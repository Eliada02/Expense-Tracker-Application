'use strict';

const Expense = require('../models/Expense');
const Income = require('../models/Income');
const env = require('../config/env');
const { EXPENSE_CATEGORIES } = require('../constants/taxonomy');
const { monthRange, shiftMonthKey, currentMonthKey, daysInMonth } = require('../utils/dates');

const CATEGORY_BY_ID = new Map(EXPENSE_CATEGORIES.map((c) => [c.id, c]));

const sumOf = (rows) => rows[0]?.total ?? 0;

/**
 * Every pipeline below starts by matching the owner. Aggregations bypass the
 * usual query helpers, so forgetting this here would silently mix other
 * users' spending into the numbers.
 */
const ownedBy = (userId, range) => ({
  user: userId,
  ...(range ? { date: { $gte: range.start, $lt: range.end } } : {}),
});

/** `{ total, count }` for a model over an optional date range. */
const aggregateTotals = (Model, userId, range) =>
  Model.aggregate([
    { $match: ownedBy(userId, range) },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);

/** Expense totals grouped by category for one month. */
const aggregateByCategory = (userId, range) =>
  Expense.aggregate([
    { $match: ownedBy(userId, range) },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);

/** Expense + income totals per month over a half-open range. */
const aggregateMonthly = async (userId, start, end) => {
  const group = (Model, field) =>
    Model.aggregate([
      { $match: { user: userId, date: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$date', timezone: env.APP_TIMEZONE },
          },
          [field]: { $sum: '$amount' },
        },
      },
    ]);

  const [expenseRows, incomeRows] = await Promise.all([
    group(Expense, 'expenses'),
    group(Income, 'income'),
  ]);

  return { expenseRows, incomeRows };
};

/** Daily expense totals inside one month. */
const aggregateDaily = (userId, range) =>
  Expense.aggregate([
    { $match: ownedBy(userId, range) },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: env.APP_TIMEZONE },
        },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

/** Builds the full month list so charts do not show gaps for empty months. */
const buildMonthSeries = (endMonthKey, count) =>
  Array.from({ length: count }, (_, i) => shiftMonthKey(endMonthKey, i - (count - 1)));

const getDashboard = async (userId, { month, months }) => {
  const monthKey = month || currentMonthKey();
  const prevMonthKey = shiftMonthKey(monthKey, -1);
  const range = monthRange(monthKey);
  const prevRange = monthRange(prevMonthKey);

  const trendMonths = buildMonthSeries(monthKey, months);
  const trendStart = monthRange(trendMonths[0]).start;
  const trendEnd = range.end;

  const [
    allExpenses,
    allIncome,
    monthExpenses,
    prevMonthExpenses,
    monthIncome,
    byCategoryRows,
    dailyRows,
    highestRows,
    monthly,
  ] = await Promise.all([
    aggregateTotals(Expense, userId),
    aggregateTotals(Income, userId),
    aggregateTotals(Expense, userId, range),
    aggregateTotals(Expense, userId, prevRange),
    aggregateTotals(Income, userId, range),
    aggregateByCategory(userId, range),
    aggregateDaily(userId, range),
    Expense.find(ownedBy(userId, range)).sort({ amount: -1 }).limit(1).lean(),
    aggregateMonthly(userId, trendStart, trendEnd),
  ]);

  const monthTotal = sumOf(monthExpenses);
  const prevTotal = sumOf(prevMonthExpenses);

  // Average per day: only count days that have actually happened in the
  // current month, otherwise the figure is misleadingly low early on.
  const isCurrentMonth = monthKey === currentMonthKey();
  const elapsedDays = isCurrentMonth
    ? Math.max(1, new Date().getUTCDate())
    : daysInMonth(monthKey);

  const expenseByMonth = new Map(monthly.expenseRows.map((r) => [r._id, r.expenses]));
  const incomeByMonth = new Map(monthly.incomeRows.map((r) => [r._id, r.income]));

  return {
    month: monthKey,
    currency: env.CURRENCY,
    summary: {
      totalExpenses: sumOf(allExpenses),
      totalIncome: sumOf(allIncome),
      balance: sumOf(allIncome) - sumOf(allExpenses),
      monthExpenses: monthTotal,
      monthIncome: sumOf(monthIncome),
      monthBalance: sumOf(monthIncome) - monthTotal,
      previousMonthExpenses: prevTotal,
      monthOverMonthChange: prevTotal > 0 ? ((monthTotal - prevTotal) / prevTotal) * 100 : null,
      averageDailySpend: monthTotal / elapsedDays,
      transactionCount: monthExpenses[0]?.count ?? 0,
      highestExpense: highestRows[0] ?? null,
    },
    byCategory: byCategoryRows.map((row) => ({
      category: row._id,
      label: CATEGORY_BY_ID.get(row._id)?.label ?? row._id,
      color: CATEGORY_BY_ID.get(row._id)?.color ?? '#94a3b8',
      total: row.total,
      count: row.count,
      share: monthTotal > 0 ? (row.total / monthTotal) * 100 : 0,
    })),
    monthlyTrend: trendMonths.map((key) => ({
      month: key,
      expenses: expenseByMonth.get(key) ?? 0,
      income: incomeByMonth.get(key) ?? 0,
    })),
    dailySpending: dailyRows.map((row) => ({ date: row._id, total: row.total })),
  };
};

module.exports = { getDashboard };

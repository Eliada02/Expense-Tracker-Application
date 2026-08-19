'use strict';

const Expense = require('../models/Expense');
const env = require('../config/env');
const { EXPENSE_CATEGORIES } = require('../constants/taxonomy');
const { monthRange, shiftMonthKey, currentMonthKey, daysInMonth } = require('../utils/dates');
const { getBudgetOverview } = require('./budgetService');

const CATEGORY_BY_ID = new Map(EXPENSE_CATEGORIES.map((c) => [c.id, c]));
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const labelOf = (id) => CATEGORY_BY_ID.get(id)?.label ?? id;

const money = (value) =>
  new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: env.CURRENCY,
    maximumFractionDigits: 0,
  }).format(value);

const pct = (value) => `${Math.abs(value).toFixed(1)}%`;

const byCategory = (userId, range) =>
  Expense.aggregate([
    { $match: { user: userId, date: { $gte: range.start, $lt: range.end } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
  ]);

const totals = (userId, range) =>
  Expense.aggregate([
    { $match: { user: userId, date: { $gte: range.start, $lt: range.end } } },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);

/** Spend per weekday over the last three months, to have enough signal. */
const byWeekday = (userId, start, end) =>
  Expense.aggregate([
    { $match: { user: userId, date: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: { $dayOfWeek: { date: '$date', timezone: env.APP_TIMEZONE } },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 1 },
  ]);

/**
 * Derives plain-language observations from the data that is actually in the
 * database. Every number below comes from an aggregation – nothing is faked,
 * and an insight is omitted entirely when there is not enough data for it.
 */
const getInsights = async (userId, { month } = {}) => {
  const monthKey = month || currentMonthKey();
  const prevKey = shiftMonthKey(monthKey, -1);
  const range = monthRange(monthKey);
  const prevRange = monthRange(prevKey);
  const weekdayStart = monthRange(shiftMonthKey(monthKey, -2)).start;

  const [current, previous, currentCats, previousCats, weekdayRows, budgets] = await Promise.all([
    totals(userId, range),
    totals(userId, prevRange),
    byCategory(userId, range),
    byCategory(userId, prevRange),
    byWeekday(userId, weekdayStart, range.end),
    getBudgetOverview(userId, monthKey),
  ]);

  const monthTotal = current[0]?.total ?? 0;
  const monthCount = current[0]?.count ?? 0;
  const prevTotal = previous[0]?.total ?? 0;
  const insights = [];

  if (monthCount === 0) {
    return {
      month: monthKey,
      currency: env.CURRENCY,
      insights: [
        {
          id: 'no-data',
          tone: 'neutral',
          title: 'No expenses recorded yet',
          description: 'Add a few expenses for this month and insights will appear here.',
        },
      ],
    };
  }

  // 1. Month-over-month movement.
  if (prevTotal > 0) {
    const change = ((monthTotal - prevTotal) / prevTotal) * 100;
    const increased = change >= 0;
    insights.push({
      id: 'month-over-month',
      tone: increased ? 'negative' : 'positive',
      title: `Spending ${increased ? 'increased' : 'decreased'} ${pct(change)} vs last month`,
      description: `${money(monthTotal)} this month against ${money(prevTotal)} last month.`,
      value: change,
    });
  }

  // 2. Dominant category.
  const sortedCats = [...currentCats].sort((a, b) => b.total - a.total);
  const top = sortedCats[0];
  if (top && monthTotal > 0) {
    const share = (top.total / monthTotal) * 100;
    insights.push({
      id: 'top-category',
      tone: share >= 40 ? 'warning' : 'neutral',
      title: `${labelOf(top._id)} is ${pct(share)} of this month's spending`,
      description: `${money(top.total)} across ${labelOf(top._id).toLowerCase()}.`,
      value: share,
    });
  }

  // 3. Biggest category swing against last month.
  const prevByCat = new Map(previousCats.map((r) => [r._id, r.total]));
  const swings = sortedCats
    .map((row) => ({ category: row._id, delta: row.total - (prevByCat.get(row._id) ?? 0) }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const swing = swings[0];
  if (swing && Math.abs(swing.delta) > 0 && previousCats.length > 0) {
    const up = swing.delta > 0;
    insights.push({
      id: 'category-swing',
      tone: up ? 'negative' : 'positive',
      title: `You spent ${money(Math.abs(swing.delta))} ${up ? 'more' : 'less'} on ${labelOf(swing.category)}`,
      description: `Compared with ${prevKey}.`,
      value: swing.delta,
    });
  }

  // 4. Average daily spend.
  const isCurrentMonth = monthKey === currentMonthKey();
  const elapsedDays = isCurrentMonth
    ? Math.max(1, new Date().getUTCDate())
    : daysInMonth(monthKey);
  insights.push({
    id: 'daily-average',
    tone: 'neutral',
    title: `Your average daily spending is ${money(monthTotal / elapsedDays)}`,
    description: `${money(monthTotal)} over ${elapsedDays} day${elapsedDays === 1 ? '' : 's'}, from ${monthCount} transaction${monthCount === 1 ? '' : 's'}.`,
    value: monthTotal / elapsedDays,
  });

  // 5. Heaviest weekday over the last three months.
  const weekday = weekdayRows[0];
  if (weekday) {
    insights.push({
      id: 'top-weekday',
      tone: 'neutral',
      title: `${WEEKDAYS[weekday._id - 1]} is your heaviest spending day`,
      description: `${money(weekday.total)} spent on ${WEEKDAYS[weekday._id - 1]}s over the last 3 months.`,
    });
  }

  // 6. Budget pressure, only when a budget actually exists.
  const pressured = [budgets.overall, ...budgets.categories]
    .filter(Boolean)
    .filter((line) => line.status !== 'ok');
  for (const line of pressured.slice(0, 3)) {
    const over = line.status === 'exceeded';
    insights.push({
      id: `budget-${line.category ?? 'overall'}`,
      tone: over ? 'negative' : 'warning',
      title: over
        ? `${line.label} budget exceeded by ${money(Math.abs(line.remaining))}`
        : `${line.label} budget is ${pct(line.percentUsed)} used`,
      description: `${money(line.spent)} of ${money(line.amount)}.`,
      value: line.percentUsed,
    });
  }

  return { month: monthKey, currency: env.CURRENCY, insights };
};

module.exports = { getInsights };

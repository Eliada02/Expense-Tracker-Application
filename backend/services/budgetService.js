'use strict';

const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const env = require('../config/env');
const { EXPENSE_CATEGORIES } = require('../constants/taxonomy');
const { monthRange, currentMonthKey } = require('../utils/dates');

const CATEGORY_BY_ID = new Map(EXPENSE_CATEGORIES.map((c) => [c.id, c]));

/** Spending is "at risk" from 80% and "over" past 100%. */
const WARNING_THRESHOLD = 80;

const statusFor = (percentUsed) => {
  if (percentUsed >= 100) return 'exceeded';
  if (percentUsed >= WARNING_THRESHOLD) return 'warning';
  return 'ok';
};

const buildLine = (budget, spent) => {
  const percentUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  const category = budget.category ? CATEGORY_BY_ID.get(budget.category) : null;
  return {
    _id: budget._id,
    category: budget.category,
    label: budget.category ? category?.label ?? budget.category : 'Overall monthly budget',
    color: category?.color ?? '#6366f1',
    amount: budget.amount,
    spent,
    remaining: budget.amount - spent,
    percentUsed,
    status: statusFor(percentUsed),
  };
};

/**
 * Budgets joined with what was actually spent in the requested month.
 */
const getBudgetOverview = async (month) => {
  const monthKey = month || currentMonthKey();
  const { start, end } = monthRange(monthKey);

  const [budgets, categoryRows, totalRows] = await Promise.all([
    Budget.find().lean(),
    Expense.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]),
    Expense.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const spentByCategory = new Map(categoryRows.map((r) => [r._id, r.total]));
  const monthTotal = totalRows[0]?.total ?? 0;

  const overallBudget = budgets.find((b) => b.category === null) ?? null;
  const categoryBudgets = budgets
    .filter((b) => b.category !== null)
    .map((b) => buildLine(b, spentByCategory.get(b.category) ?? 0))
    .sort((a, b) => b.percentUsed - a.percentUsed);

  return {
    month: monthKey,
    currency: env.CURRENCY,
    overall: overallBudget ? buildLine(overallBudget, monthTotal) : null,
    categories: categoryBudgets,
  };
};

/** Creates or replaces the budget for a category (or the overall budget). */
const upsertBudget = async ({ category, amount }) =>
  Budget.findOneAndUpdate(
    { category: category ?? null },
    { $set: { amount } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

module.exports = { getBudgetOverview, upsertBudget, WARNING_THRESHOLD, statusFor };

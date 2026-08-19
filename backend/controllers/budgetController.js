'use strict';

const asyncHandler = require('../middleware/asyncHandler');
const Budget = require('../models/Budget');
const ApiError = require('../utils/ApiError');
const { getBudgetOverview, upsertBudget } = require('../services/budgetService');

const list = asyncHandler(async (req, res) => {
  const data = await getBudgetOverview(req.query.month);
  res.json({ success: true, data });
});

/** Upsert: setting a budget twice for the same category updates it. */
const save = asyncHandler(async (req, res) => {
  const budget = await upsertBudget(req.body);
  res.status(200).json({ success: true, message: 'Budget saved', data: budget });
});

const remove = asyncHandler(async (req, res) => {
  const deleted = await Budget.findByIdAndDelete(req.params.id);
  if (!deleted) throw ApiError.notFound('Budget not found');
  res.json({ success: true, message: 'Budget removed' });
});

module.exports = { list, save, remove };

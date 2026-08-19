'use strict';

const asyncHandler = require('../middleware/asyncHandler');
const Budget = require('../models/Budget');
const ApiError = require('../utils/ApiError');
const { getBudgetOverview, upsertBudget } = require('../services/budgetService');

const list = asyncHandler(async (req, res) => {
  const data = await getBudgetOverview(req.user._id, req.query.month);
  res.json({ success: true, data });
});

/** Upsert: setting a budget twice for the same category updates it. */
const save = asyncHandler(async (req, res) => {
  const budget = await upsertBudget(req.user._id, req.body);
  res.status(200).json({ success: true, message: 'Budget saved', data: budget });
});

const remove = asyncHandler(async (req, res) => {
  // Matching on owner as well as id means a request for someone else's budget
  // is a 404, not a successful delete.
  const deleted = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!deleted) throw ApiError.notFound('Budget not found');
  res.json({ success: true, message: 'Budget removed' });
});

module.exports = { list, save, remove };

'use strict';

const asyncHandler = require('../middleware/asyncHandler');
const Recurring = require('../models/Recurring');
const ApiError = require('../utils/ApiError');
const { parseCalendarDate } = require('../utils/dates');
const { initialNextRunDate, runDueRecurring } = require('../services/recurringService');

const list = asyncHandler(async (req, res) => {
  const data = await Recurring.find({ user: req.user._id })
    .sort({ active: -1, nextRunDate: 1 })
    .lean();
  res.json({ success: true, data });
});

const create = asyncHandler(async (req, res) => {
  const created = await Recurring.create({
    ...req.body,
    user: req.user._id,
    startDate: parseCalendarDate(req.body.startDate),
    endDate: req.body.endDate ? parseCalendarDate(req.body.endDate) : null,
    nextRunDate: initialNextRunDate(req.body),
  });
  // Generate any occurrences that are already due (e.g. a rule backdated
  // to the start of the month) so the user sees the effect immediately.
  await runDueRecurring(req.user._id);
  res.status(201).json({ success: true, message: 'Recurring expense created', data: created });
});

const update = asyncHandler(async (req, res) => {
  const existing = await Recurring.findOne({ _id: req.params.id, user: req.user._id });
  if (!existing) throw ApiError.notFound('Recurring expense not found');

  const startDate = parseCalendarDate(req.body.startDate);
  // Only reset the cursor when the schedule itself changed, so editing the
  // amount does not re-create past occurrences.
  const scheduleChanged =
    existing.frequency !== req.body.frequency ||
    existing.startDate.getTime() !== startDate.getTime();

  Object.assign(existing, {
    ...req.body,
    startDate,
    endDate: req.body.endDate ? parseCalendarDate(req.body.endDate) : null,
    nextRunDate: scheduleChanged ? startDate : existing.nextRunDate,
  });
  await existing.save();

  res.json({ success: true, message: 'Recurring expense updated', data: existing });
});

const remove = asyncHandler(async (req, res) => {
  const deleted = await Recurring.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!deleted) throw ApiError.notFound('Recurring expense not found');
  // Expenses already generated are intentionally kept: they are real spending.
  res.json({ success: true, message: 'Recurring expense removed' });
});

module.exports = { list, create, update, remove };

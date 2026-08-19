'use strict';

const mongoose = require('mongoose');
const {
  EXPENSE_CATEGORY_IDS,
  PAYMENT_METHOD_IDS,
  RECURRENCE_FREQUENCIES,
} = require('../constants/taxonomy');

/**
 * A recurring expense template. Occurrences are materialised into the Expense
 * collection lazily (see services/recurringService.js) so no scheduler or
 * background worker is needed.
 */
const RecurringSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 80 },
    amount: { type: Number, required: true, min: 0.01 },
    category: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      enum: EXPENSE_CATEGORY_IDS,
    },
    paymentMethod: { type: String, enum: PAYMENT_METHOD_IDS, default: 'other' },
    description: { type: String, trim: true, default: '', maxlength: 500 },
    frequency: { type: String, required: true, enum: RECURRENCE_FREQUENCIES },
    startDate: { type: Date, required: true },
    /** Date of the next occurrence still to be created. */
    nextRunDate: { type: Date, required: true, index: true },
    /** Optional stop date; the rule produces nothing after it. */
    endDate: { type: Date, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

module.exports = mongoose.model('Recurring', RecurringSchema);

'use strict';

const mongoose = require('mongoose');
const { EXPENSE_CATEGORY_IDS } = require('../constants/taxonomy');

/**
 * One document per budget line. `category: null` is the overall monthly budget;
 * any other value is a per-category monthly budget. Budgets repeat every month
 * rather than being stored per month, which keeps the feature simple.
 */
const BudgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
      enum: { values: [...EXPENSE_CATEGORY_IDS, null], message: '`{VALUE}` is not a valid category' },
    },
    amount: {
      type: Number,
      required: [true, 'Budget amount is required'],
      min: [0.01, 'Budget must be greater than 0'],
    },
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
  }
);

// At most one budget per category per user (and one overall budget each).
// The uniqueness must be scoped to the owner, otherwise the first user to
// budget for "food" would block everyone else from doing the same.
BudgetSchema.index({ user: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Budget', BudgetSchema);

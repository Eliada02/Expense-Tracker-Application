'use strict';

const mongoose = require('mongoose');
const { PAYMENT_METHOD_IDS } = require('../constants/taxonomy');

/**
 * Expenses and incomes are structurally identical, so the schema is built once
 * here and instantiated twice. They stay in separate collections to preserve
 * the existing data and to keep queries simple.
 */
const buildTransactionSchema = ({ type, categories }) => {
  const schema = new mongoose.Schema(
    {
      title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [80, 'Title cannot exceed 80 characters'],
      },
      amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0.01, 'Amount must be greater than 0'],
        max: [1_000_000_000, 'Amount is unrealistically large'],
      },
      type: { type: String, default: type, immutable: true },
      date: {
        type: Date,
        required: [true, 'Date is required'],
        index: true,
      },
      category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true,
        lowercase: true,
        enum: { values: categories, message: '`{VALUE}` is not a valid category' },
      },
      // Optional free-text note. Historically called "description" and kept
      // under that name so existing documents keep working.
      description: {
        type: String,
        trim: true,
        default: '',
        maxlength: [500, 'Notes cannot exceed 500 characters'],
      },
      paymentMethod: {
        type: String,
        enum: { values: PAYMENT_METHOD_IDS, message: '`{VALUE}` is not a valid payment method' },
        default: 'other',
      },
      // Set when a row was materialised from a recurring rule.
      recurringId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recurring',
        default: null,
      },
    },
    {
      timestamps: true,
      toJSON: {
        virtuals: true,
        versionKey: false,
        transform: (_doc, ret) => {
          delete ret.id;
          return ret;
        },
      },
    }
  );

  // Dashboard and list queries are always "recent first, optionally by category".
  schema.index({ date: -1, _id: -1 });
  schema.index({ category: 1, date: -1 });

  return schema;
};

module.exports = buildTransactionSchema;

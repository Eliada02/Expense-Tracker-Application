'use strict';

const {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  RECURRENCE_FREQUENCIES,
} = require('../constants/taxonomy');
const env = require('../config/env');

/**
 * Serves the shared taxonomy so the frontend never hardcodes category lists.
 * Static data, so it is safe to cache aggressively.
 */
const getCategories = (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.json({
    success: true,
    data: { expense: EXPENSE_CATEGORIES, income: INCOME_CATEGORIES },
  });
};

const getPaymentMethods = (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.json({ success: true, data: PAYMENT_METHODS });
};

const getConfig = (req, res) => {
  res.json({
    success: true,
    data: {
      currency: env.CURRENCY,
      timezone: env.APP_TIMEZONE,
      frequencies: RECURRENCE_FREQUENCIES,
    },
  });
};

module.exports = { getCategories, getPaymentMethods, getConfig };

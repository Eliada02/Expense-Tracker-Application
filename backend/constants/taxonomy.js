'use strict';

/**
 * Single source of truth for categories and payment methods.
 * The frontend fetches these from /api/categories and /api/payment-methods
 * instead of duplicating the list, so adding a category is a one-file change.
 *
 * NOTE: ids that look redundant (groceries/takeaways/clothing/subscriptions/
 * travelling) are kept because existing documents in the database use them.
 * Removing an id would orphan real data.
 */
const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Food & Dining', color: '#f97316' },
  { id: 'groceries', label: 'Groceries', color: '#84cc16' },
  { id: 'takeaways', label: 'Takeaways', color: '#f59e0b' },
  { id: 'transport', label: 'Transport', color: '#0ea5e9' },
  { id: 'shopping', label: 'Shopping', color: '#ec4899' },
  { id: 'clothing', label: 'Clothing', color: '#d946ef' },
  { id: 'bills', label: 'Bills & Utilities', color: '#64748b' },
  { id: 'subscriptions', label: 'Subscriptions', color: '#8b5cf6' },
  { id: 'entertainment', label: 'Entertainment', color: '#f43f5e' },
  { id: 'health', label: 'Health', color: '#10b981' },
  { id: 'travelling', label: 'Travel', color: '#06b6d4' },
  { id: 'education', label: 'Education', color: '#3b82f6' },
  { id: 'other', label: 'Other', color: '#94a3b8' },
];

const INCOME_CATEGORIES = [
  { id: 'salary', label: 'Salary', color: '#22c55e' },
  { id: 'freelancing', label: 'Freelancing', color: '#14b8a6' },
  { id: 'investments', label: 'Investments', color: '#3b82f6' },
  { id: 'stocks', label: 'Stocks', color: '#6366f1' },
  { id: 'bitcoin', label: 'Crypto', color: '#f59e0b' },
  { id: 'bank', label: 'Bank', color: '#0ea5e9' },
  { id: 'youtube', label: 'YouTube', color: '#ef4444' },
  { id: 'other', label: 'Other', color: '#94a3b8' },
];

const PAYMENT_METHODS = [
  { id: 'card', label: 'Card' },
  { id: 'cash', label: 'Cash' },
  { id: 'bank_transfer', label: 'Bank transfer' },
  { id: 'direct_debit', label: 'Direct debit' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'other', label: 'Other' },
];

const RECURRENCE_FREQUENCIES = ['weekly', 'monthly', 'yearly'];

const ids = (list) => list.map((item) => item.id);

module.exports = {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  RECURRENCE_FREQUENCIES,
  EXPENSE_CATEGORY_IDS: ids(EXPENSE_CATEGORIES),
  INCOME_CATEGORY_IDS: ids(INCOME_CATEGORIES),
  PAYMENT_METHOD_IDS: ids(PAYMENT_METHODS),
};

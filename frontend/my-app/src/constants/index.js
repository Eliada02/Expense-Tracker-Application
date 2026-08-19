/**
 * Frontend-only constants. Categories and payment methods deliberately live on
 * the backend (`/api/categories`, `/api/payment-methods`) so there is one
 * source of truth; they are fetched through `useTaxonomy`.
 */

export const THEME_STORAGE_KEY = 'expense-tracker-theme';

export const PAGE_SIZES = [10, 20, 50, 100];

export const DEFAULT_PAGE_SIZE = 20;

export const SORT_OPTIONS = [
  { value: 'date:desc', label: 'Newest first' },
  { value: 'date:asc', label: 'Oldest first' },
  { value: 'amount:desc', label: 'Highest amount' },
  { value: 'amount:asc', label: 'Lowest amount' },
  { value: 'title:asc', label: 'Title A–Z' },
  { value: 'category:asc', label: 'Category A–Z' },
];

export const FREQUENCY_LABELS = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

/** Blank filter state, also used to reset the filter bar. */
export const EMPTY_FILTERS = {
  search: '',
  category: '',
  paymentMethod: '',
  month: '',
};

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: 'LayoutDashboard', end: true },
  { to: '/expenses', label: 'Expenses', icon: 'Receipt' },
  { to: '/incomes', label: 'Income', icon: 'TrendingUp' },
  { to: '/budgets', label: 'Budgets', icon: 'Wallet' },
  { to: '/insights', label: 'Insights', icon: 'Lightbulb' },
  { to: '/recurring', label: 'Recurring', icon: 'Repeat' },
  { to: '/settings', label: 'Settings', icon: 'Settings' },
];

/**
 * Central list of React Query cache keys. Keeping them here means a mutation
 * can invalidate exactly the right slices without guessing at key shapes.
 */
export const queryKeys = {
  expenses: (params) => ['expenses', params],
  expensesAll: ['expenses'],
  incomes: (params) => ['incomes', params],
  incomesAll: ['incomes'],
  dashboard: (params) => ['dashboard', params],
  dashboardAll: ['dashboard'],
  insights: (params) => ['insights', params],
  insightsAll: ['insights'],
  budgets: (month) => ['budgets', month],
  budgetsAll: ['budgets'],
  recurring: ['recurring'],
  taxonomy: ['taxonomy'],
};

/**
 * Everything a change to expenses can affect. Budgets, the dashboard and
 * insights are all derived from expense data, so they go stale together.
 */
export const EXPENSE_DEPENDENT_KEYS = [
  queryKeys.expensesAll,
  queryKeys.dashboardAll,
  queryKeys.insightsAll,
  queryKeys.budgetsAll,
];

export const INCOME_DEPENDENT_KEYS = [queryKeys.incomesAll, queryKeys.dashboardAll];

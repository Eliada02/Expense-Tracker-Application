export const EXPENSE_CATEGORIES = [
  { id: 'groceries', label: 'Groceries', color: '#84cc16' },
  { id: 'transport', label: 'Transport', color: '#0ea5e9' },
  { id: 'bills', label: 'Bills & Utilities', color: '#64748b' },
];

export const PAYMENT_METHODS = [
  { id: 'card', label: 'Card' },
  { id: 'cash', label: 'Cash' },
];

export const CATEGORY_MAP = new Map(EXPENSE_CATEGORIES.map((c) => [c.id, c]));
export const PAYMENT_METHOD_MAP = new Map(PAYMENT_METHODS.map((p) => [p.id, p]));

export const makeExpense = (overrides = {}) => ({
  _id: '1',
  title: 'Weekly shop',
  amount: 42.5,
  date: '2024-05-10T12:00:00.000Z',
  category: 'groceries',
  paymentMethod: 'card',
  description: 'Supermarket',
  type: 'expense',
  ...overrides,
});

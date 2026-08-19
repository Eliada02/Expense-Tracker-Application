/**
 * The app speaks `YYYY-MM-DD` (calendar day) and `YYYY-MM` (month) everywhere:
 * in form inputs, in query strings and in the API contract. Keeping a single
 * string representation avoids the timezone drift that Date objects cause when
 * they cross a boundary.
 */

const pad = (n) => String(n).padStart(2, '0');

/** Local calendar day of a Date (or now) as `YYYY-MM-DD`. */
export const toDateInputValue = (value = new Date()) => {
  const d = new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Local calendar month as `YYYY-MM`. */
export const toMonthKey = (value = new Date()) => toDateInputValue(value).slice(0, 7);

export const currentMonthKey = () => toMonthKey();

/** Shifts a `YYYY-MM` key by whole months. */
export const shiftMonthKey = (monthKey, offset) => {
  const [year, month] = monthKey.split('-').map(Number);
  const d = new Date(year, month - 1 + offset, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

/**
 * Month options for the period picker: the current month plus `count - 1`
 * previous ones, newest first.
 */
export const recentMonthKeys = (count = 12, from = currentMonthKey()) =>
  Array.from({ length: count }, (_, i) => shiftMonthKey(from, -i));

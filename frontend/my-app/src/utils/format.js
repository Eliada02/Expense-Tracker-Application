/**
 * Formatting helpers. Moment.js was removed in favour of the built-in `Intl`
 * APIs: they are already in every browser, handle locales and currencies
 * correctly, and cost nothing in bundle size.
 */

const LOCALE = 'en-IE';

const currencyFormatters = new Map();

const currencyFormatter = (currency, options) => {
  const key = `${currency}|${JSON.stringify(options)}`;
  if (!currencyFormatters.has(key)) {
    currencyFormatters.set(
      key,
      new Intl.NumberFormat(LOCALE, { style: 'currency', currency, ...options })
    );
  }
  return currencyFormatters.get(key);
};

export const formatCurrency = (value, currency = 'EUR', options) =>
  currencyFormatter(currency, options).format(Number(value) || 0);

/** Compact form for chart axes and tight cards: €1.2k */
export const formatCompactCurrency = (value, currency = 'EUR') =>
  formatCurrency(value, currency, { notation: 'compact', maximumFractionDigits: 1 });

export const formatPercent = (value, digits = 1) =>
  `${Number(value ?? 0).toFixed(digits)}%`;

export const formatNumber = (value) => new Intl.NumberFormat(LOCALE).format(value ?? 0);

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const monthFormatter = new Intl.DateTimeFormat(LOCALE, { month: 'short', year: 'numeric' });
const monthLongFormatter = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' });
const dayFormatter = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' });

export const formatDate = (value) => (value ? dateFormatter.format(new Date(value)) : '—');

export const formatDay = (value) => (value ? dayFormatter.format(new Date(value)) : '—');

/** `2024-05` -> `May 2024`. */
export const formatMonthKey = (monthKey, long = false) => {
  if (!monthKey) return '—';
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return (long ? monthLongFormatter : monthFormatter).format(date);
};

/** Signed percentage used by the "vs last month" indicators. */
export const formatSignedPercent = (value) => {
  if (value === null || value === undefined) return null;
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

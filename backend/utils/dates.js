'use strict';

/**
 * Date handling rules for this project:
 *
 * - A transaction date is a *calendar day*, not an instant. It is stored as
 *   12:00 UTC of that day, so shifting the value into any timezone between
 *   UTC-11 and UTC+11 still lands on the same calendar day. This removes the
 *   classic "expense saved on the 1st shows up on the 31st" bug.
 * - Month keys are plain `YYYY-MM` strings and month ranges are half-open
 *   [start, end), which keeps boundary handling obvious.
 */

const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Parses `YYYY-MM-DD` into a Date anchored at 12:00 UTC. */
const parseCalendarDate = (value) => {
  if (value instanceof Date) return value;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (!match) return new Date(value);
  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
};

/** `YYYY-MM` key for a Date, using UTC (dates are noon-anchored). */
const toMonthKey = (date) => {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

/** Half-open [start, end) range covering a `YYYY-MM` month. */
const monthRange = (monthKey) => {
  const [year, month] = monthKey.split('-').map(Number);
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
};

/** Shifts a `YYYY-MM` key by `offset` months (negative goes back). */
const shiftMonthKey = (monthKey, offset) => {
  const [year, month] = monthKey.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1 + offset, 1));
  return toMonthKey(d);
};

/** The `YYYY-MM` key of the current month. */
const currentMonthKey = (now = new Date()) => toMonthKey(now);

/** Number of days in the given `YYYY-MM` month. */
const daysInMonth = (monthKey) => {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
};

/**
 * Advances a date by one recurrence step. Monthly/yearly steps clamp to the
 * last day of the target month so "31 January + 1 month" becomes 28/29 Feb
 * rather than silently rolling into March.
 *
 * `anchorDay` is the day-of-month the series is really pinned to. Passing it
 * keeps a clamped occurrence from dragging the whole series earlier: a rule
 * anchored on the 31st goes 31 Jan -> 29 Feb -> 31 Mar, not -> 29 Mar.
 */
const addRecurrence = (date, frequency, anchorDay) => {
  const d = new Date(date);
  if (frequency === 'weekly') {
    d.setUTCDate(d.getUTCDate() + 7);
    return d;
  }
  const monthsToAdd = frequency === 'yearly' ? 12 : 1;
  const day = anchorDay ?? d.getUTCDate();
  const target = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + monthsToAdd, 1, 12)
  );
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target;
};

module.exports = {
  MONTH_KEY_PATTERN,
  parseCalendarDate,
  toMonthKey,
  monthRange,
  shiftMonthKey,
  currentMonthKey,
  daysInMonth,
  addRecurrence,
};

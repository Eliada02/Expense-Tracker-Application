'use strict';

const {
  parseCalendarDate,
  toMonthKey,
  monthRange,
  shiftMonthKey,
  daysInMonth,
  addRecurrence,
} = require('../utils/dates');

describe('date utilities', () => {
  it('anchors a calendar date at noon UTC so timezones cannot shift the day', () => {
    const date = parseCalendarDate('2024-05-01');
    expect(date.toISOString()).toBe('2024-05-01T12:00:00.000Z');
  });

  it('derives the month key from a date', () => {
    expect(toMonthKey(parseCalendarDate('2024-01-31'))).toBe('2024-01');
  });

  it('produces a half-open month range', () => {
    const { start, end } = monthRange('2024-02');
    expect(start.toISOString()).toBe('2024-02-01T00:00:00.000Z');
    expect(end.toISOString()).toBe('2024-03-01T00:00:00.000Z');
  });

  it('shifts month keys across year boundaries', () => {
    expect(shiftMonthKey('2024-01', -1)).toBe('2023-12');
    expect(shiftMonthKey('2024-12', 1)).toBe('2025-01');
  });

  it('knows the length of a leap-year February', () => {
    expect(daysInMonth('2024-02')).toBe(29);
    expect(daysInMonth('2023-02')).toBe(28);
  });

  it('clamps monthly recurrence to the last day of a shorter month', () => {
    const next = addRecurrence(parseCalendarDate('2024-01-31'), 'monthly');
    expect(next.toISOString().slice(0, 10)).toBe('2024-02-29');
  });

  it('keeps the series anchored to the original day after a clamp', () => {
    const feb = addRecurrence(parseCalendarDate('2024-01-31'), 'monthly', 31);
    const mar = addRecurrence(feb, 'monthly', 31);
    expect(feb.toISOString().slice(0, 10)).toBe('2024-02-29');
    expect(mar.toISOString().slice(0, 10)).toBe('2024-03-31');
  });

  it('advances weekly and yearly recurrences', () => {
    expect(addRecurrence(parseCalendarDate('2024-05-01'), 'weekly').toISOString().slice(0, 10))
      .toBe('2024-05-08');
    expect(addRecurrence(parseCalendarDate('2024-05-01'), 'yearly').toISOString().slice(0, 10))
      .toBe('2025-05-01');
  });
});

import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatMonthKey,
  formatPercent,
  formatSignedPercent,
} from './format';
import { currentMonthKey, recentMonthKeys, shiftMonthKey, toDateInputValue } from './dates';

describe('formatting', () => {
  it('formats amounts as currency', () => {
    expect(formatCurrency(1234.5, 'EUR')).toBe('€1,234.50');
  });

  it('treats missing or invalid amounts as zero rather than NaN', () => {
    expect(formatCurrency(undefined, 'EUR')).toBe('€0.00');
    expect(formatCurrency(null, 'EUR')).toBe('€0.00');
  });

  it('formats a stored noon-UTC date on the right calendar day', () => {
    expect(formatDate('2024-05-01T12:00:00.000Z')).toBe('01 May 2024');
    expect(formatDate('2024-12-31T12:00:00.000Z')).toBe('31 Dec 2024');
  });

  it('shows an em dash for a missing date', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('formats month keys', () => {
    expect(formatMonthKey('2024-05')).toBe('May 2024');
    expect(formatMonthKey('2024-05', true)).toBe('May 2024');
  });

  it('formats percentages', () => {
    expect(formatPercent(32.456)).toBe('32.5%');
    expect(formatSignedPercent(18)).toBe('+18.0%');
    expect(formatSignedPercent(-12.5)).toBe('-12.5%');
    expect(formatSignedPercent(null)).toBeNull();
  });
});

describe('date helpers', () => {
  it('produces a YYYY-MM-DD value for date inputs', () => {
    expect(toDateInputValue(new Date(2024, 4, 9))).toBe('2024-05-09');
  });

  it('shifts month keys across year boundaries', () => {
    expect(shiftMonthKey('2024-01', -1)).toBe('2023-12');
    expect(shiftMonthKey('2024-12', 1)).toBe('2025-01');
  });

  it('lists recent months newest first, starting with the current one', () => {
    const months = recentMonthKeys(3, '2024-05');
    expect(months).toEqual(['2024-05', '2024-04', '2024-03']);
  });

  it('derives the current month key in YYYY-MM form', () => {
    expect(currentMonthKey()).toMatch(/^\d{4}-\d{2}$/);
  });
});

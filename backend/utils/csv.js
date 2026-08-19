'use strict';

/** Escapes a single CSV cell (RFC 4180). */
const cell = (value) => {
  if (value === null || value === undefined) return '';
  const text = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/**
 * @param {Array<{key: string, header: string}>} columns
 * @param {Array<object>} rows
 */
const toCsv = (columns, rows) => {
  const lines = [columns.map((c) => cell(c.header)).join(',')];
  for (const row of rows) {
    lines.push(columns.map((c) => cell(row[c.key])).join(','));
  }
  return lines.join('\r\n');
};

module.exports = { toCsv };

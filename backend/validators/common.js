'use strict';

const { z } = require('zod');
const { MONTH_KEY_PATTERN } = require('../utils/dates');

const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Invalid id');

const idParam = z.object({ id: objectId });

const monthKey = z
  .string()
  .regex(MONTH_KEY_PATTERN, 'Month must be in YYYY-MM format');

const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}/, 'Date must be in YYYY-MM-DD format')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Date is not a real date');

/** Accepts `"12,50"` as well as `"12.50"` and rejects anything non-numeric. */
const amount = z.coerce
  .number({ message: 'Amount must be a number' })
  .positive('Amount must be greater than 0')
  .max(1_000_000_000, 'Amount is unrealistically large');

module.exports = { objectId, idParam, monthKey, calendarDate, amount };

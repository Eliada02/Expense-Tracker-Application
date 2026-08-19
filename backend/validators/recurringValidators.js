'use strict';

const { z } = require('zod');
const { amount, calendarDate } = require('./common');
const {
  EXPENSE_CATEGORY_IDS,
  PAYMENT_METHOD_IDS,
  RECURRENCE_FREQUENCIES,
} = require('../constants/taxonomy');

const recurringBody = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(80),
    amount,
    category: z.enum(EXPENSE_CATEGORY_IDS, { message: 'Select a valid category' }),
    paymentMethod: z.enum(PAYMENT_METHOD_IDS).optional().default('other'),
    description: z.string().trim().max(500).optional().default(''),
    frequency: z.enum(RECURRENCE_FREQUENCIES, { message: 'Select a valid frequency' }),
    startDate: calendarDate,
    endDate: calendarDate.nullish().transform((v) => v ?? null),
    active: z.boolean().optional().default(true),
  })
  .refine(
    (data) => !data.endDate || Date.parse(data.endDate) >= Date.parse(data.startDate),
    { message: 'End date must be on or after the start date', path: ['endDate'] }
  );

module.exports = { recurringBody };

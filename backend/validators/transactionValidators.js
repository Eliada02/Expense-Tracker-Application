'use strict';

const { z } = require('zod');
const { amount, calendarDate, monthKey } = require('./common');
const {
  EXPENSE_CATEGORY_IDS,
  INCOME_CATEGORY_IDS,
  PAYMENT_METHOD_IDS,
} = require('../constants/taxonomy');

const SORTABLE_FIELDS = ['date', 'amount', 'title', 'category', 'createdAt'];

const buildBodySchema = (categories) =>
  z.object({
    title: z.string().trim().min(1, 'Title is required').max(80, 'Title cannot exceed 80 characters'),
    amount,
    date: calendarDate,
    category: z.enum(categories, { message: 'Select a valid category' }),
    description: z.string().trim().max(500, 'Notes cannot exceed 500 characters').optional().default(''),
    paymentMethod: z.enum(PAYMENT_METHOD_IDS).optional().default('other'),
  });

const buildQuerySchema = (categories) =>
  z.object({
    search: z.string().trim().max(120).optional(),
    category: z.enum(categories).optional(),
    paymentMethod: z.enum(PAYMENT_METHOD_IDS).optional(),
    month: monthKey.optional(),
    from: calendarDate.optional(),
    to: calendarDate.optional(),
    minAmount: z.coerce.number().nonnegative().optional(),
    maxAmount: z.coerce.number().nonnegative().optional(),
    sortBy: z.enum(SORTABLE_FIELDS).optional().default('date'),
    sortDir: z.enum(['asc', 'desc']).optional().default('desc'),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(200).optional().default(20),
  });

const expenseBody = buildBodySchema(EXPENSE_CATEGORY_IDS);
const incomeBody = buildBodySchema(INCOME_CATEGORY_IDS);

const exportQuery = (categories) =>
  buildQuerySchema(categories)
    .omit({ page: true, limit: true })
    .extend({ format: z.enum(['csv', 'json']).optional().default('csv') });

module.exports = {
  SORTABLE_FIELDS,
  expenseBody,
  incomeBody,
  expenseQuery: buildQuerySchema(EXPENSE_CATEGORY_IDS),
  incomeQuery: buildQuerySchema(INCOME_CATEGORY_IDS),
  expenseExportQuery: exportQuery(EXPENSE_CATEGORY_IDS),
};

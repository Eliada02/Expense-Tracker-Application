'use strict';

const { z } = require('zod');
const { amount, monthKey } = require('./common');
const { EXPENSE_CATEGORY_IDS } = require('../constants/taxonomy');

const budgetBody = z.object({
  // `null` (or omitted) means the overall monthly budget.
  category: z.enum(EXPENSE_CATEGORY_IDS).nullish().transform((v) => v ?? null),
  amount,
});

const budgetQuery = z.object({ month: monthKey.optional() });

module.exports = { budgetBody, budgetQuery };

'use strict';

const { z } = require('zod');
const { monthKey } = require('./common');

const dashboardQuery = z.object({
  month: monthKey.optional(),
  /** How many months of history to include in the trend chart. */
  months: z.coerce.number().int().min(3).max(24).optional().default(6),
});

module.exports = { dashboardQuery };

'use strict';

const Recurring = require('../models/Recurring');
const Expense = require('../models/Expense');
const { addRecurrence, parseCalendarDate } = require('../utils/dates');

/**
 * Safety valve: a rule can never generate more than this many occurrences in a
 * single pass, so a rule with a start date years in the past cannot lock up a
 * request while it catches up.
 */
const MAX_OCCURRENCES_PER_RUN = 120;

let lastRunAt = 0;
const THROTTLE_MS = 60 * 1000;

/**
 * Materialises every due occurrence of every active recurring rule into real
 * expenses. Called lazily before read-heavy endpoints, which avoids adding a
 * scheduler for what is a once-a-day job at most.
 *
 * @returns {Promise<number>} number of expenses created
 */
const runDueRecurring = async (now = new Date()) => {
  const rules = await Recurring.find({ active: true, nextRunDate: { $lte: now } });
  if (!rules.length) return 0;

  const expensesToCreate = [];
  const ruleUpdates = [];

  for (const rule of rules) {
    let cursor = new Date(rule.nextRunDate);
    let created = 0;
    // The series is anchored to the start date's day-of-month, so a February
    // occurrence clamped to the 29th does not pull March back to the 29th.
    const anchorDay = new Date(rule.startDate).getUTCDate();

    while (cursor <= now && created < MAX_OCCURRENCES_PER_RUN) {
      if (rule.endDate && cursor > rule.endDate) break;

      expensesToCreate.push({
        title: rule.title,
        amount: rule.amount,
        category: rule.category,
        paymentMethod: rule.paymentMethod,
        description: rule.description,
        date: cursor,
        type: 'expense',
        recurringId: rule._id,
      });

      cursor = addRecurrence(cursor, rule.frequency, anchorDay);
      created += 1;
    }

    const finished = Boolean(rule.endDate && cursor > rule.endDate);
    ruleUpdates.push({
      updateOne: {
        filter: { _id: rule._id },
        update: { $set: { nextRunDate: cursor, active: !finished } },
      },
    });
  }

  if (expensesToCreate.length) await Expense.insertMany(expensesToCreate);
  if (ruleUpdates.length) await Recurring.bulkWrite(ruleUpdates);

  return expensesToCreate.length;
};

/**
 * Express middleware that runs the materialiser at most once a minute. Failures
 * are logged but never block the request the user actually asked for.
 */
const materialiseRecurring = async (req, res, next) => {
  const now = Date.now();
  if (now - lastRunAt < THROTTLE_MS) return next();
  lastRunAt = now;

  try {
    await runDueRecurring();
  } catch (error) {
    console.error('[recurring] failed to materialise due expenses', error);
  }
  return next();
};

/** First occurrence date for a new rule: the start date itself. */
const initialNextRunDate = (payload) => parseCalendarDate(payload.startDate);

/** Resets the throttle. Used by tests. */
const resetThrottle = () => {
  lastRunAt = 0;
};

module.exports = {
  runDueRecurring,
  materialiseRecurring,
  initialNextRunDate,
  resetThrottle,
  MAX_OCCURRENCES_PER_RUN,
};

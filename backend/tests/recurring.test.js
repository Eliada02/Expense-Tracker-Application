'use strict';

const { api } = require('./helpers');
const Recurring = require('../models/Recurring');
const Expense = require('../models/Expense');
const { runDueRecurring } = require('../services/recurringService');
const { parseCalendarDate } = require('../utils/dates');

const validRule = (overrides = {}) => ({
  title: 'Internet',
  amount: 39.9,
  category: 'bills',
  paymentMethod: 'direct_debit',
  frequency: 'monthly',
  startDate: '2024-01-15',
  ...overrides,
});

/**
 * Inserts a rule without going through the API, so the materialiser can be
 * driven with an explicit "now" instead of the real clock.
 */
const seedRule = (overrides = {}) => {
  const rule = validRule(overrides);
  return Recurring.create({
    ...rule,
    startDate: parseCalendarDate(rule.startDate),
    endDate: rule.endDate ? parseCalendarDate(rule.endDate) : null,
    nextRunDate: parseCalendarDate(rule.startDate),
  });
};

const expenseDates = async () =>
  (await Expense.find().sort({ date: 1 }).lean()).map((e) => e.date.toISOString().slice(0, 10));

describe('recurring materialisation', () => {
  it('creates one expense per due occurrence', async () => {
    await seedRule();
    // Rule starts 15 Jan 2024, so by 20 Mar 2024 three occurrences are due.
    const created = await runDueRecurring(new Date('2024-03-20T00:00:00Z'));

    expect(created).toBe(3);
    expect(await expenseDates()).toEqual(['2024-01-15', '2024-02-15', '2024-03-15']);

    const first = await Expense.findOne().sort({ date: 1 }).lean();
    expect(first).toMatchObject({ title: 'Internet', amount: 39.9, category: 'bills' });
    expect(first.recurringId).not.toBeNull();
  });

  it('is idempotent when run repeatedly for the same instant', async () => {
    await seedRule();

    await runDueRecurring(new Date('2024-03-20T00:00:00Z'));
    await runDueRecurring(new Date('2024-03-20T00:00:00Z'));

    expect(await Expense.countDocuments()).toBe(3);
  });

  it('clamps a rule that starts on the 31st to shorter months', async () => {
    await seedRule({ frequency: 'monthly', startDate: '2024-01-31' });
    await runDueRecurring(new Date('2024-04-01T00:00:00Z'));

    expect(await expenseDates()).toEqual(['2024-01-31', '2024-02-29', '2024-03-31']);
  });

  it('handles weekly rules', async () => {
    await seedRule({ frequency: 'weekly', startDate: '2024-05-01' });
    await runDueRecurring(new Date('2024-05-22T13:00:00Z'));

    expect(await expenseDates()).toEqual([
      '2024-05-01',
      '2024-05-08',
      '2024-05-15',
      '2024-05-22',
    ]);
  });

  it('handles yearly rules', async () => {
    await seedRule({ frequency: 'yearly', startDate: '2022-03-01' });
    await runDueRecurring(new Date('2024-06-01T00:00:00Z'));

    expect(await expenseDates()).toEqual(['2022-03-01', '2023-03-01', '2024-03-01']);
  });

  it('stops at the end date and deactivates the rule', async () => {
    await seedRule({ endDate: '2024-02-20' });
    await runDueRecurring(new Date('2024-06-01T00:00:00Z'));

    expect(await Expense.countDocuments()).toBe(2);
    expect((await Recurring.findOne()).active).toBe(false);
  });

  it('ignores inactive rules', async () => {
    await seedRule({ active: false });
    await runDueRecurring(new Date('2024-06-01T00:00:00Z'));

    expect(await Expense.countDocuments()).toBe(0);
  });

  it('generates nothing before the start date', async () => {
    await seedRule({ startDate: '2030-01-01' });
    await runDueRecurring(new Date('2024-06-01T00:00:00Z'));

    expect(await Expense.countDocuments()).toBe(0);
  });
});

describe('recurring API', () => {
  it('creates a rule and generates the occurrences already due', async () => {
    const res = await api().post('/api/recurring').send(validRule({ startDate: '2024-01-15' }));

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ title: 'Internet', frequency: 'monthly' });
    // The rule is backdated, so history is generated straight away.
    expect(await Expense.countDocuments()).toBeGreaterThan(0);
  });

  it('lists rules', async () => {
    await seedRule();
    const res = await api().get('/api/recurring');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('does not regenerate history when only the amount is edited', async () => {
    const rule = await seedRule();
    await runDueRecurring(new Date('2024-03-20T00:00:00Z'));
    const before = await Expense.countDocuments();

    const res = await api().put(`/api/recurring/${rule._id}`).send(validRule({ amount: 45 }));

    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(45);
    expect(await Expense.countDocuments()).toBe(before);
  });

  it('rewinds the cursor when the schedule itself changes', async () => {
    const rule = await seedRule();
    await runDueRecurring(new Date('2024-03-20T00:00:00Z'));

    await api()
      .put(`/api/recurring/${rule._id}`)
      .send(validRule({ frequency: 'weekly' }));

    const updated = await Recurring.findById(rule._id);
    expect(updated.nextRunDate.toISOString().slice(0, 10)).toBe('2024-01-15');
  });

  it('rejects an end date before the start date', async () => {
    const res = await api().post('/api/recurring').send(validRule({ endDate: '2023-12-01' }));

    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('endDate');
  });

  it('rejects an unsupported frequency', async () => {
    const res = await api().post('/api/recurring').send(validRule({ frequency: 'daily' }));
    expect(res.status).toBe(400);
  });

  it('keeps already generated expenses when the rule is deleted', async () => {
    const rule = await seedRule();
    await runDueRecurring(new Date('2024-03-20T00:00:00Z'));

    const res = await api().delete(`/api/recurring/${rule._id}`);

    expect(res.status).toBe(200);
    expect(await Expense.countDocuments()).toBe(3);
    expect(await Recurring.countDocuments()).toBe(0);
  });

  it('returns 404 for an unknown rule', async () => {
    const res = await api().delete('/api/recurring/507f1f77bcf86cd799439011');
    expect(res.status).toBe(404);
  });
});

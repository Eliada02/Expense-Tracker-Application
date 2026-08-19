'use strict';

const { api, createExpense } = require('./helpers');

const seedTwoMonths = async () => {
  // April: 100
  await createExpense({ title: 'April rent', amount: 100, category: 'bills', date: '2024-04-10' });
  // May: 150 across two categories
  await createExpense({ title: 'May rent', amount: 100, category: 'bills', date: '2024-05-01' });
  await createExpense({ title: 'Lunch', amount: 50, category: 'food', date: '2024-05-31' });
};

describe('GET /api/dashboard', () => {
  it('summarises the requested month and compares it with the previous one', async () => {
    await seedTwoMonths();
    const res = await api().get('/api/dashboard?month=2024-05');

    expect(res.status).toBe(200);
    const { summary } = res.body.data;
    expect(summary.monthExpenses).toBe(150);
    expect(summary.previousMonthExpenses).toBe(100);
    expect(summary.monthOverMonthChange).toBeCloseTo(50);
    expect(summary.transactionCount).toBe(2);
    expect(summary.totalExpenses).toBe(250);
    expect(summary.highestExpense.title).toBe('May rent');
  });

  it('includes the first and last day of the month in the month total', async () => {
    await seedTwoMonths();
    const res = await api().get('/api/dashboard?month=2024-05');
    // 1 May and 31 May both counted -> 150, not 50 or 100.
    expect(res.body.data.summary.monthExpenses).toBe(150);
  });

  it('breaks spending down by category with shares that add up to 100%', async () => {
    await seedTwoMonths();
    const res = await api().get('/api/dashboard?month=2024-05');

    const { byCategory } = res.body.data;
    expect(byCategory.map((c) => c.category)).toEqual(['bills', 'food']);
    expect(byCategory[0]).toMatchObject({ total: 100, label: 'Bills & Utilities' });
    expect(byCategory.reduce((sum, c) => sum + c.share, 0)).toBeCloseTo(100);
  });

  it('returns a gap-free monthly trend series', async () => {
    await seedTwoMonths();
    const res = await api().get('/api/dashboard?month=2024-05&months=3');

    expect(res.body.data.monthlyTrend).toEqual([
      { month: '2024-03', expenses: 0, income: 0 },
      { month: '2024-04', expenses: 100, income: 0 },
      { month: '2024-05', expenses: 150, income: 0 },
    ]);
  });

  it('returns zeroed totals rather than failing when there is no data', async () => {
    const res = await api().get('/api/dashboard?month=2024-05');

    expect(res.status).toBe(200);
    expect(res.body.data.summary.monthExpenses).toBe(0);
    expect(res.body.data.summary.monthOverMonthChange).toBeNull();
    expect(res.body.data.summary.highestExpense).toBeNull();
    expect(res.body.data.byCategory).toEqual([]);
  });

  it('rejects a malformed month', async () => {
    const res = await api().get('/api/dashboard?month=2024-13');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/insights', () => {
  it('derives observations from real data', async () => {
    await seedTwoMonths();
    const res = await api().get('/api/insights?month=2024-05');

    expect(res.status).toBe(200);
    const ids = res.body.data.insights.map((i) => i.id);
    expect(ids).toEqual(expect.arrayContaining(['month-over-month', 'top-category', 'daily-average']));

    const mom = res.body.data.insights.find((i) => i.id === 'month-over-month');
    expect(mom.value).toBeCloseTo(50);
    expect(mom.title).toContain('increased');
  });

  it('reports an empty state instead of inventing insights', async () => {
    const res = await api().get('/api/insights?month=2024-05');
    expect(res.body.data.insights).toHaveLength(1);
    expect(res.body.data.insights[0].id).toBe('no-data');
  });
});

describe('budgets', () => {
  it('creates a budget and reports spend against it', async () => {
    await createExpense({ amount: 1120, category: 'bills', date: '2024-05-10' });

    const saved = await api().put('/api/budgets').send({ amount: 1500 });
    expect(saved.status).toBe(200);

    const res = await api().get('/api/budgets?month=2024-05');
    expect(res.body.data.overall).toMatchObject({
      amount: 1500,
      spent: 1120,
      remaining: 380,
      status: 'ok',
    });
    expect(res.body.data.overall.percentUsed).toBeCloseTo(74.67, 1);
  });

  it('flags a category budget that has been exceeded', async () => {
    await createExpense({ amount: 200, category: 'food', date: '2024-05-10' });
    await api().put('/api/budgets').send({ category: 'food', amount: 150 });

    const res = await api().get('/api/budgets?month=2024-05');
    expect(res.body.data.categories[0]).toMatchObject({
      category: 'food',
      spent: 200,
      remaining: -50,
      status: 'exceeded',
    });
  });

  it('warns from 80% usage', async () => {
    await createExpense({ amount: 85, category: 'food', date: '2024-05-10' });
    await api().put('/api/budgets').send({ category: 'food', amount: 100 });

    const res = await api().get('/api/budgets?month=2024-05');
    expect(res.body.data.categories[0].status).toBe('warning');
  });

  it('updates rather than duplicating a budget for the same category', async () => {
    await api().put('/api/budgets').send({ category: 'food', amount: 100 });
    await api().put('/api/budgets').send({ category: 'food', amount: 250 });

    const res = await api().get('/api/budgets?month=2024-05');
    expect(res.body.data.categories).toHaveLength(1);
    expect(res.body.data.categories[0].amount).toBe(250);
  });

  it('surfaces budget pressure as an insight', async () => {
    await createExpense({ amount: 200, category: 'food', date: '2024-05-10' });
    await api().put('/api/budgets').send({ category: 'food', amount: 150 });

    const res = await api().get('/api/insights?month=2024-05');
    const budgetInsight = res.body.data.insights.find((i) => i.id === 'budget-food');
    expect(budgetInsight).toBeDefined();
    expect(budgetInsight.tone).toBe('negative');
  });

  it('rejects a non-positive budget', async () => {
    const res = await api().put('/api/budgets').send({ amount: 0 });
    expect(res.status).toBe(400);
  });

  it('deletes a budget', async () => {
    const saved = await api().put('/api/budgets').send({ category: 'food', amount: 100 });
    const res = await api().delete(`/api/budgets/${saved.body.data._id}`);

    expect(res.status).toBe(200);
    const after = await api().get('/api/budgets?month=2024-05');
    expect(after.body.data.categories).toHaveLength(0);
  });
});

describe('taxonomy endpoints', () => {
  it('serves the shared category list', async () => {
    const res = await api().get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body.data.expense.length).toBeGreaterThan(0);
    expect(res.body.data.expense[0]).toHaveProperty('color');
    expect(res.body.data.income.map((c) => c.id)).toContain('salary');
  });

  it('serves payment methods', async () => {
    const res = await api().get('/api/payment-methods');
    expect(res.body.data.map((p) => p.id)).toContain('card');
  });
});

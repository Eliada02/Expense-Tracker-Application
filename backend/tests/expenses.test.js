'use strict';

const { api, validExpense, createExpense } = require('./helpers');

describe('POST /api/expenses', () => {
  it('creates an expense and returns it', async () => {
    const res = await api().post('/api/expenses').send(validExpense());

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      title: 'Weekly shop',
      amount: 42.5,
      category: 'groceries',
      type: 'expense',
      paymentMethod: 'card',
    });
    // Stored at noon UTC so the calendar day survives any timezone.
    expect(res.body.data.date).toBe('2024-05-10T12:00:00.000Z');
  });

  it('accepts an amount sent as a string', async () => {
    const res = await api().post('/api/expenses').send(validExpense({ amount: '19.99' }));
    expect(res.status).toBe(201);
    expect(res.body.data.amount).toBe(19.99);
  });

  it('rejects a missing title with a field-level error', async () => {
    const res = await api().post('/api/expenses').send(validExpense({ title: '' }));

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'title' })])
    );
  });

  it('rejects a zero or negative amount', async () => {
    for (const amount of [0, -5]) {
      const res = await api().post('/api/expenses').send(validExpense({ amount }));
      expect(res.status).toBe(400);
      expect(res.body.errors[0].field).toBe('amount');
    }
  });

  it('rejects an unknown category', async () => {
    const res = await api().post('/api/expenses').send(validExpense({ category: 'yachts' }));
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('category');
  });

  it('rejects a malformed date', async () => {
    const res = await api().post('/api/expenses').send(validExpense({ date: '10/05/2024' }));
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('date');
  });

  it('ignores an attempt to inject a Mongo operator', async () => {
    const res = await api()
      .post('/api/expenses')
      .send({ ...validExpense(), amount: { $gt: 0 } });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/expenses', () => {
  beforeEach(async () => {
    await createExpense({ title: 'Coffee', amount: 3, category: 'takeaways', date: '2024-05-01' });
    await createExpense({
      title: 'Bus pass',
      amount: 55,
      category: 'transport',
      date: '2024-05-15',
      paymentMethod: 'cash',
    });
    await createExpense({ title: 'Rent', amount: 900, category: 'bills', date: '2024-04-01' });
  });

  it('returns items with pagination metadata', async () => {
    const res = await api().get('/api/expenses');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.meta).toMatchObject({ page: 1, total: 3, totalPages: 1 });
    expect(res.body.meta.filteredTotalAmount).toBe(958);
  });

  it('sorts by date descending by default', async () => {
    const res = await api().get('/api/expenses');
    expect(res.body.data.map((e) => e.title)).toEqual(['Bus pass', 'Coffee', 'Rent']);
  });

  it('filters by category', async () => {
    const res = await api().get('/api/expenses?category=bills');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Rent');
  });

  it('filters by payment method', async () => {
    const res = await api().get('/api/expenses?paymentMethod=cash');
    expect(res.body.data.map((e) => e.title)).toEqual(['Bus pass']);
  });

  it('filters by month, including the first and last day', async () => {
    const res = await api().get('/api/expenses?month=2024-05');
    expect(res.body.meta.total).toBe(2);
    expect(res.body.meta.filteredTotalAmount).toBe(58);
  });

  it('filters by an explicit date range inclusive of both ends', async () => {
    const res = await api().get('/api/expenses?from=2024-04-01&to=2024-05-01');
    expect(res.body.data.map((e) => e.title).sort()).toEqual(['Coffee', 'Rent']);
  });

  it('searches title and notes case-insensitively', async () => {
    const res = await api().get('/api/expenses?search=coff');
    expect(res.body.data).toHaveLength(1);
  });

  it('treats regex metacharacters in search as literal text', async () => {
    const res = await api().get('/api/expenses?search=.*');
    expect(res.body.data).toHaveLength(0);
  });

  it('paginates without repeating rows', async () => {
    const first = await api().get('/api/expenses?limit=2&page=1');
    const second = await api().get('/api/expenses?limit=2&page=2');

    expect(first.body.data).toHaveLength(2);
    expect(second.body.data).toHaveLength(1);
    expect(second.body.meta.totalPages).toBe(2);
    const ids = [...first.body.data, ...second.body.data].map((e) => e._id);
    expect(new Set(ids).size).toBe(3);
  });

  it('rejects an invalid sort field instead of silently ignoring it', async () => {
    const res = await api().get('/api/expenses?sortBy=password');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/expenses/:id', () => {
  it('returns a single expense', async () => {
    const created = await createExpense();
    const res = await api().get(`/api/expenses/${created._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(created._id);
  });

  it('returns 404 for an unknown id', async () => {
    const res = await api().get('/api/expenses/507f1f77bcf86cd799439011');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: 'Expense not found' });
  });

  it('returns 400 for a malformed id rather than a 500', async () => {
    const res = await api().get('/api/expenses/not-an-id');
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/expenses/:id', () => {
  it('updates an expense', async () => {
    const created = await createExpense();
    const res = await api()
      .put(`/api/expenses/${created._id}`)
      .send(validExpense({ title: 'Updated', amount: 10 }));

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ title: 'Updated', amount: 10 });
  });

  it('validates the payload on update too', async () => {
    const created = await createExpense();
    const res = await api().put(`/api/expenses/${created._id}`).send(validExpense({ amount: -1 }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when updating something that does not exist', async () => {
    const res = await api().put('/api/expenses/507f1f77bcf86cd799439011').send(validExpense());
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/expenses/:id', () => {
  it('deletes an expense', async () => {
    const created = await createExpense();
    const res = await api().delete(`/api/expenses/${created._id}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Expense deleted');
    const after = await api().get('/api/expenses');
    expect(after.body.data).toHaveLength(0);
  });

  it('returns 404 when deleting twice', async () => {
    const created = await createExpense();
    await api().delete(`/api/expenses/${created._id}`);
    const res = await api().delete(`/api/expenses/${created._id}`);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/expenses/export', () => {
  beforeEach(async () => {
    await createExpense({ title: 'Coffee, large', amount: 3, category: 'takeaways' });
    await createExpense({ title: 'Rent', amount: 900, category: 'bills', date: '2024-04-01' });
  });

  it('exports CSV honouring the active filters', async () => {
    const res = await api().get('/api/expenses/export?format=csv&category=bills');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="expenses-/);
    const lines = res.text.replace(/^﻿/, '').trim().split('\r\n');
    expect(lines[0]).toBe('Date,Title,Category,Amount,Payment method,Notes');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('Rent');
  });

  it('quotes values containing commas', async () => {
    const res = await api().get('/api/expenses/export?category=takeaways');
    expect(res.text).toContain('"Coffee, large"');
  });

  it('exports JSON when asked', async () => {
    const res = await api().get('/api/expenses/export?format=json');
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(JSON.parse(res.text)).toHaveLength(2);
  });
});

describe('error handling', () => {
  it('returns a structured 404 for unknown routes', async () => {
    const res = await api().get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('never leaks a stack trace on a handled error', async () => {
    const res = await api().get('/api/expenses/507f1f77bcf86cd799439011');
    expect(res.body.stack).toBeUndefined();
  });

  it('rejects malformed JSON with a 400', async () => {
    const res = await api()
      .post('/api/expenses')
      .set('Content-Type', 'application/json')
      .send('{"title":');
    expect(res.status).toBe(400);
  });
});

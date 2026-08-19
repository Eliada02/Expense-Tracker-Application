'use strict';

const { anonymous, signIn, credentials } = require('./helpers');
const User = require('../models/User');

describe('POST /api/auth/register', () => {
  it('creates an account and signs the user straight in', async () => {
    const res = await anonymous().post('/api/auth/register').send(credentials());

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ name: 'Test User' });
    expect(res.body.data._id).toBeDefined();

    const cookie = res.headers['set-cookie']?.join(';') ?? '';
    expect(cookie).toContain('et_token=');
  });

  it('stores a bcrypt hash, never the password', async () => {
    const creds = credentials({ password: 'supersecret1' });
    await anonymous().post('/api/auth/register').send(creds);

    const user = await User.findOne({ email: creds.email }).select('+passwordHash');
    expect(user.passwordHash).toBeDefined();
    expect(user.passwordHash).not.toBe(creds.password);
    expect(user.passwordHash).toMatch(/^\$2[aby]\$\d{2}\$/);
    expect(await user.verifyPassword(creds.password)).toBe(true);
    expect(await user.verifyPassword('wrong-password')).toBe(false);
  });

  it('never returns the password hash', async () => {
    const res = await anonymous().post('/api/auth/register').send(credentials());

    expect(res.body.data.passwordHash).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('$2b$');
  });

  it('rejects a duplicate email', async () => {
    const creds = credentials();
    await anonymous().post('/api/auth/register').send(creds);

    const res = await anonymous().post('/api/auth/register').send(creds);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('treats email as case-insensitive when detecting duplicates', async () => {
    const creds = credentials({ email: 'Someone@Example.com' });
    await anonymous().post('/api/auth/register').send(creds);

    const res = await anonymous()
      .post('/api/auth/register')
      .send({ ...creds, email: 'someone@example.com' });

    expect(res.status).toBe(409);
  });

  it('normalises the stored email to lowercase', async () => {
    const res = await anonymous()
      .post('/api/auth/register')
      .send(credentials({ email: 'MiXeD@Example.COM' }));

    expect(res.body.data.email).toBe('mixed@example.com');
  });

  it('rejects a malformed email', async () => {
    const res = await anonymous()
      .post('/api/auth/register')
      .send(credentials({ email: 'not-an-email' }));

    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('email');
  });

  it('rejects a short password', async () => {
    const res = await anonymous()
      .post('/api/auth/register')
      .send(credentials({ password: 'short' }));

    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('password');
  });

  it('rejects a missing name', async () => {
    const res = await anonymous().post('/api/auth/register').send(credentials({ name: '' }));

    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('name');
  });

  it('ignores extra fields a client might try to set', async () => {
    const res = await anonymous()
      .post('/api/auth/register')
      .send({ ...credentials(), role: 'admin', passwordHash: 'injected' });

    expect(res.status).toBe(201);
    const user = await User.findById(res.body.data._id).select('+passwordHash');
    expect(user.passwordHash).not.toBe('injected');
    expect(user.role).toBeUndefined();
  });
});

describe('POST /api/auth/login', () => {
  it('signs in with correct credentials', async () => {
    const creds = credentials();
    await anonymous().post('/api/auth/register').send(creds);

    const res = await anonymous()
      .post('/api/auth/login')
      .send({ email: creds.email, password: creds.password });

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(creds.email.toLowerCase());
    expect(res.headers['set-cookie'].join(';')).toContain('et_token=');
  });

  it('rejects a wrong password', async () => {
    const creds = credentials();
    await anonymous().post('/api/auth/register').send(creds);

    const res = await anonymous()
      .post('/api/auth/login')
      .send({ email: creds.email, password: 'not-the-password' });

    expect(res.status).toBe(401);
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('gives the same answer for an unknown email as for a wrong password', async () => {
    const creds = credentials();
    await anonymous().post('/api/auth/register').send(creds);

    const wrongPassword = await anonymous()
      .post('/api/auth/login')
      .send({ email: creds.email, password: 'not-the-password' });
    const unknownEmail = await anonymous()
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'not-the-password' });

    // Identical status and wording, so the response cannot be used to work out
    // which addresses have accounts.
    expect(unknownEmail.status).toBe(wrongPassword.status);
    expect(unknownEmail.body.message).toBe(wrongPassword.body.message);
  });

  it('rejects a malformed email without probing the database', async () => {
    const res = await anonymous()
      .post('/api/auth/login')
      .send({ email: 'nope', password: 'whatever' });

    expect(res.status).toBe(400);
  });

  it('is not fooled by an operator injection in place of the email', async () => {
    const res = await anonymous()
      .post('/api/auth/login')
      .send({ email: { $ne: null }, password: { $ne: null } });

    expect(res.status).toBe(400);
  });
});

describe('session lifecycle', () => {
  it('resolves the signed-in user from the cookie', async () => {
    const { agent, user } = await signIn();

    const res = await agent.get('/api/auth/me');

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(user._id);
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it('returns 401 from /me without a cookie', async () => {
    const res = await anonymous().get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('clears the session on logout', async () => {
    const { agent } = await signIn();
    expect((await agent.get('/api/auth/me')).status).toBe(200);

    const res = await agent.post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'].join(';')).toMatch(/et_token=;|et_token=;/);
  });

  it('blocks protected endpoints after logout', async () => {
    const { agent } = await signIn();
    await agent.post('/api/auth/logout');

    expect((await agent.get('/api/auth/me')).status).toBe(401);
    expect((await agent.get('/api/expenses')).status).toBe(401);
  });

  it('rejects a tampered token', async () => {
    const res = await anonymous()
      .get('/api/auth/me')
      .set('Cookie', 'et_token=not.a.real.token');

    expect(res.status).toBe(401);
  });

  it('stops working once the account is deleted', async () => {
    const { agent, user } = await signIn();
    await User.findByIdAndDelete(user._id);

    const res = await agent.get('/api/expenses');

    expect(res.status).toBe(401);
  });
});

describe('route protection', () => {
  const PROTECTED = [
    ['get', '/api/expenses'],
    ['post', '/api/expenses'],
    ['get', '/api/expenses/export'],
    ['get', '/api/incomes'],
    ['get', '/api/dashboard'],
    ['get', '/api/insights'],
    ['get', '/api/budgets'],
    ['put', '/api/budgets'],
    ['get', '/api/recurring'],
    ['post', '/api/recurring'],
  ];

  it.each(PROTECTED)('rejects unauthenticated %s %s', async (method, path) => {
    const res = await anonymous()[method](path).send({});
    expect(res.status).toBe(401);
  });

  const PUBLIC = ['/api/health', '/api/categories', '/api/payment-methods', '/api/config'];

  it.each(PUBLIC)('leaves %s public', async (path) => {
    const res = await anonymous().get(path);
    expect(res.status).toBe(200);
  });
});

describe('data isolation between users', () => {
  /** Two separate accounts, each with one expense, one budget, one rule. */
  const setUpTwoUsers = async () => {
    const alice = await signIn({ name: 'Alice' });
    const aliceExpense = (
      await alice.agent.post('/api/expenses').send({
        title: 'Alice groceries',
        amount: 100,
        date: '2024-05-10',
        category: 'groceries',
      })
    ).body.data;
    const aliceBudget = (
      await alice.agent.put('/api/budgets').send({ category: 'groceries', amount: 500 })
    ).body.data;
    const aliceRule = (
      await alice.agent.post('/api/recurring').send({
        title: 'Alice rent',
        amount: 900,
        category: 'bills',
        frequency: 'monthly',
        startDate: '2024-05-01',
      })
    ).body.data;

    const bob = await signIn({ name: 'Bob' });
    await bob.agent.post('/api/expenses').send({
      title: 'Bob transport',
      amount: 25,
      date: '2024-05-11',
      category: 'transport',
    });

    return { alice, bob, aliceExpense, aliceBudget, aliceRule };
  };

  it('lists only the requesting user expenses', async () => {
    const { alice, bob } = await setUpTwoUsers();

    const aliceList = await alice.agent.get('/api/expenses?limit=200');
    const bobList = await bob.agent.get('/api/expenses?limit=200');

    // Alice's backdated rule has also generated a run of "Alice rent" rows, so
    // compare the distinct titles rather than an exact list.
    const titles = (res) => [...new Set(res.body.data.map((e) => e.title))].sort();

    expect(titles(aliceList)).toEqual(['Alice groceries', 'Alice rent']);
    expect(titles(bobList)).toEqual(['Bob transport']);
  });

  it('hides another user expense behind a 404', async () => {
    const { bob, aliceExpense } = await setUpTwoUsers();

    const res = await bob.agent.get(`/api/expenses/${aliceExpense._id}`);

    expect(res.status).toBe(404);
  });

  it('refuses to update another user expense', async () => {
    const { alice, bob, aliceExpense } = await setUpTwoUsers();

    const res = await bob.agent.put(`/api/expenses/${aliceExpense._id}`).send({
      title: 'Hijacked',
      amount: 1,
      date: '2024-05-10',
      category: 'other',
    });

    expect(res.status).toBe(404);
    const unchanged = await alice.agent.get(`/api/expenses/${aliceExpense._id}`);
    expect(unchanged.body.data.title).toBe('Alice groceries');
  });

  it('refuses to delete another user expense', async () => {
    const { alice, bob, aliceExpense } = await setUpTwoUsers();

    const res = await bob.agent.delete(`/api/expenses/${aliceExpense._id}`);

    expect(res.status).toBe(404);
    expect((await alice.agent.get(`/api/expenses/${aliceExpense._id}`)).status).toBe(200);
  });

  it('refuses to delete another user budget', async () => {
    const { alice, bob, aliceBudget } = await setUpTwoUsers();

    const res = await bob.agent.delete(`/api/budgets/${aliceBudget._id}`);

    expect(res.status).toBe(404);
    const stillThere = await alice.agent.get('/api/budgets');
    expect(stillThere.body.data.categories).toHaveLength(1);
  });

  it('refuses to modify another user recurring rule', async () => {
    const { bob, aliceRule } = await setUpTwoUsers();

    const updated = await bob.agent.put(`/api/recurring/${aliceRule._id}`).send({
      title: 'Hijacked',
      amount: 1,
      category: 'other',
      frequency: 'monthly',
      startDate: '2024-05-01',
    });
    const deleted = await bob.agent.delete(`/api/recurring/${aliceRule._id}`);

    expect(updated.status).toBe(404);
    expect(deleted.status).toBe(404);
  });

  it('scopes dashboard totals to the requesting user', async () => {
    const { alice, bob } = await setUpTwoUsers();

    const aliceDash = await alice.agent.get('/api/dashboard?month=2024-05');
    const bobDash = await bob.agent.get('/api/dashboard?month=2024-05');

    // Alice: 100 groceries + 900 generated rent. Bob: 25 transport only.
    expect(aliceDash.body.data.summary.monthExpenses).toBe(1000);
    expect(bobDash.body.data.summary.monthExpenses).toBe(25);
  });

  it('scopes insights to the requesting user', async () => {
    const { bob } = await setUpTwoUsers();

    const res = await bob.agent.get('/api/insights?month=2024-05');
    const topCategory = res.body.data.insights.find((i) => i.id === 'top-category');

    expect(topCategory.title).toContain('Transport');
  });

  it('scopes budgets to the requesting user', async () => {
    const { bob } = await setUpTwoUsers();

    const res = await bob.agent.get('/api/budgets?month=2024-05');

    expect(res.body.data.categories).toHaveLength(0);
    expect(res.body.data.overall).toBeNull();
  });

  it('scopes recurring rules to the requesting user', async () => {
    const { bob } = await setUpTwoUsers();

    const res = await bob.agent.get('/api/recurring');

    expect(res.body.data).toHaveLength(0);
  });

  it('scopes export to the requesting user', async () => {
    const { bob } = await setUpTwoUsers();

    const res = await bob.agent.get('/api/expenses/export?format=json');

    const rows = JSON.parse(res.text);
    expect(rows.map((r) => r.title)).toEqual(['Bob transport']);
  });

  it('lets both users budget for the same category independently', async () => {
    const { alice, bob } = await setUpTwoUsers();

    const res = await bob.agent.put('/api/budgets').send({ category: 'groceries', amount: 200 });

    expect(res.status).toBe(200);
    const aliceBudgets = await alice.agent.get('/api/budgets?month=2024-05');
    expect(aliceBudgets.body.data.categories[0].amount).toBe(500);
  });

  it('cannot reassign a record to another user by sending a user field', async () => {
    const { alice, bob } = await setUpTwoUsers();

    const created = await bob.agent.post('/api/expenses').send({
      title: 'Sneaky',
      amount: 5,
      date: '2024-05-12',
      category: 'other',
      user: alice.user._id,
    });

    expect(created.status).toBe(201);
    // It stayed with Bob rather than landing in Alice's ledger.
    const aliceList = await alice.agent.get('/api/expenses');
    expect(aliceList.body.data.map((e) => e.title)).not.toContain('Sneaky');
  });
});

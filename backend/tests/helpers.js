'use strict';

process.env.MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/test';

const request = require('supertest');
const app = require('../app');

/**
 * `request.agent` keeps cookies between calls, so once a test signs in the
 * session cookie rides along on every later request exactly as it would in a
 * browser.
 */
let currentAgent = null;
let emailCounter = 0;

/** The signed-in agent, or a bare unauthenticated client before `signIn`. */
const api = () => currentAgent ?? request(app);

/** A fresh unauthenticated client, for testing that routes are protected. */
const anonymous = () => request(app);

const credentials = (overrides = {}) => ({
  name: 'Test User',
  email: `user${(emailCounter += 1)}@example.com`,
  password: 'password123',
  ...overrides,
});

/**
 * Registers a new account and makes it the active session.
 * @returns the created user plus its own agent, so tests can hold two users.
 */
const signIn = async (overrides) => {
  const agent = request.agent(app);
  const creds = credentials(overrides);
  const res = await agent.post('/api/auth/register').send(creds);

  if (res.status !== 201) {
    throw new Error(`Test sign-in failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  currentAgent = agent;
  return { agent, user: res.body.data, credentials: creds };
};

/** Drops the active session without touching the database. */
const signOut = () => {
  currentAgent = null;
};

const validExpense = (overrides = {}) => ({
  title: 'Weekly shop',
  amount: 42.5,
  date: '2024-05-10',
  category: 'groceries',
  paymentMethod: 'card',
  description: 'Supermarket',
  ...overrides,
});

const createExpense = async (overrides, agent = api()) => {
  const res = await agent.post('/api/expenses').send(validExpense(overrides));
  if (res.status !== 201) {
    throw new Error(`createExpense failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data;
};

module.exports = {
  api,
  anonymous,
  app,
  signIn,
  signOut,
  credentials,
  validExpense,
  createExpense,
};

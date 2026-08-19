'use strict';

process.env.MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/test';

const request = require('supertest');
const app = require('../app');

const api = () => request(app);

const validExpense = (overrides = {}) => ({
  title: 'Weekly shop',
  amount: 42.5,
  date: '2024-05-10',
  category: 'groceries',
  paymentMethod: 'card',
  description: 'Supermarket',
  ...overrides,
});

const createExpense = async (overrides) => {
  const res = await api().post('/api/expenses').send(validExpense(overrides));
  return res.body.data;
};

module.exports = { api, app, validExpense, createExpense };

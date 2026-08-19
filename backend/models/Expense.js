'use strict';

const mongoose = require('mongoose');
const buildTransactionSchema = require('./transactionSchema');
const { EXPENSE_CATEGORY_IDS } = require('../constants/taxonomy');

const ExpenseSchema = buildTransactionSchema({
  type: 'expense',
  categories: EXPENSE_CATEGORY_IDS,
});

module.exports = mongoose.model('Expense', ExpenseSchema);

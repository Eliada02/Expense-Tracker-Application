'use strict';

const mongoose = require('mongoose');
const buildTransactionSchema = require('./transactionSchema');
const { INCOME_CATEGORY_IDS } = require('../constants/taxonomy');

const IncomeSchema = buildTransactionSchema({
  type: 'income',
  categories: INCOME_CATEGORY_IDS,
});

module.exports = mongoose.model('Income', IncomeSchema);

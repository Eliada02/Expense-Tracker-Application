'use strict';

const Income = require('../models/Income');
const { createTransactionService } = require('../services/transactionService');
const { createTransactionController } = require('./transactionController');

const incomeService = createTransactionService(Income, 'Income');

module.exports = createTransactionController(incomeService, 'Income');
module.exports.service = incomeService;

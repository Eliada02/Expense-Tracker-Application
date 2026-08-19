'use strict';

const Expense = require('../models/Expense');
const { createTransactionService } = require('../services/transactionService');
const { createTransactionController } = require('./transactionController');

const expenseService = createTransactionService(Expense, 'Expense');

module.exports = createTransactionController(expenseService, 'Expense');
module.exports.service = expenseService;

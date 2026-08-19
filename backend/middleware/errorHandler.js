'use strict';

const mongoose = require('mongoose');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * Central error handler. Maps known error shapes to clean HTTP responses and
 * never leaks stack traces or driver internals in production.
 */
// eslint-disable-next-line no-unused-vars -- Express identifies handlers by arity
const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = 'Something went wrong. Please try again.';
  let errors;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.details;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for "${err.path}"`;
  } else if (err && err.code === 11000) {
    statusCode = 409;
    message = 'That record already exists';
  } else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON body';
  }

  if (statusCode >= 500 && !env.isTest) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  if (!env.isProduction && statusCode >= 500) payload.stack = err.stack;

  res.status(statusCode).json(payload);
};

module.exports = errorHandler;

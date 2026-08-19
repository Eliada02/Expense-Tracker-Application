'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const ApiError = require('./utils/ApiError');

const app = express();

app.set('trust proxy', 1);

// Security headers. The API serves JSON only, so the CSP defaults are fine.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Only the configured frontend origins may call the API. Requests without an
// Origin header (curl, health checks, same-origin) are allowed through.
//
// `credentials: true` is required for the session cookie to be sent on
// cross-origin requests, and it is why the allowed origin must be echoed
// explicitly - a browser refuses to send credentials to a wildcard origin.
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.CLIENT_URLS.includes(origin)) return callback(null, true);
      // A rejected origin is a client mistake, so it gets a 403 rather than
      // the 500 a bare Error would produce.
      return callback(new ApiError(403, 'This origin is not allowed to call the API'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

if (!env.isTest) {
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));
}

// Blunt abuse protection for a single-user API.
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    skip: () => env.isTest,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please slow down.' },
  })
);

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

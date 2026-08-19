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

/**
 * Any loopback origin, on any port. Vite moves to 5174, 5175 and so on when
 * its default port is taken, which would otherwise fail CORS in a way that
 * looks like a bug in the app rather than a stray dev server.
 *
 * Development only - production uses the explicit allowlist and nothing else.
 */
const LOOPBACK_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

const isAllowedOrigin = (origin) => {
  if (env.CLIENT_URLS.includes(origin)) return true;
  return !env.isProduction && LOOPBACK_ORIGIN.test(origin);
};

// Only the configured frontend origins may call the API. Requests without an
// Origin header (curl, health checks, same-origin) are allowed through.
//
// `credentials: true` is required for the session cookie to be sent on
// cross-origin requests, and it is why the allowed origin must be echoed
// explicitly - a browser refuses to send credentials to a wildcard origin.
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isAllowedOrigin(origin)) return callback(null, true);
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

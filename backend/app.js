'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const env = require('./config/env');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', 1);

// Security headers. The API serves JSON only, so the CSP defaults are fine.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Only the configured frontend origins may call the API. Requests without an
// Origin header (curl, health checks, same-origin) are allowed through.
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.CLIENT_URLS.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

app.use(express.json({ limit: '100kb' }));

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

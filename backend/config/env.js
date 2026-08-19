'use strict';

require('dotenv').config();

/**
 * Single place where process.env is read. Everything else in the app imports
 * from here so that a missing variable fails loudly at boot instead of
 * producing `undefined` deep inside a request handler.
 */
const required = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". See backend/.env.example.`
    );
  }
  return value;
};

const NODE_ENV = process.env.NODE_ENV || 'development';

const env = {
  NODE_ENV,
  isProduction: NODE_ENV === 'production',
  isTest: NODE_ENV === 'test',
  PORT: Number(process.env.PORT) || 5000,
  // Comma separated list so a deployed frontend and localhost can coexist.
  CLIENT_URLS: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
  // Timezone used for month/day bucketing in aggregations. Set this to your own
  // zone (e.g. Europe/Rome) so "this month" matches your calendar.
  APP_TIMEZONE: process.env.APP_TIMEZONE || 'UTC',
  CURRENCY: process.env.CURRENCY || 'EUR',
  get MONGO_URL() {
    return required('MONGO_URL');
  },
};

module.exports = env;

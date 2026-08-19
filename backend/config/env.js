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
const isProduction = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

/** Converts `7d` / `12h` / `30m` into milliseconds for the cookie maxAge. */
const durationToMs = (value) => {
  const match = /^(\d+)([smhd])$/.exec(String(value));
  if (!match) throw new Error(`JWT_EXPIRES_IN must look like "7d", got "${value}"`);
  const units = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return Number(match[1]) * units[match[2]];
};

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const env = {
  NODE_ENV,
  isProduction,
  isTest,
  PORT: Number(process.env.PORT) || 5000,
  // Comma separated so a deployed frontend and localhost can coexist.
  CLIENT_URLS: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
  // Timezone used for month/day bucketing in aggregations. Set this to your own
  // zone (e.g. Europe/Rome) so "this month" matches your calendar.
  APP_TIMEZONE: process.env.APP_TIMEZONE || 'UTC',
  CURRENCY: process.env.CURRENCY || 'EUR',

  JWT_EXPIRES_IN,
  JWT_EXPIRES_MS: durationToMs(JWT_EXPIRES_IN),
  // Lax works when the app and API share a site (including different ports on
  // localhost). A truly cross-site deployment needs SameSite=None + Secure.
  COOKIE_SAMESITE: process.env.COOKIE_SAMESITE || 'lax',
  COOKIE_SECURE: process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === 'true'
    : isProduction,

  get MONGO_URL() {
    return required('MONGO_URL');
  },
  get JWT_SECRET() {
    // Tests get a fixed throwaway secret so the suite needs no .env file.
    if (isTest) return process.env.JWT_SECRET || 'test-secret-not-for-production';
    return required('JWT_SECRET');
  },
};

module.exports = env;

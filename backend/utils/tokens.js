'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * The JWT is delivered in an httpOnly cookie rather than a response body, so
 * client-side JavaScript can never read it. That removes the usual XSS
 * token-theft path that comes with keeping a token in localStorage.
 */
const COOKIE_NAME = 'et_token';

const signToken = (user) =>
  jwt.sign({ sub: String(user._id) }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

const verifyToken = (token) => jwt.verify(token, env.JWT_SECRET);

/**
 * Cookie flags:
 * - httpOnly  : unreadable from JavaScript
 * - sameSite  : Lax is enough in development (the dev server and the API share
 *               the `localhost` site). A cross-site deployment needs
 *               `None` + `secure`, which is why both are configurable.
 * - secure    : always on in production so the cookie never crosses plain HTTP
 */
const cookieOptions = () => ({
  httpOnly: true,
  sameSite: env.COOKIE_SAMESITE,
  secure: env.COOKIE_SECURE,
  maxAge: env.JWT_EXPIRES_MS,
  path: '/',
});

const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, cookieOptions());
};

/** Must mirror the flags used when setting, or the browser keeps the cookie. */
const clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: env.COOKIE_SAMESITE,
    secure: env.COOKIE_SECURE,
    path: '/',
  });
};

module.exports = {
  COOKIE_NAME,
  signToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
};

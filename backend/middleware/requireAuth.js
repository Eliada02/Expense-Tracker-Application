'use strict';

const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('./asyncHandler');
const { COOKIE_NAME, verifyToken } = require('../utils/tokens');

/**
 * Rejects anything without a valid session cookie and attaches the user to the
 * request. Every data route sits behind this, so ownership checks downstream
 * can rely on `req.user` existing.
 *
 * The user is loaded on each request rather than trusted from the token alone,
 * so a deleted account stops working immediately instead of staying valid
 * until its token expires.
 */
const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) throw new ApiError(401, 'You must be signed in to do that');

  let payload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    // Expired and malformed tokens are both "sign in again" from the client's
    // point of view; the distinction only helps an attacker.
    throw new ApiError(401, 'Your session has expired. Please sign in again.');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, 'Your session is no longer valid');

  req.user = user;
  return next();
});

module.exports = requireAuth;

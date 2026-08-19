'use strict';

/**
 * Express 4 does not forward rejected promises to the error handler, so async
 * route handlers are wrapped once here instead of sprinkling try/catch around.
 */
const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

module.exports = asyncHandler;

'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Validates `req.body` / `req.query` / `req.params` against Zod schemas and
 * replaces them with the parsed (coerced, defaulted) values, so controllers
 * always receive clean data.
 */
const validate = (schemas) => (req, res, next) => {
  for (const source of ['body', 'query', 'params']) {
    const schema = schemas[source];
    if (!schema) continue;

    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || source,
        message: issue.message,
      }));
      return next(ApiError.badRequest('Validation failed', errors));
    }

    // req.query is a getter in some Express versions; define instead of assign.
    Object.defineProperty(req, source, { value: result.data, writable: true });
  }
  return next();
};

module.exports = validate;

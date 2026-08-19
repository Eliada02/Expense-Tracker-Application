'use strict';

const { z } = require('zod');

/**
 * Minimum length is the control that actually matters for password strength;
 * composition rules mostly push people toward predictable substitutions. The
 * upper bound exists because bcrypt silently truncates beyond 72 bytes, so a
 * longer password would give a false sense of security.
 */
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .max(254, 'Email is too long')
  .email('Enter a valid email address');

const password = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  .max(MAX_PASSWORD_LENGTH, `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters`);

const registerBody = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name cannot exceed 80 characters'),
  email,
  password,
});

const loginBody = z.object({
  email,
  // No length rules on login: the only useful answer to a bad password is
  // "those credentials are wrong", not a hint about the expected format.
  password: z.string().min(1, 'Password is required'),
});

module.exports = { registerBody, loginBody, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH };

'use strict';

const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../middleware/asyncHandler');
const { signToken, setAuthCookie, clearAuthCookie } = require('../utils/tokens');

/** Deliberately identical for "no such email" and "wrong password". */
const INVALID_CREDENTIALS = 'Incorrect email or password';

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    // Registration cannot hide that an email is taken - the account either
    // gets created or it does not. The message stays generic so it reads the
    // same whether or not the visitor owns that address.
    throw ApiError.conflict('That email address is already registered');
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash });

  setAuthCookie(res, signToken(user));

  res.status(201).json({
    success: true,
    message: 'Account created',
    data: user.toPublicJSON(),
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // `passwordHash` is `select: false` on the schema, so it must be asked for.
  const user = await User.findOne({ email }).select('+passwordHash');

  // Verify against a dummy hash when the account does not exist, so a missing
  // account and a wrong password take about the same time. Otherwise the
  // response time alone reveals which emails are registered.
  const isValid = user
    ? await user.verifyPassword(password)
    : await User.hashPassword(password).then(() => false);

  if (!isValid) throw new ApiError(401, INVALID_CREDENTIALS);

  setAuthCookie(res, signToken(user));

  res.json({
    success: true,
    message: 'Signed in',
    data: user.toPublicJSON(),
  });
});

const logout = (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Signed out' });
};

/** Used by the frontend on boot to resolve who (if anyone) is signed in. */
const me = (req, res) => {
  res.json({ success: true, data: req.user.toPublicJSON() });
};

module.exports = { register, login, logout, me, INVALID_CREDENTIALS };

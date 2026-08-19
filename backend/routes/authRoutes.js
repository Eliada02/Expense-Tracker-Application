'use strict';

const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/authController');
const validate = require('../middleware/validate');
const requireAuth = require('../middleware/requireAuth');
const env = require('../config/env');
const { registerBody, loginBody } = require('../validators/authValidators');

/**
 * Far tighter than the global limiter: these are the endpoints worth
 * brute-forcing, and a real person signs in a handful of times an hour.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skip: () => env.isTest,
  standardHeaders: true,
  legacyHeaders: false,
  // Failed attempts are what we are limiting; a correct sign-in should not
  // count against the visitor.
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

router.post('/register', authLimiter, validate({ body: registerBody }), controller.register);
router.post('/login', authLimiter, validate({ body: loginBody }), controller.login);
router.post('/logout', controller.logout);
router.get('/me', requireAuth, controller.me);

module.exports = router;

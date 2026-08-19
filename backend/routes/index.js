'use strict';

const router = require('express').Router();
const { materialiseRecurring } = require('../services/recurringService');
const validate = require('../middleware/validate');
const requireAuth = require('../middleware/requireAuth');
const { dashboardQuery } = require('../validators/dashboardValidators');
const { budgetQuery } = require('../validators/budgetValidators');
const dashboardController = require('../controllers/dashboardController');
const metaController = require('../controllers/metaController');

/* --- Public --------------------------------------------------------------
   Only liveness and the static taxonomy. Neither reveals anything about a
   user or their data. */

router.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));

router.get('/categories', metaController.getCategories);
router.get('/payment-methods', metaController.getPaymentMethods);
router.get('/config', metaController.getConfig);

router.use('/auth', require('./authRoutes'));

/* --- Authenticated -------------------------------------------------------
   Everything below is financial data. `requireAuth` is applied once here
   rather than route by route, so a new router cannot be mounted without
   protection by accident. */

router.use(requireAuth);

// Due recurring expenses are materialised before anything that reads spending,
// so the numbers a user sees always include their fixed costs. This runs after
// requireAuth because it needs to know whose rules to process.
router.use(['/expenses', '/dashboard', '/insights', '/budgets'], materialiseRecurring);

router.get('/dashboard', validate({ query: dashboardQuery }), dashboardController.dashboard);
router.get('/insights', validate({ query: budgetQuery }), dashboardController.insights);

router.use('/expenses', require('./expenseRoutes'));
router.use('/incomes', require('./incomeRoutes'));
router.use('/budgets', require('./budgetRoutes'));
router.use('/recurring', require('./recurringRoutes'));

module.exports = router;

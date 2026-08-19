'use strict';

const router = require('express').Router();
const controller = require('../controllers/expenseController');
const validate = require('../middleware/validate');
const { idParam } = require('../validators/common');
const {
  expenseBody,
  expenseQuery,
  expenseExportQuery,
} = require('../validators/transactionValidators');

router.get('/export', validate({ query: expenseExportQuery }), controller.export);

router
  .route('/')
  .get(validate({ query: expenseQuery }), controller.list)
  .post(validate({ body: expenseBody }), controller.create);

router
  .route('/:id')
  .get(validate({ params: idParam }), controller.getOne)
  .put(validate({ params: idParam, body: expenseBody }), controller.update)
  .delete(validate({ params: idParam }), controller.remove);

module.exports = router;

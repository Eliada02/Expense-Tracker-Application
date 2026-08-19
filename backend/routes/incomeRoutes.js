'use strict';

const router = require('express').Router();
const controller = require('../controllers/incomeController');
const validate = require('../middleware/validate');
const { idParam } = require('../validators/common');
const { incomeBody, incomeQuery } = require('../validators/transactionValidators');

router
  .route('/')
  .get(validate({ query: incomeQuery }), controller.list)
  .post(validate({ body: incomeBody }), controller.create);

router
  .route('/:id')
  .get(validate({ params: idParam }), controller.getOne)
  .put(validate({ params: idParam, body: incomeBody }), controller.update)
  .delete(validate({ params: idParam }), controller.remove);

module.exports = router;

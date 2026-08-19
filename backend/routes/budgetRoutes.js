'use strict';

const router = require('express').Router();
const controller = require('../controllers/budgetController');
const validate = require('../middleware/validate');
const { idParam } = require('../validators/common');
const { budgetBody, budgetQuery } = require('../validators/budgetValidators');

router
  .route('/')
  .get(validate({ query: budgetQuery }), controller.list)
  .put(validate({ body: budgetBody }), controller.save);

router.delete('/:id', validate({ params: idParam }), controller.remove);

module.exports = router;

'use strict';

const router = require('express').Router();
const controller = require('../controllers/recurringController');
const validate = require('../middleware/validate');
const { idParam } = require('../validators/common');
const { recurringBody } = require('../validators/recurringValidators');

router
  .route('/')
  .get(controller.list)
  .post(validate({ body: recurringBody }), controller.create);

router
  .route('/:id')
  .put(validate({ params: idParam, body: recurringBody }), controller.update)
  .delete(validate({ params: idParam }), controller.remove);

module.exports = router;

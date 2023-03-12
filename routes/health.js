const express = require('express');
const router = express.Router();

const {newHealth,getHealth,readHealth,updateHealth, deleteHealth } = require('../controllers/healthController');

router.route('/health/new').post(newHealth);
router.route('/health/read').get(getHealth);
router.route('/health/edit/:id').get(readHealth);
router.route('/health/update/:id').put(updateHealth);

router.route('/health/delete/:id').delete(deleteHealth);

module.exports = router;
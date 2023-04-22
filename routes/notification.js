const express = require('express');
const router = express.Router();

const {allNotification, updateLength, updateSpecificNotif, newNotification } = require('../controllers/notificationController');
const { protect } = require("../middlewares/authMiddleware");

router.route('/allNotification/:id').get(allNotification);
router.route('/notification/updateLength').post(updateLength);
router.route('/notification/updateNotif/:id').put(updateSpecificNotif);
router.route('/notification/new').post(newNotification);

module.exports = router;

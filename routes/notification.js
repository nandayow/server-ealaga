const express = require('express');
const router = express.Router();

const {allNotification, updateLength, updateSpecificNotif, newNotification } = require('../controllers/notificationController');
const { protect } = require("../middlewares/authMiddleware");

router.route('/allNotification').get(protect, allNotification);
router.route('/notification/updateLength').post(protect, updateLength);
router.route('/notification/updateNotif/:id').put(protect, updateSpecificNotif);
router.route('/notification/new').post(protect, newNotification);

module.exports = router;

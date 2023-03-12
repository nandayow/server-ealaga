const express = require('express');
const router = express.Router();

const {schedule, add, activity, viewActivity, history,addReview, cancelActivity, attendeesList} = require('../controllers/scheduleController');

router.route('/schedule/:id').get(schedule);
router.route('/activity/:id').get(activity);
router.route('/activity/view/:id').get(viewActivity);
router.route('/activity/cancel/:id').get(cancelActivity);
router.route('/history/:id').get(history);
router.route('/review/:id').put(addReview);
router.route('/schedule/add').post(add);
router.route('/attendees').get(attendeesList);

module.exports = router;
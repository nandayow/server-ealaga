const express = require('express');
const router = express.Router();

const {newAnnouncement, getAnnouncement,editAnnouncement,deleteAnnouncement } = require('../controllers/announcementController');

router.route('/announcement/new').post(newAnnouncement);
router.route('/announcement/read').get(getAnnouncement);
router.route('/announcement/edit/:id').put(editAnnouncement);
router.route('/announcement/delete/:id').delete(deleteAnnouncement);
module.exports = router;
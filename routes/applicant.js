const express = require('express');
const router = express.Router();

const {newApplicant, getApplicant, viewApplicant, acceptApplicant, deniedApplicant} = require('../controllers/applicantController');

router.route('/applicant/new').post(newApplicant);
router.route('/applicant/get').get(getApplicant);
router.route('/applicant/view/:id').get(viewApplicant);
router.route('/applicant/accept/:id').put(acceptApplicant);
router.route('/applicant/denied/:id').put(deniedApplicant);
// router.route('/health/delete/:id').delete(deleteHealth);

module.exports = router;
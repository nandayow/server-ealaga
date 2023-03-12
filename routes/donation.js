const express = require('express');
const router = express.Router();

const {clientDonation, clientDonationRead } = require('../controllers/donationController');

 
//client donation fetch 
router.route('/client/:id').get(clientDonation);
router.route('/client/clientDonationRead/:id').get(clientDonationRead);

module.exports = router;
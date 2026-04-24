const express = require('express');
const router = express.Router();
const { chargeCallback } = require('../controllers/controller.callback');
// const { moCallback } = require('../controllers/controller.mocallback');
const { checkSubscriptionStatus } = require('../controllers/controller.subscription');

router.post('/notify-callback', chargeCallback);
// router.post('/notify-mo-callback' , moCallback);/rs

router.post("/check-status", checkSubscriptionStatus);


module.exports = router;

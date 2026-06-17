const express = require('express');
const router = express.Router();
const { chargeCallback } = require('../controllers/controller.callback');
// const { moCallback } = require('../controllers/controller.mocallback');
const { checkSubscriptionStatus } = require('../controllers/controller.subscription');
const { checkSubscription, createSubscription } = require('../controllers/CheckSub');

router.all('/notify-callback', chargeCallback);
// router.post('/notify-mo-callback' , moCallback);/rs

router.post("/check-status", checkSubscriptionStatus);

router.post(
  "/check-subscription",
  checkSubscription
);

router.post(
  "/create-subscription",
  createSubscription
);



module.exports = router;

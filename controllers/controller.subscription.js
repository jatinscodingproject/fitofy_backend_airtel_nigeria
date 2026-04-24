const Subscription = require("../models/models.subscription");

const checkSubscriptionStatus = async (req, res) => {
  try {
    const { msisdn, channel_id } = req.body;

    if (!msisdn || !channel_id) {
      return res.status(400).json({
        message: "msisdn and channel_id are required"
      });
    }

    const subscription = await Subscription.findOne({
      where: { msisdn, channel_id }
    });

    if (!subscription) {
      return res.status(200).json({
        status: "NOT_SUBSCRIBED",
        message: "User is not subscribed"
      });
    }

    if (subscription.status === "active") {
      return res.status(200).json({
        status: "ACTIVE",
        message: "User is active"
      });
    }

    return res.status(200).json({
      status: subscription.status.toUpperCase(),
      message: `User status is ${subscription.status}`
    });

  } catch (error) {
    console.error("Check subscription error:", error.message);

    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports = {
  checkSubscriptionStatus
};

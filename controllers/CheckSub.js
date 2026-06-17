const jwt = require("jsonwebtoken");
const AnCallbackLog = require("../models/models.callback");
const crypto = require("crypto");
exports.checkSubscription = async (req, res) => {
  try {
    const { msisdn } = req.body;

    if (!msisdn) {
      return res.status(400).json({
        success: false,
        message: "MSISDN is required",
      });
    }

    // Test Number
    if (msisdn === "7039594389") {
      const token = jwt.sign(
        {
          msisdn,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "30d",
        }
      );

      return res.json({
        success: true,
        active: true,
        token,
      });
    }

    const latestRecord = await AnCallbackLog.findOne({
      where: {
        msisdn,
      },
      order: [["createdAt", "DESC"]],
    });

    if (!latestRecord) {
      return res.json({
        success: true,
        active: false,
        message: "No subscription found",
      });
    }

    const action = String(
      latestRecord.action || ""
    ).toUpperCase();

    if (
      action === "UNSUBSCRIBE" ||
      action === "DEACTIVATE"
    ) {
      return res.json({
        success: true,
        active: false,
        message: "Subscription inactive",
      });
    }

    const token = jwt.sign(
      {
        msisdn,
        user_id: latestRecord.user_id,
        channel_id: latestRecord.channel_id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    return res.json({
      success: true,
      active: true,
      token,
    });
  } catch (error) {
    console.error(
      "Check Subscription Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


exports.createSubscription = async (req, res) => {
  try {
    const { plan } = req.body;

    const trxId =
      Date.now() +
      "_" +
      crypto.randomBytes(4).toString("hex");

    const trafficSource = "web";

    let redirect_url = "";

    if (plan === "daily") {
      redirect_url =
        `http://ng-airtel-web.upp.st/NAC-NGAIR-INNOV/FitnessDaily-24-Yes-40677-Web` +
        `?trxId=${trxId}&trfsrc=${trafficSource}`;
    } else if (plan === "weekly") {
      redirect_url =
        `http://ng-airtel-web.upp.st/NAC-NGAIR-INNOV/FitnessWeekly-168-Yes-40680-Web` +
        `?trxId=${trxId}&trfsrc=${trafficSource}`;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid plan",
      });
    }

    return res.json({
      success: true,
      trxId,
      redirect_url,
    });
  } catch (error) {
    console.error("Subscription Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
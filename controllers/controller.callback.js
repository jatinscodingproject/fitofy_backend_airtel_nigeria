const axios = require("axios");
const AnCallbackLog = require("../models/models.callback");
const Subscription = require("../models/models.subscription");
require('dotenv').config();

const chargeCallback = async (req, res) => {
  console.log("api hitted" ,req.body)
  try {
    const {
      user_id,
      msisdn,
      channel_id,
      notification_id,
      notification_time,
      action,
      amount,
      original_mo,
      transaction_id,
      subscription_id
    } = req.body;

    if (!msisdn || !channel_id) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const clientIp =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress;

    let smsResponse = null;
    let sdpApiKey = null;
    let message = null;

    if (action === "sub") {
      await Subscription.update(
        {
          status: "active",
          transaction_id: transaction_id || null,
          subscription_id: subscription_id || null,
        },
        { where: { msisdn, channel_id } }
      );

      
    }

    const apiKeyForLog = sdpApiKey || "N/A";

    await AnCallbackLog.create({
      user_id,
      notification_id,
      notification_time,
      api_key: apiKeyForLog,
      msisdn,
      channel_id,
      amount: amount ? Number(amount) : null,
      action,
      message,
      source_ip: clientIp,
      original_mo,
    });

    if (Number(channel_id) === 172) {
        sdpApiKey = process.env.SDP_API_KEY_DAILY;
        message = `You have subscribed to the DAILY fitofyy pack. Here you can access it https://airtelng.fitofyy.com/?msisdn=${msisdn}`;
      } else if (Number(channel_id) === 174) {
        sdpApiKey = process.env.SDP_API_KEY_WEEKLY;
        message = `You have subscribed to the WEEKLY fitofyy pack. Here you can access it https://airtelng.fitofyy.com/?msisdn=${msisdn}`;
      }

      if (sdpApiKey) {
        try {
          smsResponse = await axios.get(
            "https://mediaworldsdp.com/en/api/get/users.send_sms",
            {
              params: {
                api_key: sdpApiKey,
                msisdn: msisdn,
                channel_id: channel_id,
                extra: JSON.stringify({ message }),
              },
            }
          );
          console.log(smsResponse)
        } catch (smsError) {
          console.error("SMS Sending Failed:", smsError.message);
        }
      }

    return res.status(200).json({ status: "ACK" });
  } catch (error) {
    console.error("Charge callback error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports = { chargeCallback };

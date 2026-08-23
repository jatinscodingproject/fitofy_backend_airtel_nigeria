const axios = require("axios");
const AnCallbackLog = require("../models/models.callback");
const Subscription = require("../models/models.subscription");

require("dotenv").config();

const chargeCallback = async (req, res) => {
  console.log("API Hitted");

  // Support BOTH GET query params and POST body
  const data = {
    ...req.query,
    ...req.body,
  };

  console.log("Request Data:", data);

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
      subscription_id,
    } = data;

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
      try {
        const payload = {
          channel_id: channel_id,
          user_id: user_id,
          msisdn: msisdn,
          notification_id: notification_id,
          notification_time: notification_time,
          action: action,
          amount: amount,
          transaction_id: transaction_id,
          subscription_id: subscription_id,
          orginal_mo: data.orginal_mo || "",
        };

        console.log(
          "Sending JSON:",
          JSON.stringify(payload, null, 2)
        );

        // =====================================================
        // 1. SEND TO BOLD MEDIA
        // =====================================================

        try {
          const response = await axios({
            method: "post",
            url: "https://cb.boldmediadigital.com/ng/airtel",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            data: payload,
          });

          console.log(
            "Bold Media Response:",
            response.data
          );
        } catch (err) {
          console.error(
            "Bold Media Callback Error:",
            err.response?.status,
            err.response?.data || err.message
          );
        }



        try {
          // IMPORTANT:
          // This must come from the original Gridix tracked visit.
          const cid = gridixClickId;

          if (!cid) {
            console.warn(
              "Gridix postback skipped: cid/Gridix click ID is missing"
            );
          } else {
            const gridixUrl = new URL(
              "https://api.gridixtech.com/api/v1/postback"
            );

            gridixUrl.searchParams.set(
              "cid",
              cid
            );

            // Your transaction ID
            if (transaction_id) {
              gridixUrl.searchParams.set(
                "txn_id",
                String(transaction_id)
              );
            }

            // Your internal user/customer ID
            if (user_id) {
              gridixUrl.searchParams.set(
                "user_ref",
                String(user_id)
              );
            }

            // Subscriber MSISDN
            if (msisdn) {
              gridixUrl.searchParams.set(
                "msisdn",
                String(msisdn)
              );
            }

            console.log(
              "Sending Gridix Postback:",
              gridixUrl.toString()
            );

            const gridixResponse = await axios.get(
              gridixUrl.toString(),
              {
                headers: {
                  Accept: "application/json",
                },
                timeout: 10000,
              }
            );

            console.log(
              "Gridix Response:",
              gridixResponse.data
            );
          }
        } catch (err) {
          console.error(
            "Gridix Postback Error:",
            err.response?.status,
            err.response?.data || err.message
          );
        }

      } catch (err) {
        console.error(
          "Subscription Callback Error:",
          err.response?.status,
          err.response?.data || err.message
        );
      }
    }

    // Update subscription
    if (action === "sub") {
      await Subscription.update(
        {
          status: "active",
          transaction_id: transaction_id || null,
          subscription_id: subscription_id || null,
        },
        {
          where: {
            msisdn,
            channel_id,
          },
        }
      );
    }

    // SMS Logic
    if (
      Number(channel_id) === 172 &&
      (action === "sub" || action === "renewal" || action === "first_charge")
    ) {
      sdpApiKey = process.env.SDP_API_KEY_DAILY;

      message = `You have subscribed to the DAILY fitofyy pack. Here you can access it https://airtelng.fitofyy.com/?msisdn=${msisdn}`;
    } else if (
      Number(channel_id) === 174 &&
      (action === "sub" || action === "renewal" || action === "first_charge")
    ) {
      sdpApiKey = process.env.SDP_API_KEY_WEEKLY;

      message = `You have subscribed to the WEEKLY fitofyy pack. Here you can access it https://airtelng.fitofyy.com/?msisdn=${msisdn}`;
    }

    // Send SMS
    if (sdpApiKey) {
      try {
        smsResponse = await axios.get(
          "https://mediaworldsdp.com/en/api/get/users.send_sms",
          {
            params: {
              api_key: sdpApiKey,
              msisdn,
              channel_id,
              extra: JSON.stringify({ message }),
            },
          }
        );

        console.log("SMS Response:", smsResponse.data);
      } catch (smsError) {
        console.error("SMS Sending Failed:", smsError.message);
      }
    }

    // Save callback log
    await AnCallbackLog.create({
      user_id,
      notification_id,
      notification_time,
      api_key: sdpApiKey || "N/A",
      msisdn,
      channel_id,
      amount: amount ? Number(amount) : null,
      action,
      message,
      source_ip: clientIp,
      original_mo,
    });

    return res.status(200).json({
      status: "ACK",
    });
  } catch (error) {
    console.error("Charge callback error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports = { chargeCallback };
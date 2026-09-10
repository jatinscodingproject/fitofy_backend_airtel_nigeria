const axios = require("axios");
const AnCallbackLog = require("../models/models.callback");
const Subscription = require("../models/models.subscription");
const PublisherClick = require("../models/models.publisherClick");

require("dotenv").config();

const chargeCallback = async (req, res) => {
  console.log("API Hitted");
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

    // =========================================================
    // SUBSCRIPTION CALLBACK
    // =========================================================

    if (action === "sub") {
      try {
        const payload = {
          channel_id,
          user_id,
          msisdn,
          notification_id,
          notification_time,
          action,
          amount,
          transaction_id,
          subscription_id,
          orginal_mo: data.orginal_mo || "",
        };

        console.log(
          "Sending JSON:",
          JSON.stringify(payload, null, 2)
        );

      
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
          const latestClick = await PublisherClick.findOne({
            order: [["createdAt", "DESC"]],
          });

          if (!latestClick) {
            console.warn(
              "Gridix postback skipped: No PublisherClick found"
            );
          } else {
            const cid = latestClick.click_id;

            console.log(
              "Latest Publisher Click:",
              {
                id: latestClick.id,
                click_id: cid,
                client: latestClick.client,
                service: latestClick.service,
                publisher: latestClick.publisher,
                createdAt: latestClick.createdAt,
              }
            );

            if (!cid) {
              console.warn(
                "Gridix postback skipped: click_id is missing"
              );
            } else {
            
              const gridixUrl = new URL(
                "https://api.gridixtech.com/api/v1/postback"
              );

              gridixUrl.searchParams.set(
                "cid",
                String(cid)
              );

              if (transaction_id) {
                gridixUrl.searchParams.set(
                  "txn_id",
                  String(transaction_id)
                );
              }

              if (user_id) {
                gridixUrl.searchParams.set(
                  "user_ref",
                  String(user_id)
                );
              }

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

    // =========================================================
    // UPDATE SUBSCRIPTION
    // =========================================================

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

    // =========================================================
    // SMS LOGIC
    // =========================================================

    if (
      Number(channel_id) === 172 &&
      (
        action === "sub" ||
        action === "renewal" ||
        action === "first_charge"
      )
    ) {
      sdpApiKey = process.env.SDP_API_KEY_DAILY;

      message =
        `You have subscribed to the DAILY fitofyy pack. ` +
        `Here you can access it https://airtelng.fitofyy.com/?msisdn=${msisdn}`;

    } else if (
      Number(channel_id) === 174 &&
      (
        action === "sub" ||
        action === "renewal" ||
        action === "first_charge"
      )
    ) {
      sdpApiKey = process.env.SDP_API_KEY_WEEKLY;

      message =
        `You have subscribed to the WEEKLY fitofyy pack. ` +
        `Here you can access it https://airtelng.fitofyy.com/?msisdn=${msisdn}`;
    }

    // =========================================================
    // SEND SMS
    // =========================================================

    if (sdpApiKey) {
      try {
        smsResponse = await axios.get(
          "https://mediaworldsdp.com/en/api/get/users.send_sms",
          {
            params: {
              api_key: sdpApiKey,
              msisdn,
              channel_id,
              extra: JSON.stringify({
                message,
              }),
            },
          }
        );

        console.log(
          "SMS Response:",
          smsResponse.data
        );

      } catch (smsError) {
        console.error(
          "SMS Sending Failed:",
          smsError.message
        );
      }
    }

    // =========================================================
    // SAVE CALLBACK LOG
    // =========================================================

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
    console.error(
      "Charge callback error:",
      error
    );

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  chargeCallback,
};

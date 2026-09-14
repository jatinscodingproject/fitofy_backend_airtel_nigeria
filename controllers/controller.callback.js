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

    if (action === "sub") {
      try {
        let gridixService = null;

        if (Number(channel_id) === 172) {
          gridixService = "FTDL";
        } else if (Number(channel_id) === 174) {
          gridixService = "FTWL";
        }

        if (!gridixService) {
          console.warn(
            `Gridix postback skipped: Unknown channel_id ${channel_id}`
          );
        } else {
          /*
          * Find the latest click belonging to the correct service.
          *
          * IMPORTANT:
          * Do not use the latest PublisherClick globally.
          * We specifically search for:
          *
          * FTDL -> Daily
          * FTWL -> Weekly
          *
          * and the click_id must start with "clk_".
          */

          const latestClick = await PublisherClick.findOne({
            where: {
              service: gridixService,
              click_id: {
                [require("sequelize").Op.like]: "clk_%",
              },
            },
            order: [["createdAt", "DESC"]],
          });

          if (!latestClick) {
            console.warn(
              `Gridix postback skipped: No click found for service ${gridixService}`
            );
          } else {
            const cid = latestClick.click_id;

            console.log(
              `Gridix click found for ${gridixService}:`,
              cid
            );

            /*
            * Gridix documentation:
            *
            * Required:
            *   cid
            *
            * Optional:
            *   txn_id
            *   user_ref
            *   msisdn
            *
            * We intentionally send ONLY cid.
            */

            const gridixUrl = new URL(
              "https://api.gridixtech.com/api/v1/postback"
            );

            gridixUrl.searchParams.set("cid", String(cid));

            console.log(
              `Sending Gridix ${gridixService} Postback:`,
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
              `Gridix ${gridixService} Response:`,
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
    }

   
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

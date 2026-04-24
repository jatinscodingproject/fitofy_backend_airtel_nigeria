const cron = require("node-cron");
const axios = require("axios");
const Subscription = require("../models/models.subscription");
require("dotenv").config();

// Run every day at 12:00 AM GMT
cron.schedule("0 0 * * *", async () => {
  console.log("Running daily SMS cron at 12:00 GMT");

  try {
    // Get all active users
    const users = await Subscription.findAll({
    //   where: {
    //     status: "active",
    //   },
    });

    for (const user of users) {
      let message = null;
      let sdpApiKey = null;

      if (Number(user.channel_id) === 173) {
        sdpApiKey = process.env.SDP_API_KEY_DAILY;
        message = `Daily fitofyy pack active. Access here: https://airtelng.fitofyy.com/?msisdn=${user.msisdn}`;
      } else if (Number(user.channel_id) === 171) {
        sdpApiKey = process.env.SDP_API_KEY_WEEKLY;
        message = `Weekly fitofyy pack active. Access here: https://airtelng.fitofyy.com/?msisdn=${user.msisdn}`;
      }

      if (sdpApiKey && message) {
        try {
          await axios.get(
            "https://mediaworldsdp.com/en/api/get/users.send_sms",
            {
              params: {
                api_key: sdpApiKey,
                msisdn: user.msisdn,
                channel_id: user.channel_id,
                extra: JSON.stringify({ message }),
              },
            }
          );

          console.log(`SMS sent to ${user.msisdn}`);
        } catch (err) {
          console.error(`Failed for ${user.msisdn}:`, err.message);
        }
      }
    }

    console.log("Daily SMS cron completed");
  } catch (error) {
    console.error("Cron error:", error.message);
  }
}, {
  timezone: "Etc/GMT" // IMPORTANT: ensures GMT timing
});
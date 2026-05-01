const cron = require("node-cron");
const axios = require("axios");
const { Op } = require("sequelize");
const AnCallbackLog = require("../models/models.callback");
require("dotenv").config();

cron.schedule(
  "0 8 * * *",
  async () => {
    console.log("Running daily SMS cron at 8:00 AM GMT");

    try {
      const logs = await AnCallbackLog.findAll({
        where: {
          action: {
            [Op.in]: ["sub", "renewal"],
          },
        },
        order: [["createdAt", "DESC"]],
      });

      const uniqueUsers = new Map();

      for (const log of logs) {
        if (!uniqueUsers.has(log.msisdn)) {
          uniqueUsers.set(log.msisdn, log);
        }
      }

      const users = Array.from(uniqueUsers.values());

      console.log(`Total unique users: ${users.length}`);

      for (const user of users) {
        const chId = Number(user.channel_id);

        let message = null;
        let sdpApiKey = null;

        if (Number(channel_id) === 172) {
          sdpApiKey = process.env.SDP_API_KEY_DAILY;
          message = `You have subscribed to the DAILY fitofyy pack. Here you can access it https://airtelng.fitofyy.com/?msisdn=${msisdn}`;
        } else if (Number(channel_id) === 174) {
          sdpApiKey = process.env.SDP_API_KEY_WEEKLY;
          message = `You have subscribed to the WEEKLY fitofyy pack. Here you can access it https://airtelng.fitofyy.com/?msisdn=${msisdn}`;
        }

        if (sdpApiKey && message) {
          try {
            await axios.get(
              "https://mediaworldsdp.com/en/api/get/users.send_sms",
              {
                params: {
                  api_key: sdpApiKey,
                  msisdn: user.msisdn,
                  channel_id: chId,
                  extra: message,
                },
              }
            );

            console.log(`✅ SMS sent to ${user.msisdn}`);
          } catch (err) {
            console.error(`❌ Failed for ${user.msisdn}:`, err.message);
          }
        }
      }

      console.log("✅ Daily SMS cron completed");

    } catch (error) {
      console.error("❌ Cron error:", error.message);
    }
  },
  {
    timezone: "Etc/GMT",
  }
); 6653
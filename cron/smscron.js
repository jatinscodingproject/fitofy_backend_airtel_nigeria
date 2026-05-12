const cron = require("node-cron");
const axios = require("axios");
const { Op } = require("sequelize");
const moment = require("moment");

const AnCallbackLog = require("../models/models.callback");

require("dotenv").config();

cron.schedule(
  "0 8 * * *",
  async () => {
    console.log("Running Fitofyy weekly SMS cron");

    try {
      const logs = await AnCallbackLog.findAll({
        where: {
          action: {
            [Op.in]: ["sub", "renewal"],
          },
          channel_id: 174, // ONLY WEEKLY USERS
        },
        order: [["createdAt", "DESC"]],
      });

      const uniqueUsers = new Map();

      // latest record per msisdn
      for (const log of logs) {
        if (!uniqueUsers.has(log.msisdn)) {
          uniqueUsers.set(log.msisdn, log);
        }
      }

      const users = Array.from(uniqueUsers.values());

      console.log(`Total weekly users: ${users.length}`);

      for (const user of users) {
        const createdAt = moment(user.createdAt);
        const expiry = createdAt.clone().add(7, "days");

        // skip expired users
        if (moment().isAfter(expiry)) {
          console.log(`⏩ Expired weekly user: ${user.msisdn}`);
          continue;
        }

        const message = `You have subscribed to the WEEKLY fitofyy pack. Here you can access it https://airtelng.fitofyy.com/?msisdn=${user.msisdn}`;

        try {
          await axios.get(
            "https://mediaworldsdp.com/en/api/get/users.send_sms",
            {
              params: {
                api_key: process.env.SDP_API_KEY_WEEKLY,
                msisdn: user.msisdn,
                channel_id: 174,
                extra: JSON.stringify({ message }),
              },
            }
          );

          console.log(`✅ SMS sent to ${user.msisdn}`);
        } catch (err) {
          console.error(`❌ Failed for ${user.msisdn}:`, err.message);
        }
      }

      console.log("✅ Fitofyy weekly SMS cron completed");

    } catch (error) {
      console.error("❌ Cron error:", error.message);
    }
  },
  {
    timezone: "Etc/GMT",
  }
);
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const AnCallbackLog = sequelize.define(
  "an_callback_logs",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },

    user_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    notification_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    notification_time: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    api_key: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },

    msisdn: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    channel_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    action: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    source_ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },

    original_mo: {
      type: DataTypes.TEXT(),
      allowNull : true
    }
  },
  {
    tableName: "an_callback_logs",
    timestamps: true,
  }
);

module.exports = AnCallbackLog;

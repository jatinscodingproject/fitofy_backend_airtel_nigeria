const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Subscription = sequelize.define(
  "subscriptions",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },

    msisdn: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    channel_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    subscription_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    transaction_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },

    status: {
      type: DataTypes.ENUM(
        "pending",
        "active",
        "charge_failed",
        "renewal_failed",
        "cancelled",
        "expired"
      ),
      defaultValue: "pending",
    },

    service_type: {
      type: DataTypes.ENUM("daily", "weekly", "monthly"),
      allowNull: true,
    },

    last_charged_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    next_renewal_date: {
      type: DataTypes.DATE,
      allowNull: true,
    }

  },
  {
    tableName: "subscriptions",
    timestamps: true,
    indexes: [
      {
        fields: ["msisdn", "channel_id"]
      }
    ]
  }
);

module.exports = Subscription;

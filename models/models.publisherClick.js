const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PublisherClick = sequelize.define(
    "PublisherClick",
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },

        client: {
            type: DataTypes.STRING(100),
            allowNull: false
        },

        service: {
            type: DataTypes.STRING(100),
            allowNull: false
        },

        publisher: {
            type: DataTypes.STRING(150),
            allowNull: false
        },

        click_id: {
            type: DataTypes.STRING(255),
            allowNull: false,
            index: true
        },

        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },

        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    },
    {
        tableName: "publisher_clicks",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
);

module.exports = PublisherClick;
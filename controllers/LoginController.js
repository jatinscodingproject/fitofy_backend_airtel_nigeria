const jwt = require("jsonwebtoken");
require('dotenv').config()

exports.loginUser = async(req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.json({
                status: false,
                message: "Phone number is required"
            });
        }

        if (phone !== "7039594389") {
            return res.json({
                status: false,
                message: "Invalid phone number"
            });
        }

        const token = jwt.sign({
                userId: 1,
                phone: phone
            },
            "MY_SECRET_KEY_123", { expiresIn: "7d" }
        );

        return res.json({
            status: true,
            message: "Login successful",
            token: token
        });

    } catch (err) {
        return res.json({
            status: false,
            message: "Something went wrong",
            error: err.message
        });
    }
};
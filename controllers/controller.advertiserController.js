const crypto = require("crypto");
const PublisherClick = require("../models/models.publisherClick");

exports.subscribe = async (req, res) => {
    try {

        const {
            client,
            service,
            publisher,
            clickId
        } = req.query;


        // -----------------------------
        // Validate parameters
        // -----------------------------

        if (!client) {
            return res.status(400).json({
                success: false,
                message: "client is required"
            });
        }

        if (!service) {
            return res.status(400).json({
                success: false,
                message: "service is required"
            });
        }

        if (!publisher) {
            return res.status(400).json({
                success: false,
                message: "publisher is required"
            });
        }

        if (!clickId) {
            return res.status(400).json({
                success: false,
                message: "clickId is required"
            });
        }


        // -----------------------------
        // Clean values
        // -----------------------------

        const cleanClient = String(client).trim();
        const cleanService = String(service).trim();
        const cleanPublisher = String(publisher).trim();
        const cleanClickId = String(clickId).trim();


        // -----------------------------
        // Generate random transaction ID
        // -----------------------------

        const trxId = crypto
            .randomUUID()
            .replace(/-/g, "")
            .substring(0, 12)
            .toUpperCase();


        // Example:
        // 8F31A7C92B10


        // -----------------------------
        // Store publisher click
        // -----------------------------

        const click = await PublisherClick.create({
            client: cleanClient,
            service: cleanService,
            publisher: cleanPublisher,
            click_id: cleanClickId
        });


        console.log("Publisher Click Stored:", {
            id: click.id,
            client: cleanClient,
            service: cleanService,
            publisher: cleanPublisher,
            clickId: cleanClickId,
            trxId: trxId
        });


        // -----------------------------
        // Create advertiser URL
        // -----------------------------

        const redirectUrl =
            "http://ng-airtel-web.upp.st/NAC-NGAIR-INNOV/FitnessDaily-24-Yes-40677-Web" +
            `?trxId=${encodeURIComponent(trxId)}` +
            `&trfsrc=web`;


        console.log("Redirecting to:", redirectUrl);


        // -----------------------------
        // Redirect
        // -----------------------------

        return res.redirect(302, redirectUrl);


    } catch (error) {

        console.error(
            "Advertiser Subscribe Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to process advertiser subscription",
            error: error.message
        });
    }
};
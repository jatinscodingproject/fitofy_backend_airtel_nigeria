const PublisherClick = require("../models/models.publisherClick");

exports.subscribe = async (req, res) => {
    try {
        const {
            client,
            service,
            publisher,
            clickId
        } = req.query;

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

        const cleanClient = String(client).trim();
        const cleanService = String(service).trim();
        const cleanPublisher = String(publisher).trim();
        const cleanClickId = String(clickId).trim();

        const click =
            await PublisherClick.create({
                client: cleanClient,
                service: cleanService,
                publisher: cleanPublisher,
                click_id: cleanClickId
            });


        console.log(
            "Publisher Click Stored:",
            {
                id: click.id,
                client: cleanClient,
                service: cleanService,
                publisher: cleanPublisher,
                clickId: cleanClickId
            }
        );

        const redirectUrl =
            "https://arenaxpro.arbeex.com/";

        return res.redirect(
            redirectUrl
        );

    } catch (error) {
        console.error(
            "Advertiser Subscribe Error:",
            error
        );
        return res.status(500).json({
            success: false,
            message:
                "Unable to process advertiser subscription",
            error:
                error.message
        });
    }
};
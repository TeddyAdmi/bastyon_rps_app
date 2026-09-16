export default async function handler(req, res) {
    try {
        const address = req.query?.address;

        if (!address) {
            return res.status(400).json({
                success: false,
                error: "address is required"
            });
        }

        const response = await fetch(
            "https://pocketnet.app/api/node/getuserprofile",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    address: address,
                    shortForm: "basic"
                })
            }
        );

        const text = await response.text();

        return res.status(response.status).json({
            success: response.ok,
            status: response.status,
            response: text
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error
                ? error.message
                : "Unknown error"
        });
    }
}

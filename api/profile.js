export default async function handler(req, res) {
    try {
        const address = req.query?.address;

        if (!address) {
            return res.status(400).json({
                success: false,
                error: "address is required"
            });
        }

        const response = await fetch("https://bastyon.com/rpc/getuserprofile", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                address,
                shortForm: "basic"
            })
        });

        const text = await response.text();

        let data;

        try {
            data = JSON.parse(text);
        } catch {
            return res.status(502).json({
                success: false,
                error: "Invalid response from Bastyon RPC",
                status: response.status
            });
        }

        return res.status(response.ok ? 200 : response.status).json({
            success: response.ok,
            data
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

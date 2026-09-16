export default async function handler(req, res) {
    try {
        const address = req.query?.address;

        if (!address) {
            return res.status(400).json({
                success: false,
                error: "address is required"
            });
        }

        const endpoints = [
            "https://bastyon.com/api/rpc",
            "https://pocketnet.app/api/rpc"
        ];

        let lastError = null;

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        jsonrpc: "2.0",
                        id: 1,
                        method: "getuserprofile",
                        params: {
                            address,
                            shortForm: "basic"
                        }
                    })
                });

                const text = await response.text();

                let data;

                try {
                    data = JSON.parse(text);
                } catch {
                    lastError = `Invalid JSON from ${endpoint} (${response.status})`;
                    continue;
                }

                if (response.ok && data) {
                    return res.status(200).json({
                        success: true,
                        data
                    });
                }

                lastError =
                    data?.error?.message ||
                    `HTTP ${response.status}`;

            } catch (error) {
                lastError =
                    error instanceof Error
                        ? error.message
                        : "Request failed";
            }
        }

        return res.status(502).json({
            success: false,
            error: "Bastyon profile API unavailable",
            details: lastError
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error"
        });
    }
}

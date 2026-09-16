export default async function handler(req, res) {
    try {
        const address = req.query?.address;

        if (!address) {
            return res.status(400).json({
                success: false,
                error: "address is required"
            });
        }

        return res.status(200).json({
            success: true,
            address,
            message: "PROFILE_API_WAITING_FOR_PROXY"
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

import { getPocketNetProxyInstance } from "../lib/index.js";

export default async function handler(req, res) {
    try {
        const address = req.query.address;

        if (!address) {
            return res.status(400).json({
                error: "Address is required"
            });
        }

        const api = await getPocketNetProxyInstance();

        const result = await api.rpc.getuserprofile({
            address: address,
            shortForm: "basic"
        });

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {

        console.error("PROFILE ERROR:", error);

        return res.status(500).json({
            success: false,
            error: error instanceof Error
                ? error.message
                : "Unknown error"
        });
    }
}

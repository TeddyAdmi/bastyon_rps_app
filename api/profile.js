export default async function handler(req, res) {
    try {
        const address = req.query.address;

        if (!address) {
            return res.status(400).json({
                error: "Address is required"
            });
        }

        /*
         * Здесь пока проверяем получение профиля.
         * Bastyon Proxy API используется через серверную часть приложения.
         */

        const response = await fetch(
            "https://api.bastyon.com",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    method: "getuserprofile",
                    params: [{
                        address: address,
                        shortForm: "basic"
                    }]
                })
            }
        );

        const data = await response.json();

        return res.status(200).json(data);

    } catch (error) {

        console.error("PROFILE API ERROR:", error);

        return res.status(500).json({
            error: "Failed to load profile",
            message: error.message
        });
    }
}

export default async function handler(req, res) {
    return res.status(200).json({
        success: false,
        message: "Profile API is temporarily disabled"
    });
}

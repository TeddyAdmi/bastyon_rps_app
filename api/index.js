module.exports = function handler(req, res) {
res.status(200).json({
ok: true,
app: "bastyon-rps-app",
message: "API works"
});
};

const rooms = new Map();

function createRoomId() {
  return Math.random()
    .toString(36)
    .slice(2, 10);
}

module.exports = function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed"
      });
    }

    const body =
      req.body &&
      typeof req.body === "object"
        ? req.body
        : {};

    if (!body.userId) {
      return res.status(400).json({
        error: "userId is required"
      });
    }

    const roomId =
      createRoomId();

    const room = {
      id: roomId,
      status: "waiting",
      createdAt: Date.now(),
      expiresAt:
        Date.now() +
        24 * 60 * 60 * 1000,
      players: [
        {
          userId: String(
            body.userId
          ),
          nickname: String(
            body.nickname ||
            "Player"
          ),
          choice: null
        }
      ]
    };

    rooms.set(
      roomId,
      room
    );

    return res.status(200).json({
      room: room,
      paymentRequired: false,
      stake: 1,
      waitHours: 24
    });

  } catch (error) {
    return res.status(500).json({
      error: "SERVER_ERROR",
      message:
        error.message ||
        "Unknown error"
    });
  }
};

const rooms = new Map();

const ROOM_CONFIG = {
  "room-2": {
    number: 2,
    name: "Bronze",
    stake: 0.2
  },

  "room-3": {
    number: 3,
    name: "Silver",
    stake: 0.5
  },

  "room-4": {
    number: 4,
    name: "Gold",
    stake: 1
  },

  "room-5": {
    number: 5,
    name: "Platinum",
    stake: 2
  },

  "room-6": {
    number: 6,
    name: "Diamond",
    stake: 3
  },

  "room-7": {
    number: 7,
    name: "Master",
    stake: 4
  },

  "room-8": {
    number: 8,
    name: "Elite",
    stake: 5
  },

  "room-9": {
    number: 9,
    name: "Champion",
    stake: 10
  },

  "room-10": {
    number: 10,
    name: "Legend",
    stake: 50
  }
};


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
      String(
        body.roomId || ""
      );


    const roomConfig =
      ROOM_CONFIG[roomId];


    if (!roomConfig) {

      return res.status(400).json({

        error: "INVALID_ROOM",

        message:
          "Неверная PvP-комната"

      });

    }


    const requestedStake =
      Number(body.stake);


    if (
      !Number.isFinite(
        requestedStake
      ) ||
      requestedStake !==
        roomConfig.stake
    ) {

      return res.status(400).json({

        error: "INVALID_STAKE",

        message:
          "Ставка не соответствует комнате",

        expectedStake:
          roomConfig.stake

      });

    }


    const roomIdGenerated =
      createRoomId();


    const room = {

      id:
        roomIdGenerated,

      gameRoomId:
        roomId,

      roomNumber:
        roomConfig.number,

      roomName:
        roomConfig.name,

      stake:
        roomConfig.stake,

      status:
        "waiting",

      createdAt:
        Date.now(),

      expiresAt:
        Date.now() +
        24 * 60 * 60 * 1000,

      players: [

        {

          userId:
            String(
              body.userId
            ),

          nickname:
            String(
              body.nickname ||
              "Player"
            ),

          choice:
            null

        }

      ]

    };


    rooms.set(
      roomIdGenerated,
      room
    );


    return res.status(200).json({

      room:

        room,

      paymentRequired:
        true,

      stake:
        roomConfig.stake,

      roomId:
        roomConfig.number,

      roomName:
        roomConfig.name,

      waitHours:
        24

    });

  }


  catch (error) {

    console.error(
      "PVP JOIN ERROR:",
      error
    );


    return res.status(500).json({

      error:
        "SERVER_ERROR",

      message:
        error.message ||
        "Unknown error"

    });

  }

};

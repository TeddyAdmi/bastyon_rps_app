const waitingByRoom = new Map();
const roomsById = new Map();


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


const WAIT_TIME_MS =
  24 * 60 * 60 * 1000;


function createRoomId() {

  return Math.random()
    .toString(36)
    .slice(2, 10);

}


function getCleanWaitingPlayer(
  roomId
) {

  const waiting =
    waitingByRoom.get(
      roomId
    );


  if (!waiting) {

    return null;

  }


  if (
    Date.now() >
    waiting.expiresAt
  ) {

    waitingByRoom.delete(
      roomId
    );

    return null;

  }


  return waiting;

}


function createGameRoom(
  roomId,
  config,
  player
) {

  const gameRoomId =
    createRoomId();


  const now =
    Date.now();


  const room = {

    id:
      gameRoomId,

    gameRoomId:
      roomId,

    roomNumber:
      config.number,

    roomName:
      config.name,

    stake:
      config.stake,

    status:
      "waiting",

    createdAt:
      now,

    expiresAt:
      now +
      WAIT_TIME_MS,

    players: [

      {

        userId:
          player.userId,

        nickname:
          player.nickname,

        choice:
          null

      }

    ]

  };


  roomsById.set(
    gameRoomId,
    room
  );


  waitingByRoom.set(
    roomId,
    {

      gameRoomId:
        gameRoomId,

      userId:
        player.userId,

      nickname:
        player.nickname,

      expiresAt:
        room.expiresAt

    }
  );


  return room;

}


function matchPlayers(
  room,
  secondPlayer
) {

  room.status =
    "matched";


  room.players.push({

    userId:
      secondPlayer.userId,

    nickname:
      secondPlayer.nickname,

    choice:
      null

  });


  room.matchedAt =
    Date.now();


  waitingByRoom.delete(
    room.gameRoomId
  );


  roomsById.set(
    room.id,
    room
  );


  return room;

}


function findRoomForWaitingPlayer(
  roomId
) {

  const waiting =
    getCleanWaitingPlayer(
      roomId
    );


  if (!waiting) {

    return null;

  }


  return (
    roomsById.get(
      waiting.gameRoomId
    ) || null
  );

}


module.exports =
  function handler(
    req,
    res
  ) {

    try {


      /* ==============================
         METHOD
         ============================== */

      if (
        req.method !==
        "POST"
      ) {

        return res
          .status(405)
          .json({

            error:
              "Method not allowed"

          });

      }


      /* ==============================
         BODY
         ============================== */

      const body =
        req.body &&
        typeof req.body ===
          "object"

          ? req.body

          : {};


      /* ==============================
         USER
         ============================== */

      if (!body.userId) {

        return res
          .status(400)
          .json({

            error:
              "userId is required"

          });

      }


      /* ==============================
         ROOM
         ============================== */

      const roomId =
        String(
          body.roomId ||
          ""
        );


      const roomConfig =
        ROOM_CONFIG[
          roomId
        ];


      if (!roomConfig) {

        return res
          .status(400)
          .json({

            error:
              "INVALID_ROOM",

            message:
              "Неверная PvP-комната"

          });

      }


      /* ==============================
         STAKE
         ============================== */

      const requestedStake =
        Number(
          body.stake
        );


      if (

        !Number.isFinite(
          requestedStake
        )

        ||

        requestedStake !==
          roomConfig.stake

      ) {

        return res
          .status(400)
          .json({

            error:
              "INVALID_STAKE",

            message:
              "Ставка не соответствует комнате",

            expectedStake:
              roomConfig.stake

          });

      }


      /* ==============================
         PLAYER
         ============================== */

      const userId =
        String(
          body.userId
        );


      const nickname =
        String(
          body.nickname ||
          "Player"
        );


      /* ==============================
         LOOK FOR WAITING PLAYER
         ============================== */

      const existingWaiting =
        getCleanWaitingPlayer(
          roomId
        );


      /* ==============================
         FIRST PLAYER
         ============================== */

      if (!existingWaiting) {

        const room =
          createGameRoom(

            roomId,

            roomConfig,

            {

              userId:
                userId,

              nickname:
                nickname

            }

          );


        return res
          .status(200)
          .json({

            room:
              room,

            matched:
              false,

            alreadyWaiting:
              false,

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


      /* ==============================
         SAME PLAYER
         ============================== */

      if (
        existingWaiting.userId ===
        userId
      ) {

        const existingRoom =
          roomsById.get(
            existingWaiting.gameRoomId
          );


        if (existingRoom) {

          return res
            .status(200)
            .json({

              room:
                existingRoom,

              matched:
                false,

              alreadyWaiting:
                true,

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

      }


      /* ==============================
         FIND ROOM
         ============================== */

      const waitingRoom =
        findRoomForWaitingPlayer(
          roomId
        );


      /* ==============================
         NO VALID ROOM
         ============================== */

      if (!waitingRoom) {

        const room =
          createGameRoom(

            roomId,

            roomConfig,

            {

              userId:
                userId,

              nickname:
                nickname

            }

          );


        return res
          .status(200)
          .json({

            room:
              room,

            matched:
              false,

            alreadyWaiting:
              false,

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


      /* ==============================
         MATCH SECOND PLAYER
         ============================== */

      const matchedRoom =
        matchPlayers(

          waitingRoom,

          {

            userId:
              userId,

            nickname:
              nickname

          }

        );


      /* ==============================
         RESPONSE
         ============================== */

      return res
        .status(200)
        .json({

          room:
            matchedRoom,

          matched:
            true,

          alreadyWaiting:
            false,

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


    catch (
      error
    ) {

      console.error(
        "PVP JOIN ERROR:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "SERVER_ERROR",

          message:
            error.message ||
            "Unknown error"

        });

    }

  };

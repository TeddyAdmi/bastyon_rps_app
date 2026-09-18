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


const VALID_CHOICES = [
  "rock",
  "scissors",
  "paper"
];


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

    roomsById.delete(
      waiting.gameRoomId
    );

    return null;

  }


  return waiting;

}


function publicRoom(
  room
) {

  if (!room) {

    return null;

  }


  return {

    id:
      room.id,

    gameRoomId:
      room.gameRoomId,

    roomNumber:
      room.roomNumber,

    roomName:
      room.roomName,

    stake:
      room.stake,

    status:
      room.status,

    createdAt:
      room.createdAt,

    expiresAt:
      room.expiresAt,

    matchedAt:
      room.matchedAt ||
      null,

    players:
      room.players.map(
        function(player) {

          return {

            userId:
              player.userId,

            nickname:
              player.nickname,

            hasChoice:
              Boolean(
                player.choice
              )

          };

        }
      ),

    winnerUserId:
      room.winnerUserId ||
      null,

    winnerNickname:
      room.winnerNickname ||
      null,

    result:
      room.result ||
      null

  };

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

    matchedAt:
      null,

    players: [

      {

        userId:
          player.userId,

        nickname:
          player.nickname,

        choice:
          null

      }

    ],

    winnerUserId:
      null,

    winnerNickname:
      null,

    result:
      null

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


  room.matchedAt =
    Date.now();


  room.players.push({

    userId:
      secondPlayer.userId,

    nickname:
      secondPlayer.nickname,

    choice:
      null

  });


  waitingByRoom.delete(
    room.gameRoomId
  );


  roomsById.set(
    room.id,
    room
  );


  return room;

}


function getOutcome(
  firstChoice,
  secondChoice
) {

  if (
    firstChoice ===
    secondChoice
  ) {

    return "draw";

  }


  if (

    (
      firstChoice ===
      "rock" &&

      secondChoice ===
      "scissors"
    )

    ||

    (
      firstChoice ===
      "scissors" &&

      secondChoice ===
      "paper"
    )

    ||

    (
      firstChoice ===
      "paper" &&

      secondChoice ===
      "rock"
    )

  ) {

    return "first";

  }


  return "second";

}


function finishRoom(
  room
) {

  const first =
    room.players[0];

  const second =
    room.players[1];


  if (

    !first ||

    !second ||

    !first.choice ||

    !second.choice

  ) {

    return room;

  }


  const outcome =
    getOutcome(

      first.choice,

      second.choice

    );


  room.status =
    "finished";


  room.result =
    outcome;


  if (
    outcome ===
    "first"
  ) {

    room.winnerUserId =
      first.userId;

    room.winnerNickname =
      first.nickname;

  }

  else if (
    outcome ===
    "second"
  ) {

    room.winnerUserId =
      second.userId;

    room.winnerNickname =
      second.nickname;

  }

  else {

    room.winnerUserId =
      null;

    room.winnerNickname =
      null;

  }


  roomsById.set(
    room.id,
    room
  );


  return room;

}


function findPlayerIndex(
  room,
  userId
) {

  return room.players.findIndex(
    function(player) {

      return (
        player.userId ===
        userId
      );

    }
  );

}


function jsonError(
  res,
  status,
  error,
  message,
  extra
) {

  return res
    .status(status)
    .json({

      error:
        error,

      message:
        message,

      ...(extra || {})

    });

}


module.exports =
  function handler(
    req,
    res
  ) {

    try {


      if (
        req.method !==
        "POST"
      ) {

        return jsonError(

          res,

          405,

          "METHOD_NOT_ALLOWED",

          "Method not allowed"

        );

      }


      const body =

        req.body &&

        typeof req.body ===
          "object"

          ? req.body

          : {};


      const action =
        String(
          body.action ||
          "join"
        );


      const userId =
        body.userId
          ? String(
              body.userId
            )
          : "";


      const nickname =
        String(
          body.nickname ||
          "Player"
        );


      if (!userId) {

        return jsonError(

          res,

          400,

          "USER_REQUIRED",

          "userId is required"

        );

      }


      /* =====================================
         JOIN
         ===================================== */

      if (
        action ===
        "join"
      ) {

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

          return jsonError(

            res,

            400,

            "INVALID_ROOM",

            "Неверная PvP-комната"

          );

        }


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

          return jsonError(

            res,

            400,

            "INVALID_STAKE",

            "Ставка не соответствует комнате",

            {

              expectedStake:
                roomConfig.stake

            }

          );

        }


        const existingWaiting =
          getCleanWaitingPlayer(
            roomId
          );


        /* FIRST PLAYER */

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
                publicRoom(
                  room
                ),

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


        /* SAME PLAYER */

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
                  publicRoom(
                    existingRoom
                  ),

                matched:
                  existingRoom.status ===
                  "matched",

                alreadyWaiting:
                  existingRoom.status ===
                  "waiting",

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


        const waitingRoom =
          roomsById.get(
            existingWaiting.gameRoomId
          );


        /* INVALID WAITING ROOM */

        if (

          !waitingRoom ||

          waitingRoom.status !==
            "waiting"

        ) {

          waitingByRoom.delete(
            roomId
          );


          const newRoom =
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
                publicRoom(
                  newRoom
                ),

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


        /* SECOND PLAYER */

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


        return res
          .status(200)
          .json({

            room:
              publicRoom(
                matchedRoom
              ),

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


      /* =====================================
         STATUS
         ===================================== */

      if (
        action ===
        "status"
      ) {

        const gameRoomId =
          String(
            body.gameRoomId ||
            ""
          );


        const room =
          roomsById.get(
            gameRoomId
          );


        if (!room) {

          return jsonError(

            res,

            404,

            "ROOM_NOT_FOUND",

            "Комната не найдена"

          );

        }


        if (

          Date.now() >
            room.expiresAt &&

          room.status ===
            "waiting"

        ) {

          roomsById.delete(
            room.id
          );


          const waiting =
            waitingByRoom.get(
              room.gameRoomId
            );


          if (

            waiting &&

            waiting.gameRoomId ===
              room.id

          ) {

            waitingByRoom.delete(
              room.gameRoomId
            );

          }


          return jsonError(

            res,

            410,

            "ROOM_EXPIRED",

            "Время ожидания истекло"

          );

        }


        return res
          .status(200)
          .json({

            room:
              publicRoom(
                room
              ),

            matched:
              room.status ===
              "matched",

            finished:
              room.status ===
              "finished"

          });

      }


      /* =====================================
         MOVE
         ===================================== */

      if (
        action ===
        "move"
      ) {

        const gameRoomId =
          String(
            body.gameRoomId ||
            ""
          );


        const choice =
          String(
            body.choice ||
            ""
          );


        if (
          !VALID_CHOICES.includes(
            choice
          )
        ) {

          return jsonError(

            res,

            400,

            "INVALID_CHOICE",

            "Неверный ход"

          );

        }


        const room =
          roomsById.get(
            gameRoomId
          );


        if (!room) {

          return jsonError(

            res,

            404,

            "ROOM_NOT_FOUND",

            "Комната не найдена"

          );

        }


        if (
          room.status ===
          "waiting"
        ) {

          return jsonError(

            res,

            409,

            "WAITING_OPPONENT",

            "Соперник ещё не найден"

          );

        }


        if (
          room.status ===
          "finished"
        ) {

          return res
            .status(200)
            .json({

              room:
                publicRoom(
                  room
                ),

              finished:
                true

            });

        }


        const playerIndex =
          findPlayerIndex(

            room,

            userId

          );


        if (
          playerIndex ===
          -1
        ) {

          return jsonError(

            res,

            403,

            "PLAYER_NOT_IN_ROOM",

            "Игрок не находится в этой комнате"

          );

        }


        const player =
          room.players[
            playerIndex
          ];


        if (
          player.choice
        ) {

          return jsonError(

            res,

            409,

            "ALREADY_MOVED",

            "Вы уже сделали ход"

          );

        }


        player.choice =
          choice;


        if (

          room.players[0].choice &&

          room.players[1].choice

        ) {

          finishRoom(
            room
          );

        }


        return res
          .status(200)
          .json({

            room:
              publicRoom(
                room
              ),

            accepted:
              true,

            finished:
              room.status ===
              "finished"

          });

      }


      /* =====================================
         LEAVE
         ===================================== */

      if (
        action ===
        "leave"
      ) {

        const gameRoomId =
          String(
            body.gameRoomId ||
            ""
          );


        const room =
          roomsById.get(
            gameRoomId
          );


        if (!room) {

          return res
            .status(200)
            .json({

              ok:
                true

            });

        }


        const playerIndex =
          findPlayerIndex(

            room,

            userId

          );


        if (
          playerIndex ===
          -1
        ) {

          return res
            .status(200)
            .json({

              ok:
                true

            });

        }


        /* LEAVE WAITING ROOM */

        if (
          room.status ===
          "waiting"
        ) {

          waitingByRoom.delete(
            room.gameRoomId
          );

          roomsById.delete(
            room.id
          );


          return res
            .status(200)
            .json({

              ok:
                true

            });

        }


        /* LEAVE MATCHED ROOM */

        if (
          room.status ===
          "matched"
        ) {

          room.players.splice(
            playerIndex,
            1
          );


          if (
            room.players.length <
            2
          ) {

            room.status =
              "waiting";


            room.matchedAt =
              null;


            const remaining =
              room.players[0];


            if (remaining) {

              waitingByRoom.set(

                room.gameRoomId,

                {

                  gameRoomId:
                    room.id,

                  userId:
                    remaining.userId,

                  nickname:
                    remaining.nickname,

                  expiresAt:
                    room.expiresAt

                }

              );

            }


            roomsById.set(
              room.id,
              room
            );

          }

        }


        return res
          .status(200)
          .json({

            ok:
              true

          });

      }


      return jsonError(

        res,

        400,

        "INVALID_ACTION",

        "Неизвестное действие"

      );

    }


    catch (
      error
    ) {

      console.error(
        "PVP ERROR:",
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

const rooms = new Map();

const STAKE = 1;
const COMMISSION_BPS = 500;
const WAIT_HOURS = 24;
const DEMO_MODE = true;

function createRoomId() {
return Math.random()
.toString(36)
.slice(2, 10);
}

function joinRoom(userId, nickname) {
const now = Date.now();

for (const room of rooms.values()) {
if (
room.status === "waiting" &&
room.expiresAt > now &&
!room.players.some(
function (player) {
return player.userId === userId;
}
)
) {
room.players.push({
userId: userId,
nickname: nickname,
paid: false,
choice: null
});

```
  room.status = "playing";

  return room;
}
```

}

const room = {
id: createRoomId(),
status: "waiting",
createdAt: now,
expiresAt:
now + WAIT_HOURS * 60 * 60 * 1000,
players: [
{
userId: userId,
nickname: nickname,
paid: false,
choice: null
}
]
};

rooms.set(room.id, room);

return room;
}

function getRoom(roomId) {
const room = rooms.get(roomId);

if (!room) {
return null;
}

if (
room.status === "waiting" &&
Date.now() > room.expiresAt
) {
room.status = "expired";
}

return room;
}

function makeChoice(roomId, userId, choice) {
const room = getRoom(roomId);

if (!room) {
return null;
}

if (room.status !== "playing") {
return null;
}

if (room.players.length !== 2) {
return null;
}

const player = room.players.find(
function (item) {
return item.userId === String(userId);
}
);

if (!player) {
return null;
}

if (player.choice) {
return null;
}

player.choice = choice;

const bothMadeChoice =
room.players.every(
function (item) {
return Boolean(item.choice);
}
);

if (!bothMadeChoice) {
return {
finished: false,
roomId: roomId,
waitingForOpponent: true
};
}

room.status = "finished";

return {
finished: true,
roomId: roomId,
choices: [
room.players[0].choice,
room.players[1].choice
],
players: [
{
userId: room.players[0].userId,
nickname: room.players[0].nickname
},
{
userId: room.players[1].userId,
nickname: room.players[1].nickname
}
]
};
}

function getGameResult(first, second) {
if (first === second) {
return "draw";
}

if (
first === "stone" &&
second === "scissors"
) {
return "player1";
}

if (
first === "scissors" &&
second === "paper"
) {
return "player1";
}

if (
first === "paper" &&
second === "stone"
) {
return "player1";
}

return "player2";
}

function findProfileObject(data) {
if (!data) {
return {};
}

if (Array.isArray(data)) {
if (data.length === 0) {
return {};
}

```
return findProfileObject(data[0]);
```

}

if (
typeof data !== "object"
) {
return {};
}

if (data.result !== undefined) {
return findProfileObject(data.result);
}

if (data.data !== undefined) {
return findProfileObject(data.data);
}

if (data.profile !== undefined) {
return findProfileObject(data.profile);
}

return data;
}

function extractProfile(data) {
const profile =
findProfileObject(data);

const name =
profile.name ||
profile.pName ||
profile.nickname ||
profile.username ||
profile.displayName ||
profile.n ||
"";

let avatar =
profile.i ||
profile.avatar ||
profile.image ||
profile.avatarUrl ||
profile.imageUrl ||
"";

if (
avatar &&
typeof avatar === "object"
) {
avatar =
avatar.url ||
avatar.src ||
avatar.hash ||
"";
}

if (
typeof avatar !== "string"
) {
avatar = "";
}

avatar = avatar.trim();

if (
avatar &&
avatar.indexOf("http://") !== 0 &&
avatar.indexOf("https://") !== 0 &&
avatar.indexOf("data:") !== 0
) {
avatar =
"https://pocketnet.app/ipfs/" +
avatar.replace(/^/+/, "");
}

return {
name: String(name).trim(),
avatarUrl: avatar
};
}

async function requestProfile(address) {
const nodes = [
"https://1.pocketnet.app:38881/public/",
"https://2.pocketnet.app:38881/public/",
"https://3.pocketnet.app:38881/public/"
];

let lastError = null;

for (
let i = 0;
i < nodes.length;
i++
) {
const node = nodes[i];

```
try {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      function () {
        controller.abort();
      },
      6000
    );

  try {
    const response =
      await fetch(
        node,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method:
              "getuserprofile",
            params: [
              {
                address: address,
                shortForm: "basic"
              }
            ]
          }),
          signal:
            controller.signal
        }
      );

    if (!response.ok) {
      throw new Error(
        "HTTP " +
          response.status
      );
    }

    const text =
      await response.text();

    if (!text) {
      throw new Error(
        "Empty RPC response"
      );
    }

    const data =
      JSON.parse(text);

    const profile =
      extractProfile(data);

    console.log(
      "PROFILE RESULT:",
      profile
    );

    return profile;

  } finally {
    clearTimeout(timeout);
  }

} catch (error) {
  lastError = error;

  console.log(
    "PROFILE NODE ERROR:",
    node,
    error.message
  );
}
```

}

throw (
lastError ||
new Error(
"Profile unavailable"
)
);
}

async function readBody(req) {
if (
req.body &&
typeof req.body === "object"
) {
return req.body;
}

return new Promise(
function (resolve) {
let body = "";

```
  req.on(
    "data",
    function (chunk) {
      body += chunk;
    }
  );

  req.on(
    "end",
    function () {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(
          JSON.parse(body)
        );
      } catch (error) {
        resolve({});
      }
    }
  );

  req.on(
    "error",
    function () {
      resolve({});
    }
  );
}
```

);
}

async function handler(req, res) {
try {
const requestUrl =
new URL(
req.url || "/",
"https://" +
(
req.headers.host ||
"localhost"
)
);

```
const path =
  requestUrl.pathname;

if (
  req.method === "GET" &&
  path === "/api/health"
) {
  return res.status(200).json({
    ok: true,
    app:
      "bastyon-rps-app",
    mode:
      DEMO_MODE
        ? "demo"
        : "production"
  });
}

if (
  req.method === "GET" &&
  path === "/api/profile"
) {
  const address =
    requestUrl.searchParams.get(
      "address"
    );

  if (!address) {
    return res.status(400).json({
      success: false,
      error:
        "address is required"
    });
  }

  try {
    const profile =
      await requestProfile(
        address
      );

    return res.status(200).json({
      success: true,
      address: address,
      profile: profile
    });

  } catch (error) {
    console.log(
      "PROFILE FALLBACK:",
      error.message
    );

    return res.status(200).json({
      success: true,
      address: address,
      profile: {
        name: "",
        avatarUrl: ""
      }
    });
  }
}

if (
  req.method === "GET" &&
  path === "/api/stats"
) {
  let online = 0;
  let waiting = 0;

  rooms.forEach(
    function (room) {
      online +=
        room.players.length;

      if (
        room.status ===
        "waiting" &&
        room.expiresAt >
          Date.now()
      ) {
        waiting++;
      }
    }
  );

  return res.status(200).json({
    online: online,
    waiting: waiting
  });
}

if (
  req.method === "POST" &&
  path === "/api/pvp/join"
) {
  const body =
    await readBody(req);

  if (!body.userId) {
    return res.status(400).json({
      error:
        "userId is required"
    });
  }

  const room =
    joinRoom(
      String(body.userId),
      String(
        body.nickname ||
        "Player"
      )
    );

  return res.status(200).json({
    room: room,
    paymentRequired: false,
    stake: STAKE,
    waitHours:
      WAIT_HOURS
  });
}

const roomMatch =
  path.match(
    /^\/api\/pvp\/room\/([^/]+)$/
  );

if (
  req.method === "GET" &&
  roomMatch
) {
  const room =
    getRoom(
      roomMatch[1]
    );

  if (!room) {
    return res.status(404).json({
      error:
        "Room not found"
    });
  }

  return res.status(200).json({
    room: room
  });
}

const choiceMatch =
  path.match(
    /^\/api\/pvp\/room\/([^/]+)\/choice$/
  );

if (
  req.method === "POST" &&
  choiceMatch
) {
  const body =
    await readBody(req);

  const userId =
    body.userId;

  const choice =
    body.choice;

  if (!userId) {
    return res.status(400).json({
      error:
        "userId is required"
    });
  }

  if (
    choice !== "stone" &&
    choice !== "scissors" &&
    choice !== "paper"
  ) {
    return res.status(400).json({
      error:
        "Invalid choice"
    });
  }

  const result =
    makeChoice(
      choiceMatch[1],
      String(userId),
      choice
    );

  if (!result) {
    return res.status(400).json({
      error:
        "Choice rejected"
    });
  }

  if (result.finished) {
    result.outcome =
      getGameResult(
        result.choices[0],
        result.choices[1]
      );

    const pot =
      STAKE * 2;

    result.commission =
      Number(
        (
          pot *
          COMMISSION_BPS /
          10000
        ).toFixed(8)
      );

    result.payout =
      Number(
        (
          pot -
          result.commission
        ).toFixed(8)
      );
  }

  return res.status(200).json(
    result
  );
}

return res.status(404).json({
  error:
    "API route not found",
  path: path
});
```

} catch (error) {
console.error(
"API ERROR:",
error
);

```
return res.status(500).json({
  error:
    "SERVER_ERROR",
  message:
    error.message ||
    "Unknown error"
});
```

}
}

module.exports = handler;

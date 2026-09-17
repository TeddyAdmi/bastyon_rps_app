const rooms = new Map();

const STAKE = Number(
process.env.STAKE_PKOIN || 1
);

const COMMISSION_BPS = Number(
process.env.COMMISSION_BPS || 500
);

const WAIT_HOURS = Number(
process.env.WAIT_HOURS || 24
);

const DEMO_MODE =
String(
process.env.DEMO_MODE || "true"
).toLowerCase() === "true";

function makeRoomId() {
return Math.random()
.toString(36)
.slice(2, 10);
}

function joinRoom(
userId,
nickname
) {
const now = Date.now();

for (const room of rooms.values()) {
if (
room.status === "waiting" &&
!room.players.some(
(player) =>
player.userId === userId
)
) {
room.players.push({
userId,
nickname,
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
id: makeRoomId(),
status: "waiting",
createdAt: now,
expiresAt:
now +
WAIT_HOURS *
60 *
60 *
1000,
players: [
{
userId,
nickname,
paid: false,
choice: null
}
]
};

rooms.set(
room.id,
room
);

return room;
}

function getRoom(id) {
const room =
rooms.get(id);

if (!room) {
return null;
}

if (
room.status === "waiting" &&
Date.now() >
room.expiresAt
) {
room.status = "expired";
}

return room;
}

function recordPayment(
roomId,
userId
) {
const room =
getRoom(roomId);

if (!room) {
return null;
}

const player =
room.players.find(
(item) =>
item.userId ===
String(userId)
);

if (player) {
player.paid = true;
}

return room;
}

function makeChoice(
roomId,
userId,
choice
) {
const room =
getRoom(roomId);

if (
!room ||
room.status !== "playing" ||
room.players.length !== 2
) {
return null;
}

const player =
room.players.find(
(item) =>
item.userId ===
String(userId)
);

if (
!player ||
player.choice
) {
return null;
}

player.choice =
choice;

if (
room.players.every(
(item) =>
item.choice
)
) {
room.status =
"finished";

```
return {
  finished: true,
  roomId,
  choices:
    room.players.map(
      (item) =>
        item.choice
    ),
  players:
    room.players.map(
      (item) => ({
        userId:
          item.userId,
        nickname:
          item.nickname
      })
    )
};
```

}

return {
finished: false,
roomId,
waitingForOpponent:
true
};
}

function gameResult(
a,
b
) {
if (a === b) {
return "draw";
}

const wins = {
stone: "scissors",
scissors: "paper",
paper: "stone"
};

return wins[a] === b
? "player1"
: "player2";
}

function paymentStatus(
room
) {
return {
configured:
!DEMO_MODE,
verifiedPlayers:
room.players.filter(
(player) =>
player.paid
).length
};
}

function extractProfile(
payload
) {
let value = payload;

if (
value &&
typeof value ===
"object" &&
value.result !==
undefined
) {
value = value.result;
}

if (
value &&
typeof value ===
"object" &&
value.data !==
undefined
) {
value =
value.data;
}

if (
Array.isArray(value)
) {
value =
value[0] || {};
}

if (
!value ||
typeof value !== "object"
) {
return {};
}

const name =
value.name ||
value.pName ||
value.nickname ||
value.username ||
value.displayName ||
"";

let avatar =
value.i ||
value.avatar ||
value.image ||
value.avatarUrl ||
value.imageUrl ||
"";

if (
typeof avatar ===
"string" &&
avatar.trim()
) {
avatar =
avatar.trim();

```
if (
  !/^https?:\/\//i.test(
    avatar
  ) &&
  !avatar.startsWith(
    "data:"
  )
) {
  avatar =
    "https://pocketnet.app/ipfs/" +
    avatar.replace(
      /^\/+/,
      ""
    );
}
```

} else {
avatar = "";
}

return {
name:
typeof name ===
"string"
? name.trim()
: "",
avatarUrl:
avatar
};
}

async function getProfile(
address
) {
const nodes = [
"https://1.pocketnet.app:38881/public/",
"https://2.pocketnet.app:38881/public/",
"https://3.pocketnet.app:38881/public/"
];

const requestBody = {
jsonrpc: "2.0",
id: 1,
method:
"getuserprofile",
params: [
{
address,
shortForm:
"basic"
}
]
};

let lastError =
null;

for (
const node of nodes
) {
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
body:
JSON.stringify(
requestBody
)
}
);

```
  if (
    !response.ok
  ) {
    throw new Error(
      "HTTP " +
        response.status
    );
  }

  const payload =
    await response.json();

  console.log(
    "PROFILE RPC RESULT:",
    payload
  );

  return extractProfile(
    payload
  );
} catch (error) {
  lastError =
    error;

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
"Bastyon RPC unavailable"
)
);
}

export default async function handler(
req,
res
) {
try {
const url =
new URL(
req.url || "/",
`https://${req.headers.host}`
);

```
const path =
  url.pathname;

// =====================================
// PROFILE
// =====================================

if (
  req.method === "GET" &&
  path === "/api/profile"
) {
  const address =
    url.searchParams.get(
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
      await getProfile(
        address
      );

    return res.status(200).json({
      success: true,
      address,
      profile
    });
  } catch (error) {
    console.error(
      "PROFILE API ERROR:",
      error
    );

    return res.status(502).json({
      success: false,
      error:
        "PROFILE_RPC_UNAVAILABLE",
      message:
        error.message
    });
  }
}

// =====================================
// HEALTH
// =====================================

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

// =====================================
// STATS
// =====================================

if (
  req.method === "GET" &&
  path === "/api/stats"
) {
  let waiting = 0;
  let online = 0;

  for (
    const room of
      rooms.values()
  ) {
    if (
      room.status ===
      "waiting"
    ) {
      waiting++;
    }

    online +=
      room.players.length;
  }

  return res.status(200).json({
    online,
    waiting
  });
}

// =====================================
// PVP JOIN
// =====================================

if (
  req.method === "POST" &&
  path === "/api/pvp/join"
) {
  const body =
    await readJsonBody(req);

  const userId =
    body.userId;

  const nickname =
    body.nickname ||
    "Player";

  if (!userId) {
    return res.status(400).json({
      error:
        "userId is required"
    });
  }

  const room =
    joinRoom(
      String(userId),
      String(nickname)
    );

  return res.status(200).json({
    room,
    paymentRequired:
      !DEMO_MODE,
    stake: STAKE,
    waitHours:
      WAIT_HOURS
  });
}

// =====================================
// PVP ROOM
// =====================================

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
    room
  });
}

// =====================================
// PAYMENT
// =====================================

const paymentMatch =
  path.match(
    /^\/api\/pvp\/room\/([^/]+)\/payment$/
  );

if (
  req.method === "POST" &&
  paymentMatch
) {
  const body =
    await readJsonBody(req);

  if (!DEMO_MODE) {
    return res.status(501).json({
      error:
        "REAL_PKOIN_NOT_CONFIGURED"
    });
  }

  const room =
    recordPayment(
      paymentMatch[1],
      body.userId
    );

  if (!room) {
    return res.status(404).json({
      error:
        "Room not found"
    });
  }

  return res.status(200).json({
    room,
    payment:
      paymentStatus(room)
  });
}

// =====================================
// CHOICE
// =====================================

const choiceMatch =
  path.match(
    /^\/api\/pvp\/room\/([^/]+)\/choice$/
  );

if (
  req.method === "POST" &&
  choiceMatch
) {
  const body =
    await readJsonBody(req);

  const userId =
    body.userId;

  const choice =
    body.choice;

  if (
    !userId ||
    ![
      "stone",
      "scissors",
      "paper"
    ].includes(choice)
  ) {
    return res.status(400).json({
      error:
        "Invalid userId or choice"
    });
  }

  const room =
    getRoom(
      choiceMatch[1]
    );

  if (!room) {
    return res.status(404).json({
      error:
        "Room not found"
    });
  }

  if (
    !DEMO_MODE &&
    !room.players.every(
      (player) =>
        player.paid
    )
  ) {
    return res.status(402).json({
      error:
        "Both players must be verified as paid."
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

  if (
    result.finished
  ) {
    result.outcome =
      gameResult(
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
  path
});
```

} catch (error) {
console.error(
"API SERVER ERROR:",
error
);

```
return res.status(500).json({
  error:
    "SERVER_ERROR",
  message:
    error?.message ||
    "Unknown server error"
});
```

}
}

async function readJsonBody(
req
) {
if (
req.body &&
typeof req.body ===
"object"
) {
return req.body;
}

return new Promise(
(resolve) => {
let body = "";

```
  req.on(
    "data",
    (chunk) => {
      body += chunk;
    }
  );

  req.on(
    "end",
    () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(
          JSON.parse(body)
        );
      } catch {
        resolve({});
      }
    }
  );

  req.on(
    "error",
    () => {
      resolve({});
    }
  );
}
```

);
}

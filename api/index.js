const rooms = new Map();

const STAKE = Number(process.env.STAKE_PKOIN || 1);
const COMMISSION_BPS = Number(process.env.COMMISSION_BPS || 500);
const WAIT_HOURS = Number(process.env.WAIT_HOURS || 24);

const DEMO_MODE =
String(process.env.DEMO_MODE || "true").toLowerCase() === "true";

function makeRoomId() {
return Math.random().toString(36).slice(2, 10);
}

function joinRoom(userId, nickname) {
const now = Date.now();

for (const room of rooms.values()) {
if (
room.status === "waiting" &&
room.expiresAt > now &&
!room.players.some((player) => player.userId === userId)
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
expiresAt: now + WAIT_HOURS * 60 * 60 * 1000,
players: [
{
userId,
nickname,
paid: false,
choice: null
}
]
};

rooms.set(room.id, room);

return room;
}

function getRoom(id) {
const room = rooms.get(id);

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

function recordPayment(roomId, userId) {
const room = getRoom(roomId);

if (!room) {
return null;
}

const player = room.players.find(
(item) => item.userId === String(userId)
);

if (player) {
player.paid = true;
}

return room;
}

function makeChoice(roomId, userId, choice) {
const room = getRoom(roomId);

if (
!room ||
room.status !== "playing" ||
room.players.length !== 2
) {
return null;
}

const player = room.players.find(
(item) => item.userId === String(userId)
);

if (!player || player.choice) {
return null;
}

player.choice = choice;

if (room.players.every((item) => item.choice)) {
room.status = "finished";

```
return {
  finished: true,
  roomId,
  choices: room.players.map((item) => item.choice),
  players: room.players.map((item) => ({
    userId: item.userId,
    nickname: item.nickname
  }))
};
```

}

return {
finished: false,
roomId,
waitingForOpponent: true
};
}

function gameResult(a, b) {
if (a === b) {
return "draw";
}

const wins = {
stone: "scissors",
scissors: "paper",
paper: "stone"
};

return wins[a] === b ? "player1" : "player2";
}

function paymentStatus(room) {
return {
configured: !DEMO_MODE,
verifiedPlayers: room.players.filter(
(player) => player.paid
).length
};
}

function parseJsonText(value) {
if (typeof value !== "string") {
return value;
}

const text = value.trim();

if (!text) {
return value;
}

try {
return JSON.parse(text);
} catch {
return value;
}
}

function extractProfile(payload) {
let value = payload;

if (
value &&
typeof value === "object" &&
value.result !== undefined
) {
value = value.result;
}

if (
value &&
typeof value === "object" &&
value.data !== undefined
) {
value = value.data;
}

if (
value &&
typeof value === "object" &&
value.profile !== undefined
) {
value = value.profile;
}

if (Array.isArray(value)) {
value = value[0] || {};
}

if (
value &&
typeof value === "object" &&
value.p &&
typeof value.p === "object"
) {
const p = value.p;

```
const parsedS1 = parseJsonText(p.s1);
const parsedS2 = parseJsonText(p.s2);
const parsedS3 = parseJsonText(p.s3);
const parsedS4 = parseJsonText(p.s4);

value = {
  ...value,
  ...(parsedS1 && typeof parsedS1 === "object"
    ? parsedS1
    : {}),
  ...(parsedS2 && typeof parsedS2 === "object"
    ? parsedS2
    : {}),
  ...(parsedS3 && typeof parsedS3 === "object"
    ? parsedS3
    : {}),
  ...(parsedS4 && typeof parsedS4 === "object"
    ? parsedS4
    : {})
};
```

}

if (!value || typeof value !== "object") {
return {};
}

const name =
value.name ||
value.pName ||
value.nickname ||
value.username ||
value.displayName ||
value.n ||
"";

let avatar =
value.i ||
value.avatar ||
value.image ||
value.avatarUrl ||
value.imageUrl ||
"";

if (avatar && typeof avatar === "object") {
avatar =
avatar.url ||
avatar.src ||
avatar.hash ||
"";
}

if (typeof avatar === "string") {
avatar = avatar.trim();
} else {
avatar = "";
}

if (
avatar &&
!/^https?:///i.test(avatar) &&
!/^data:/i.test(avatar) &&
!/^///.test(avatar)
) {
avatar =
"https://pocketnet.app/ipfs/" +
avatar.replace(/^/+/, "");
}

return {
name:
typeof name === "string"
? name.trim()
: "",
avatarUrl: avatar
};
}

async function rpcRequest(node, method, params) {
const controller = new AbortController();

const timer = setTimeout(() => {
controller.abort();
}, 8000);

try {
const response = await fetch(node, {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
jsonrpc: "2.0",
id: 1,
method,
params
}),
signal: controller.signal
});

```
if (!response.ok) {
  throw new Error(
    "HTTP " + response.status
  );
}

const text = await response.text();

let payload;

try {
  payload = JSON.parse(text);
} catch {
  throw new Error(
    "RPC returned non-JSON response"
  );
}

if (payload && payload.error) {
  throw new Error(
    typeof payload.error === "string"
      ? payload.error
      : JSON.stringify(payload.error)
  );
}

return payload;
```

} finally {
clearTimeout(timer);
}
}

async function getProfile(address) {
const nodes = [
"https://1.pocketnet.app:38881/public/",
"https://2.pocketnet.app:38881/public/",
"https://3.pocketnet.app:38881/public/"
];

let lastError = null;

for (const node of nodes) {
try {
let payload = await rpcRequest(
node,
"getuserprofile",
{
address,
shortForm: "basic"
}
);

```
  let profile = extractProfile(payload);

  if (
    profile.name ||
    profile.avatarUrl
  ) {
    console.log(
      "PROFILE RPC RESULT:",
      node,
      profile
    );

    return profile;
  }

  try {
    payload = await rpcRequest(
      node,
      "getuserprofile",
      [
        {
          address,
          shortForm: "basic"
        }
      ]
    );

    profile = extractProfile(payload);

    if (
      profile.name ||
      profile.avatarUrl
    ) {
      console.log(
        "PROFILE RPC RESULT ARRAY PARAMS:",
        node,
        profile
      );

      return profile;
    }
  } catch (secondaryError) {
    lastError = secondaryError;
  }

  try {
    payload = await rpcRequest(
      node,
      "getaccountversions",
      {
        address,
        pageStart: 0,
        pageSize: 10
      }
    );

    let versions = payload;

    if (
      versions &&
      typeof versions === "object" &&
      versions.result !== undefined
    ) {
      versions = versions.result;
    }

    if (
      versions &&
      typeof versions === "object" &&
      versions.data !== undefined
    ) {
      versions = versions.data;
    }

    if (
      Array.isArray(versions) &&
      versions.length
    ) {
      const latest =
        versions.find(
          (item) =>
            item &&
            item.last === 1
        ) ||
        versions[0];

      profile =
        extractProfile(latest);

      if (
        profile.name ||
        profile.avatarUrl
      ) {
        console.log(
          "PROFILE FROM ACCOUNT VERSIONS:",
          node,
          profile
        );

        return profile;
      }
    }
  } catch (versionsError) {
    lastError = versionsError;
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
"Bastyon RPC unavailable"
)
);
}

async function readJsonBody(req) {
if (
req.body &&
typeof req.body === "object"
) {
return req.body;
}

return new Promise((resolve) => {
let body = "";

```
req.on("data", (chunk) => {
  body += chunk;
});

req.on("end", () => {
  if (!body) {
    resolve({});
    return;
  }

  try {
    resolve(JSON.parse(body));
  } catch {
    resolve({});
  }
});

req.on("error", () => {
  resolve({});
});
```

});
}

async function handler(req, res) {
try {
const url = new URL(
req.url || "/",
`https://${
        req.headers.host || "localhost"
      }`
);

```
const path = url.pathname;

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
      await getProfile(address);

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
        error?.message ||
        "Unknown profile error"
    });
  }
}

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
  path === "/api/stats"
) {
  let waiting = 0;
  let online = 0;

  for (
    const room of rooms.values()
  ) {
    if (
      room.status ===
        "waiting" &&
      room.expiresAt >
        Date.now()
    ) {
      waiting += 1;
    }

    online +=
      room.players.length;
  }

  return res.status(200).json({
    online,
    waiting
  });
}

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

  if (result.finished) {
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

module.exports = handler;

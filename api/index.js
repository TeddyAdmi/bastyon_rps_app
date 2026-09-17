import {
joinRoom,
getRoom,
makeChoice,
recordPayment
} from "../backend/src/store.js";

import { gameResult } from "../backend/src/game.js";

import {
getConfig,
paymentStatus
} from "../backend/src/payments.js";

export default async function handler(req, res) {
try {
const url = new URL(
req.url || "/",
`https://${req.headers.host}`
);

```
const path = url.pathname;

// =========================================
// PROFILE
// =========================================

if (
  req.method === "GET" &&
  path === "/api/profile"
) {
  const address =
    url.searchParams.get("address");

  if (!address) {
    return res.status(400).json({
      error: "address is required"
    });
  }

  const rpcPayload = {
    jsonrpc: "2.0",
    id: 1,
    method: "getuserprofile",
    params: [[address]]
  };

  const nodes = [
    "https://1.pocketnet.app:38881/public/",
    "https://2.pocketnet.app:38881/public/",
    "https://3.pocketnet.app:38881/public/"
  ];

  for (const node of nodes) {
    try {
      const response = await fetch(
        node,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify(
            rpcPayload
          )
        }
      );

      if (!response.ok) {
        continue;
      }

      const data =
        await response.json();

      console.log(
        "PROFILE RPC RESULT:",
        data
      );

      return res.status(200).json(
        data
      );
    } catch (error) {
      console.error(
        "PROFILE NODE ERROR:",
        error.message
      );
    }
  }

  return res.status(502).json({
    error:
      "PROFILE_RPC_UNAVAILABLE"
  });
}

// =========================================
// HEALTH
// =========================================

if (
  req.method === "GET" &&
  path === "/api/health"
) {
  return res.status(200).json({
    ok: true,
    app: "knb-bastyon",
    mode: getConfig().demoMode
      ? "demo"
      : "production"
  });
}

// =========================================
// STATS
// =========================================

if (
  req.method === "GET" &&
  path === "/api/stats"
) {
  return res.status(200).json({
    online: 0,
    waiting: 0
  });
}

// =========================================
// PVP JOIN
// =========================================

if (
  req.method === "POST" &&
  path === "/api/pvp/join"
) {
  const body =
    await readJsonBody(req);

  const userId =
    body.userId;

  const nickname =
    body.nickname;

  if (!userId) {
    return res.status(400).json({
      error:
        "userId is required"
    });
  }

  const room =
    joinRoom(
      String(userId),
      String(
        nickname || "Player"
      )
    );

  return res.status(200).json({
    room,
    paymentRequired:
      !getConfig().demoMode,
    stake:
      getConfig().stake,
    waitHours:
      getConfig().waitHours
  });
}

// =========================================
// PVP ROOM
// =========================================

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

// =========================================
// PAYMENT
// =========================================

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

  if (!getConfig().demoMode) {
    return res.status(501).json({
      error:
        "REAL_PKOIN_NOT_CONFIGURED",
      message:
        "Real PKOIN verification is not configured yet."
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

// =========================================
// CHOICE
// =========================================

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
    !getConfig().demoMode &&
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
      getConfig().stake * 2;

    result.commission =
      Number(
        (
          pot *
          getConfig()
            .commissionBps /
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

// =========================================
// NOT FOUND
// =========================================

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

// =========================================
// JSON BODY
// =========================================

async function readJsonBody(req) {
if (
req.body &&
typeof req.body === "object"
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

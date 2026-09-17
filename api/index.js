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
      req.url,
      `http://${req.headers.host}`
    );

    const path = url.pathname;

    // ==========================================
    // PROFILE
    // ==========================================

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

      const rpcUrls = [
        process.env.BASTYON_RPC_URL ||
          "https://1.pocketnet.app:38881/public/",
        "https://2.pocketnet.app:38881/public/",
        "https://3.pocketnet.app:38881/public/"
      ];

      let lastError = null;

      for (const rpcUrl of rpcUrls) {
        try {
          const rpcResponse = await fetch(
            rpcUrl,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json"
              },
              body: JSON.stringify({
                method: "getuserprofile",
                params: [
                  {
                    address,
                    shortForm: "basic"
                  }
                ],
                jsonrpc: "2.0",
                id: 1
              }),
              signal: AbortSignal.timeout(10000)
            }
          );

          if (!rpcResponse.ok) {
            throw new Error(
              `RPC HTTP ${rpcResponse.status}`
            );
          }

          const data =
            await rpcResponse.json();

          console.log(
            "BASTYON PROFILE RPC:",
            JSON.stringify(data)
          );

          return res.status(200).json(data);
        } catch (error) {
          lastError = error;

          console.log(
            "BASTYON PROFILE NODE ERROR:",
            rpcUrl,
            error.message
          );
        }
      }

      return res.status(502).json({
        error: "PROFILE_RPC_UNAVAILABLE",
        message:
          lastError?.message ||
          "Bastyon RPC unavailable"
      });
    }

    // ==========================================
    // HEALTH
    // ==========================================

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

    // ==========================================
    // STATS
    // ==========================================

    if (
      req.method === "GET" &&
      path === "/api/stats"
    ) {
      return res.status(200).json({
        online: 0,
        waiting: 0
      });
    }

    // ==========================================
    // PVP JOIN
    // ==========================================

    if (
      req.method === "POST" &&
      path === "/api/pvp/join"
    ) {
      const body = await readBody(req);

      const {
        userId,
        nickname
      } = body;

      if (!userId) {
        return res.status(400).json({
          error: "userId is required"
        });
      }

      const room = joinRoom(
        String(userId),
        String(nickname || "Player")
      );

      return res.status(200).json({
        room,
        paymentRequired:
          !getConfig().demoMode,
        stake: getConfig().stake,
        waitHours: getConfig().waitHours
      });
    }

    // ==========================================
    // PVP ROOM
    // ==========================================

    const roomMatch =
      path.match(
        /^\/api\/pvp\/room\/([^/]+)$/
      );

    if (
      req.method === "GET" &&
      roomMatch
    ) {
      const room =
        getRoom(roomMatch[1]);

      if (!room) {
        return res.status(404).json({
          error: "Room not found"
        });
      }

      return res.status(200).json({
        room
      });
    }

    // ==========================================
    // PAYMENT
    // ==========================================

    const paymentMatch =
      path.match(
        /^\/api\/pvp\/room\/([^/]+)\/payment$/
      );

    if (
      req.method === "POST" &&
      paymentMatch
    ) {
      if (!getConfig().demoMode) {
        return res.status(501).json({
          error:
            "REAL_PKOIN_NOT_CONFIGURED",
          message:
            "Real PKOIN verification is not configured yet."
        });
      }

      const body =
        await readBody(req);

      const room =
        recordPayment(
          paymentMatch[1],
          body?.userId
        );

      if (!room) {
        return res.status(404).json({
          error: "Room not found"
        });
      }

      return res.status(200).json({
        room,
        payment:
          paymentStatus(room)
      });
    }

    // ==========================================
    // CHOICE
    // ==========================================

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

      const {
        userId,
        choice
      } = body;

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
          error: "Room not found"
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

    // ==========================================
    // UNKNOWN API
    // ==========================================

    return res.status(404).json({
      error: "API route not found",
      path
    });
  } catch (error) {
    console.error(
      "API ERROR:",
      error
    );

    return res.status(500).json({
      error: "SERVER_ERROR",
      message:
        error?.message ||
        "Unknown error"
    });
  }
}

// ==========================================
// READ JSON BODY
// ==========================================

async function readBody(req) {
  if (
    req.body &&
    typeof req.body === "object"
  ) {
    return req.body;
  }

  let data = "";

  for await (
    const chunk of req
  ) {
    data += chunk;
  }

  if (!data) {
    return {};
  }

  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
}

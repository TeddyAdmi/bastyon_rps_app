function normalizeProfile(data) {
  let value = data;

  if (value && value.data !== undefined) {
    value = value.data;
  }

  if (Array.isArray(value)) {
    value = value[0] || {};
  }

  if (value && value.profile) {
    value = value.profile;
  }

  if (!value || typeof value !== "object") {
    return {
      name: "",
      avatarUrl: ""
    };
  }

  const name =
    value.name ||
    value.nickname ||
    value.username ||
    value.displayName ||
    value.n ||
    "";

  let avatar =
    value.avatarUrl ||
    value.avatar ||
    value.imageUrl ||
    value.image ||
    value.photoUrl ||
    value.photo ||
    value.i ||
    "";

  if (avatar && typeof avatar === "object") {
    avatar =
      avatar.url ||
      avatar.src ||
      avatar.hash ||
      "";
  }

  if (typeof avatar !== "string") {
    avatar = "";
  }

  return {
    name:
      typeof name === "string"
        ? name.trim()
        : "",
    avatarUrl: avatar.trim()
  };
}

async function requestProfile(
  node,
  address
) {
  const response = await fetch(
    node,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json"
      },
      body: JSON.stringify({
        method:
          "getuserprofile",
        parameters: [
          [address],
          "1"
        ]
      })
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
      "Пустой ответ RPC"
    );
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(
      "RPC вернул не JSON"
    );
  }
}

module.exports =
  async function handler(
    req,
    res
  ) {
    if (
      req.method !== "GET"
    ) {
      return res
        .status(405)
        .json({
          success: false,
          error:
            "Method not allowed"
        });
    }

    const address =
      req.query &&
      req.query.address;

    if (!address) {
      return res
        .status(400)
        .json({
          success: false,
          error:
            "address is required"
        });
    }

    const nodes = [
      "https://5.pocketnet.app:8899/rpc/getuserprofile",
      "https://1.pocketnet.app:8899/rpc/getuserprofile",
      "https://2.pocketnet.app:8899/rpc/getuserprofile"
    ];

    for (
      let i = 0;
      i < nodes.length;
      i++
    ) {
      try {
        const raw =
          await requestProfile(
            nodes[i],
            address
          );

        const profile =
          normalizeProfile(
            raw
          );

        let avatarUrl =
          profile.avatarUrl;

        if (
          avatarUrl &&
          (
            avatarUrl.indexOf(
              "https://bastyon.com:8092/i/"
            ) === 0 ||
            avatarUrl.indexOf(
              "http://bastyon.com:8092/i/"
            ) === 0
          )
        ) {
          const protocol =
            req.headers[
              "x-forwarded-proto"
            ] || "https";

          const host =
            req.headers.host ||
            "bastyon-rps-app.vercel.app";

          avatarUrl =
            protocol +
            "://" +
            host +
            "/api/avatar?url=" +
            encodeURIComponent(
              avatarUrl
            );
        }

        const result = {
          name: profile.name,
          avatarUrl: avatarUrl
        };

        console.log(
          "PROFILE RPC RAW",
          JSON.stringify(raw)
        );

        console.log(
          "PROFILE EXTRACTED",
          JSON.stringify(result)
        );

        return res
          .status(200)
          .json({
            success: true,
            address:
              address,
            profile:
              result
          });

      } catch (error) {

        console.log(
          "PROFILE RPC ERROR",
          nodes[i],
          error &&
          error.message
            ? error.message
            : String(error)
        );
      }
    }

    return res
      .status(200)
      .json({
        success: true,
        address:
          address,
        profile: {
          name: "",
          avatarUrl: ""
        }
      });
  };

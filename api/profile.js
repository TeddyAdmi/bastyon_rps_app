function getProfile(data) {
  if (!data) return {};

  if (Array.isArray(data)) {
    return getProfile(data[0]);
  }

  if (typeof data !== "object") {
    return {};
  }

  if (data.profile) {
    return getProfile(data.profile);
  }

  if (data.result) {
    return getProfile(data.result);
  }

  if (data.data) {
    return getProfile(data.data);
  }

  return data;
}

function getName(profile) {
  const value =
    profile.name ||
    profile.pName ||
    profile.nickname ||
    profile.username ||
    profile.displayName ||
    "";

  return typeof value === "string" ? value.trim() : "";
}

function getAvatar(profile) {
  let value =
    profile.i ||
    profile.avatar ||
    profile.avatarUrl ||
    profile.image ||
    profile.imageUrl ||
    profile.photo ||
    profile.photoUrl ||
    "";

  if (value && typeof value === "object") {
    value = value.url || value.src || value.hash || "";
  }

  if (typeof value !== "string") {
    return "";
  }

  value = value.trim();

  if (!value) {
    return "";
  }

  if (
    value.indexOf("http://") === 0 ||
    value.indexOf("https://") === 0 ||
    value.indexOf("data:") === 0 ||
    value.indexOf("//") === 0
  ) {
    return value;
  }

  return "https://pocketnet.app/ipfs/" + value.replace(/^\/+/, "");
}

async function callRpc(node, address) {
  const response = await fetch(node, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      method: "getuserprofile",
      params: {
        addresses: [address],
        shortForm: "basic"
      }
    })
  });

  if (!response.ok) {
    throw new Error("HTTP " + response.status);
  }

  return response.json();
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  const address = req.query && req.query.address;

  if (!address) {
    return res.status(400).json({
      success: false,
      error: "address is required"
    });
  }

  const nodes = [
    "https://1.pocketnet.app:38881/public/",
    "https://2.pocketnet.app:38881/public/",
    "https://3.pocketnet.app:38881/public/"
  ];

  for (let i = 0; i < nodes.length; i++) {
    try {
      const raw = await callRpc(nodes[i], address);

      console.log(
        "PROFILE RPC RAW",
        JSON.stringify(raw)
      );

      const profile = getProfile(raw);

      const result = {
        name: getName(profile),
        avatarUrl: getAvatar(profile)
      };

      console.log(
        "PROFILE EXTRACTED",
        JSON.stringify(result)
      );

      return res.status(200).json({
        success: true,
        address: address,
        profile: result
      });

    } catch (error) {
      console.log(
        "PROFILE RPC ERROR",
        nodes[i],
        error && error.message
          ? error.message
          : String(error)
      );
    }
  }

  return res.status(200).json({
    success: true,
    address: address,
    profile: {
      name: "",
      avatarUrl: ""
    }
  });
};

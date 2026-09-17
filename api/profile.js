async function getProfile(address) {
const nodes = [
"https://1.pocketnet.app:38881/public/",
"https://2.pocketnet.app:38881/public/",
"https://3.pocketnet.app:38881/public/"
];

let lastError = null;

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
body: JSON.stringify({
method:
"getuserprofile",
params: {
address: address,
shortForm: "basic"
}
})
}
);

```
  if (!response.ok) {
    throw new Error(
      "HTTP " +
      response.status
    );
  }

  const data =
    await response.json();

  let profile =
    data;

  if (
    data &&
    data.result !== undefined
  ) {
    profile =
      data.result;
  }

  if (
    profile &&
    profile.data !== undefined
  ) {
    profile =
      profile.data;
  }

  if (
    Array.isArray(profile)
  ) {
    profile =
      profile[0] || {};
  }

  if (
    profile &&
    profile.profile
  ) {
    profile =
      profile.profile;
  }

  if (
    !profile ||
    typeof profile !==
      "object"
  ) {
    profile = {};
  }

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
    typeof avatar ===
      "object"
  ) {
    avatar =
      avatar.url ||
      avatar.src ||
      avatar.hash ||
      "";
  }

  if (
    typeof avatar !==
      "string"
  ) {
    avatar = "";
  }

  avatar =
    avatar.trim();

  if (
    avatar &&
    avatar.indexOf(
      "http://"
    ) !== 0 &&
    avatar.indexOf(
      "https://"
    ) !== 0 &&
    avatar.indexOf(
      "data:"
    ) !== 0
  ) {
    avatar =
      "https://pocketnet.app/ipfs/" +
      avatar.replace(
        /^\/+/,
        ""
      );
  }

  return {
    name:
      String(name).trim(),
    avatarUrl:
      avatar
  };

} catch (error) {
  lastError =
    error;
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

module.exports =
async function handler(
req,
res
) {
try {
if (
req.method !== "GET"
) {
return res.status(405).json({
error:
"Method not allowed"
});
}

```
  const address =
    req.query &&
    req.query.address;

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
      address: address,
      profile: profile
    });

  } catch (error) {
    return res.status(200).json({
      success: true,
      address: address,
      profile: {
        name: "",
        avatarUrl: ""
      }
    });
  }

} catch (error) {
  return res.status(500).json({
    success: false,
    error:
      error.message ||
      "Server error"
  });
}
```

};

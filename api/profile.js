function extractText(value) {
if (typeof value !== "string") {
return "";
}

return value.trim();
}

function extractProfile(data) {
let name = "";
let avatar = "";

function scan(value, depth) {
if (
depth > 6 ||
value === null ||
value === undefined
) {
return;
}

```
if (
  typeof value === "string"
) {
  const text =
    extractText(value);

  if (
    !name &&
    text.length > 1 &&
    text.length < 100
  ) {
    const lowered =
      text.toLowerCase();

    if (
      lowered.indexOf(
        "http://"
      ) !== 0 &&
      lowered.indexOf(
        "https://"
      ) !== 0 &&
      lowered.indexOf(
        "pqo"
      ) !== 0
    ) {
      name = text;
    }
  }

  return;
}

if (
  typeof value !== "object"
) {
  return;
}

const nameKeys = [
  "name",
  "pName",
  "nickname",
  "username",
  "displayName"
];

const avatarKeys = [
  "i",
  "avatar",
  "avatarUrl",
  "image",
  "imageUrl",
  "photo",
  "photoUrl"
];

for (
  let i = 0;
  i < nameKeys.length;
  i++
) {
  const key =
    nameKeys[i];

  if (
    !name &&
    typeof value[key] ===
      "string"
  ) {
    const text =
      value[key].trim();

    if (text) {
      name = text;
    }
  }
}

for (
  let i = 0;
  i < avatarKeys.length;
  i++
) {
  const key =
    avatarKeys[i];

  let current =
    value[key];

  if (
    current &&
    typeof current ===
      "object"
  ) {
    current =
      current.url ||
      current.src ||
      current.hash ||
      "";
  }

  if (
    !avatar &&
    typeof current ===
      "string"
  ) {
    const text =
      current.trim();

    if (text) {
      avatar = text;
    }
  }
}

const keys =
  Object.keys(value);

for (
  let i = 0;
  i < keys.length;
  i++
) {
  scan(
    value[keys[i]],
    depth + 1
  );
}
```

}

scan(data, 0);

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
) !== 0 &&
avatar.indexOf(
"//"
) !== 0
) {
avatar =
"https://pocketnet.app/ipfs/" +
avatar.replace(
/^/+/,
""
);
}

return {
name: name,
avatarUrl: avatar
};
}

async function callRpc(
node,
address
) {
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
JSON.stringify({
method:
"getuserprofile",
params: {
address:
address,
shortForm:
"basic"
}
})
}
);

if (!response.ok) {
throw new Error(
"HTTP " +
response.status
);
}

return response.json();
}

module.exports =
async function handler(
req,
res
) {
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

const nodes = [
  "https://1.pocketnet.app:38881/public/",
  "https://2.pocketnet.app:38881/public/",
  "https://3.pocketnet.app:38881/public/"
];

for (
  let i = 0;
  i < nodes.length;
  i++
) {
  try {
    const raw =
      await callRpc(
        nodes[i],
        address
      );

    console.log(
      "PROFILE RPC RAW",
      JSON.stringify(raw)
    );

    const profile =
      extractProfile(raw);

    console.log(
      "PROFILE EXTRACTED",
      JSON.stringify(profile)
    );

    return res.status(200).json({
      success: true,
      address:
        address,
      profile:
        profile
    });

  } catch (error) {
    console.log(
      "PROFILE RPC ERROR",
      nodes[i],
      error.message
    );
  }
}

return res.status(200).json({
  success: true,
  address:
    address,
  profile: {
    name: "",
    avatarUrl: ""
  }
});
```

};

function parseValue(value) {
if (typeof value !== "string") {
return value;
}

const text = value.trim();

if (!text) {
return value;
}

if (
text[0] !== "{" &&
text[0] !== "["
) {
return value;
}

try {
return JSON.parse(text);
} catch {
return value;
}
}

function findProfileData(source) {
const visited = new Set();

let bestName = "";
let bestAvatar = "";

function walk(value, depth) {
if (
depth > 8 ||
value === null ||
value === undefined
) {
return;
}

```
if (
  typeof value !== "object"
) {
  return;
}

if (visited.has(value)) {
  return;
}

visited.add(value);

const nameKeys = [
  "name",
  "pName",
  "nickname",
  "username",
  "displayName",
  "n"
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

  const valueForKey =
    value[key];

  if (
    !bestName &&
    typeof valueForKey ===
      "string" &&
    valueForKey.trim()
  ) {
    bestName =
      valueForKey.trim();
  }
}

for (
  let i = 0;
  i < avatarKeys.length;
  i++
) {
  const key =
    avatarKeys[i];

  let avatarValue =
    value[key];

  if (
    avatarValue &&
    typeof avatarValue ===
      "object"
  ) {
    avatarValue =
      avatarValue.url ||
      avatarValue.src ||
      avatarValue.hash ||
      "";
  }

  if (
    !bestAvatar &&
    typeof avatarValue ===
      "string" &&
    avatarValue.trim()
  ) {
    bestAvatar =
      avatarValue.trim();
  }
}

const keys =
  Object.keys(value);

for (
  let i = 0;
  i < keys.length;
  i++
) {
  const key =
    keys[i];

  const child =
    value[key];

  const parsed =
    parseValue(child);

  if (
    parsed !== child
  ) {
    walk(
      parsed,
      depth + 1
    );
  }

  if (
    child &&
    typeof child ===
      "object"
  ) {
    walk(
      child,
      depth + 1
    );
  }
}
```

}

walk(source, 0);

let avatar =
bestAvatar;

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
name:
bestName,
avatarUrl:
avatar
};
}

async function requestRpc(
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

const text =
await response.text();

if (!text) {
throw new Error(
"Empty response"
);
}

return JSON.parse(text);
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

let lastError =
  null;

for (
  let i = 0;
  i < nodes.length;
  i++
) {
  try {
    const raw =
      await requestRpc(
        nodes[i],
        address
      );

    console.log(
      "BASTYON PROFILE RPC RAW",
      JSON.stringify(raw)
    );

    const profile =
      findProfileData(raw);

    console.log(
      "BASTYON PROFILE EXTRACTED",
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
    lastError =
      error;

    console.log(
      "PROFILE NODE ERROR",
      nodes[i],
      error.message
    );
  }
}

console.log(
  "PROFILE ALL NODES FAILED",
  lastError
    ? lastError.message
    : "unknown"
);

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

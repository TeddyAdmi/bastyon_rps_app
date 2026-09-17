const $ = (selector) => document.querySelector(selector);

const screens = {
home: $("#home"),
game: $("#game"),
pvpWait: $("#pvpWait")
};

let user = {
id: "demo-" + Math.random().toString(36).slice(2),
nickname: "Гость",
avatar: "",
balance: null
};

let mode = "free";
let room = null;

function show(screenName) {
Object.values(screens).forEach((screen) => {
if (screen) {
screen.classList.remove("active");
}
});

if (screens[screenName]) {
screens[screenName].classList.add("active");
}
}

function icon(choice) {
const icons = {
stone: "🪨",
scissors: "✂",
paper: "📄"
};

return icons[choice] || "?";
}

function resultText(result) {
if (result === "draw") {
return "Ничья!";
}

if (result === "player1") {
return "Ты победил!";
}

return "Ты проиграл!";
}

function firstString(...values) {
for (const value of values) {
if (
typeof value === "string" &&
value.trim()
) {
return value.trim();
}
}

return "";
}

function findDeepValue(value, keys, depth = 0) {
if (
!value ||
typeof value !== "object" ||
depth > 8
) {
return "";
}

for (const key of keys) {
if (
Object.prototype.hasOwnProperty.call(
value,
key
)
) {
const found = value[key];

```
  if (
    typeof found === "string" &&
    found.trim()
  ) {
    return found.trim();
  }

  if (
    found &&
    typeof found === "object"
  ) {
    const nested = findDeepValue(
      found,
      keys,
      depth + 1
    );

    if (nested) {
      return nested;
    }
  }
}
```

}

for (const child of Object.values(value)) {
if (
child &&
typeof child === "object"
) {
const nested = findDeepValue(
child,
keys,
depth + 1
);

```
  if (nested) {
    return nested;
  }
}
```

}

return "";
}

function normalizeProfile(raw) {
let data = raw;

if (
data &&
typeof data === "object" &&
data.data !== undefined
) {
data = data.data;
}

if (Array.isArray(data)) {
data = data[0] || {};
}

const nickname = firstString(
findDeepValue(data, [
"name",
"nickname",
"username",
"userName",
"displayName",
"displayname"
]),
findDeepValue(raw, [
"name",
"nickname",
"username",
"userName",
"displayName",
"displayname"
])
);

const avatar = firstString(
findDeepValue(data, [
"avatarUrl",
"avatarURL",
"avatar_url",
"avatar",
"image",
"photo",
"picture"
]),
findDeepValue(raw, [
"avatarUrl",
"avatarURL",
"avatar_url",
"avatar",
"image",
"photo",
"picture"
])
);

return {
nickname,
avatar
};
}

function renderUser() {
const nicknameElement = $("#nickname");
const avatarElement = $("#avatar");
const balanceElement = $("#balance");

if (nicknameElement) {
nicknameElement.textContent =
user.nickname || "Гость";
}

if (avatarElement) {
avatarElement.textContent = "";
avatarElement.style.backgroundImage = "";
avatarElement.style.backgroundSize = "cover";
avatarElement.style.backgroundPosition = "center";
avatarElement.style.backgroundRepeat = "no-repeat";

```
if (user.avatar) {
  const image = new Image();

  image.onload = () => {
    avatarElement.style.backgroundImage =
      `url("${user.avatar.replace(/"/g, "%22")}")`;
  };

  image.onerror = () => {
    avatarElement.style.backgroundImage = "";
    avatarElement.textContent =
      (user.nickname || "Г")
        .slice(0, 1)
        .toUpperCase();
  };

  image.src = user.avatar;
} else {
  avatarElement.textContent =
    (user.nickname || "Г")
      .slice(0, 1)
      .toUpperCase();
}
```

}

if (balanceElement) {
if (
user.balance === null ||
user.balance === undefined
) {
balanceElement.textContent = "—";
} else {
const numericBalance =
Number(user.balance);

```
  balanceElement.textContent =
    Number.isFinite(numericBalance)
      ? numericBalance
          .toFixed(4)
          .replace(/0+$/, "")
          .replace(/\.$/, "")
      : "—";
}
```

}
}

async function loadProfile(address) {
if (!address) {
return;
}

try {
const url =
"/api/profile?address=" +
encodeURIComponent(address);

```
console.log(
  "PROFILE REQUEST:",
  url
);

const response =
  await fetch(url, {
    method: "GET",
    cache: "no-store"
  });

console.log(
  "PROFILE HTTP STATUS:",
  response.status
);

if (!response.ok) {
  throw new Error(
    "Profile HTTP " +
    response.status
  );
}

const payload =
  await response.json();

console.log(
  "BASTYON PROFILE RAW:",
  payload
);

const profile =
  normalizeProfile(payload);

console.log(
  "BASTYON PROFILE NORMALIZED:",
  profile
);

if (profile.nickname) {
  user.nickname =
    profile.nickname;
}

if (profile.avatar) {
  user.avatar =
    profile.avatar;
}

renderUser();
```

} catch (error) {
console.log(
"PROFILE LOAD ERROR:",
error
);

```
renderUser();
```

}
}

async function loadBastyon() {
try {
if (
!window.sdk &&
typeof window.BastyonSdk ===
"function"
) {
window.sdk =
new window.BastyonSdk();

```
  await window.sdk.init();
}

if (
  window.sdk?.get?.account
) {
  const account =
    await window.sdk.get.account();

  console.log(
    "BASTYON ACCOUNT RAW:",
    account
  );

  if (account) {
    user.id = String(
      account.address ||
      account.id ||
      user.id
    );
  }
}

if (
  window.sdk?.get?.balance
) {
  const balanceData =
    await window.sdk.get.balance();

  console.log(
    "BASTYON BALANCE RAW:",
    balanceData
  );

  if (
    typeof balanceData ===
    "number"
  ) {
    user.balance =
      balanceData;
  } else if (
    balanceData &&
    typeof balanceData ===
      "object"
  ) {
    console.log(
      "BASTYON BALANCE DATA:",
      balanceData
    );

    const candidates = [
      [
        "actual",
        balanceData.actual
      ],
      [
        "total",
        balanceData.total
      ],
      [
        "balance",
        balanceData.balance
      ],
      [
        "confirmed",
        balanceData.confirmed
      ]
    ];

    const found =
      candidates.find(
        ([, value]) =>
          typeof value ===
            "number" &&
          Number.isFinite(value)
      );

    if (found) {
      user.balance =
        found[1];

      console.log(
        "BALANCE SEARCH RESULT:",
        {
          value: found[1],
          path: found[0]
        }
      );
    }
  }
}
```

} catch (error) {
console.log(
"BASTYON SDK ERROR:",
error
);
}

renderUser();

if (user.id) {
await loadProfile(
user.id
);
}

renderUser();
}

function freeGame() {
mode = "free";

$("#gameMode").textContent =
"Бесплатная игра";

$("#roomInfo").textContent =
"";

$("#opponentName").textContent =
"Компьютер";

$("#playerPick").textContent =
"?";

$("#opponentPick").textContent =
"?";

$("#result").textContent =
"Сделай выбор";

show("game");
}

function playFree(choice) {
const opponent =
[
"stone",
"scissors",
"paper"
][
Math.floor(
Math.random() * 3
)
];

$("#playerPick").textContent =
icon(choice);

$("#opponentPick").textContent =
icon(opponent);

const wins = {
stone: "scissors",
scissors: "paper",
paper: "stone"
};

const result =
choice === opponent
? "draw"
: wins[choice] === opponent
? "player1"
: "player2";

$("#result").textContent =
resultText(result);
}

async function startPvp() {
mode = "pvp";

try {
const response =
await fetch(
"/api/pvp/join",
{
method: "POST",
headers: {
"Content-Type":
"application/json"
},
body: JSON.stringify({
userId: user.id,
nickname:
user.nickname
})
}
);

```
const data =
  await response.json();

if (!response.ok) {
  alert(
    data.error ||
    "Ошибка PvP"
  );

  return;
}

room = data.room;

$("#roomId").textContent =
  room.id;

$("#waitText").textContent =
  data.paymentRequired
    ? "Нужна реальная PKOIN-оплата. Платёжный модуль пока не подключён."
    : "DEMO_MODE: реальные PKOIN не списываются.";

$("#demoMatch").style.display =
  data.paymentRequired
    ? "none"
    : "inline-block";

if (
  room.status ===
  "waiting"
) {
  show("pvpWait");
} else {
  setupPvp();
}
```

} catch (error) {
alert(
"PvP API недоступен: " +
error.message
);
}
}

function setupPvp() {
$("#gameMode").textContent =
"PvP — 1 PKOIN";

$("#roomInfo").textContent =
"Комната " +
room.id;

$("#opponentName").textContent =
"Соперник";

$("#result").textContent =
"Сделай выбор";

$("#playerPick").textContent =
"?";

$("#opponentPick").textContent =
"?";

show("game");
}

async function demoSecondPlayer() {
if (!room) {
return;
}

try {
const response =
await fetch(
"/api/pvp/join",
{
method: "POST",
headers: {
"Content-Type":
"application/json"
},
body: JSON.stringify({
userId:
user.id +
"-opponent",
nickname:
"Demo Player"
})
}
);

```
const data =
  await response.json();

if (
  data.room?.id ===
  room.id
) {
  room = data.room;

  setupPvp();
} else {
  alert(
    "Для настоящего PvP нужна постоянная БД."
  );
}
```

} catch (error) {
alert(
"Ошибка DEMO PvP: " +
error.message
);
}
}

async function playPvp(choice) {
if (!room) {
return;
}

try {
const response =
await fetch(
"/api/pvp/room/" +
room.id +
"/choice",
{
method: "POST",
headers: {
"Content-Type":
"application/json"
},
body: JSON.stringify({
userId: user.id,
choice
})
}
);

```
const data =
  await response.json();

if (!response.ok) {
  alert(
    data.error ||
    "Ошибка PvP"
  );

  return;
}

$("#playerPick").textContent =
  icon(choice);

if (!data.finished) {
  $("#result").textContent =
    "Ждём выбор соперника…";

  return;
}

$("#opponentPick").textContent =
  icon(data.choices[1]);

const playerIndex =
  data.players.findIndex(
    (player) =>
      player.userId ===
      user.id
  );

const outcome =
  data.outcome ===
  "draw"
    ? "draw"
    : data.outcome ===
      `player${playerIndex + 1}`
      ? "player1"
      : "player2";

$("#result").textContent =
  resultText(outcome) +
  ` Банк: ${data.payout} PKOIN`;
```

} catch (error) {
alert(
"Ошибка PvP: " +
error.message
);
}
}

document.addEventListener(
"click",
(event) => {
const choiceButton =
event.target.closest(
"[data-choice]"
);

```
if (choiceButton) {
  if (
    mode === "free"
  ) {
    playFree(
      choiceButton.dataset
        .choice
    );
  } else {
    playPvp(
      choiceButton.dataset
        .choice
    );
  }

  return;
}

const backButton =
  event.target.closest(
    "[data-back]"
  );

if (backButton) {
  show("home");
}
```

}
);

if ($("#freeBtn")) {
$("#freeBtn").onclick =
freeGame;
}

if ($("#pvpBtn")) {
$("#pvpBtn").onclick =
startPvp;
}

if ($("#demoMatch")) {
$("#demoMatch").onclick =
demoSecondPlayer;
}

loadBastyon();

````

Нажми **Commit changes**.

Потом открой сайт и нажми **Ctrl + F5**.

После этого в консоли должны появиться строки:

```text
PROFILE REQUEST:
PROFILE HTTP STATUS:
BASTYON PROFILE RAW:
BASTYON PROFILE NORMALIZED:
````

Именно эти строки покажут нам, что реально возвращает Bastyon для **имени и аватара**. Баланс этот файл сохраняет: у тебя уже правильно определяется `actual = 0.20059996`.

Если после этого снова будет `Игрок PQoPdc`, пришли **только 4 строки `PROFILE...` из консоли**, без access token.

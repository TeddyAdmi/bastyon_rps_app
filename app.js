const $ = s => document.querySelector(s);

// ======================================================
// ЭКРАНЫ
// ======================================================

const screens = {
home: $('#home'),
game: $('#game'),
pvpWait: $('#pvpWait')
};

// ======================================================
// ПОЛЬЗОВАТЕЛЬ
// ======================================================

let user = {
id: 'demo-' + Math.random().toString(36).slice(2),
nickname: 'Гость',
balance: null,
avatar: null
};

let mode = 'free';
let room = null;

// ======================================================
// ЭКРАНЫ
// ======================================================

function show(name) {

Object.values(screens).forEach(screen => {

```
if (screen) {
  screen.classList.remove('active');
}
```

});

if (screens[name]) {
screens[name].classList.add('active');
}
}

// ======================================================
// ИКОНКИ
// ======================================================

function icon(choice) {

return {
stone: '🪨',
scissors: '✂',
paper: '📄'
}[choice] || '?';
}

// ======================================================
// РЕЗУЛЬТАТ
// ======================================================

function resultText(result) {

if (result === 'draw') {
return 'Ничья!';
}

if (result === 'player1') {
return 'Ты победил!';
}

return 'Ты проиграл!';
}

// ======================================================
// АВАТАР
// ======================================================

function setAvatar(avatarUrl) {

const avatar = $('#avatar');

if (!avatar) {
return;
}

if (!avatarUrl) {

```
avatar.innerHTML = '';

avatar.textContent =
  (user.nickname || 'Г')
    .slice(0, 1)
    .toUpperCase();

return;
```

}

let url = String(avatarUrl).trim();

// ----------------------------------------------------
// //example.com/image
// ----------------------------------------------------

if (url.startsWith('//')) {
url = 'https:' + url;
}

// ----------------------------------------------------
// IPFS
// ----------------------------------------------------

if (
!/^https?:///i.test(url) &&
!url.startsWith('data:')
) {

```
url =
  'https://pocketnet.app/ipfs/' +
  url.replace(/^\/+/, '');
```

}

avatar.innerHTML = '';

const img =
document.createElement('img');

img.src = url;

img.alt =
user.nickname || 'Профиль';

img.referrerPolicy =
'no-referrer';

img.onload = () => {

```
user.avatar = url;
```

};

img.onerror = () => {

```
avatar.innerHTML = '';

avatar.textContent =
  (user.nickname || 'Г')
    .slice(0, 1)
    .toUpperCase();
```

};

avatar.appendChild(img);
}

// ======================================================
// ПРОФИЛЬ
// ======================================================

function setProfile(name, avatarUrl) {

const nickname =
$('#nickname');

if (name) {

```
user.nickname =
  String(name);

if (nickname) {
  nickname.textContent =
    user.nickname;
}
```

}

if (avatarUrl) {

```
setAvatar(avatarUrl);
```

} else {

```
setAvatar(null);
```

}
}

// ======================================================
// ПОИСК ЗНАЧЕНИЯ В ОБЪЕКТЕ
// ======================================================

function findValue(object, keys) {

if (!object || typeof object !== 'object') {
return null;
}

for (const key of keys) {

```
if (
  object[key] !== undefined &&
  object[key] !== null
) {

  return object[key];
}
```

}

return null;
}

// ======================================================
// ПРЕОБРАЗОВАНИЕ БАЛАНСА
// ======================================================

function extractBalance(data) {

console.log(
'BASTYON BALANCE RAW:',
data
);

// ----------------------------------------------------
// Если SDK сразу вернул число
// ----------------------------------------------------

if (typeof data === 'number') {
return data;
}

// ----------------------------------------------------
// Если SDK вернул строку с числом
// ----------------------------------------------------

if (
typeof data === 'string' &&
data.trim() !== ''
) {

```
const number =
  Number(data);

if (Number.isFinite(number)) {
  return number;
}
```

}

// ----------------------------------------------------
// Объект
// ----------------------------------------------------

if (
data &&
typeof data === 'object'
) {

```
const value =
  findValue(
    data,
    [
      'balance',
      'amount',
      'pkoin',
      'PKOIN',
      'value',
      'available',
      'confirmed'
    ]
  );

if (
  typeof value === 'number'
) {
  return value;
}

if (
  typeof value === 'string' &&
  value.trim() !== ''
) {

  const number =
    Number(value);

  if (Number.isFinite(number)) {
    return number;
  }
}


// ------------------------------------------------
// Иногда данные могут лежать внутри account
// ------------------------------------------------

if (data.account) {

  const nested =
    extractBalance(
      data.account
    );

  if (nested !== null) {
    return nested;
  }
}


// ------------------------------------------------
// Иногда внутри wallet
// ------------------------------------------------

if (data.wallet) {

  const nested =
    extractBalance(
      data.wallet
    );

  if (nested !== null) {
    return nested;
  }
}


// ------------------------------------------------
// Иногда внутри data
// ------------------------------------------------

if (data.data) {

  const nested =
    extractBalance(
      data.data
    );

  if (nested !== null) {
    return nested;
  }
}
```

}

return null;
}

// ======================================================
// ПОКАЗ БАЛАНСА
// ======================================================

function updateBalanceDisplay() {

const balance =
$('#balance');

if (!balance) {
return;
}

if (
user.balance === null ||
user.balance === undefined
) {

```
balance.textContent =
  '—';

return;
```

}

// ----------------------------------------------------
// Красивое отображение числа
// ----------------------------------------------------

const number =
Number(user.balance);

if (Number.isFinite(number)) {

```
balance.textContent =
  number.toLocaleString(
    'en-US',
    {
      maximumFractionDigits: 8
    }
  );
```

} else {

```
balance.textContent =
  String(user.balance);
```

}
}

// ======================================================
// BASTYON
// ======================================================

async function loadBastyon() {

try {

```
const sdk =
  window.sdk;


// ==================================================
// ПРОВЕРКА SDK
// ==================================================

console.log(
  'BASTYON SDK:',
  sdk
);


if (!sdk) {

  console.log(
    'Bastyon SDK не найден'
  );

  setProfile(
    'Гость',
    null
  );

  updateBalanceDisplay();

  return;
}


// ==================================================
// ACCOUNT
// ==================================================

try {

  if (sdk.get?.account) {

    const account =
      await sdk.get.account();

    console.log(
      'BASTYON ACCOUNT:',
      account
    );


    if (account) {

      const accountId =
        account.address ||
        account.id ||
        account.uid ||
        account.userId ||
        account.key;

      if (accountId) {

        user.id =
          String(accountId);

      }
    }
  }

} catch (error) {

  console.log(
    'Account error:',
    error
  );
}


// ==================================================
// BALANCE
// ==================================================

try {

  if (sdk.get?.balance) {

    const balanceData =
      await sdk.get.balance();

    user.balance =
      extractBalance(
        balanceData
      );

  } else {

    console.log(
      'sdk.get.balance отсутствует'
    );

  }

} catch (error) {

  console.log(
    'Balance error:',
    error
  );

  user.balance =
    null;
}


// ==================================================
// USERSTATE
// ==================================================

try {

  if (
    sdk.helpers?.userstate
  ) {

    const state =
      await sdk.helpers.userstate();

    console.log(
      'BASTYON USERSTATE:',
      state
    );


    // ----------------------------------------------
    // Профиль
    // ----------------------------------------------

    const profile =
      state?.profile ||
      state?.user ||
      state?.account ||
      state;


    const name =
      profile?.name ||
      profile?.pName ||
      profile?.nickname ||
      profile?.username ||
      profile?.displayName ||
      state?.name ||
      state?.pName;


    const avatar =
      profile?.i ||
      profile?.avatar ||
      profile?.avatarUrl ||
      profile?.image ||
      profile?.imageUrl ||
      profile?.avatarImage ||
      state?.i ||
      state?.avatar ||
      state?.avatarUrl;


    if (
      name ||
      avatar
    ) {

      setProfile(
        name,
        avatar
      );
    }


    // ----------------------------------------------
    // Иногда баланс приходит вместе с userstate
    // ----------------------------------------------

    if (
      user.balance === null ||
      user.balance === undefined
    ) {

      const stateBalance =
        extractBalance(
          state
        );

      if (
        stateBalance !== null
      ) {

        user.balance =
          stateBalance;
      }
    }
  }

} catch (error) {

  console.log(
    'Userstate error:',
    error
  );
}
```

} catch (error) {

```
console.log(
  'Bastyon initialization error:',
  err
```

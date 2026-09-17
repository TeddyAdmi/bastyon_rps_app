const $ = s => document.querySelector(s);

const screens = {
  home: $('#home'),
  game: $('#game'),
  pvpWait: $('#pvpWait')
};

let user = {
  id: 'demo-' + Math.random().toString(36).slice(2),
  nickname: 'Гость',
  balance: null
};

let mode = 'free';
let room = null;


// =========================
// ЭКРАНЫ
// =========================

function show(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}


// =========================
// ИКОНКИ И РЕЗУЛЬТАТ
// =========================

function icon(choice) {
  return {
    stone: '🪨',
    scissors: '✂',
    paper: '📄'
  }[choice] || '?';
}

function resultText(result) {
  if (result === 'draw') return 'Ничья!';
  if (result === 'player1') return 'Ты победил!';
  return 'Ты проиграл!';
}


// =========================
// ПРОФИЛЬ
// =========================

function setProfile(name, avatarUrl) {

  const nickname = $('#nickname');
  const avatar = $('#avatar');

  if (name) {
    user.nickname = String(name);
    nickname.textContent = user.nickname;
  }

  if (avatarUrl) {

    let url = String(avatarUrl);

    // //example.com/image
    if (url.startsWith('//')) {
      url = 'https:' + url;
    }

    // Если Bastyon вернул IPFS hash
    if (
      !/^https?:\/\//i.test(url) &&
      !url.startsWith('data:')
    ) {
      url =
        'https://pocketnet.app/ipfs/' +
        url.replace(/^\/+/, '');
    }

    avatar.innerHTML = '';

    const img = document.createElement('img');

    img.src = url;
    img.alt = user.nickname || 'Профиль';
    img.referrerPolicy = 'no-referrer';

    img.onerror = () => {
      avatar.textContent =
        (user.nickname || 'Г')
          .slice(0, 1)
          .toUpperCase();
    };

    avatar.appendChild(img);

  } else {

    avatar.textContent =
      (user.nickname || 'Г')
        .slice(0, 1)
        .toUpperCase();
  }
}


// =========================
// BASTYON
// =========================

async function loadBastyon() {

  try {

    const sdk = window.sdk;

    // -------------------------
    // КОШЕЛЁК
    // -------------------------

    if (sdk?.get?.account) {

      const account = await sdk.get.account();

      if (account) {

        user.id = String(
          account.address ||
          account.id ||
          user.id
        );
      }
    }


    // -------------------------
    // БАЛАНС
    // -------------------------

    if (sdk?.get?.balance) {

      const balance = await sdk.get.balance();

      user.balance =
        typeof balance === 'number'
          ? balance
          : (balance?.balance ?? null);
    }


    // -------------------------
    // ПРОФИЛЬ BASTYON
    // -------------------------

    if (sdk?.helpers?.userstate) {

      const state =
        await sdk.helpers.userstate();

      // Оставляем в консоли,
      // чтобы увидеть настоящий ответ Bastyon
      console.log(
        'BASTYON USERSTATE:',
        state
      );

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
        state?.name ||
        state?.pName;


      const avatar =
        profile?.i ||
        profile?.avatar ||
        profile?.avatarUrl ||
        profile?.image ||
        profile?.imageUrl ||
        state?.i ||
        state?.avatar ||
        state?.avatarUrl;


      if (name || avatar) {
        setProfile(name, avatar);
      }
    }

  } catch (error) {

    console.log(
      'Bastyon profile error:',
      error
    );
  }


  // Если профиль не удалось получить
  if (user.nickname === 'Гость') {

    setProfile(
      'Игрок ' + user.id.slice(0, 7),
      null
    );

  } else {

    setProfile(
      user.nickname,
      null
    );
  }


  $('#balance').textContent =
    user.balance ?? '—';
}


// =========================
// БЕСПЛАТНАЯ ИГРА
// =========================

function freeGame() {

  mode = 'free';

  $('#gameMode').textContent =
    'Бесплатная игра';

  $('#roomInfo').textContent = '';

  $('#opponentName').textContent =
    'Компьютер';

  $('#playerPick').textContent = '?';

  $('#opponentPick').textContent = '?';

  $('#result').textContent =
    'Сделай выбор';

  show('game');
}


function playFree(choice) {

  const opponent =
    ['stone', 'scissors', 'paper'][
      Math.floor(Math.random() * 3)
    ];

  $('#playerPick').textContent =
    icon(choice);

  $('#opponentPick').textContent =
    icon(opponent);

  const wins = {
    stone: 'scissors',
    scissors: 'paper',
    paper: 'stone'
  };

  $('#result').textContent =
    resultText(
      choice === opponent
        ? 'draw'
        : wins[choice] === opponent
          ? 'player1'
          : 'player2'
    );
}


// =========================
// PVP
// =========================

async function startPvp() {

  mode = 'pvp';

  const response = await fetch(
    '/api/pvp/join',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: user.id,
        nickname: user.nickname
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return alert(
      data.error || 'Ошибка'
    );
  }

  room = data.room;

  $('#roomId').textContent =
    room.id;

  $('#waitText').textContent =
    data.paymentRequired
      ? 'Нужна реальная PKOIN-оплата. Платёжный модуль пока не подключён.'
      : 'DEMO_MODE: реальные PKOIN не списываются.';

  $('#demoMatch').style.display =
    data.paymentRequired
      ? 'none'
      : 'inline-block';

  room.status === 'waiting'
    ? show('pvpWait')
    : setupPvp();
}


function setupPvp() {

  $('#gameMode').textContent =
    'PvP — 1 PKOIN';

  $('#roomInfo').textContent =
    'Комната ' + room.id;

  $('#opponentName').textContent =
    'Соперник';

  $('#result').textContent =
    'Сделай выбор';

  $('#playerPick').textContent = '?';

  $('#opponentPick').textContent = '?';

  show('game');
}


async function demoSecondPlayer() {

  if (!room) return;

  const response = await fetch(
    '/api/pvp/join',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: user.id + '-opponent',
        nickname: 'Demo Player'
      })
    }
  );

  const data = await response.json();

  if (data.room?.id === room.id) {

    room = data.room;

    setupPvp();

  } else {

    alert(
      'Для настоящего PvP нужна постоянная БД.'
    );
  }
}


async function playPvp(choice) {

  if (!room) return;

  const response = await fetch(
    '/api/pvp/room/' +
    room.id +
    '/choice',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: user.id,
        choice
      })
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    return alert(
      data.error || 'Ошибка'
    );
  }

  $('#playerPick').textContent =
    icon(choice);

  if (!data.finished) {

    $('#result').textContent =
      'Ждём выбор соперника…';

    return;
  }

  $('#opponentPick').textContent =
    icon(data.choices[1]);

  const playerIndex =
    data.players.findIndex(
      p => p.userId === user.id
    );

  const outcome =
    data.outcome === 'draw'
      ? 'draw'
      : data.outcome ===
        `player${playerIndex + 1}`
        ? 'player1'
        : 'player2';

  $('#result').textContent =
    resultText(outcome) +
    ` Банк: ${data.payout} PKOIN`;
}


// =========================
// КНОПКИ
// =========================

document.addEventListener(
  'click',
  event => {

    const button =
      event.target.closest(
        '[data-choice]'
      );

    if (button) {

      return mode === 'free'
        ? playFree(
            button.dataset.choice
          )
        : playPvp(
            button.dataset.choice
          );
    }

    if (
      event.target.closest(
        '[data-back]'
      )
    ) {
      show('home');
    }
  }
);


$('#freeBtn').onclick =
  freeGame;

$('#pvpBtn').onclick =
  startPvp;

$('#demoMatch').onclick =
  demoSecondPlayer;


// =========================
// ЗАПУСК
// =========================

loadBastyon();

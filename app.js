// Address for receiving bets (5% fee remains here, 1.9 PKOIN paid to winner)
const APP_WALLET_ADDRESS = "YOUR_BASTYON_DEPOSIT_WALLET_ADDRESS";

let currentUser = null;
let currentPvpMatch = null;
let matchTimerInterval = null;

// Mock open matches for demo
let openMatches = [
  { id: 'match_101', creator: 'Alex_PK', avatar: 'https://bastyon.com/images/user.png', bet: 1, created: Date.now() }
];

// Initialize Bastyon SDK
document.addEventListener('DOMContentLoaded', () => {
  initBastyonSdk();
  renderMatches();
});

function initBastyonSdk() {
  const sdk = window.BastyonSdk || window.pktSdk;
  if (sdk) {
    sdk.init().then(() => {
      console.log('Bastyon SDK Initialized');
      autoConnectWallet();
    }).catch(err => {
      console.warn('Bastyon SDK init error:', err);
    });
  }
}

// Auto-connect or one-click connect
async function connectWallet() {
  const sdk = window.BastyonSdk || window.pktSdk;
  if (!sdk) {
    // Fallback demo mode outside Bastyon environment
    currentUser = {
      name: "Пользователь (Demo)",
      avatar: "https://bastyon.com/images/user.png",
      balance: 15.5
    };
    updateUserUI();
    return;
  }

  try {
    const accountInfo = await sdk.get.account();
    const balanceInfo = await sdk.get.balance();

    currentUser = {
      address: accountInfo.address,
      name: accountInfo.name || "Игрок Bastyon",
      avatar: accountInfo.avatar || "https://bastyon.com/images/user.png",
      balance: balanceInfo ? balanceInfo.balance : 0
    };

    updateUserUI();
  } catch (e) {
    console.error("Ошибка при подключении кошелька:", e);
    alert("Не удалось подключить кошелек Bastyon.");
  }
}

function autoConnectWallet() {
  connectWallet();
}

function updateUserUI() {
  if (currentUser) {
    document.getElementById('connect-btn').style.display = 'none';
    document.getElementById('profile-info').style.display = 'flex';
    document.getElementById('user-avatar').src = currentUser.avatar;
    document.getElementById('user-name').innerText = currentUser.name;
    document.getElementById('user-balance').innerText = `${currentUser.balance} PKOIN`;
  }
}

// Room switching
function switchRoom(room) {
  document.getElementById('tab-free').classList.toggle('active', room === 'free');
  document.getElementById('tab-pvp').classList.toggle('active', room === 'pvp');

  document.getElementById('room-free').style.display = room === 'free' ? 'block' : 'none';
  document.getElementById('room-pvp').style.display = room === 'pvp' ? 'block' : 'none';
}

// Free PvE game logic
function playFree(playerChoice) {
  const choices = ['rock', 'scissors', 'paper'];
  const botChoice = choices[Math.floor(Math.random() * choices.length)];

  const choiceIcons = { rock: '🪨 Камень', scissors: '✂️ Ножницы', paper: '📄 Бумага' };

  let outcome = "";
  if (playerChoice === botChoice) {
    outcome = "Ничья! 🤝";
  } else if (
    (playerChoice === 'rock' && botChoice === 'scissors') ||
    (playerChoice === 'scissors' && botChoice === 'paper') ||
    (playerChoice === 'paper' && botChoice === 'rock')
  ) {
    outcome = "Вы выиграли! 🎉";
  } else {
    outcome = "Компьютер выиграл! 🤖";
  }

  document.getElementById('free-player-choice').innerText = choiceIcons[playerChoice];
  document.getElementById('free-bot-choice').innerText = choiceIcons[botChoice];
  document.getElementById('free-outcome').innerText = outcome;
  document.getElementById('free-result').style.display = 'block';
}

// PvP Logic
async function createPvpMatch() {
  if (!currentUser) {
    alert("Пожалуйста, подключите кошелек в 1 клик!");
    return;
  }

  const sdk = window.BastyonSdk || window.pktSdk;

  if (sdk) {
    try {
      // 1 PKOIN transaction to deposit wallet
      const tx = await sdk.payment({
        address: APP_WALLET_ADDRESS,
        amount: 1.0,
        comment: "RPS PvP Game Bet 1 PKOIN"
      });

      if (!tx) {
        alert("Транзакция отменена.");
        return;
      }
    } catch (e) {
      alert("Ошибка совершения платежа: " + e.message);
      return;
    }
  }

  // Create match state
  currentPvpMatch = {
    id: 'match_' + Date.now(),
    creator: currentUser.name,
    created: Date.now(),
    creatorMove: null
  };

  document.getElementById('pvp-lobby').style.display = 'none';
  document.getElementById('active-match').style.display = 'block';
  document.getElementById('pvp-status-msg').innerText = "Ставка 1 PKOIN принята! Выберите ваш ход и ждите соперника (таймер 24 часа).";

  startTimer(86400); // 24 hours
}

function startTimer(secondsLeft) {
  clearInterval(matchTimerInterval);
  let timer = secondsLeft;

  matchTimerInterval = setInterval(() => {
    let hours = Math.floor(timer / 3600);
    let minutes = Math.floor((timer % 3600) / 60);
    let seconds = Math.floor(timer % 60);

    document.getElementById('timer').innerText = 
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (--timer < 0) {
      clearInterval(matchTimerInterval);
      document.getElementById('pvp-status-msg').innerText = "Время истекло (24ч)! Ставка 1 PKOIN возвращена.";
    }
  }, 1000);
}

function makePvpMove(move) {
  if (!currentPvpMatch) return;
  currentPvpMatch.creatorMove = move;
  document.getElementById('pvp-status-msg').innerText = `Ваш ход (${move}) записан! Ждем второго игрока...`;
}

function renderMatches() {
  const container = document.getElementById('open-matches-list');
  if (openMatches.length === 0) {
    container.innerHTML = '<div class="no-matches">Ищется активный соперник...</div>';
    return;
  }

  container.innerHTML = openMatches.map(m => `
    <div class="match-item">
      <div>
        <strong>${m.creator}</strong> | Ставка: ${m.bet} PKOIN
      </div>
      <button class="btn btn-action" onclick="joinMatch('${m.id}')">Принять (1 PKOIN)</button>
    </div>
  `).join('');
}

function joinMatch(matchId) {
  alert("Для входа в игру выберите 'Создать матч' или подключите бэкенд-сервер сопоставления.");
}

function refreshLobby() {
  renderMatches();
}

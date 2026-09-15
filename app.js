// Адрес вашего кошелька для приема ставок и хранения 5% комиссии
const APP_WALLET_ADDRESS = "ВАШ_АДРЕС_КОШЕЛЬКА_BASTYON";

let currentUser = null;
let currentPvpMatch = null;

// Инициализация Bastyon SDK
document.addEventListener('DOMContentLoaded', () => {
  const sdk = window.BastyonSdk || window.pktSdk;
  if (sdk) {
    sdk.init().then(() => {
      connectWallet(); // Автоподключение в 1 клик
    });
  }
});

// Авторизация и загрузка профиля
async function connectWallet() {
  const sdk = window.BastyonSdk || window.pktSdk;
  if (!sdk) return;

  try {
    const accountInfo = await sdk.get.account();
    const balanceInfo = await sdk.get.balance();

    currentUser = {
      address: accountInfo.address,
      name: accountInfo.name || "Игрок Bastyon",
      avatar: accountInfo.avatar || "https://bastyon.com/images/user.png",
      balance: balanceInfo ? balanceInfo.balance : 0
    };

    // Отображаем профиль, аватар и баланс
    document.getElementById('user-avatar').src = currentUser.avatar;
    document.getElementById('user-name').innerText = currentUser.name;
    document.getElementById('user-balance').innerText = `${currentUser.balance} PKOIN`;
  } catch (e) {
    console.error("Ошибка подключения:", e);
  }
}

// Создание PvP матча на 1 PKOIN
async function createPvpMatch() {
  const sdk = window.BastyonSdk || window.pktSdk;
  
  if (sdk) {
    try {
      // Оплата 1 PKOIN на игровой кошелек
      const tx = await sdk.payment({
        address: APP_WALLET_ADDRESS,
        amount: 1.0,
        comment: "RPS PvP Game Bet 1 PKOIN"
      });

      if (!tx) {
        alert("Транзакция была отменена.");
        return;
      }
    } catch (e) {
      alert("Ошибка платежа: " + e.message);
      return;
    }
  }

  // Запуск 24-часового таймера
  start24hTimer();
}

function start24hTimer() {
  let timer = 86400; // 24 часа в секундах
  const interval = setInterval(() => {
    let hours = Math.floor(timer / 3600);
    let minutes = Math.floor((timer % 3600) / 60);
    let seconds = Math.floor(timer % 60);

    document.getElementById('timer').innerText = 
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (--timer < 0) {
      clearInterval(interval);
      alert("Время ожидания игрока истекло (24ч). Ставка возвращается.");
    }
  }, 1000);
}

// Адрес для приема ставок и хранения 5% комиссии
const APP_WALLET_ADDRESS = "PQoPdcQdkqQSqiHxPfsMwnhxW8QAjfTEzs";

let currentUser = null;

// Автоматическая загрузка профиля (1 клик)
document.addEventListener('DOMContentLoaded', () => {
  const sdk = window.BastyonSdk || window.pktSdk;
  if (sdk) {
    sdk.init().then(() => {
      connectWallet();
    });
  }
});

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

    document.getElementById('user-avatar').src = currentUser.avatar;
    document.getElementById('user-name').innerText = currentUser.name;
    document.getElementById('user-balance').innerText = `${currentUser.balance} PKOIN`;
  } catch (e) {
    console.error("Ошибка подключения SDK:", e);
  }
}

// Создание PvP матча на 1 PKOIN
async function createPvpMatch() {
  const sdk = window.BastyonSdk || window.pktSdk;
  if (!sdk) return;

  try {
    const tx = await sdk.payment({
      address: APP_WALLET_ADDRESS,
      amount: 1.0,
      comment: "RPS PvP Game Bet 1 PKOIN"
    });

    if (tx) {
      alert("Ставка 1 PKOIN принята! Ожидание второго игрока (24 часа).");
    }
  } catch (e) {
    alert("Ошибка платежа: " + e.message);
  }
}

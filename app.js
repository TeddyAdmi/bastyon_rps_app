const APP_WALLET_ADDRESS = "ВАШ_PKOIN_АДРЕС_КОШЕЛЬКА";
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  initBastyonSdk();
});

async function initBastyonSdk() {
  const sdk = window.BastyonSdk || window.pktSdk;
  if (!sdk) {
    console.warn("Bastyon SDK не найден, запуск в автономном режиме.");
    return;
  }

  try {
    await sdk.init();
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
    console.error("Ошибка при работе с Bastyon SDK:", e);
  }
}

async function createPvpMatch() {
  const sdk = window.BastyonSdk || window.pktSdk;
  if (!sdk) {
    alert("SDK недоступен");
    return;
  }

  try {
    const tx = await sdk.payment({
      address: APP_WALLET_ADDRESS,
      amount: 1.0,
      comment: "RPS PvP Game Bet 1 PKOIN"
    });

    if (tx) {
      alert("Ставка 1 PKOIN принята!");
    }
  } catch (e) {
    alert("Ошибка платежа: " + e.message);
  }
}

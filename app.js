const APP_WALLET_ADDRESS = "PQoPdcQdkqQSqiHxPfsMwnhxW8QAjfTEzs";
let currentUser = null;

// Ожидаем полную готовность DOM и загрузку SDK
window.addEventListener('load', () => {
  initBastyonSdk();
});

async function initBastyonSdk() {
  // Выполняем до 10 попыток найти объект SDK в объекте window
  let attempts = 0;
  let sdk = window.BastyonSdk || window.pktSdk;

  while (!sdk && attempts < 10) {
    await new Promise(resolve => setTimeout(resolve, 300));
    sdk = window.BastyonSdk || window.pktSdk;
    attempts++;
  }

  if (!sdk) {
    console.warn("Bastyon SDK не найден. Запуск локального режима.");
    return;
  }

  try {
    // Инициализируем SDK
    if (typeof sdk.init === 'function') {
      await sdk.init();
    }

    // Запрашиваем аккаунт и баланс
    const accountInfo = await sdk.get.account();
    const balanceInfo = await sdk.get.balance();

    currentUser = {
      address: accountInfo?.address || "",
      name: accountInfo?.name || "Игрок Bastyon",
      avatar: accountInfo?.avatar || "https://bastyon.com/images/user.png",
      balance: balanceInfo?.balance || 0
    };

    // Обновляем UI
    const avatarEl = document.getElementById('user-avatar');
    const nameEl = document.getElementById('user-name');
    const balanceEl = document.getElementById('user-balance');

    if (avatarEl) avatarEl.src = currentUser.avatar;
    if (nameEl) nameEl.innerText = currentUser.name;
    if (balanceEl) balanceEl.innerText = `${currentUser.balance} PKOIN`;

  } catch (e) {
    console.error("Ошибка инициализации Bastyon SDK:", e);
  }
}

async function createPvpMatch() {
  const sdk = window.BastyonSdk || window.pktSdk;
  if (!sdk) {
    alert("SDK не инициализирован.");
    return;
  }

  try {
    const tx = await sdk.payment({
      address: APP_WALLET_ADDRESS,
      amount: 1.0,
      comment: "RPS Bet 1 PKOIN"
    });

    if (tx) {
      alert("Ставка принята!");
    }
  } catch (e) {
    alert("Ошибка платежа: " + e.message);
  }
}

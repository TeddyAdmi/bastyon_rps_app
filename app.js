const APP_WALLET_ADDRESS = "PQoPdcQdkqQSqiHxPfsMwnhxW8QAjfTEzs";
let currentUser = null;

// Запасной аватар в формате SVG Data-URI, который не блокируется браузером
const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='%23ffaa00'><circle cx='12' cy='8' r='4'/><path d='M12 14c-6.1 0-8 4-8 4v2h16v-2s-1.9-4-8-4z'/></svg>";

document.addEventListener('DOMContentLoaded', () => {
  initBastyonApp();
});

function initBastyonApp() {
  // 1. Слушаем сообщение от родительской платформы Bastyon (если она внедряет SDK через postMessage)
  window.addEventListener('message', (event) => {
    if (event.data && (event.data.type === 'bastyon-sdk-init' || event.data.BastyonSdk)) {
      startSdk();
    }
  });

  // 2. Циклический опрос наличия SDK в течение 10 секунд
  let checkCount = 0;
  const interval = setInterval(() => {
    checkCount++;
    const sdk = window.BastyonSdk || window.pktSdk || (window.parent && window.parent.BastyonSdk);

    if (sdk) {
      clearInterval(interval);
      startSdk(sdk);
    } else if (checkCount >= 50) { // 50 * 200ms = 10 секунд
      clearInterval(interval);
      console.warn("Bastyon SDK не обнаружен после 10 сек. Запуск автономного UI.");
      showFallbackUI();
    }
  }, 200);
}

async function startSdk(sdkInstance) {
  const sdk = sdkInstance || window.BastyonSdk || window.pktSdk;
  try {
    if (typeof sdk.init === 'function') {
      await sdk.init();
    }

    const account = await sdk.get.account();
    const balance = await sdk.get.balance();

    currentUser = {
      address: account?.address || "",
      name: account?.name || "Игрок Bastyon",
      avatar: account?.avatar || DEFAULT_AVATAR,
      balance: balance?.balance || 0
    };

    updateUI();
  } catch (err) {
    console.error("Ошибка при получении данных из Bastyon SDK:", err);
    showFallbackUI();
  }
}

function updateUI() {
  if (!currentUser) return;
  
  const avatarImg = document.getElementById('user-avatar');
  if (avatarImg) {
    avatarImg.src = currentUser.avatar;
    // Если аватар Bastyon заблокирован по CORS/ORB, ставим дефолтный SVG
    avatarImg.onerror = () => { avatarImg.src = DEFAULT_AVATAR; };
  }

  const nameEl = document.getElementById('user-name');
  if (nameEl) nameEl.innerText = currentUser.name;

  const balanceEl = document.getElementById('user-balance');
  if (balanceEl) balanceEl.innerText = `${currentUser.balance} PKOIN`;
}

function showFallbackUI() {
  const nameEl = document.getElementById('user-name');
  if (nameEl) nameEl.innerText = "Автономный режим";
  
  const avatarImg = document.getElementById('user-avatar');
  if (avatarImg) avatarImg.src = DEFAULT_AVATAR;
}

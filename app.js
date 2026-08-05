let selectedSpriteStaticTemp = 'assets/characters/hero-male.png';
let selectedSpriteIdleTemp = 'assets/characters/hero-male-idle.gif';

const battleState = {
  price: 0,
  itemName: '',
  enemyHP: 100,
  maxEnemyHP: 100,
  playerHP: 100,
  maxPlayerHP: 100,
  timerInterval: null
};

// UI NAVIGATION
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('form-login').classList.toggle('hidden', !isLogin);
  document.getElementById('form-signup').classList.toggle('hidden', isLogin);
  document.getElementById('tab-login').classList.toggle('active', isLogin);
  document.getElementById('tab-signup').classList.toggle('active', isLogin);
}

// LOCAL AUTHENTICATION
function handleLocalSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim().toLowerCase();
  const pass = document.getElementById('signup-pass').value;

  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};

  if (users[email]) {
    alert("An account with this email already exists!");
    return;
  }

  users[email] = {
    password: pass,
    trainerName: name || 'Hero',
    wage: 15.00,
    foodPrice: 7.50,
    eventPrice: 25.00,
    baseSpriteStatic: 'assets/characters/hero-male.png',
    baseSpriteIdle: 'assets/characters/hero-male-idle.gif',
    equippedSprite: 'assets/characters/hero-male-idle.gif',
    inventory: ['hat_default'],
    lvl: 1,
    xp: 0,
    savedTotal: 0,
    vaultUnlockTime: null,
    logs: []
  };

  localStorage.setItem('slayer_users', JSON.stringify(users));
  localStorage.setItem('slayer_active_user', email);

  showScreen('screen-survey');
}

function handleLocalLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pass = document.getElementById('login-pass').value;

  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  const user = users[email];

  if (!user || user.password !== pass) {
    alert("Incorrect email or password.");
    return;
  }

  localStorage.setItem('slayer_active_user', email);
  loadTrainerSession();
}

// FINANCIAL PROFILE SETUP
function saveFinancialProfile(e) {
  e.preventDefault();
  const activeEmail = localStorage.getItem('slayer_active_user');
  if (!activeEmail) return showScreen('screen-login');

  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  if (users[activeEmail]) {
    users[activeEmail].wage = parseFloat(document.getElementById('survey-wage').value) || 15.00;
    users[activeEmail].foodPrice = parseFloat(document.getElementById('survey-food').value) || 7.50;
    users[activeEmail].eventPrice = parseFloat(document.getElementById('survey-event').value) || 25.00;

    localStorage.setItem('slayer_users', JSON.stringify(users));
  }

  showScreen('screen-sprite');
}

// SPRITE SELECTION
function selectSprite(staticSrc, idleSrc, element) {
  selectedSpriteStaticTemp = staticSrc;
  selectedSpriteIdleTemp = idleSrc;

  document.querySelectorAll('.sprite-option').forEach(opt => opt.classList.remove('active'));
  element.classList.add('active');
}

function confirmSpriteSelection() {
  const activeEmail = localStorage.getItem('slayer_active_user');
  if (!activeEmail) return showScreen('screen-login');

  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  if (users[activeEmail]) {
    users[activeEmail].baseSpriteStatic = selectedSpriteStaticTemp;
    users[activeEmail].baseSpriteIdle = selectedSpriteIdleTemp;
    users[activeEmail].equippedSprite = selectedSpriteIdleTemp;
    localStorage.setItem('slayer_users', JSON.stringify(users));
  }

  loadTrainerSession();
}

// SESSION MANAGEMENT & HUB LOAD
function loadTrainerSession() {
  const activeEmail = localStorage.getItem('slayer_active_user');
  if (!activeEmail) {
    showScreen('screen-login');
    return;
  }

  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  const user = users[activeEmail];

  if (user) {
    document.getElementById('hub-trainer-name').textContent = user.trainerName;
    document.getElementById('hub-trainer-lvl').textContent = `Level ${user.lvl}`;
    document.getElementById('hub-saved').textContent = `$${user.savedTotal.toFixed(2)}`;
    document.getElementById('hub-exp').textContent = `${user.xp} / 100`;
    
    const activeSprite = user.equippedSprite || user.baseSpriteIdle || 'assets/characters/hero-male-idle.gif';
    
    const hubImg = document.getElementById('hub-avatar-img');
    const battleImg = document.getElementById('battle-avatar-img');
    const shopImg = document.getElementById('shop-preview-img');

    if (hubImg && !activeSprite.startsWith('[')) hubImg.src = activeSprite;
    if (battleImg && !activeSprite.startsWith('[')) battleImg.src = activeSprite;
    if (shopImg && !activeSprite.startsWith('[')) shopImg.src = activeSprite;

    document.getElementById('settings-name').value = user.trainerName || '';
    document.getElementById('settings-wage').value = user.wage || 15.00;
    document.getElementById('settings-food').value = user.foodPrice || 7.50;
    document.getElementById('settings-event').value = user.eventPrice || 25.00;

    checkLockStatus(user);
    showScreen('screen-hub');
  }
}

function checkLockStatus(user) {
  const btn = document.getElementById('btn-engage-boss');
  if (user.vaultUnlockTime && user.vaultUnlockTime > Date.now()) {
    btn.textContent = "Cooldown Active";
    btn.style.opacity = "0.6";
  } else {
    btn.textContent = "Start Impulse Battle";
    btn.style.opacity = "1";
  }
}

function checkBossAvailability() {
  const activeEmail = localStorage.getItem('slayer_active_user');
  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  const user = users[activeEmail];

  if (user && user.vaultUnlockTime && user.vaultUnlockTime > Date.now()) {
    alert("Battles are temporarily paused during your 15-minute cooling period. Check your vault timer for details.");
    checkVaultDirect();
  } else {
    showScreen('screen-quest');
  }
}

// COMBAT SYSTEM
function startBattle() {
  const name = document.getElementById('target-name').value.trim();
  const price = parseFloat(document.getElementById('target-price').value);

  if (!name || isNaN(price) || price <= 0) return alert("Please enter a valid item name and price.");

  const activeEmail = localStorage.getItem('slayer_active_user');
  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  const user = users[activeEmail] || { trainerName: 'Hero', lvl: 1 };

  battleState.itemName = name;
  battleState.price = price;
  battleState.maxEnemyHP = price > 100 ? 150 : 100;
  battleState.enemyHP = battleState.maxEnemyHP;
  battleState.maxPlayerHP = 100;
  battleState.playerHP = 100;

  document.getElementById('enemy-name').textContent = price > 100 ? "Big Impulse Monster" : "Impulse Monster";
  document.getElementById('player-battle-name').textContent = user.trainerName;
  document.getElementById('player-battle-lvl').textContent = `Lv ${user.lvl}`;

  updateHPUI();
  setDialogue(`An impulse item appears! Choose your move to stay on track.`);
  
  showAttackMenu();
  showScreen('screen-battle');
}

function updateHPUI() {
  const enemyPct = Math.max(0, (battleState.enemyHP / battleState.maxEnemyHP) * 100);
  const playerPct = Math.max(0, (battleState.playerHP / battleState.maxPlayerHP) * 100);
  
  document.getElementById('enemy-hp').style.width = `${enemyPct}%`;
  document.getElementById('player-hp').style.width = `${playerPct}%`;
}

function setDialogue(msg) {
  document.getElementById('battle-text').textContent = msg;
}

function showAttackMenu() {
  const container = document.getElementById('quiz-answers');
  container.innerHTML = `
    <div class="attack-grid">
      <button class="attack-btn" onclick="executeAttack('logic')">Logic Slash<small>30-40 damage</small></button>
      <button class="attack-btn" onclick="executeAttack('delay')">Delay Strike<small>20 damage + Stun</small></button>
      <button class="attack-btn" onclick="executeAttack('heal')">Mindful Shield<small>Restore 25 HP</small></button>
      <button class="attack-btn flee" onclick="giveInAndSpend()">Give In & Buy<small>Resign and purchase</small></button>
    </div>
  `;
}

function executeAttack(type) {
  let playerMsg = "";
  let enemyStunned = false;

  if (type === 'logic') {
    const dmg = Math.floor(Math.random() * 15) + 30;
    battleState.enemyHP -= dmg;
    playerMsg = `You used Logic Slash! Dealt ${dmg} damage to the impulse.`;
  } else if (type === 'delay') {
    battleState.enemyHP -= 20;
    enemyStunned = true;
    playerMsg = `You used Delay Strike! Dealt 20 damage and stunned the target.`;
  } else if (type === 'heal') {
    battleState.playerHP = Math.min(100, battleState.playerHP + 25);
    playerMsg = `You used Mindful Shield and regained 25 HP.`;
  }

  updateHPUI();
  setDialogue(playerMsg);

  if (battleState.enemyHP <= 0) {
    setTimeout(victorySavedMoney, 1000);
  } else if (!enemyStunned) {
    setTimeout(enemyTurn, 1200);
  } else {
    setTimeout(() => setDialogue("The impulse is stunned! Pick your next action."), 1500);
  }
}

function enemyTurn() {
  const dmg = Math.floor(Math.random() * 15) + 12;
  battleState.playerHP -= dmg;
  updateHPUI();

  if (battleState.playerHP <= 0) {
    alert("You ran out of energy and decided to make the purchase.");
    giveInAndSpend();
  } else {
    setDialogue(`The impulse countered and dealt ${dmg} damage.`);
  }
}

// BATTLE OUTCOMES
function victorySavedMoney() {
  confetti({ particleCount: 80, spread: 70 });
  alert(`Great job! You beat the impulse and saved $${battleState.price.toFixed(2)}.`);

  const activeEmail = localStorage.getItem('slayer_active_user');
  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  
  if (users[activeEmail]) {
    const unlockTime = Date.now() + (15 * 60 * 1000);
    users[activeEmail].vaultUnlockTime = unlockTime;
    localStorage.setItem('slayer_users', JSON.stringify(users));
  }

  updateTrainerStats(50, battleState.price, {
    name: battleState.itemName,
    price: battleState.price,
    type: 'SAVED',
    date: new Date().toLocaleDateString()
  });

  checkVaultDirect();
}

function giveInAndSpend() {
  alert(`You purchased ${battleState.itemName} for $${battleState.price.toFixed(2)}.`);

  updateTrainerStats(10, 0, {
    name: battleState.itemName,
    price: battleState.price,
    type: 'SPENT',
    date: new Date().toLocaleDateString()
  });

  checkVaultDirect();
}

// SETTINGS & ACCOUNT ACTIONS
function updateTrainerName() {
  const activeEmail = localStorage.getItem('slayer_active_user');
  const newName = document.getElementById('settings-name').value.trim();
  if (!newName) return alert("Please enter a valid name.");

  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  if (users[activeEmail]) {
    users[activeEmail].trainerName = newName;
    localStorage.setItem('slayer_users', JSON.stringify(users));
    alert("Trainer name saved.");
    loadTrainerSession();
  }
}

function updateMetricsSettings() {
  const activeEmail = localStorage.getItem('slayer_active_user');
  const wage = parseFloat(document.getElementById('settings-wage').value);
  const food = parseFloat(document.getElementById('settings-food').value);
  const eventVal = parseFloat(document.getElementById('settings-event').value);

  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  if (users[activeEmail]) {
    users[activeEmail].wage = wage || 15.00;
    users[activeEmail].foodPrice = food || 7.50;
    users[activeEmail].eventPrice = eventVal || 25.00;
    localStorage.setItem('slayer_users', JSON.stringify(users));
    alert("Financial metrics saved.");
    loadTrainerSession();
  }
}

function deleteAccount() {
  if (confirm("Are you sure you want to delete your account? This will erase all your progress.")) {
    const activeEmail = localStorage.getItem('slayer_active_user');
    const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
    delete users[activeEmail];
    localStorage.setItem('slayer_users', JSON.stringify(users));
    localStorage.removeItem('slayer_active_user');
    alert("Account deleted.");
    showScreen('screen-login');
  }
}

function updateTrainerStats(xpGained, goldSaved, logEntry = null) {
  const activeEmail = localStorage.getItem('slayer_active_user');
  if (!activeEmail) return;

  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  const user = users[activeEmail];

  if (user) {
    user.xp += xpGained;
    user.savedTotal += goldSaved;

    if (!user.logs) user.logs = [];
    if (logEntry) user.logs.unshift(logEntry);

    if (user.xp >= 100) {
      user.lvl += 1;
      user.xp -= 100;
      alert(`Level Up! You reached Level ${user.lvl}.`);
    }

    localStorage.setItem('slayer_users', JSON.stringify(users));
    loadTrainerSession();
  }
}

function logoutTrainer() {
  localStorage.removeItem('slayer_active_user');
  showScreen('screen-login');
}

// VAULT LOGIC
function startVaultTimer(unlockTimestamp) {
  if (battleState.timerInterval) clearInterval(battleState.timerInterval);

  function updateDisplay() {
    const remaining = unlockTimestamp - Date.now();

    if (remaining <= 0) {
      clearInterval(battleState.timerInterval);
      document.getElementById('vault-timer').textContent = "Ready";
      
      const activeEmail = localStorage.getItem('slayer_active_user');
      const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
      if (users[activeEmail]) {
        users[activeEmail].vaultUnlockTime = null;
        localStorage.setItem('slayer_users', JSON.stringify(users));
        loadTrainerSession();
      }
      return;
    }

    const mins = Math.floor(remaining / (1000 * 60));
    const secs = Math.floor((remaining % (1000 * 60)) / 1000);

    document.getElementById('vault-timer').textContent = 
      `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  updateDisplay();
  battleState.timerInterval = setInterval(updateDisplay, 1000);
}

function checkVaultDirect() {
  const activeEmail = localStorage.getItem('slayer_active_user');
  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  const user = users[activeEmail];

  if (user && user.vaultUnlockTime && user.vaultUnlockTime > Date.now()) {
    startVaultTimer(user.vaultUnlockTime);
  } else {
    document.getElementById('vault-timer').textContent = "Ready";
  }

  renderHistoryLogs(user ? user.logs || [] : []);
  showScreen('screen-vault');
}

function renderHistoryLogs(logs) {
  const container = document.getElementById('history-list');
  container.innerHTML = '';

  if (!logs || logs.length === 0) {
    container.innerHTML = `<p class="empty-log">No transactions recorded yet.</p>`;
    return;
  }

  logs.forEach(item => {
    const div = document.createElement('div');
    const isSaved = item.type === 'SAVED';
    div.className = `log-item ${isSaved ? 'saved' : 'spent'}`;
    div.innerHTML = `
      <div>
        <div class="log-name">${item.name}</div>
        <div class="sub-text">${item.date}</div>
      </div>
      <div class="log-val ${isSaved ? 'saved' : 'spent'}">
        ${isSaved ? '+' : '-'}$${parseFloat(item.price).toFixed(2)}
      </div>
    `;
    container.appendChild(div);
  });
}

// SHOP SYSTEM
function openShop() {
  const activeEmail = localStorage.getItem('slayer_active_user');
  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  const user = users[activeEmail];

  if (!user) return;

  if (!user.inventory) user.inventory = ['hat_default'];
  if (!user.equippedSprite) user.equippedSprite = user.baseSpriteIdle || 'assets/characters/hero-male-idle.gif';

  document.getElementById('shop-gold-val').textContent = user.savedTotal.toFixed(2);
  
  const shopPreview = document.getElementById('shop-preview-img');
  if (shopPreview && !user.equippedSprite.startsWith('[')) {
    shopPreview.src = user.equippedSprite;
  }

  updateShopButtons(user);
  showScreen('screen-shop');
}

function updateShopButtons(user) {
  const items = ['hat_crown', 'hat_party', 'hat_sunglasses', 'hat_default'];

  items.forEach(itemId => {
    const btn = document.getElementById(`btn-${itemId}`);
    if (!btn) return;

    const isOwned = user.inventory.includes(itemId);
    const baseSprite = user.baseSpriteIdle || 'assets/characters/hero-male-idle.gif';
    const isEquipped = (itemId === 'hat_default' && user.equippedSprite === baseSprite) ||
                       (itemId === 'hat_crown' && user.equippedSprite === 'Crown') ||
                       (itemId === 'hat_party' && user.equippedSprite === 'Party Hat') ||
                       (itemId === 'hat_sunglasses' && user.equippedSprite === 'Glasses');

    if (isEquipped) {
      btn.textContent = "Equipped";
      btn.className = "btn btn-sm btn-equipped";
    } else if (isOwned) {
      btn.textContent = "Equip";
      btn.className = "btn btn-secondary btn-sm";
    } else {
      btn.textContent = "Unlock";
      btn.className = "btn btn-primary btn-sm";
    }
  });
}

function buyOrEquip(itemId, price, spriteName) {
  const activeEmail = localStorage.getItem('slayer_active_user');
  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  const user = users[activeEmail];

  if (!user) return;

  if (!user.inventory) user.inventory = ['hat_default'];

  const isOwned = user.inventory.includes(itemId);
  const targetSprite = spriteName === 'BASE' ? (user.baseSpriteIdle || 'assets/characters/hero-male-idle.gif') : spriteName;

  if (isOwned) {
    user.equippedSprite = targetSprite;
  } else {
    if (user.savedTotal < price) {
      alert("You need more saved money to unlock this item!");
      return;
    }
    user.savedTotal -= price;
    user.inventory.push(itemId);
    user.equippedSprite = targetSprite;
    alert("Item unlocked and equipped!");
  }

  localStorage.setItem('slayer_users', JSON.stringify(users));
  loadTrainerSession();
  openShop();
}

window.addEventListener('DOMContentLoaded', () => {
  loadTrainerSession();
});

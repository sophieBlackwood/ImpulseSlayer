let selectedSpriteTemp = '🧙‍♂️';

const battleState = {
  price: 0,
  itemName: '',
  enemyHP: 100,
  maxEnemyHP: 100,
  playerHP: 100,
  maxPlayerHP: 100,
  qIndex: 0,
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
    trainerName: name.toUpperCase(),
    wage: 15.00,
    foodPrice: 7.50,
    eventPrice: 25.00,
    baseSprite: '🧙‍♂️',
    sprite: '🧙‍♂️',
    equippedSprite: '🧙‍♂️',
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
    alert("Invalid email or password!");
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

// SPRITE SELECTION (MALE / FEMALE)
function selectSprite(spriteIcon, element) {
  selectedSpriteTemp = spriteIcon;
  document.querySelectorAll('.sprite-option').forEach(opt => opt.classList.remove('active'));
  element.classList.add('active');
}

function confirmSpriteSelection() {
  const activeEmail = localStorage.getItem('slayer_active_user');
  if (!activeEmail) return showScreen('screen-login');

  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  if (users[activeEmail]) {
    users[activeEmail].baseSprite = selectedSpriteTemp;
    users[activeEmail].sprite = selectedSpriteTemp;
    users[activeEmail].equippedSprite = selectedSpriteTemp;
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
    document.getElementById('hub-trainer-name').textContent = `TRAINER ${user.trainerName}`;
    document.getElementById('hub-trainer-lvl').textContent = `LVL ${user.lvl.toString().padStart(2, '0')}`;
    document.getElementById('hub-saved').textContent = `$${user.savedTotal.toFixed(2)}`;
    document.getElementById('hub-exp').textContent = `${user.xp} / 100`;
    
    const activeSprite = user.equippedSprite || user.baseSprite || user.sprite || '🧙‍♂️';
    document.getElementById('hub-avatar').textContent = activeSprite;
    document.getElementById('player-sprite').textContent = activeSprite;

    // Populate Settings Inputs
    document.getElementById('settings-name').value = user.trainerName || '';
    document.getElementById('settings-wage').value = user.wage || 15.00;
    document.getElementById('settings-food').value = user.foodPrice || 7.50;
    document.getElementById('settings-event').value = user.eventPrice || 25.00;

    // Check 15-minute Boss Lock Status
    checkLockStatus(user);

    showScreen('screen-hub');
  }
}

function checkLockStatus(user) {
  const btn = document.getElementById('btn-engage-boss');
  if (user.vaultUnlockTime && user.vaultUnlockTime > Date.now()) {
    btn.textContent = "🔒 BOSS LOCKED";
    btn.style.opacity = "0.6";
  } else {
    btn.textContent = "⚔️ ENGAGE BOSS";
    btn.style.opacity = "1";
  }
}

function checkBossAvailability() {
  const activeEmail = localStorage.getItem('slayer_active_user');
  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  const user = users[activeEmail];

  if (user && user.vaultUnlockTime && user.vaultUnlockTime > Date.now()) {
    alert("Boss fight is locked during your 15-minute cooling period! Check Vault for remaining time.");
    checkVaultDirect();
  } else {
    showScreen('screen-quest');
  }
}

// SETTINGS ACTIONS
function updateTrainerName() {
  const activeEmail = localStorage.getItem('slayer_active_user');
  const newName = document.getElementById('settings-name').value.trim().toUpperCase();
  if (!newName) return alert("ENTER A VALID NAME");

  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  if (users[activeEmail]) {
    users[activeEmail].trainerName = newName;
    localStorage.setItem('slayer_users', JSON.stringify(users));
    alert("Trainer Name Updated!");
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
    alert("Financial Metrics Updated!");
    loadTrainerSession();
  }
}

function deleteAccount() {
  if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
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
      alert(`LEVEL UP! You are now Level ${user.lvl}!`);
    }

    localStorage.setItem('slayer_users', JSON.stringify(users));
    loadTrainerSession();
  }
}

function logoutTrainer() {
  localStorage.removeItem('slayer_active_user');
  showScreen('screen-login');
}

// BATTLE ARENA & METRICS
function startBattle() {
  const name = document.getElementById('target-name').value.trim();
  const price = parseFloat(document.getElementById('target-price').value);

  if (!name || isNaN(price) || price <= 0) return alert("ENTER VALID ITEM DETAILS");

  const activeEmail = localStorage.getItem('slayer_active_user');
  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  const user = users[activeEmail] || { trainerName: 'RED', lvl: 1 };

  battleState.itemName = name;
  battleState.price = price;
  battleState.maxEnemyHP = price > 100 ? 150 : 100;
  battleState.enemyHP = battleState.maxEnemyHP;
  
  battleState.maxPlayerHP = 100;
  battleState.playerHP = 100;
  battleState.qIndex = 0;

  document.getElementById('enemy-name').textContent = price > 100 ? "OVERSPEND DRAGON" : "FOMO MONSTER";
  document.getElementById('enemy-sprite').textContent = price > 100 ? "🐉" : "👹";
  
  document.getElementById('player-battle-name').textContent = user.trainerName;
  document.getElementById('player-battle-lvl').textContent = `Lv${user.lvl}`;

  updateHPUI();
  setDialogue(`A wild impulse monster blocks your path!`);

  document.getElementById('battle-commands').classList.remove('hidden');
  document.getElementById('quiz-deck').classList.add('hidden');

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

function enemyCounterAttack() {
  if (battleState.enemyHP <= 0) return;

  const dmg = Math.floor(Math.random() * 15) + 10;
  battleState.playerHP -= dmg;
  updateHPUI();

  if (battleState.playerHP <= 0) {
    alert("YOUR WILLPOWER FAILED! You gave in to impulse.");
    updateTrainerStats(10, 0, {
      name: battleState.itemName,
      price: battleState.price,
      type: 'SPENT',
      date: new Date().toLocaleDateString()
    });
    showScreen('screen-hub');
  } else {
    setDialogue(`Monster attacked back! Took ${dmg} damage.`);
  }
}

function showMetrics() {
  const activeEmail = localStorage.getItem('slayer_active_user');
  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  const user = users[activeEmail] || { wage: 15, foodPrice: 7.5, eventPrice: 25 };

  const hours = (battleState.price / user.wage).toFixed(1);
  const foods = (battleState.price / user.foodPrice).toFixed(1);
  const events = (battleState.price / user.eventPrice).toFixed(1);

  setDialogue(`METRICS: ${hours}h work | ${foods} fav meals | ${events} fav events`);
}

function restTurn() {
  battleState.enemyHP -= 20;
  battleState.playerHP = Math.min(100, battleState.playerHP + 15);
  updateHPUI();
  setDialogue("You meditated. Restored 15 HP and weakened monster!");
  
  setTimeout(enemyCounterAttack, 1200);
  checkBattleEnd();
}

function runAway() {
  updateTrainerStats(25, battleState.price, {
    name: battleState.itemName,
    price: battleState.price,
    type: 'SAVED',
    date: new Date().toLocaleDateString()
  });
  alert(`YOU ESCAPED! Saved $${battleState.price.toFixed(2)}.`);
  showScreen('screen-hub');
}

// QUIZ SYSTEM
const questions = [
  { q: "WILL YOU USE THIS IN 30 DAYS?", opts: [{ t: "DEFINITELY USE IT", d: 40 }, { t: "PROBABLY NOT", d: 0 }] },
  { q: "IS THIS IN YOUR BUDGET?", opts: [{ t: "YES, SAVED UP", d: 40 }, { t: "NO, IMPULSE BUY", d: 0 }] }
];

function triggerQuiz() {
  document.getElementById('battle-commands').classList.add('hidden');
  document.getElementById('quiz-deck').classList.remove('hidden');
  loadQuizQuestion();
}

function loadQuizQuestion() {
  if (battleState.qIndex >= questions.length) return checkBattleEnd();

  const q = questions[battleState.qIndex];
  document.getElementById('quiz-q').textContent = q.q;

  const container = document.getElementById('quiz-answers');
  container.innerHTML = '';

  q.opts.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt.t;
    btn.onclick = () => {
      battleState.enemyHP -= opt.d;
      updateHPUI();
      battleState.qIndex++;

      if (battleState.enemyHP > 0) {
        enemyCounterAttack();
      }

      loadQuizQuestion();
    };
    container.appendChild(btn);
  });
}

function checkBattleEnd() {
  if (battleState.enemyHP <= 20) {
    confetti({ particleCount: 70, spread: 60 });

    const activeEmail = localStorage.getItem('slayer_active_user');
    const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
    
    if (users[activeEmail]) {
      const unlockTime = Date.now() + (15 * 60 * 1000);
      users[activeEmail].vaultUnlockTime = unlockTime;
      localStorage.setItem('slayer_users', JSON.stringify(users));
      startVaultTimer(unlockTime);
    }

    updateTrainerStats(50, battleState.price, {
      name: battleState.itemName,
      price: battleState.price,
      type: 'SAVED',
      date: new Date().toLocaleDateString()
    });

    showScreen('screen-vault');
  }
}

// VAULT & TIMER & HISTORY LOGS
function startVaultTimer(unlockTimestamp) {
  if (battleState.timerInterval) clearInterval(battleState.timerInterval);

  function updateDisplay() {
    const remaining = unlockTimestamp - Date.now();

    if (remaining <= 0) {
      clearInterval(battleState.timerInterval);
      document.getElementById('vault-timer').textContent = "UNLOCKED";
      
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
    document.getElementById('vault-timer').textContent = "READY";
  }

  renderHistoryLogs(user ? user.logs || [] : []);
  showScreen('screen-vault');
}

function renderHistoryLogs(logs) {
  const container = document.getElementById('history-list');
  container.innerHTML = '';

  if (!logs || logs.length === 0) {
    container.innerHTML = `<p class="empty-log">No transactions logged yet.</p>`;
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

// SHOP & WARDROBE SYSTEM
function openShop() {
  const activeEmail = localStorage.getItem('slayer_active_user');
  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  const user = users[activeEmail];

  if (!user) return;

  if (!user.inventory) user.inventory = ['hat_default'];
  if (!user.equippedSprite) user.equippedSprite = user.baseSprite || user.sprite || '🧙‍♂️';

  document.getElementById('shop-gold-val').textContent = user.savedTotal.toFixed(2);
  document.getElementById('shop-preview-avatar').textContent = user.equippedSprite;

  updateShopButtons(user);
  showScreen('screen-shop');
}

function updateShopButtons(user) {
  const items = ['hat_crown', 'hat_party', 'hat_sunglasses', 'hat_default'];

  items.forEach(itemId => {
    const btn = document.getElementById(`btn-${itemId}`);
    if (!btn) return;

    const isOwned = user.inventory.includes(itemId);
    const baseSprite = user.baseSprite || user.sprite || '🧙‍♂️';
    const isEquipped = (itemId === 'hat_default' && user.equippedSprite === baseSprite) ||
                       (itemId === 'hat_crown' && user.equippedSprite === '👑') ||
                       (itemId === 'hat_party' && user.equippedSprite === '🥳') ||
                       (itemId === 'hat_sunglasses' && user.equippedSprite === '😎');

    if (isEquipped) {
      btn.textContent = "EQUIPPED";
      btn.className = "btn btn-sm btn-equipped";
    } else if (isOwned) {
      btn.textContent = "EQUIP";
      btn.className = "btn btn-secondary btn-sm";
    } else {
      btn.textContent = "BUY";
      btn.className = "btn btn-primary btn-sm";
    }
  });
}

function buyOrEquip(itemId, price, spriteIcon) {
  const activeEmail = localStorage.getItem('slayer_active_user');
  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  const user = users[activeEmail];

  if (!user) return;

  if (!user.inventory) user.inventory = ['hat_default'];

  const isOwned = user.inventory.includes(itemId);
  const targetSprite = spriteIcon === 'BASE' ? (user.baseSprite || '🧙‍♂️') : spriteIcon;

  if (isOwned) {
    user.equippedSprite = targetSprite;
  } else {
    if (user.savedTotal < price) {
      alert("Not enough gold saved to buy this costume!");
      return;
    }
    user.savedTotal -= price;
    user.inventory.push(itemId);
    user.equippedSprite = targetSprite;
    alert("Unlocked & Equipped!");
  }

  localStorage.setItem('slayer_users', JSON.stringify(users));
  loadTrainerSession();
  openShop();
}

// INITIALIZE APP
window.addEventListener('DOMContentLoaded', () => {
  loadTrainerSession();
});

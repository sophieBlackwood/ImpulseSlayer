let selectedSpriteStaticTemp = 'assets/characters/hero-male.png';
let selectedSpriteIdleTemp = 'assets/characters/hero-male-idle.gif';

const battleState = {
  price: 0,
  itemName: '',
  category: 'general',
  enemyHP: 100,
  maxEnemyHP: 100,
  playerHP: 100,
  maxPlayerHP: 100,
  timerInterval: null,
  lastAnswer1: ''
};

// ==========================================
// 1. UI NAVIGATION & SCREEN MANAGEMENT
// ==========================================

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

// MULTI-ITEM AVATAR RENDERER
function renderCharacterAvatar(containerId, user) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const baseSprite = user.baseSpriteIdle || 'assets/characters/hero-male-idle.gif';
  const equippedList = user.equippedItems || [];

  let layersHTML = `<img src="${baseSprite}" alt="Base Hero" class="character-img base-layer" />`;

  equippedList.forEach(path => {
    if (path && path !== 'BASE') {
      layersHTML += `<img src="${path}" alt="Costume Layer" class="character-img costume-overlay-layer" />`;
    }
  });

  container.innerHTML = layersHTML;
}

// ==========================================
// 2. AUTHENTICATION & PROFILE SETUP
// ==========================================

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
    equippedItems: [],
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
    localStorage.setItem('slayer_users', JSON.stringify(users));
  }

  loadTrainerSession();
}

function loadTrainerSession() {
  const activeEmail = localStorage.getItem('slayer_active_user');
  if (!activeEmail) {
    showScreen('screen-login');
    return;
  }

  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  const user = users[activeEmail];

  if (user) {
    if (!Array.isArray(user.equippedItems)) {
      user.equippedItems = user.equippedSprite && user.equippedSprite !== 'BASE' 
        ? [user.equippedSprite] 
        : [];
    }

    document.getElementById('hub-trainer-name').textContent = user.trainerName;
    document.getElementById('hub-trainer-lvl').textContent = `Level ${user.lvl}`;
    document.getElementById('hub-saved').textContent = `$${user.savedTotal.toFixed(2)}`;
    document.getElementById('hub-exp').textContent = `${user.xp} / 100`;

    renderCharacterAvatar('hub-avatar', user);
    renderCharacterAvatar('player-sprite', user);
    renderCharacterAvatar('shop-preview-avatar', user);

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
    alert("Battles are temporarily paused during your cooling period. Check your vault timer!");
    checkVaultDirect();
  } else {
    showScreen('screen-quest');
  }
}

// ==========================================
// 3. COMBAT & DYNAMIC MONSTER SYSTEM
// ==========================================

function getMonsterData(itemName, price, category) {
  const lowerName = itemName.toLowerCase();

  // Price-based override for major purchases
  if (price >= 150) {
    return {
      name: "Buyer's Remorse Titan",
      sprite: "assets/monsters/monster-dragon-fomo.png"
    };
  }

  // Category & Keyword matching
  if (category === 'tech' || lowerName.includes('phone') || lowerName.includes('headphone') || lowerName.includes('gadget')) {
    return {
      name: "Upgrade Overlord",
      sprite: "assets/monsters/monster-beast-impulse.png"
    };
  } else if (category === 'fashion' || lowerName.includes('shoes') || lowerName.includes('shirt') || lowerName.includes('clothes')) {
    return {
      name: "Fast-Fashion Phantom",
      sprite: "assets/monsters/monster-phantom-subscription.png"
    };
  } else if (category === 'food' || lowerName.includes('snack') || lowerName.includes('coffee') || lowerName.includes('takeout')) {
    return {
      name: "Snack-Attack Slime",
      sprite: "assets/monsters/monster-gremlin-splurge.png"
    };
  } else if (category === 'sub' || lowerName.includes('subscription') || lowerName.includes('pass')) {
    return {
      name: "Recurring Subscription Imp",
      sprite: "assets/monsters/monster-phantom-subscription.png"
    };
  }

  // Fallback defaults by price tier
  if (price < 30) {
    return {
      name: "Splurge Gremlin",
      sprite: "assets/monsters/monster-gremlin-splurge.png"
    };
  }

  return {
    name: "FOMO Beast",
    sprite: "assets/monsters/monster-beast-impulse.png"
  };
}

function startBattle() {
  const name = document.getElementById('target-name').value.trim();
  const price = parseFloat(document.getElementById('target-price').value);
  const categorySelect = document.getElementById('target-category');
  const category = categorySelect ? categorySelect.value : 'general';

  if (!name || isNaN(price) || price <= 0) return alert("Please enter a valid item name and price.");

  const activeEmail = localStorage.getItem('slayer_active_user');
  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  const user = users[activeEmail] || { trainerName: 'Hero', lvl: 1 };

  battleState.itemName = name;
  battleState.price = price;
  battleState.category = category;
  battleState.maxEnemyHP = price > 100 ? 150 : 100;
  battleState.enemyHP = battleState.maxEnemyHP;
  battleState.maxPlayerHP = 100;
  battleState.playerHP = 100;

  // Retrieve dynamic monster based on item attributes
  const monster = getMonsterData(name, price, category);
  const enemySpriteContainer = document.getElementById('enemy-sprite');

  document.getElementById('enemy-name').textContent = monster.name;
  enemySpriteContainer.innerHTML = `<img src="${monster.sprite}" alt="${monster.name}" class="character-img" />`;

  document.getElementById('player-battle-name').textContent = user.trainerName;
  document.getElementById('player-battle-lvl').textContent = `Lv ${user.lvl}`;

  updateHPUI();
  setDialogue(`A wild ${monster.name} appears! Choose a reflection tactic to fight back.`);
  
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
      <button class="attack-btn" onclick="startQuestionFlow('necessity')">
        Necessity Check<small>Evaluate need vs. want</small>
      </button>
      <button class="attack-btn" onclick="startQuestionFlow('utility')">
        Utility Rate<small>Calculate cost-per-use</small>
      </button>
      <button class="attack-btn" onclick="startQuestionFlow('wait')">
        Opportunity Cost<small>Explore alternative uses</small>
      </button>
      <button class="attack-btn flee" onclick="giveInAndSpend()">
        Give In & Buy<small>Resign and purchase</small>
      </button>
    </div>
  `;
}

function startQuestionFlow(attackType) {
  const container = document.getElementById('quiz-answers');

  if (attackType === 'necessity') {
    setDialogue("Question 1/2: Why do you want this item right now?");
    container.innerHTML = `
      <div class="input-field">
        <input type="text" id="user-reflection-1" placeholder="e.g., I saw an ad and it looks cool..." autofocus />
      </div>
      <button class="btn btn-primary" onclick="submitQuestionTwo('${attackType}')">Next Question</button>
    `;
  } else if (attackType === 'utility') {
    setDialogue("Question 1/2: How many times do you realistically expect to use this?");
    container.innerHTML = `
      <div class="input-field">
        <input type="number" id="user-reflection-1" placeholder="e.g., 5" autofocus />
      </div>
      <button class="btn btn-primary" onclick="submitQuestionTwo('${attackType}')">Next Question</button>
    `;
  } else if (attackType === 'wait') {
    setDialogue("Question 1/2: What else could you do with this money instead?");
    container.innerHTML = `
      <div class="input-field">
        <input type="text" id="user-reflection-1" placeholder="e.g., Save for vacation or gifts..." autofocus />
      </div>
      <button class="btn btn-primary" onclick="submitQuestionTwo('${attackType}')">Next Question</button>
    `;
  }
}

function submitQuestionTwo(attackType) {
  const ans1 = document.getElementById('user-reflection-1').value.trim();
  if (!ans1) return alert("Please type an answer first!");

  battleState.lastAnswer1 = ans1;
  const container = document.getElementById('quiz-answers');

  if (attackType === 'necessity') {
    setDialogue("Question 2/2: Will you still care about owning this 30 days from now?");
  } else if (attackType === 'utility') {
    setDialogue("Question 2/2: On a scale of 1 to 10, how much will this improve your daily life?");
  } else {
    setDialogue("Question 2/2: On a scale of 1 to 10, how strong is the urge right now?");
  }

  container.innerHTML = `
    <div class="input-field">
      <input type="text" id="user-reflection-2" placeholder="Your answer..." autofocus />
    </div>
    <button class="btn btn-primary" onclick="processPlayerAttack('${attackType}')">Submit Reflection</button>
  `;
}

function processPlayerAttack(attackType) {
  const ans2 = document.getElementById('user-reflection-2').value.trim();
  if (!ans2) return alert("Please enter an answer!");

  const dmg = Math.floor(Math.random() * 15) + 35;
  battleState.enemyHP -= dmg;
  updateHPUI();

  setDialogue(`Your mindful reflection hit the impulse for ${dmg} damage!`);

  if (battleState.enemyHP <= 0) {
    setTimeout(victorySavedMoney, 1200);
  } else {
    setTimeout(() => monsterRealityCounter(attackType), 1500);
  }
}

function monsterRealityCounter(attackType) {
  const activeEmail = localStorage.getItem('slayer_active_user');
  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  const user = users[activeEmail] || { wage: 15.00, foodPrice: 7.50, eventPrice: 25.00 };

  const price = battleState.price;

  const hoursWorked = (price / (user.wage || 15)).toFixed(1);
  const mealsCount = Math.floor(price / (user.foodPrice || 7.50));
  const outingsCount = (price / (user.eventPrice || 25)).toFixed(1);

  const counterAttacks = [
    `The Monster strikes back! "This costs $${price.toFixed(2)}—that is ${hoursWorked} hours of work at your wage!"`,
    `The Monster counters! "That $${price.toFixed(2)} equals ${mealsCount} full meals you could buy!"`,
    `The Monster resists! "This purchase equals ${outingsCount} fun social outings with friends!"`
  ];

  const chosenCounter = counterAttacks[Math.floor(Math.random() * counterAttacks.length)];

  const playerDmg = Math.floor(Math.random() * 10) + 15;
  battleState.playerHP -= playerDmg;
  updateHPUI();

  setDialogue(chosenCounter);

  if (battleState.playerHP <= 0) {
    setTimeout(() => {
      alert("You were overwhelmed by the purchase impulse!");
      giveInAndSpend();
    }, 1500);
  } else {
    setTimeout(showAttackMenu, 2500);
  }
}

// BATTLE OUTCOMES
function victorySavedMoney() {
  if (typeof confetti === 'function') {
    confetti({ particleCount: 80, spread: 70 });
  }
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

// ==========================================
// 4. SETTINGS & ACCOUNT ACTIONS
// ==========================================

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

// ==========================================
// 5. VAULT & HISTORY LOGS
// ==========================================

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

// ==========================================
// 6. SHOP & MULTI-EQUIP SYSTEM
// ==========================================

function openShop() {
  const activeEmail = localStorage.getItem('slayer_active_user');
  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  const user = users[activeEmail];

  if (!user) return;

  if (!user.inventory) user.inventory = ['hat_default'];
  if (!Array.isArray(user.equippedItems)) user.equippedItems = [];

  document.getElementById('shop-gold-val').textContent = user.savedTotal.toFixed(2);
  renderCharacterAvatar('shop-preview-avatar', user);

  updateShopButtons(user);
  showScreen('screen-shop');
}

function updateShopButtons(user) {
  const items = [
    'hat_crown', 'hat_wizard', 'hat_ninja', 'hat_party', 'hat_helmet',
    'face_sunglasses', 'face_eyepatch', 'face_visor',
    'item_sword', 'item_staff', 'item_shield', 'item_laser',
    'hat_default'
  ];

  const itemPathMap = {
    'hat_crown': 'assets/costumes/overlay-crown.png',
    'hat_wizard': 'assets/costumes/overlay-wizard-hat.png',
    'hat_ninja': 'assets/costumes/overlay-ninja-headband.png',
    'hat_party': 'assets/costumes/overlay-party-hat.png',
    'hat_helmet': 'assets/costumes/overlay-helmet.png',
    'face_sunglasses': 'assets/costumes/overlay-sunglasses.png',
    'face_eyepatch': 'assets/costumes/overlay-eyepatch.png',
    'face_visor': 'assets/costumes/overlay-visor.png',
    'item_sword': 'assets/costumes/overlay-wooden-sword.png',
    'item_staff': 'assets/costumes/overlay-magic-staff.png',
    'item_shield': 'assets/costumes/overlay-shield.png',
    'item_laser': 'assets/costumes/overlay-laser-blaster.png'
  };

  const equipped = user.equippedItems || [];

  items.forEach(itemId => {
    const btn = document.getElementById(`btn-${itemId}`);
    if (!btn) return;

    if (itemId === 'hat_default') {
      btn.textContent = equipped.length === 0 ? "Equipped" : "Unequip All";
      btn.className = equipped.length === 0 ? "btn btn-sm btn-equipped" : "btn btn-secondary btn-sm";
      return;
    }

    const isOwned = user.inventory.includes(itemId);
    const targetPath = itemPathMap[itemId];
    const isEquipped = equipped.includes(targetPath);

    if (isEquipped) {
      btn.textContent = "Unequip";
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

function buyOrEquip(itemId, price, spritePath) {
  const activeEmail = localStorage.getItem('slayer_active_user');
  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  const user = users[activeEmail];

  if (!user) return;

  if (!user.inventory) user.inventory = ['hat_default'];
  if (!Array.isArray(user.equippedItems)) user.equippedItems = [];

  if (itemId === 'hat_default') {
    user.equippedItems = [];
    localStorage.setItem('slayer_users', JSON.stringify(users));
    loadTrainerSession();
    openShop();
    return;
  }

  const isOwned = user.inventory.includes(itemId);

  if (isOwned) {
    const index = user.equippedItems.indexOf(spritePath);
    if (index > -1) {
      user.equippedItems.splice(index, 1);
    } else {
      user.equippedItems.push(spritePath);
    }
  } else {
    if (user.savedTotal < price) {
      alert("You need more saved money to unlock this item!");
      return;
    }
    user.savedTotal -= price;
    user.inventory.push(itemId);
    user.equippedItems.push(spritePath);
    alert("Item unlocked and equipped!");
  }

  localStorage.setItem('slayer_users', JSON.stringify(users));
  loadTrainerSession();
  openShop();
}

window.addEventListener('DOMContentLoaded', () => {
  loadTrainerSession();
});

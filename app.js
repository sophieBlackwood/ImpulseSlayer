// ==========================================
// 1. GLOBAL STATE & CONSTANTS
// ==========================================

let currentUser = null;

const battleState = {
  itemName: '',
  price: 0,
  category: 'general',
  maxEnemyHP: 100,
  enemyHP: 100,
  maxPlayerHP: 100,
  playerHP: 100,
  monsterName: 'Impulse Beast',
  isProcessing: false
};

const DEFAULT_USER_PROFILE = {
  email: '',
  trainer_name: 'Trainer',
  lvl: 1,
  xp: 0,
  saved_total: 0,
  wage: 15.00,
  food_price: 7.50,
  event_price: 25.00,
  equipped_items: [],
  inventory: ['hat_default'],
  logs: [],
  vault_unlock_time: 0
};

const ITEM_MANIFEST = {
  hat_wizard: { path: 'assets/items/wizard-hat.png', slot: 'head', price: 50.00 },
  hat_crown: { path: 'assets/items/crown.png', slot: 'head', price: 150.00 },
  shield_gold: { path: 'assets/items/gold-shield.png', slot: 'offhand', price: 100.00 },
  aura_sparkle: { path: 'assets/items/sparkle-aura.png', slot: 'effect', price: 200.00 }
};

const CATEGORY_BACKGROUNDS = {
  tech: ['assets/bg/tech-1.jpg', 'assets/bg/tech-2.jpg'],
  fashion: ['assets/bg/fashion-1.jpg'],
  food: ['assets/bg/food-1.jpg'],
  general: ['assets/bg/general-1.jpg']
};

const QUESTION_POOLS = {
  necessity: [
    "Will you still use or value this item 30 days from now?",
    "Do you already own something that fulfills this same exact purpose?",
    "Is this purchase solving a genuine problem or fulfilling an impulse?"
  ],
  utility: [
    "How many times per week do you realistically plan to use this?",
    "What is the cost-per-use if you keep this for six months?",
    "Would renting or borrowing this make more financial sense?"
  ],
  wait: [
    "If you put this money into a high-yield savings account, what could it grow into?",
    "What major goal are you delaying by spending this money today?",
    "Could this money be better spent on an experience or long-term investment?"
  ],
  heal: [
    "Take a deep breath. Why are you tempted to buy this right now?",
    "How will you feel tomorrow if you walk away without buying this today?"
  ]
};

// ==========================================
// 2. CORE UTILITIES & UI NAVIGATION
// ==========================================

function showScreen(screenId) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(s => s.classList.remove('active'));

  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
  }
}

function showNotification(message, type = "info") {
  const container = document.getElementById('notification-container') || document.body;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

function enforceMoneyLimit(inputElement) {
  let val = parseFloat(inputElement.value);
  if (val > 5000) {
    inputElement.value = "5000.00";
    showNotification("Maximum value allowed is $5,000.00", "error");
  }
}

function saveUserData() {
  if (!currentUser || !currentUser.email) return;
  localStorage.setItem(`user_${currentUser.email}`, JSON.stringify(currentUser));
  localStorage.setItem('session_user', currentUser.email);
}

function loadTrainerSession() {
  const activeEmail = localStorage.getItem('session_user');
  if (!activeEmail) return showScreen('screen-login');

  const savedData = localStorage.getItem(`user_${activeEmail}`);
  if (savedData) {
    currentUser = JSON.parse(savedData);
    updateDashboardUI();
    showScreen('screen-dashboard');
  } else {
    showScreen('screen-login');
  }
}

function updateDashboardUI() {
  if (!currentUser) return;

  const nameEl = document.getElementById('dash-trainer-name');
  const lvlEl = document.getElementById('dash-trainer-lvl');
  const xpEl = document.getElementById('dash-trainer-xp');
  const savedEl = document.getElementById('dash-saved-total');

  if (nameEl) nameEl.textContent = currentUser.trainer_name;
  if (lvlEl) lvlEl.textContent = `Lv. ${currentUser.lvl}`;
  if (xpEl) xpEl.textContent = `${currentUser.xp}/100 XP`;
  if (savedEl) savedEl.textContent = `$${parseFloat(currentUser.saved_total || 0).toFixed(2)}`;

  renderCharacterAvatar('dashboard-avatar', currentUser);
}

function renderCharacterAvatar(containerId, user) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const items = user?.equipped_items || [];
  let layersHtml = `<img src="assets/avatar/base-hero.png" class="avatar-layer base" alt="Base Hero" />`;

  items.forEach(itemPath => {
    layersHtml += `<img src="${itemPath}" class="avatar-layer gear" alt="Equipped Gear" />`;
  });

  container.innerHTML = `<div class="avatar-wrapper">${layersHtml}</div>`;
}

function syncAllAnimations() {
  const avatars = document.querySelectorAll('.avatar-wrapper');
  avatars.forEach(wrapper => {
    wrapper.classList.remove('pulse');
    void wrapper.offsetWidth;
    wrapper.classList.add('pulse');
  });
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('form-login');
  const signupForm = document.getElementById('form-signup');
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');

  if (tab === 'login') {
    if (loginForm) loginForm.style.display = 'block';
    if (signupForm) signupForm.style.display = 'none';
    if (tabLogin) tabLogin.classList.add('active');
    if (tabSignup) tabSignup.classList.remove('active');
  } else {
    if (loginForm) loginForm.style.display = 'none';
    if (signupForm) signupForm.style.display = 'block';
    if (tabLogin) tabLogin.classList.remove('active');
    if (tabSignup) tabSignup.classList.add('active');
  }
}

// ==========================================
// 3. AUTHENTICATION & PROFILE SETUP
// ==========================================

function handleLocalSignup(e) {
  e.preventDefault();
  const emailInput = document.getElementById('signup-email');
  const nameInput = document.getElementById('signup-name');
  const passInput = document.getElementById('signup-password');

  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const name = nameInput ? nameInput.value.trim() : 'Trainer';
  const password = passInput ? passInput.value : '';

  if (!email || !password) {
    return showNotification("Please enter an email and password.", "error");
  }

  if (localStorage.getItem(`user_${email}`)) {
    return showNotification("An account with this email already exists.", "error");
  }

  currentUser = {
    ...DEFAULT_USER_PROFILE,
    email: email,
    trainer_name: name,
    password: password
  };

  saveUserData();
  showNotification("Account created! Let's set up your metrics.", "success");
  showScreen('screen-survey');
}

function handleLocalLogin(e) {
  e.preventDefault();
  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-password');

  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const password = passInput ? passInput.value : '';

  const record = localStorage.getItem(`user_${email}`);
  if (!record) {
    return showNotification("Account not found. Please sign up.", "error");
  }

  const parsed = JSON.parse(record);
  if (parsed.password !== password) {
    return showNotification("Incorrect password.", "error");
  }

  currentUser = parsed;
  localStorage.setItem('session_user', currentUser.email);
  showNotification("Welcome back!", "success");
  updateDashboardUI();
  showScreen('screen-dashboard');
}

function saveFinancialProfile(e) {
  e.preventDefault();
  if (!currentUser) return showScreen('screen-login');

  const wage = parseFloat(document.getElementById('survey-wage')?.value) || 15.00;
  const food = parseFloat(document.getElementById('survey-food')?.value) || 7.50;
  const eventVal = parseFloat(document.getElementById('survey-event')?.value) || 25.00;

  currentUser.wage = wage;
  currentUser.food_price = food;
  currentUser.event_price = eventVal;

  saveUserData();
  showNotification("Financial baseline saved!", "success");
  updateDashboardUI();
  showScreen('screen-dashboard');
}

// ==========================================
// 4. COMBAT PREPARATION & QUEST AVAILABILITY
// ==========================================

function checkBossAvailability() {
  if (!currentUser) return showScreen('screen-login');

  if (currentUser.vault_unlock_time && currentUser.vault_unlock_time > Date.now()) {
    showNotification("Battles are temporarily paused during your cooling period.", "error");
    checkVaultDirect();
  } else {
    showScreen('screen-quest');
  }
}

function getPlayerMaxHP() {
  if (!currentUser) return 100;
  const level = currentUser.lvl || 1;
  return 100 + ((level - 1) * 20);
}

function setBattleBackgroundByCategory(category) {
  const battleStage = document.getElementById('battle-stage') || document.querySelector('.battle-arena') || document.getElementById('screen-battle');
  if (!battleStage) return;

  const bgList = CATEGORY_BACKGROUNDS[category] || CATEGORY_BACKGROUNDS.general;
  const randomIndex = Math.floor(Math.random() * bgList.length);
  const selectedBg = bgList[randomIndex];

  battleStage.style.backgroundImage = `url('${selectedBg}')`;
  battleStage.style.backgroundSize = 'cover';
  battleStage.style.backgroundPosition = 'center';
  battleStage.style.backgroundRepeat = 'no-repeat';
}

function getRandomMonsterAttack() {
  const wage = currentUser?.wage > 0 ? currentUser.wage : 15.00;
  const foodPrice = currentUser?.food_price > 0 ? currentUser.food_price : 7.50;
  const eventPrice = currentUser?.event_price > 0 ? currentUser.event_price : 25.00;

  const price = battleState.price || 20.00;
  const itemName = battleState.itemName || "this item";

  const hoursWorked = (price / wage).toFixed(1);
  const snacksEquivalent = Math.round(price / foodPrice);
  const eventsEquivalent = (price / eventPrice).toFixed(1);

  const attacks = [
    {
      name: "Wage Dagger",
      taunt: `"${itemName} isn't just $${price.toFixed(2)}—that costs you ${hoursWorked} hours of work!"`,
      damage: 18
    },
    {
      name: "Snack Blast",
      taunt: `"Buying ${itemName} equals giving up ${snacksEquivalent} meals!"`,
      damage: 15
    },
    {
      name: "Event Slasher",
      taunt: `"Is it worth trading ${eventsEquivalent} outings for ${itemName}?"`,
      damage: 22
    }
  ];

  return attacks[Math.floor(Math.random() * attacks.length)];
}

function getMonsterData(itemName, price, category) {
  const lowerName = itemName.toLowerCase();

  if (price >= 150) {
    return { name: "Buyer's Remorse Titan", sprite: "assets/monsters/buyers-remorse-titan-idle.gif" };
  }
  if (category === 'tech' || lowerName.includes('phone')) {
    return { name: "Upgrade Overlord", sprite: "assets/monsters/upgrade-overlord-idle.gif" };
  } else if (category === 'fashion' || lowerName.includes('shoes')) {
    return { name: "Fast-Fashion Phantom", sprite: "assets/monsters/fast-fashion-phantom-idle.gif" };
  } else if (category === 'food' || lowerName.includes('snack')) {
    return { name: "Snack-Attack Slime", sprite: "assets/monsters/sneak-attack-slime-idle.gif" };
  }

  return price < 30
    ? { name: "Splurge Gremlin", sprite: "assets/monsters/splurge-gremlin-idle.gif" }
    : { name: "FOMO Beast", sprite: "assets/monsters/fomo-beast-idle.gif" };
}

function calculateMonsterHP(price) {
  if (price < 30) return 150;
  if (price < 150) return 250;
  return Math.min(300 + Math.floor((price - 150) * 0.25), 1000);
}

// ==========================================
// 5. COMBAT EXECUTION & FLOW
// ==========================================

function startBattle() {
  const nameInput = document.getElementById('target-name');
  const priceInput = document.getElementById('target-price');
  if (!nameInput || !priceInput) return;

  const name = nameInput.value.trim().slice(0, 30);
  const price = parseFloat(priceInput.value);
  const categorySelect = document.getElementById('target-category');
  const category = categorySelect ? categorySelect.value : 'general';

  if (!name || isNaN(price) || price <= 0) {
    return showNotification("Please enter a valid item name and price.", "error");
  }

  if (price > 5000) {
    return showNotification("Item price cannot exceed $5,000.00.", "error");
  }

  const monsterHP = calculateMonsterHP(price);

  battleState.itemName = name;
  battleState.price = price;
  battleState.category = category;
  battleState.maxEnemyHP = monsterHP;
  battleState.enemyHP = monsterHP;

  const maxHP = getPlayerMaxHP();
  battleState.maxPlayerHP = maxHP;
  battleState.playerHP = maxHP;
  battleState.isProcessing = false;

  const monster = getMonsterData(name, price, category);
  battleState.monsterName = monster.name;

  const enemyContainer = document.getElementById('enemy-sprite');
  const enemyNameEl = document.getElementById('enemy-name');
  if (enemyNameEl) enemyNameEl.textContent = monster.name;
  if (enemyContainer) {
    enemyContainer.innerHTML = `<img src="${monster.sprite}?sync=${Date.now()}" alt="${monster.name}" class="character-img" />`;
  }

  const playerNameEl = document.getElementById('player-battle-name');
  const playerLvlEl = document.getElementById('player-battle-lvl');
  if (playerNameEl) playerNameEl.textContent = currentUser ? currentUser.trainer_name : 'Hero';
  if (playerLvlEl) playerLvlEl.textContent = `Lv ${currentUser ? currentUser.lvl : 1}`;

  renderCharacterAvatar('player-sprite', currentUser);

  setBattleBackgroundByCategory(category);
  updateHPUI();
  setDialogue(`A powerful ${monster.name} appears with ${monsterHP} HP!`);

  showAttackMenu();
  showScreen('screen-battle');
}

function updateHPUI() {
  const enemyPct = Math.max(0, (battleState.enemyHP / battleState.maxEnemyHP) * 100);
  const playerPct = Math.max(0, (battleState.playerHP / battleState.maxPlayerHP) * 100);

  const enemyBar = document.getElementById('enemy-hp');
  const playerBar = document.getElementById('player-hp');

  if (enemyBar) enemyBar.style.width = `${enemyPct}%`;
  if (playerBar) playerBar.style.width = `${playerPct}%`;
}

function setDialogue(msg) {
  const dialogueBox = document.getElementById('battle-text');
  if (dialogueBox) dialogueBox.textContent = msg;
}

function showAttackMenu() {
  const container = document.getElementById('quiz-answers');
  if (!container) return;

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
      <button class="attack-btn" onclick="startQuestionFlow('heal')">
        Mindful Rest<small>+25 HP Heal & +20 DMG</small>
      </button>
      <button class="attack-btn flee" onclick="giveInAndSpend()">
        Give In & Buy<small>Resign and purchase</small>
      </button>
    </div>
  `;
}

function startQuestionFlow(attackType) {
  const container = document.getElementById('quiz-answers');
  if (!container) return;

  const pool = QUESTION_POOLS[attackType];

  if (pool && pool.length > 0) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    const selectedQuestion = pool[randomIndex];
    setDialogue(`Reflection Question: ${selectedQuestion}`);
  }

  const isHeal = attackType === 'heal';

  container.innerHTML = `
    <div class="input-field">
      <input type="text" id="user-reflection" placeholder="Type your reflection answer (max 80 chars)..." maxlength="80" autofocus />
    </div>
    <button id="btn-submit-reflection" class="btn btn-primary" onclick="processPlayerAttack('${attackType}')">
      ${isHeal ? 'Rest & Strike' : 'Submit Strike'}
    </button>
  `;
}

function processPlayerAttack(attackType) {
  if (battleState.isProcessing) return;

  const answerInput = document.getElementById('user-reflection');
  const ans = answerInput ? answerInput.value.trim().slice(0, 80) : '';

  if (!ans) return showNotification("Please type a reflection answer first!", "error");

  battleState.isProcessing = true;
  const submitBtn = document.getElementById('btn-submit-reflection');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.6';
    submitBtn.textContent = 'Striking...';
  }

  let damageDealt = 50;
  let healMsg = '';

  if (attackType === 'heal') {
    damageDealt = 20;
    const healedHP = Math.min(25, battleState.maxPlayerHP - battleState.playerHP);
    battleState.playerHP = Math.min(battleState.maxPlayerHP, battleState.playerHP + 25);
    healMsg = ` Restored +${healedHP} HP!`;
  }

  battleState.enemyHP = Math.max(0, battleState.enemyHP - damageDealt);
  updateHPUI();

  if (battleState.enemyHP <= 0) {
    setDialogue(`FINAL STRIKE! Your reflection landed the finishing blow on ${battleState.monsterName}!`);
    setTimeout(victorySavedMoney, 1200);
  } else {
    setDialogue(`You dealt ${damageDealt} DMG to ${battleState.monsterName}!${healMsg}`);

    setTimeout(() => {
      let chosenAttack = getRandomMonsterAttack();

      battleState.playerHP = Math.max(0, battleState.playerHP - chosenAttack.damage);
      setDialogue(`${battleState.monsterName} used ${chosenAttack.name}! ${chosenAttack.taunt} (-${chosenAttack.damage} HP)`);
      updateHPUI();

      setTimeout(() => {
        if (battleState.playerHP <= 0) {
          setDialogue(`${battleState.monsterName} overwhelmed your resolve! You gave in to the impulse.`);
          setTimeout(giveInAndSpend, 1500);
        } else {
          battleState.isProcessing = false;
          showAttackMenu();
        }
      }, 1500);
    }, 1500);
  }
}

function victorySavedMoney() {
  if (typeof confetti === 'function') confetti({ particleCount: 80, spread: 70 });
  showNotification(`Victory! You defeated ${battleState.monsterName} and saved $${battleState.price.toFixed(2)}.`, "success");

  if (currentUser) {
    currentUser.vault_unlock_time = Date.now() + (15 * 60 * 1000);
  }

  updateTrainerStats(75, battleState.price, {
    name: battleState.itemName,
    price: battleState.price,
    type: 'SAVED',
    date: new Date().toLocaleDateString()
  });

  setTimeout(() => {
    checkVaultDirect();
  }, 500);
}

function giveInAndSpend() {
  showNotification(`You purchased ${battleState.itemName} for $${battleState.price.toFixed(2)}.`, "info");

  updateTrainerStats(10, 0, {
    name: battleState.itemName,
    price: battleState.price,
    type: 'SPENT',
    date: new Date().toLocaleDateString()
  });

  checkVaultDirect();
}

// ==========================================
// 6. VAULT, LOGS & ACCOUNT MANAGEMENT
// ==========================================

function checkVaultDirect() {
  if (!currentUser) return showScreen('screen-login');

  if (currentUser.vault_unlock_time && currentUser.vault_unlock_time > Date.now()) {
    const remainingMins = Math.ceil((currentUser.vault_unlock_time - Date.now()) / (1000 * 60));
    const vaultEl = document.getElementById('vault-timer');
    if (vaultEl) vaultEl.textContent = `Cooldown: ${remainingMins}m`;
  } else {
    const vaultEl = document.getElementById('vault-timer');
    if (vaultEl) vaultEl.textContent = "Ready";
  }

  renderHistoryLogs(currentUser.logs || []);
  showScreen('screen-vault');
}

function renderHistoryLogs(logs) {
  const container = document.getElementById('history-list');
  if (!container) return;
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

function updateTrainerName() {
  const nameInput = document.getElementById('settings-name');
  const newName = nameInput ? nameInput.value.trim().slice(0, 20) : '';

  if (!newName) return showNotification("Please enter a valid name.", "error");

  if (currentUser) {
    currentUser.trainer_name = newName;
    saveUserData();
    showNotification("Trainer name updated.", "success");
    loadTrainerSession();
  }
}

function updateMetricsSettings() {
  const wage = parseFloat(document.getElementById('settings-wage')?.value);
  const food = parseFloat(document.getElementById('settings-food')?.value);
  const eventVal = parseFloat(document.getElementById('settings-event')?.value);

  if (wage > 5000 || food > 5000 || eventVal > 5000) {
    showNotification("Settings amounts cannot exceed $5,000.", "error");
    return;
  }

  if (currentUser) {
    currentUser.wage = wage || DEFAULT_USER_PROFILE.wage;
    currentUser.food_price = food || DEFAULT_USER_PROFILE.food_price;
    currentUser.event_price = eventVal || DEFAULT_USER_PROFILE.event_price;

    saveUserData();
    showNotification("Financial metrics saved.", "success");
    loadTrainerSession();
  }
}

function deleteAccount() {
  const existingModal = document.getElementById('delete-modal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'delete-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Delete Account?</h3>
      <p>Are you sure you want to delete your account? All progress will be lost permanently.</p>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeDeleteModal()">Cancel</button>
        <button class="btn btn-danger" onclick="confirmDeleteAccount()">Delete</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function closeDeleteModal() {
  const modal = document.getElementById('delete-modal');
  if (modal) modal.remove();
}

function confirmDeleteAccount() {
  closeDeleteModal();
  if (currentUser) {
    localStorage.removeItem(`user_${currentUser.email}`);
    localStorage.removeItem('session_user');
    currentUser = null;
    showNotification("Account successfully deleted.", "info");
    showScreen('screen-login');
  }
}

function updateTrainerStats(xpGained, goldSaved, logEntry = null) {
  if (!currentUser) return;

  let newXp = (currentUser.xp || 0) + xpGained;
  let newLvl = currentUser.lvl || 1;
  let newSaved = parseFloat(currentUser.saved_total || 0) + goldSaved;
  let newLogs = currentUser.logs || [];

  if (logEntry) newLogs.unshift(logEntry);

  if (newXp >= 100) {
    newLvl += 1;
    newXp -= 100;
    showNotification(`Level Up! You reached Level ${newLvl}.`, "success");
  }

  currentUser.xp = newXp;
  currentUser.lvl = newLvl;
  currentUser.saved_total = newSaved;
  currentUser.logs = newLogs;

  saveUserData();
  loadTrainerSession();
}

function logoutTrainer() {
  localStorage.removeItem('session_user');
  currentUser = null;
  showScreen('screen-login');
}

// ==========================================
// 7. SHOP & EQUIP SYSTEM
// ==========================================

function openShop() {
  if (!currentUser) return showScreen('screen-login');

  const goldVal = document.getElementById('shop-gold-val');
  if (goldVal) {
    goldVal.textContent = parseFloat(currentUser.saved_total || 0).toFixed(2);
  }

  renderCharacterAvatar('shop-preview-avatar', currentUser);
  updateShopButtons(currentUser);
  showScreen('screen-shop');
}

function updateShopButtons(user) {
  const allItemIds = Object.keys(ITEM_MANIFEST).concat(['hat_default']);
  const equipped = user.equipped_items || [];
  const inventory = user.inventory || ['hat_default'];

  allItemIds.forEach(itemId => {
    const btn = document.getElementById(`btn-${itemId}`);
    if (!btn) return;

    if (itemId === 'hat_default') {
      btn.textContent = equipped.length === 0 ? "Equipped" : "Unequip All";
      btn.className = equipped.length === 0 ? "btn btn-sm btn-equipped" : "btn btn-secondary btn-sm";
      return;
    }

    const itemData = ITEM_MANIFEST[itemId];
    if (!itemData) return;

    const isOwned = inventory.includes(itemId);
    const isEquipped = equipped.includes(itemData.path);

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
  if (!currentUser) return showScreen('screen-login');

  let equipped = currentUser.equipped_items || [];
  let inventory = currentUser.inventory || ['hat_default'];
  let savedTotal = parseFloat(currentUser.saved_total || 0);

  if (itemId === 'hat_default') {
    equipped = [];
    showNotification("Unequipped all items.", "info");
  } else {
    const itemData = ITEM_MANIFEST[itemId];
    const canonicalPath = itemData ? itemData.path : spritePath;
    const targetSlot = itemData ? itemData.slot : itemId.split('_')[0];
    const isOwned = inventory.includes(itemId);

    if (isOwned) {
      const index = equipped.indexOf(canonicalPath);

      if (index > -1) {
        equipped.splice(index, 1);
        showNotification("Item unequipped!", "info");
      } else {
        equipped = equipped.filter(path => {
          const activeKey = Object.keys(ITEM_MANIFEST).find(key => ITEM_MANIFEST[key].path === path);
          return !(activeKey && ITEM_MANIFEST[activeKey].slot === targetSlot);
        });

        equipped.push(canonicalPath);
        showNotification("Item equipped!", "success");
      }
    } else {
      if (savedTotal < price) {
        showNotification("You need more saved money to unlock this item!", "error");
        return;
      }
      savedTotal -= price;
      inventory.push(itemId);
      equipped.push(canonicalPath);
      showNotification("Item unlocked & equipped!", "success");
    }
  }

  currentUser.equipped_items = equipped;
  currentUser.inventory = inventory;
  currentUser.saved_total = savedTotal;

  saveUserData();
  syncAllAnimations();
  openShop();
}

// ==========================================
// 8. INITIALIZATION & EVENT BINDING
// ==========================================

window.addEventListener('DOMContentLoaded', () => {
  const currencyInputs = document.querySelectorAll('input[type="number"], .money-input');
  currencyInputs.forEach(input => {
    input.addEventListener('input', (e) => enforceMoneyLimit(e.target));
  });

  const signupForm = document.getElementById('form-signup') || document.getElementById('signup-form');
  if (signupForm) signupForm.addEventListener('submit', handleLocalSignup);

  const loginForm = document.getElementById('form-login') || document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLocalLogin);

  const surveyForm = document.getElementById('form-survey') || document.getElementById('survey-form');
  if (surveyForm) surveyForm.addEventListener('submit', saveFinancialProfile);

  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');

  if (tabLogin) tabLogin.addEventListener('click', () => switchAuthTab('login'));
  if (tabSignup) tabSignup.addEventListener('click', () => switchAuthTab('signup'));

  const activeSession = localStorage.getItem('session_user');
  if (activeSession) {
    loadTrainerSession();
  } else {
    showScreen('screen-login');
  }
});

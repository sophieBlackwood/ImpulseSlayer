
// LOCAL STORAGE AUTH & GAME STATE
// ==========================================
let selectedSpriteStaticTemp = 'assets/characters/hero-male.png';
let selectedSpriteIdleTemp = 'assets/characters/hero-male-idle.gif';

let currentUser = null;

const battleState = {
  price: 0,
  itemName: '',
  category: 'general',
  enemyHP: 100,
  maxEnemyHP: 100,
  playerHP: 100,
  maxPlayerHP: 100,
  timerInterval: null,
  lastAnswer1: '',
  isMoving: false
};

// Item Catalog with Categories & Paths
const ITEM_CATALOG = {
  'hat_crown': { name: 'Royal Crown', path: 'assets/costumes/overlay-crown.png', category: 'hat' },
  'hat_wizard': { name: 'Wizard Hat', path: 'assets/costumes/overlay-wizard-hat.png', category: 'hat' },
  'hat_ninja': { name: 'Ninja Headband', path: 'assets/costumes/overlay-ninja-headband.png', category: 'hat' },
  'hat_party': { name: 'Party Hat', path: 'assets/costumes/overlay-party-hat.png', category: 'hat' },
  'hat_helmet': { name: 'Knight Helmet', path: 'assets/costumes/overlay-helmet.png', category: 'hat' },
  
  'face_sunglasses': { name: 'Cool Sunglasses', path: 'assets/costumes/overlay-sunglasses.png', category: 'face' },
  'face_eyepatch': { name: 'Pirate Eyepatch', path: 'assets/costumes/overlay-eyepatch.png', category: 'face' },
  'face_visor': { name: 'Cyber Visor', path: 'assets/costumes/overlay-visor.png', category: 'face' },
  
  'item_sword': { name: 'Wooden Sword', path: 'assets/costumes/overlay-wooden-sword.png', category: 'weapon' },
  'item_staff': { name: 'Magic Staff', path: 'assets/costumes/overlay-magic-staff.png', category: 'weapon' },
  'item_shield': { name: 'Wooden Shield', path: 'assets/costumes/overlay-shield.png', category: 'weapon' },
  'item_laser': { name: 'Laser Blaster', path: 'assets/costumes/overlay-laser-blaster.png', category: 'weapon' }
};

// Helper function to persist state
function saveUserData() {
  if (currentUser && currentUser.email) {
    localStorage.setItem(`user_${currentUser.email}`, JSON.stringify(currentUser));
  }
}

// ==========================================
// 1. UI NAVIGATION & SCREEN MANAGEMENT
// ==========================================

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');

  // Stop moving state when switching screens
  setMovementState(false);
}

function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  const loginForm = document.getElementById('form-login');
  const signupForm = document.getElementById('form-signup');
  
  if (loginForm) loginForm.classList.toggle('hidden', !isLogin);
  if (signupForm) signupForm.classList.toggle('hidden', isLogin);
  
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');

  if (tabLogin) tabLogin.classList.toggle('active', isLogin);
  if (tabSignup) tabSignup.classList.toggle('active', !isLogin);
}

function renderCharacterAvatar(containerId, user) {
  const container = document.getElementById(containerId);
  if (!container || !user) return;

  const movementClass = battleState.isMoving ? 'is-moving' : 'is-idle';

  const baseSprite = battleState.isMoving 
    ? (user.base_sprite_walk || 'assets/characters/hero-male-walk.gif')
    : (user.base_sprite_idle || 'assets/characters/hero-male-idle.gif');

  const equippedList = user.equipped_items || [];

  let layersHTML = `<img src="${baseSprite}" id="${containerId}-base-img" alt="Base Hero" class="character-img base-layer ${movementClass}" />`;

  equippedList.forEach(path => {
    if (path && path !== 'BASE') {
      // Added movementClass here so overlays inherit the same idle/moving state
      layersHTML += `<img src="${path}" alt="Costume Layer" class="character-img costume-overlay-layer ${movementClass}" />`;
    }
  });

  container.innerHTML = layersHTML;
}

/* Dynamic Sprite Movement State Handler */
function setMovementState(moving) {
  if (battleState.isMoving === moving) return;
  battleState.isMoving = moving;

  if (currentUser) {
    renderCharacterAvatar('hub-avatar', currentUser);
    renderCharacterAvatar('player-sprite', currentUser);
    renderCharacterAvatar('shop-preview-avatar', currentUser);
  }
}

// ==========================================
// 2. AUTHENTICATION & PROFILE SETUP
// ==========================================

function handleLocalSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim().toLowerCase();
  const pass = document.getElementById('signup-pass').value;

  const existingUser = localStorage.getItem(`user_${email}`);
  if (existingUser) {
    alert("An account with this email already exists!");
    return;
  }

  const newUser = {
    email: email,
    password: pass,
    trainer_name: name || 'Hero',
    wage: 15.00,
    food_price: 7.50,
    event_price: 25.00,
    lvl: 1,
    xp: 0,
    saved_total: 0,
    equipped_items: [],
    inventory: ['hat_default'],
    logs: [],
    vault_unlock_time: null,
    base_sprite_idle: 'assets/characters/hero-male-idle.gif',
    base_sprite_walk: 'assets/characters/hero-male-walk.gif'
  };

  localStorage.setItem(`user_${email}`, JSON.stringify(newUser));
  localStorage.setItem('session_user', email);
  currentUser = newUser;

  showScreen('screen-survey');
}

function handleLocalLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pass = document.getElementById('login-pass').value;

  const userData = localStorage.getItem(`user_${email}`);
  if (!userData) {
    alert("User not found!");
    return;
  }

  const user = JSON.parse(userData);
  if (user.password !== pass) {
    alert("Incorrect password!");
    return;
  }

  localStorage.setItem('session_user', email);
  currentUser = user;
  loadTrainerSession();
}

function saveFinancialProfile(e) {
  if (e) e.preventDefault();
  if (!currentUser) return showScreen('screen-login');

  currentUser.wage = parseFloat(document.getElementById('survey-wage').value) || 15.00;
  currentUser.food_price = parseFloat(document.getElementById('survey-food').value) || 7.50;
  currentUser.event_price = parseFloat(document.getElementById('survey-event').value) || 25.00;

  saveUserData();
  showScreen('screen-sprite');
}

function selectSprite(staticSrc, idleSrc, element) {
  selectedSpriteStaticTemp = staticSrc;
  selectedSpriteIdleTemp = idleSrc;

  document.querySelectorAll('.sprite-option').forEach(opt => opt.classList.remove('active'));
  element.classList.add('active');
}

function confirmSpriteSelection() {
  if (!currentUser) return showScreen('screen-login');

  currentUser.base_sprite_static = selectedSpriteStaticTemp;
  currentUser.base_sprite_idle = selectedSpriteIdleTemp;

  saveUserData();
  loadTrainerSession();
}

function loadTrainerSession() {
  const sessionEmail = localStorage.getItem('session_user');
  if (!sessionEmail) {
    showScreen('screen-login');
    return;
  }

  const userData = localStorage.getItem(`user_${sessionEmail}`);
  if (!userData) {
    showScreen('screen-login');
    return;
  }

  currentUser = JSON.parse(userData);

  if (document.getElementById('hub-trainer-name')) document.getElementById('hub-trainer-name').textContent = currentUser.trainer_name || 'Hero';
  if (document.getElementById('hub-trainer-lvl')) document.getElementById('hub-trainer-lvl').textContent = `Level ${currentUser.lvl || 1}`;
  if (document.getElementById('hub-saved')) document.getElementById('hub-saved').textContent = `$${parseFloat(currentUser.saved_total || 0).toFixed(2)}`;
  if (document.getElementById('hub-exp')) document.getElementById('hub-exp').textContent = `${currentUser.xp || 0} / 100`;

  renderCharacterAvatar('hub-avatar', currentUser);
  renderCharacterAvatar('player-sprite', currentUser);
  renderCharacterAvatar('shop-preview-avatar', currentUser);

  if (document.getElementById('settings-name')) document.getElementById('settings-name').value = currentUser.trainer_name || '';
  if (document.getElementById('settings-wage')) document.getElementById('settings-wage').value = currentUser.wage || 15.00;
  if (document.getElementById('settings-food')) document.getElementById('settings-food').value = currentUser.food_price || 7.50;
  if (document.getElementById('settings-event')) document.getElementById('settings-event').value = currentUser.event_price || 25.00;

  checkLockStatus(currentUser);
  showScreen('screen-hub');
}

function checkLockStatus(user) {
  const btn = document.getElementById('btn-engage-boss');
  if (!btn) return;
  if (user.vault_unlock_time && user.vault_unlock_time > Date.now()) {
    btn.textContent = "Cooldown Active";
    btn.style.opacity = "0.6";
  } else {
    btn.textContent = "Start Impulse Battle";
    btn.style.opacity = "1";
  }
}

function checkBossAvailability() {
  if (!currentUser) return showScreen('screen-login');

  if (currentUser.vault_unlock_time && currentUser.vault_unlock_time > Date.now()) {
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

  if (price >= 150) {
    return { name: "Buyer's Remorse Titan", sprite: "assets/monsters/monster-dragon-fomo.png" };
  }

  if (category === 'tech' || lowerName.includes('phone') || lowerName.includes('headphone')) {
    return { name: "Upgrade Overlord", sprite: "assets/monsters/monster-beast-impulse.png" };
  } else if (category === 'fashion' || lowerName.includes('shoes') || lowerName.includes('clothes')) {
    return { name: "Fast-Fashion Phantom", sprite: "assets/monsters/monster-phantom-subscription.png" };
  } else if (category === 'food' || lowerName.includes('snack') || lowerName.includes('coffee')) {
    return { name: "Snack-Attack Slime", sprite: "assets/monsters/monster-gremlin-splurge.png" };
  } else if (category === 'sub' || lowerName.includes('subscription')) {
    return { name: "Recurring Subscription Imp", sprite: "assets/monsters/monster-phantom-subscription.png" };
  }

  return price < 30 
    ? { name: "Splurge Gremlin", sprite: "assets/monsters/monster-gremlin-splurge.png" }
    : { name: "FOMO Beast", sprite: "assets/monsters/monster-beast-impulse.png" };
}

function startBattle() {
  const nameInput = document.getElementById('target-name');
  const priceInput = document.getElementById('target-price');
  if (!nameInput || !priceInput) return;

  const name = nameInput.value.trim();
  const price = parseFloat(priceInput.value);
  const categorySelect = document.getElementById('target-category');
  const category = categorySelect ? categorySelect.value : 'general';

  if (!name || isNaN(price) || price <= 0) return alert("Please enter a valid item name and price.");

  battleState.itemName = name;
  battleState.price = price;
  battleState.category = category;
  battleState.maxEnemyHP = price > 100 ? 150 : 100;
  battleState.enemyHP = battleState.maxEnemyHP;
  battleState.maxPlayerHP = 100;
  battleState.playerHP = 100;

  const monster = getMonsterData(name, price, category);
  document.getElementById('enemy-name').textContent = monster.name;
  document.getElementById('enemy-sprite').innerHTML = `<img src="${monster.sprite}" alt="${monster.name}" class="character-img" />`;

  document.getElementById('player-battle-name').textContent = currentUser ? currentUser.trainer_name : 'Hero';
  document.getElementById('player-battle-lvl').textContent = `Lv ${currentUser ? currentUser.lvl : 1}`;

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
        <input type="text" id="user-reflection-1" placeholder="e.g., I saw an ad..." autofocus />
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
        <input type="text" id="user-reflection-1" placeholder="e.g., Save for vacation..." autofocus />
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
  const price = battleState.price;
  const wage = currentUser ? currentUser.wage : 15.00;
  const food = currentUser ? currentUser.food_price : 7.50;
  const eventVal = currentUser ? currentUser.event_price : 25.00;

  const hoursWorked = (price / wage).toFixed(1);
  const mealsCount = Math.floor(price / food);
  const outingsCount = (price / eventVal).toFixed(1);

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

function victorySavedMoney() {
  if (typeof confetti === 'function') confetti({ particleCount: 80, spread: 70 });
  alert(`Great job! You beat the impulse and saved $${battleState.price.toFixed(2)}.`);

  if (currentUser) {
    currentUser.vault_unlock_time = Date.now() + (15 * 60 * 1000);
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
  const newName = document.getElementById('settings-name').value.trim();
  if (!newName) return alert("Please enter a valid name.");

  if (currentUser) {
    currentUser.trainer_name = newName;
    saveUserData();
    alert("Trainer name saved.");
    loadTrainerSession();
  }
}

function updateMetricsSettings() {
  const wage = parseFloat(document.getElementById('settings-wage').value);
  const food = parseFloat(document.getElementById('settings-food').value);
  const eventVal = parseFloat(document.getElementById('settings-event').value);

  if (currentUser) {
    currentUser.wage = wage || 15.00;
    currentUser.food_price = food || 7.50;
    currentUser.event_price = eventVal || 25.00;

    saveUserData();
    alert("Financial metrics saved.");
    loadTrainerSession();
  }
}

function deleteAccount() {
  if (confirm("Are you sure you want to delete your account? This will erase all your progress.")) {
    if (currentUser) {
      localStorage.removeItem(`user_${currentUser.email}`);
      localStorage.removeItem('session_user');
      currentUser = null;
      alert("Account deleted.");
      showScreen('screen-login');
    }
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
    alert(`Level Up! You reached Level ${newLvl}.`);
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
// 5. VAULT & HISTORY LOGS
// ==========================================

function startVaultTimer(unlockTimestamp) {
  if (battleState.timerInterval) clearInterval(battleState.timerInterval);

  function updateDisplay() {
    const remaining = unlockTimestamp - Date.now();

    if (remaining <= 0) {
      clearInterval(battleState.timerInterval);
      document.getElementById('vault-timer').textContent = "Ready";

      if (currentUser) {
        currentUser.vault_unlock_time = null;
        saveUserData();
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
  if (!currentUser) return showScreen('screen-login');

  if (currentUser.vault_unlock_time && currentUser.vault_unlock_time > Date.now()) {
    startVaultTimer(currentUser.vault_unlock_time);
  } else {
    document.getElementById('vault-timer').textContent = "Ready";
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

// ==========================================
// 6. SHOP & STRICT 1-PER-CATEGORY EQUIP SYSTEM
// ==========================================

function openShop() {
  if (!currentUser) return showScreen('screen-login');

  if (document.getElementById('shop-gold-val')) {
    document.getElementById('shop-gold-val').textContent = parseFloat(currentUser.saved_total || 0).toFixed(2);
  }
  renderCharacterAvatar('shop-preview-avatar', currentUser);

  updateShopButtons(currentUser);
  showScreen('screen-shop');
}

function updateShopButtons(user) {
  const equipped = user.equipped_items || [];
  const inventory = user.inventory || ['hat_default'];

  // Update starter button
  const starterBtn = document.getElementById('btn-hat_default');
  if (starterBtn) {
    starterBtn.textContent = equipped.length === 0 ? "Equipped" : "Unequip All";
    starterBtn.className = equipped.length === 0 ? "btn btn-sm btn-equipped" : "btn btn-secondary btn-sm";
  }

  // Update catalog buttons
  Object.keys(ITEM_CATALOG).forEach(itemId => {
    const btn = document.getElementById(`btn-${itemId}`);
    if (!btn) return;

    const itemData = ITEM_CATALOG[itemId];
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

  // Reset all equipped items if clicking Default / Starter
  if (itemId === 'hat_default') {
    currentUser.equipped_items = [];
    saveUserData();
    loadTrainerSession();
    openShop();
    return;
  }

  const targetItem = ITEM_CATALOG[itemId];
  if (!targetItem) return;

  const isOwned = inventory.includes(itemId);

  if (isOwned) {
    const isEquipped = equipped.includes(spritePath);

    if (isEquipped) {
      // Unequip item
      equipped = equipped.filter(path => path !== spritePath);
    } else {
      // 1-PER-CATEGORY FILTER: Remove any item already equipped in the same category
      equipped = equipped.filter(equippedPath => {
        const catalogItem = Object.values(ITEM_CATALOG).find(item => item.path === equippedPath);
        return !catalogItem || catalogItem.category !== targetItem.category;
      });

      // Equip new item
      equipped.push(spritePath);
    }
  } else {
    // Unlock and auto-equip item
    if (savedTotal < price) {
      alert("You need more saved money to unlock this item!");
      return;
    }

    savedTotal -= price;
    inventory.push(itemId);

    // Filter category before equipping newly bought item
    equipped = equipped.filter(equippedPath => {
      const catalogItem = Object.values(ITEM_CATALOG).find(item => item.path === equippedPath);
      return !catalogItem || catalogItem.category !== targetItem.category;
    });

    equipped.push(spritePath);
    alert(`${targetItem.name} unlocked and equipped!`);
  }

  currentUser.equipped_items = equipped;
  currentUser.inventory = inventory;
  currentUser.saved_total = savedTotal;

  saveUserData();
  loadTrainerSession();
  openShop();
}

// ==========================================
// 7. INITIALIZATION & KEYBOARD LISTENERS
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('form-signup');
  if (signupForm) signupForm.addEventListener('submit', handleLocalSignup);

  const loginForm = document.getElementById('form-login');
  if (loginForm) loginForm.addEventListener('submit', handleLocalLogin);

  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');

  if (tabLogin) tabLogin.addEventListener('click', () => switchAuthTab('login'));
  if (tabSignup) tabSignup.addEventListener('click', () => switchAuthTab('signup'));

  // Global WASD / Arrow Key Listener for character movement animation toggling
  const moveKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  const activeKeys = new Set();

  window.addEventListener('keydown', (e) => {
    if (moveKeys.includes(e.code)) {
      activeKeys.add(e.code);
      setMovementState(true);
    }
  });

  window.addEventListener('keyup', (e) => {
    if (moveKeys.includes(e.code)) {
      activeKeys.delete(e.code);
      if (activeKeys.size === 0) {
        setMovementState(false);
      }
    }
  });

  loadTrainerSession();
});

let selectedSpriteStaticTemp = 'assets/characters/hero-male.png';
let selectedSpriteIdleTemp = 'assets/characters/hero-male-idle.gif';

let currentUser = null;

const battleState = {
  price: 0,
  itemName: '',
  category: 'general',
  monsterName: '',
  enemyHP: 150,
  maxEnemyHP: 150,
  playerHP: 100,
  maxPlayerHP: 100,
  timerInterval: null,
  isProcessing: false
};

// Map of all shop items to their animated GIF paths and slot categories
const ITEM_MANIFEST = {
  'hat_crown': { path: 'assets/costumes/overlay-crown-idle.gif', slot: 'hat' },
  'hat_wizard': { path: 'assets/costumes/overlay-wizard-hat-idle.gif', slot: 'hat' },
  'hat_ninja': { path: 'assets/costumes/overlay-ninja-headband-idle.gif', slot: 'hat' },
  'hat_party': { path: 'assets/costumes/overlay-party-hat-idle.gif', slot: 'hat' },
  'hat_helmet': { path: 'assets/costumes/overlay-helmet-idle.gif', slot: 'hat' },
  'face_sunglasses': { path: 'assets/costumes/overlay-sunglasses-idle.gif', slot: 'face' },
  'face_eyepatch': { path: 'assets/costumes/overlay-eyepatch-idle.gif', slot: 'face' },
  'face_visor': { path: 'assets/costumes/overlay-visor-idle.gif', slot: 'face' },
  'item_sword': { path: 'assets/costumes/overlay-wooden-sword-idle.gif', slot: 'item' },
  'item_staff': { path: 'assets/costumes/overlay-magic-staff-idle.gif', slot: 'item' },
  'item_shield': { path: 'assets/costumes/overlay-shield-idle.gif', slot: 'item' },
  'item_laser': { path: 'assets/costumes/overlay-laser-blaster-idle.gif', slot: 'item' }
};

// Pools of randomized reflection questions per attack type
const QUESTION_POOLS = {
  necessity: [
    "Why do you want this item right now, and will it matter in 30 days?",
    "Is this a true 'need' for your daily life or an impulse 'want'?",
    "What emotion triggered this urge to buy right now?",
    "Would you still buy this if nobody else ever saw you with it?",
    "If you wait 48 hours to buy this, will you still care as much?",
    "Are you buying this to solve a temporary mood or boredom?",
    "Will buying this improve your daily productivity or just give a quick thrill?",
    "Do you already own something similar that accomplishes the same goal?",
    "If you were given the cash value instead of this item, would you keep the cash?",
    "How does buying this align with your long-term personal goals?"
  ],
  utility: [
    "How many times will you realistically use this item in the next year?",
    "If you divide the price by how often you'll use it, is the cost-per-use worth it?",
    "Will this item hold value over time or quickly gather dust?",
    "Is there a free or cheaper alternative that offers the same functionality?",
    "Will this purchase require additional add-ons, subscriptions, or maintenance?",
    "How much space will this take up in your life or room?",
    "Is the quality high enough to last, or will you need to replace it soon?",
    "Are you paying extra just for a brand name or fancy packaging?",
    "Can you borrow or rent this item instead of purchasing it outright?",
    "Does this item solve a real friction point in your routine?"
  ],
  wait: [
    "What important long-term goal could you put this money toward instead?",
    "How many hours of work did it take you to earn this amount of money?",
    "If you invested or saved this amount today, how much could it grow?",
    "What experience or trip could you fund by skipping this purchase?",
    "Would future-you thank you for saving this cash instead of spending it?",
    "If your savings balance drops by this amount, how secure will you feel?",
    "What is the single biggest trade-off you are making by buying this?",
    "Could this money cover an emergency or unexpected expense down the road?",
    "Are you sacrificing a major reward later for instant gratification now?",
    "How close does saving this money put you to your next major milestone?"
  ]
};

// ==========================================
// INPUT SANITIZATION & MONEY LIMIT GUARD
// ==========================================
function enforceMoneyLimit(inputElement) {
  if (!inputElement) return;

  let val = inputElement.value.replace(/[^0-9.]/g, '');

  const parts = val.split('.');
  if (parts.length > 2) {
    val = parts[0] + '.' + parts.slice(1).join('');
  }

  if (parts[1] && parts[1].length > 2) {
    val = parts[0] + '.' + parts[1].slice(0, 2);
  }

  let numVal = parseFloat(val);
  if (!isNaN(numVal) && numVal > 5000) {
    val = "5000";
    showNotification("Maximum monetary limit is $5,000.00", "error");
  }

  inputElement.value = val;
}

// ==========================================
// IN-APP NOTIFICATION SYSTEM
// ==========================================
function showNotification(message, type = 'info') {
  const container = document.getElementById('app-toast-container');
  if (!container) {
    console.log(`[Notification]: ${message}`);
    return;
  }

  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.innerHTML = `<span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

window.alert = function(msg) {
  showNotification(msg, 'info');
};

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

let syncAnimToken = Date.now();

function renderCharacterAvatar(containerId, user) {
  const container = document.getElementById(containerId);
  if (!container || !user) return;

  const baseSprite = user.base_sprite_idle || 'assets/characters/hero-male-idle.gif';
  const syncedBaseSprite = `${baseSprite}?sync=${syncAnimToken}`;
  const equippedList = user.equipped_items || [];

  let layersHTML = `<img src="${syncedBaseSprite}" alt="Base Hero Idle" class="character-img base-layer" />`;

  equippedList.forEach(path => {
    if (path && path !== 'BASE') {
      const syncedCostumePath = `${path}?sync=${syncAnimToken}`;
      layersHTML += `<img src="${syncedCostumePath}" alt="Costume Layer" class="character-img costume-overlay-layer" />`;
    }
  });

  container.innerHTML = layersHTML;
}

function syncAllAnimations() {
  syncAnimToken = Date.now();
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
  let name = document.getElementById('signup-name').value.trim().slice(0, 20);
  const email = document.getElementById('signup-email').value.trim().toLowerCase().slice(0, 50);
  const pass = document.getElementById('signup-pass').value.slice(0, 50);

  const existingUser = localStorage.getItem(`user_${email}`);
  if (existingUser) {
    showNotification("Existing profile reset for signup.", "info");
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
    base_sprite_static: 'assets/characters/hero-male.png',
    base_sprite_idle: 'assets/characters/hero-male-idle.gif',
    equipped_items: [],
    inventory: ['hat_default'],
    logs: [],
    vault_unlock_time: null
  };

  localStorage.setItem(`user_${email}`, JSON.stringify(newUser));
  localStorage.setItem('session_user', email);
  currentUser = newUser;

  showScreen('screen-survey');
}

function handleLocalLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase().slice(0, 50);
  const pass = document.getElementById('login-pass').value.slice(0, 50);

  const userData = localStorage.getItem(`user_${email}`);
  if (!userData) {
    showNotification("User not found!", "error");
    return;
  }

  const user = JSON.parse(userData);
  if (user.password !== pass) {
    showNotification("Incorrect password!", "error");
    return;
  }

  localStorage.setItem('session_user', email);
  currentUser = user;
  loadTrainerSession();
}

function saveFinancialProfile(e) {
  if (e) e.preventDefault();
  if (!currentUser) return showScreen('screen-login');

  let wage = parseFloat(document.getElementById('survey-wage').value) || 15.00;
  let food = parseFloat(document.getElementById('survey-food').value) || 7.50;
  let eventVal = parseFloat(document.getElementById('survey-event').value) || 25.00;

  if (wage > 5000 || food > 5000 || eventVal > 5000) {
    showNotification("Financial entries cannot exceed $5,000.", "error");
    return;
  }

  currentUser.wage = wage;
  currentUser.food_price = food;
  currentUser.event_price = eventVal;

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

  syncAllAnimations();

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
    showNotification("Battles are temporarily paused during your cooling period.", "error");
    checkVaultDirect();
  } else {
    showScreen('screen-quest');
  }
}

// ==========================================
// 3. COMBAT, ANIMATION & COUNTER-ATTACK SYSTEM
// ==========================================

function getMonsterData(itemName, price, category) {
  const lowerName = itemName.toLowerCase();

  if (price >= 150) {
    return { 
      name: "Buyer's Remorse Titan", 
      sprite: "assets/monsters/buyers-remorse-titan-idle.gif" 
    };
  }

  if (category === 'tech' || lowerName.includes('phone') || lowerName.includes('headphone')) {
    return { 
      name: "Upgrade Overlord", 
      sprite: "assets/monsters/upgrade-overlord-idle.gif" 
    };
  } else if (category === 'fashion' || lowerName.includes('shoes') || lowerName.includes('clothes')) {
    return { 
      name: "Fast-Fashion Phantom", 
      sprite: "assets/monsters/fast-fashion-phantom-idle.gif" 
    };
  } else if (category === 'food' || lowerName.includes('snack') || lowerName.includes('coffee')) {
    return { 
      name: "Snack-Attack Slime", 
      sprite: "assets/monsters/sneak-attack-slime-idle.gif" 
    };
  } else if (category === 'sub' || lowerName.includes('subscription')) {
    return { 
      name: "Phantom Subscription Imp", 
      sprite: "assets/monsters/phantom-subscription-imp-idle.gif" 
    };
  }

  return price < 30 
    ? { name: "Splurge Gremlin", sprite: "assets/monsters/splurge-gremlin-idle.gif" }
    : { name: "FOMO Beast", sprite: "assets/monsters/fomo-beast-idle.gif" };
}

function calculateMonsterHP(price) {
  if (price < 30) {
    return 150;
  } else if (price < 150) {
    return 250;
  } else {
    const scaledHP = 300 + Math.floor((price - 150) * 0.25);
    return Math.min(scaledHP, 1000);
  }
}

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
  battleState.maxPlayerHP = 100;
  battleState.playerHP = 100;
  battleState.isProcessing = false;

  const monster = getMonsterData(name, price, category);
  battleState.monsterName = monster.name;

  document.getElementById('enemy-name').textContent = monster.name;
  document.getElementById('enemy-sprite').innerHTML = `<img src="${monster.sprite}?sync=${Date.now()}" alt="${monster.name}" class="character-img" />`;

  document.getElementById('player-battle-name').textContent = currentUser ? currentUser.trainer_name : 'Hero';
  document.getElementById('player-battle-lvl').textContent = `Lv ${currentUser ? currentUser.lvl : 1}`;

  renderCharacterAvatar('player-sprite', currentUser);

  // Enlarge player sprite during combat
  const playerContainer = document.getElementById('player-sprite');
  if (playerContainer) {
    playerContainer.style.transform = 'scale(1.3)';
    playerContainer.style.transformOrigin = 'bottom center';
  }

  updateHPUI();
  setDialogue(`A powerful ${monster.name} appears with ${monsterHP} HP!`);
  
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
  const pool = QUESTION_POOLS[attackType];

  if (pool && pool.length > 0) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    const selectedQuestion = pool[randomIndex];
    setDialogue(`Reflection Question: ${selectedQuestion}`);
  }

  container.innerHTML = `
    <div class="input-field">
      <input type="text" id="user-reflection" placeholder="Type your reflection answer (max 80 chars)..." maxlength="80" autofocus />
    </div>
    <button id="btn-submit-reflection" class="btn btn-primary" onclick="processPlayerAttack('${attackType}')">Submit Strike</button>
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

  // 1. Trigger Player Attack Animation (Diagonal Dart Up-Right)
  const playerContainer = document.getElementById('player-sprite');
  if (playerContainer) {
    playerContainer.classList.remove('anim-player-attack');
    void playerContainer.offsetWidth; // Trigger reflow
    playerContainer.classList.add('anim-player-attack');
  }

  // Apply Player Damage
  const damageDealt = 50;
  battleState.enemyHP = Math.max(0, battleState.enemyHP - damageDealt);
  updateHPUI();

  if (battleState.enemyHP <= 0) {
    setDialogue(`FINAL STRIKE! Your reflection landed the finishing blow on ${battleState.monsterName}!`);
    setTimeout(victorySavedMoney, 1200);
  } else {
    setDialogue(`You dealt ${damageDealt} DMG to ${battleState.monsterName}!`);

    // 2. Pause 1 second before the monster counter-attacks
    setTimeout(() => {
      // Trigger Monster Attack Animation (Diagonal Dart Down-Left)
      const enemyContainer = document.getElementById('enemy-sprite');
      if (enemyContainer) {
        enemyContainer.classList.remove('anim-monster-attack');
        void enemyContainer.offsetWidth; // Trigger reflow
        enemyContainer.classList.add('anim-monster-attack');
      }

      const wage = (currentUser && currentUser.wage > 0) ? currentUser.wage : 15.00;
      const foodPrice = (currentUser && currentUser.food_price > 0) ? currentUser.food_price : 7.50;
      const eventPrice = (currentUser && currentUser.event_price > 0) ? currentUser.event_price : 25.00;

      const hoursWorked = (battleState.price / wage).toFixed(1);
      const snacksEquivalent = Math.round(battleState.price / foodPrice);
      const eventsEquivalent = (battleState.price / eventPrice).toFixed(1);

      const monsterTaunts = [
        `"${battleState.itemName} isn't just $${battleState.price.toFixed(2)}—that costs you ${hoursWorked} hours of work!"`,
        `"Think fast! That purchase equals buying ${snacksEquivalent} favorite snacks in one go!"`,
        `"Is it worth giving up ${eventsEquivalent} weekend outings for this single item?"`
      ];

      const chosenTaunt = monsterTaunts[Math.floor(Math.random() * monsterTaunts.length)];
      const monsterDamage = 15;
      battleState.playerHP = Math.max(0, battleState.playerHP - monsterDamage);

      setDialogue(`${battleState.monsterName} counter-attacks: ${chosenTaunt} (-${monsterDamage} HP)`);
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

    }, 2000); // 2 second turn delay
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

  checkVaultDirect();
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
// 4. SETTINGS & ACCOUNT ACTIONS
// ==========================================

function updateTrainerName() {
  const nameInput = document.getElementById('settings-name');
  const newName = nameInput ? nameInput.value.trim().slice(0, 20) : '';

  if (!newName) return showNotification("Please enter a valid name (1-20 characters).", "error");

  if (currentUser) {
    currentUser.trainer_name = newName;
    saveUserData();
    showNotification("Trainer name saved.", "success");
    loadTrainerSession();
  }
}

function updateMetricsSettings() {
  const wage = parseFloat(document.getElementById('settings-wage').value);
  const food = parseFloat(document.getElementById('settings-food').value);
  const eventVal = parseFloat(document.getElementById('settings-event').value);

  if (wage > 5000 || food > 5000 || eventVal > 5000) {
    showNotification("Settings amounts cannot exceed $5,000.", "error");
    return;
  }

  if (currentUser) {
    currentUser.wage = wage || 15.00;
    currentUser.food_price = food || 7.50;
    currentUser.event_price = eventVal || 25.00;

    saveUserData();
    showNotification("Financial metrics saved.", "success");
    loadTrainerSession();
  }
}

function deleteAccount() {
  if (confirm("Are you sure you want to delete your account? This will erase all your progress.")) {
    if (currentUser) {
      localStorage.removeItem(`user_${currentUser.email}`);
      localStorage.removeItem('session_user');
      currentUser = null;
      showNotification("Account deleted.", "info");
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
// 6. SHOP & RELIABLE EQUIP/UNEQUIP SYSTEM
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
          const activeItemKey = Object.keys(ITEM_MANIFEST).find(key => ITEM_MANIFEST[key].path === path);
          return !(activeItemKey && ITEM_MANIFEST[activeItemKey].slot === targetSlot);
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
      showNotification("Item unlocked!", "success");
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
// 7. INITIALIZATION & EVENT BINDING
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  const currencyInputs = document.querySelectorAll('input[type="number"], .money-input');
  currencyInputs.forEach(input => {
    input.addEventListener('input', (e) => enforceMoneyLimit(e.target));
  });

  const signupForm = document.getElementById('form-signup');
  if (signupForm) signupForm.addEventListener('submit', handleLocalSignup);

  const loginForm = document.getElementById('form-login');
  if (loginForm) loginForm.addEventListener('submit', handleLocalLogin);

  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');

  if (tabLogin) tabLogin.addEventListener('click', () => switchAuthTab('login'));
  if (tabSignup) tabSignup.addEventListener('click', () => switchAuthTab('signup'));

  loadTrainerSession();
});

// ==========================================
// LOCAL STORAGE AUTH & GAME STATE
// ==========================================
// Connect to Supabase
const SUPABASE_URL = 'https://rbcxqtonglxehaqceavh.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiY3hxdG9uZ2x4ZWhhcWNlYXZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NTc1MTQsImV4cCI6MjEwMjEzMzUxNH0.46PzKlyyWM1VH6ff7jYD8Qwjw2fHUNNH_obvxKr0Ve8';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
  ],
  heal: [
    "Take a breath: What is a small daily joy you can appreciate for free right now?",
    "How can taking a pause right now help protect your financial freedom?",
    "What positive habits are you building by taking time to rethink this purchase?",
    "If you step away from the checkout right now, how will you feel tomorrow?"
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

// Override default browser alerts with in-app notifications
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

  // 1. Resolve base sprite
  const baseSprite = user.base_sprite_idle || 'assets/characters/hero-male-idle.gif';
  const equippedList = user.equipped_items || [];

  let layersHTML = `<img src="${baseSprite}" alt="Base Hero Idle" class="character-img base-layer" />`;

  // 2. Resolve costume overlay layers reliably
  equippedList.forEach(itemEntry => {
    if (!itemEntry || itemEntry === 'BASE') return;

    let costumePath = itemEntry;
    if (ITEM_MANIFEST[itemEntry]) {
      costumePath = ITEM_MANIFEST[itemEntry].path;
    }

    if (costumePath) {
      layersHTML += `<img src="${costumePath}" alt="Costume Layer" class="character-img costume-overlay-layer" />`;
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

async function handleLocalSignup(e) {
  e.preventDefault();
  let name = document.getElementById('signup-name').value.trim().slice(0, 20);
  const email = document.getElementById('signup-email').value.trim().toLowerCase().slice(0, 50);
  const pass = document.getElementById('signup-pass').value.slice(0, 50);

  // Ask Supabase to create the user account
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: pass,
    options: {
      data: { trainer_name: name || 'Hero' }
    }
  });

  // If Supabase finds a problem (e.g., password too short)
  if (error) {
    showNotification(error.message, "error");
    return;
  }

  // Create the exact currentUser structure your game expects
  currentUser = {
    id: data.user.id,
    email: email,
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

  saveUserData();
  showScreen('screen-survey');
}

async function handleLocalLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase().slice(0, 50);
  const pass = document.getElementById('login-pass').value.slice(0, 50);

  // Ask Supabase to check the password
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: pass
  });

  if (error) {
    showNotification(error.message, "error");
    return;
  }

  localStorage.setItem('session_user', email);
  
  const savedData = localStorage.getItem(`user_${email}`);
  if (savedData) {
    currentUser = JSON.parse(savedData);
  } else {
    currentUser = {
      id: data.user.id,
      email: email,
      trainer_name: data.user.user_metadata?.trainer_name || 'Hero',
      wage: 15.00,
      food_price: 7.50,
      event_price: 25.00,
      lvl: 1,
      xp: 0,
      saved_total: 0,
      base_sprite_idle: 'assets/characters/hero-male-idle.gif',
      equipped_items: []
    };
  }

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

const CATEGORY_BACKGROUNDS = {
  tech: [
    "assets/backgrounds/bg-tech-1.png",
    "assets/backgrounds/bg-tech-2.png"
  ],
  fashion: [
    "assets/backgrounds/bg-fashion-1.png",
    "assets/backgrounds/bg-fashion-2.png"
  ],
  food: [
    "assets/backgrounds/bg-food-1.png",
    "assets/backgrounds/bg-food-2.png"
  ],
  sub: [
    "assets/backgrounds/bg-sub-1.png",
    "assets/backgrounds/bg-sub-2.png"
  ],
  general: [
    "assets/backgrounds/bg-general-1.png",
    "assets/backgrounds/bg-general-2.png",
    "assets/backgrounds/bg-general-3.png",
    "assets/backgrounds/bg-general-4.png"
  ]
};

function setBattleBackgroundByCategory(category) {
  const battleScreen = document.getElementById('screen-battle');
  if (!battleScreen) return;

  const bgList = CATEGORY_BACKGROUNDS[category] || CATEGORY_BACKGROUNDS.general;
  const randomIndex = Math.floor(Math.random() * bgList.length);
  const selectedBg = bgList[randomIndex];

  battleScreen.style.backgroundImage = `url('${selectedBg}')`;
  battleScreen.style.backgroundSize = 'cover';
  battleScreen.style.backgroundPosition = 'center';
  battleScreen.style.backgroundRepeat = 'no-repeat';
}

function getRandomMonsterAttack() {
  const wage = (currentUser && currentUser.wage > 0) ? currentUser.wage : 15.00;
  const foodPrice = (currentUser && currentUser.food_price > 0) ? currentUser.food_price : 7.50;
  const eventPrice = (currentUser && currentUser.event_price > 0) ? currentUser.event_price : 25.00;
  
  const price = battleState.price || 20.00;
  const itemName = battleState.itemName || "this item";

  const hoursWorked = (price / wage).toFixed(1);
  const snacksEquivalent = Math.round(price / foodPrice);
  const eventsEquivalent = (price / eventPrice).toFixed(1);
  const daysOfWage = (price / (wage * 8)).toFixed(1);

  const attacks = [
    {
      name: "Wage Dagger",
      taunt: `"${itemName} isn't just $${price.toFixed(2)}—that costs you ${hoursWorked} hours of work!"`,
      damage: 18
    },
    {
      name: "Snack Blast",
      taunt: `"Think fast! Buying ${itemName} equals giving up ${snacksEquivalent} favorite meals!"`,
      damage: 15
    },
    {
      name: "Event Slasher",
      taunt: `"Is it worth trading ${eventsEquivalent} weekend outings just for ${itemName}?"`,
      damage: 22
    },
    {
      name: "Workday Drain",
      taunt: `"That purchase takes away ${daysOfWage} full days of your hard-earned wages!"`,
      damage: 20
    },
    {
      name: "FOMO Flare",
      taunt: `"Everyone else is buying ${itemName} right now—can you really afford to skip it?"`,
      damage: 12
    },
    {
      name: "Opportunity Cost Beam",
      taunt: `"If you saved that $${price.toFixed(2)}, it could grow significantly in your vault!"`,
      damage: 25
    }
  ];

  const randomIndex = Math.floor(Math.random() * attacks.length);
  return attacks[randomIndex];
}

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

  const maxHP = typeof getPlayerMaxHP === 'function' ? getPlayerMaxHP() : 100;
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

  if (typeof renderCharacterAvatar === 'function') {
    renderCharacterAvatar('player-sprite', currentUser);
  }

  const playerContainer = document.getElementById('player-sprite');

  if (playerContainer) {
    playerContainer.classList.remove('anim-player-attack');
    playerContainer.style.transform = 'scale(1.3)';
    playerContainer.style.transformOrigin = 'bottom center';
  }
  if (enemyContainer) {
    enemyContainer.classList.remove('anim-monster-attack', 'anim-monster-retreat');
  }

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

  const playerContainer = document.getElementById('player-sprite');
  if (playerContainer) {
    playerContainer.classList.remove('anim-player-attack');
    void playerContainer.offsetWidth;
    playerContainer.classList.add('anim-player-attack');
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
      const missChance = typeof getEnemyMissChance === 'function' ? getEnemyMissChance() : 0.25;
      const isMiss = Math.random() < missChance;

      if (isMiss) {
        setDialogue(`${battleState.monsterName} attacked but MISSED! You took 0 damage.`);
        battleState.isProcessing = false;
        showAttackMenu();
      } else {
        const enemyContainer = document.getElementById('enemy-sprite');
        if (enemyContainer) {
          enemyContainer.classList.remove('anim-monster-attack');
          void enemyContainer.offsetWidth;
          enemyContainer.classList.add('anim-monster-attack');
        }

        let chosenAttack = null;
        try {
          if (typeof getRandomMonsterAttack === 'function') {
            chosenAttack = getRandomMonsterAttack();
          }
        } catch (err) {
          console.error("Error retrieving monster attack:", err);
        }

        if (!chosenAttack || typeof chosenAttack.damage !== 'number') {
          const wage = (currentUser && currentUser.wage > 0) ? currentUser.wage : 15.00;
          const hoursWorked = (battleState.price / wage).toFixed(1);
          chosenAttack = {
            name: "Impulse Strike",
            taunt: `"${battleState.itemName} costs you ${hoursWorked} hours of work!"`,
            damage: 15
          };
        }

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
      }

    }, 2000);
  }
}

function victorySavedMoney() {
  const enemyContainer = document.getElementById('enemy-sprite');
  
  if (enemyContainer) {
    enemyContainer.classList.remove('anim-monster-attack');
    void enemyContainer.offsetWidth;
    enemyContainer.classList.add('anim-monster-retreat');
  }

  if (typeof confetti === 'function') confetti({ particleCount: 80, spread: 70 });
  showNotification(`Victory! You defeated ${battleState.monsterName} and saved $${battleState.price.toFixed(2)}.`, "success");

  if (currentUser) {
    const cooldownMins = typeof getCooldownMinutes === 'function' ? getCooldownMinutes() : 15;
    currentUser.vault_unlock_time = Date.now() + (cooldownMins * 60 * 1000);
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
  const existingModal = document.getElementById('delete-modal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'delete-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Delete Account?</h3>
      <p>Are you sure you want to delete your account? This action cannot be undone and all savings progress will be lost.</p>
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

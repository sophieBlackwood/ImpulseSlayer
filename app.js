
// ==========================================
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
  isMoving: false,
  isSubmitting: false
};

// ==========================================
// ITEM CATALOG
// ==========================================

const ITEM_CATALOG = {
  hat_crown: {
    name: 'Royal Crown',
    path: 'assets/costumes/overlay-crown.png',
    idlePath: 'assets/costumes/overlay-crown-idle.gif',
    category: 'hat'
  },

  hat_wizard: {
    name: 'Wizard Hat',
    path: 'assets/costumes/overlay-wizard-hat.png',
    idlePath: 'assets/costumes/overlay-wizard-hat-idle.gif',
    category: 'hat'
  },

  hat_ninja: {
    name: 'Ninja Headband',
    path: 'assets/costumes/overlay-ninja-headband.png',
    idlePath: 'assets/costumes/overlay-ninja-headband-idle.gif',
    category: 'hat'
  },

  hat_party: {
    name: 'Party Hat',
    path: 'assets/costumes/overlay-party-hat.png',
    idlePath: 'assets/costumes/overlay-party-hat-idle.gif',
    category: 'hat'
  },

  hat_helmet: {
    name: 'Knight Helmet',
    path: 'assets/costumes/overlay-helmet.png',
    idlePath: 'assets/costumes/overlay-helmet-idle.gif',
    category: 'hat'
  },

  face_sunglasses: {
    name: 'Cool Sunglasses',
    path: 'assets/costumes/overlay-sunglasses.png',
    idlePath: 'assets/costumes/overlay-sunglasses-idle.gif',
    category: 'face'
  },

  face_eyepatch: {
    name: 'Pirate Eyepatch',
    path: 'assets/costumes/overlay-eyepatch.png',
    idlePath: 'assets/costumes/overlay-eyepatch-idle.gif',
    category: 'face'
  },

  face_visor: {
    name: 'Cyber Visor',
    path: 'assets/costumes/overlay-visor.png',
    idlePath: 'assets/costumes/overlay-visor-idle.gif',
    category: 'face'
  },

  item_sword: {
    name: 'Wooden Sword',
    path: 'assets/costumes/overlay-wooden-sword.png',
    idlePath: 'assets/costumes/overlay-wooden-sword-idle.gif',
    category: 'weapon'
  },

  item_staff: {
    name: 'Magic Staff',
    path: 'assets/costumes/overlay-magic-staff.png',
    idlePath: 'assets/costumes/overlay-magic-staff-idle.gif',
    category: 'weapon'
  },

  item_shield: {
    name: 'Wooden Shield',
    path: 'assets/costumes/overlay-shield.png',
    idlePath: 'assets/costumes/overlay-shield-idle.gif',
    category: 'weapon'
  },

  item_laser: {
    name: 'Laser Blaster',
    path: 'assets/costumes/overlay-laser-blaster.png',
    idlePath: 'assets/costumes/overlay-laser-blaster-idle.gif',
    category: 'weapon'
  }
};

// ==========================================
// REFLECTION QUESTIONS
// ==========================================

const REFLECTION_QUESTIONS = {
  necessity: [
    "Why do you want this item right now?",
    "Will you still care about owning this 30 days from now?",
    "Is this solving a real problem or just filling a temporary mood?"
  ],

  utility: [
    "How many times do you realistically expect to use this?",
    "On a scale of 1-10, how much will this improve your daily routine?",
    "Do you already own something similar that accomplishes this?"
  ],

  wait: [
    "What else could you save this money for instead?",
    "On a scale of 1-10, how strong is the urge to buy right now?",
    "If you had to wait 48 hours to buy this, would you still want it?"
  ]
};

// ==========================================
// IMAGE CACHE
// ==========================================

const imageCache = {};

function getCachedImage(src) {
  if (!src) return null;

  if (!imageCache[src]) {
    const img = new Image();

    img.onload = () => {
      // The global animation loop will draw it automatically.
    };

    img.onerror = () => {
      console.warn(`Unable to load image: ${src}`);
    };

    img.src = src;
    imageCache[src] = img;
  }

  return imageCache[src];
}

// ==========================================
// IN-APP POPUP / MODAL SYSTEM
// ==========================================

function showAppMessage(message, title = "Notification", callback = null) {
  let modal = document.getElementById('custom-app-modal');

  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'custom-app-modal';

    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    modal.innerHTML = `
      <div style="
        background: #1e1e2f;
        color: #fff;
        padding: 24px;
        border-radius: 12px;
        max-width: 360px;
        width: 85%;
        text-align: center;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        border: 2px solid #3b3b58;
      ">
        <h3
          id="app-modal-title"
          style="
            margin-top: 0;
            margin-bottom: 12px;
            color: #ffcc00;
          "
        >
          Notification
        </h3>

        <p
          id="app-modal-msg"
          style="
            margin-bottom: 20px;
            font-size: 15px;
            line-height: 1.4;
          "
        ></p>

        <button
          id="app-modal-btn"
          class="btn btn-primary"
          style="
            padding: 8px 24px;
            background: #4e54c8;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
          "
        >
          OK
        </button>
      </div>
    `;

    document.body.appendChild(modal);
  }

  const titleElement = document.getElementById('app-modal-title');
  const messageElement = document.getElementById('app-modal-msg');
  const buttonElement = document.getElementById('app-modal-btn');

  if (titleElement) {
    titleElement.textContent = title;
  }

  if (messageElement) {
    messageElement.textContent = message;
  }

  modal.style.display = 'flex';

  if (buttonElement) {
    buttonElement.onclick = () => {
      modal.style.display = 'none';

      if (typeof callback === 'function') {
        callback();
      }
    };
  }
}

// ==========================================
// USER DATA HELPERS
// ==========================================

function saveUserData() {
  if (!currentUser || !currentUser.email) return;

  localStorage.setItem(
    `user_${currentUser.email}`,
    JSON.stringify(currentUser)
  );
}

function getPlayerMaxHP(level) {
  const safeLevel = Math.max(1, Number(level) || 1);
  return 100 + ((safeLevel - 1) * 15);
}

function getPlayerDamageMultiplier(level) {
  const safeLevel = Math.max(1, Number(level) || 1);
  return 1 + ((safeLevel - 1) * 0.10);
}

function getCurrentLevel() {
  return currentUser ? Math.max(1, Number(currentUser.lvl) || 1) : 1;
}

// ==========================================
// SYNCHRONIZED CANVAS RENDERING SYSTEM
// ==========================================

function renderCharacterAvatar(canvasId, user, forceStationary = false) {
  const canvas = document.getElementById(canvasId);

  if (!canvas || !user) return;

  const ctx = canvas.getContext('2d');

  if (!ctx) return;

  const moving = forceStationary ? false : battleState.isMoving;

  let baseSprite = user.base_sprite_static ||
    'assets/characters/hero-male.png';

  if (!forceStationary) {
    baseSprite = moving
      ? (user.base_sprite_walk ||
        'assets/characters/hero-male-walk.gif')
      : (user.base_sprite_idle ||
        'assets/characters/hero-male-idle.gif');
  }

  const layers = [baseSprite];

  const equippedList = Array.isArray(user.equipped_items)
    ? user.equipped_items
    : [];

  equippedList.forEach(path => {
    if (!path || path === 'BASE') return;

    let activeOverlayPath = path;

    const catalogItem = Object.values(ITEM_CATALOG).find(item =>
      item.path === path ||
      item.idlePath === path
    );

    if (catalogItem) {
      if (forceStationary) {
        activeOverlayPath = catalogItem.path;
      } else {
        activeOverlayPath =
          !moving && catalogItem.idlePath
            ? catalogItem.idlePath
            : catalogItem.path;
      }
    }

    if (activeOverlayPath) {
      layers.push(activeOverlayPath);
    }
  });

  // Clear canvas every frame.
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw each layer in order.
  layers.forEach(src => {
    const img = getCachedImage(src);

    if (!img) return;

    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(
        img,
        0,
        0,
        canvas.width,
        canvas.height
      );
    }
  });
}

// ==========================================
// GLOBAL AVATAR LOOP
// ==========================================

let avatarLoopStarted = false;

function startGlobalAvatarLoop() {
  if (avatarLoopStarted) return;

  avatarLoopStarted = true;

  function loop() {
    if (currentUser) {
      renderCharacterAvatar(
        'hub-avatar',
        currentUser
      );

      renderCharacterAvatar(
        'player-sprite',
        currentUser
      );

      renderCharacterAvatar(
        'shop-preview-avatar',
        currentUser,
        true
      );
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

function setMovementState(moving) {
  const newState = Boolean(moving);

  if (battleState.isMoving === newState) {
    return;
  }

  battleState.isMoving = newState;
}

// ==========================================
// 1. UI NAVIGATION & AUTH
// ==========================================

function showScreen(id) {
  document
    .querySelectorAll('.screen')
    .forEach(screen => {
      screen.classList.remove('active');
    });

  const target = document.getElementById(id);

  if (target) {
    target.classList.add('active');
  }

  setMovementState(false);
}

// ==========================================
// AUTH TABS
// ==========================================

function switchAuthTab(tab) {
  const isLogin = tab === 'login';

  const loginForm = document.getElementById('form-login');
  const signupForm = document.getElementById('form-signup');

  if (loginForm) {
    loginForm.classList.toggle('hidden', !isLogin);
  }

  if (signupForm) {
    signupForm.classList.toggle('hidden', isLogin);
  }

  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');

  if (tabLogin) {
    tabLogin.classList.toggle('active', isLogin);
  }

  if (tabSignup) {
    tabSignup.classList.toggle('active', !isLogin);
  }
}

// ==========================================
// SIGNUP
// ==========================================

function handleLocalSignup(e) {
  e.preventDefault();

  const nameInput = document.getElementById('signup-name');
  const emailInput = document.getElementById('signup-email');
  const passInput = document.getElementById('signup-pass');

  if (!emailInput || !passInput) return;

  const name = nameInput
    ? nameInput.value.trim()
    : 'Hero';

  const email = emailInput.value.trim().toLowerCase();
  const pass = passInput.value;

  if (!email || !pass) {
    showAppMessage(
      "Please fill out all fields.",
      "Signup Error"
    );
    return;
  }

  const existingUser = localStorage.getItem(`user_${email}`);

  if (existingUser) {
    showAppMessage(
      "An account with this email already exists!",
      "Email Already Exists"
    );
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

    base_sprite_static:
      'assets/characters/hero-male.png',

    base_sprite_idle:
      'assets/characters/hero-male-idle.gif',

    base_sprite_walk:
      'assets/characters/hero-male-walk.gif'
  };

  localStorage.setItem(
    `user_${email}`,
    JSON.stringify(newUser)
  );

  localStorage.setItem(
    'session_user',
    email
  );

  currentUser = newUser;

  showScreen('screen-survey');
}

// ==========================================
// LOGIN
// ==========================================

function handleLocalLogin(e) {
  e.preventDefault();

  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-pass');

  if (!emailInput || !passInput) return;

  const email = emailInput.value.trim().toLowerCase();
  const pass = passInput.value;

  const userData = localStorage.getItem(
    `user_${email}`
  );

  if (!userData) {
    showAppMessage(
      "User not found!",
      "Login Error"
    );
    return;
  }

  let user;

  try {
    user = JSON.parse(userData);
  } catch (error) {
    console.error('Could not parse stored user:', error);

    showAppMessage(
      "Your saved account data is corrupted.",
      "Login Error"
    );

    return;
  }

  if (user.password !== pass) {
    showAppMessage(
      "Incorrect password!",
      "Login Error"
    );
    return;
  }

  localStorage.setItem(
    'session_user',
    email
  );

  currentUser = user;

  normalizeUserData();

  loadTrainerSession();
}

// ==========================================
// USER DATA MIGRATION / NORMALIZATION
// ==========================================

function normalizeUserData() {
  if (!currentUser) return;

  if (!currentUser.trainer_name) {
    currentUser.trainer_name = 'Hero';
  }

  if (!Number.isFinite(Number(currentUser.wage))) {
    currentUser.wage = 15.00;
  }

  if (!Number.isFinite(Number(currentUser.food_price))) {
    currentUser.food_price = 7.50;
  }

  if (!Number.isFinite(Number(currentUser.event_price))) {
    currentUser.event_price = 25.00;
  }

  if (!Number.isFinite(Number(currentUser.lvl))) {
    currentUser.lvl = 1;
  }

  if (!Number.isFinite(Number(currentUser.xp))) {
    currentUser.xp = 0;
  }

  if (!Number.isFinite(Number(currentUser.saved_total))) {
    currentUser.saved_total = 0;
  }

  if (!Array.isArray(currentUser.inventory)) {
    currentUser.inventory = ['hat_default'];
  }

  if (!currentUser.inventory.includes('hat_default')) {
    currentUser.inventory.unshift('hat_default');
  }

  if (!Array.isArray(currentUser.equipped_items)) {
    currentUser.equipped_items = [];
  }

  if (!Array.isArray(currentUser.logs)) {
    currentUser.logs = [];
  }

  if (!('vault_unlock_time' in currentUser)) {
    currentUser.vault_unlock_time = null;
  }

  if (!currentUser.base_sprite_static) {
    currentUser.base_sprite_static =
      'assets/characters/hero-male.png';
  }

  if (!currentUser.base_sprite_idle) {
    currentUser.base_sprite_idle =
      'assets/characters/hero-male-idle.gif';
  }

  if (!currentUser.base_sprite_walk) {
    currentUser.base_sprite_walk =
      'assets/characters/hero-male-walk.gif';
  }

  saveUserData();
}

// ==========================================
// FINANCIAL SURVEY
// ==========================================

function saveFinancialProfile(e) {
  if (e) {
    e.preventDefault();
  }

  if (!currentUser) {
    showScreen('screen-login');
    return;
  }

  const wageInput = document.getElementById('survey-wage');
  const foodInput = document.getElementById('survey-food');
  const eventInput = document.getElementById('survey-event');

  currentUser.wage =
    wageInput
      ? parseFloat(wageInput.value) || 15.00
      : 15.00;

  currentUser.food_price =
    foodInput
      ? parseFloat(foodInput.value) || 7.50
      : 7.50;

  currentUser.event_price =
    eventInput
      ? parseFloat(eventInput.value) || 25.00
      : 25.00;

  saveUserData();

  showScreen('screen-sprite');
}

// ==========================================
// SPRITE SELECTION
// ==========================================

function selectSprite(staticSrc, idleSrc, element) {
  selectedSpriteStaticTemp = staticSrc;
  selectedSpriteIdleTemp = idleSrc;

  document
    .querySelectorAll('.sprite-option')
    .forEach(option => {
      option.classList.remove('active');
    });

  if (element) {
    element.classList.add('active');
  }
}

function confirmSpriteSelection() {
  if (!currentUser) {
    showScreen('screen-login');
    return;
  }

  currentUser.base_sprite_static =
    selectedSpriteStaticTemp;

  currentUser.base_sprite_idle =
    selectedSpriteIdleTemp;

  saveUserData();

  loadTrainerSession();
}

// ==========================================
// LOAD SESSION
// ==========================================

function loadTrainerSession() {
  const sessionEmail =
    localStorage.getItem('session_user');

  if (!sessionEmail) {
    showScreen('screen-login');
    return;
  }

  const userData = localStorage.getItem(
    `user_${sessionEmail}`
  );

  if (!userData) {
    localStorage.removeItem('session_user');
    currentUser = null;
    showScreen('screen-login');
    return;
  }

  try {
    currentUser = JSON.parse(userData);
  } catch (error) {
    console.error(
      'Could not load saved trainer:',
      error
    );

    localStorage.removeItem('session_user');
    currentUser = null;

    showScreen('screen-login');
    return;
  }

  normalizeUserData();

  const trainerName =
    document.getElementById('hub-trainer-name');

  const trainerLevel =
    document.getElementById('hub-trainer-lvl');

  const savedAmount =
    document.getElementById('hub-saved');

  const experience =
    document.getElementById('hub-exp');

  if (trainerName) {
    trainerName.textContent =
      currentUser.trainer_name || 'Hero';
  }

  if (trainerLevel) {
    trainerLevel.textContent =
      `Level ${currentUser.lvl || 1}`;
  }

  if (savedAmount) {
    savedAmount.textContent =
      `$${parseFloat(
        currentUser.saved_total || 0
      ).toFixed(2)}`;
  }

  if (experience) {
    experience.textContent =
      `${currentUser.xp || 0} / 100`;
  }

  const settingsName =
    document.getElementById('settings-name');

  const settingsWage =
    document.getElementById('settings-wage');

  const settingsFood =
    document.getElementById('settings-food');

  const settingsEvent =
    document.getElementById('settings-event');

  if (settingsName) {
    settingsName.value =
      currentUser.trainer_name || '';
  }

  if (settingsWage) {
    settingsWage.value =
      currentUser.wage || 15.00;
  }

  if (settingsFood) {
    settingsFood.value =
      currentUser.food_price || 7.50;
  }

  if (settingsEvent) {
    settingsEvent.value =
      currentUser.event_price || 25.00;
  }

  checkLockStatus(currentUser);

  showScreen('screen-hub');
}

// ==========================================
// COOLDOWN
// ==========================================

function checkLockStatus(user) {
  const btn =
    document.getElementById('btn-engage-boss');

  if (!btn || !user) return;

  const unlockTime =
    Number(user.vault_unlock_time) || 0;

  if (unlockTime > Date.now()) {
    btn.textContent = "Cooldown Active";
    btn.style.opacity = "0.6";
  } else {
    btn.textContent = "Start Impulse Battle";
    btn.style.opacity = "1";
  }
}

function checkBossAvailability() {
  if (!currentUser) {
    showScreen('screen-login');
    return;
  }

  const unlockTime =
    Number(currentUser.vault_unlock_time) || 0;

  if (unlockTime > Date.now()) {
    showAppMessage(
      "Battles are temporarily paused during your cooling period. Check your vault timer!",
      "Cooldown Active",
      () => {
        checkVaultDirect();
      }
    );

    return;
  }

  showScreen('screen-quest');
}

// ==========================================
// 2. COMBAT & REFLECTION SYSTEM
// ==========================================

function getMonsterData(itemName, price, category) {
  const lowerName =
    String(itemName || '').toLowerCase();

  const safePrice =
    Number(price) || 0;

  if (safePrice >= 150) {
    return {
      name: "Buyer's Remorse Titan",
      sprite:
        "assets/monsters/monster-dragon-fomo.png"
    };
  }

  if (
    category === 'tech' ||
    lowerName.includes('phone') ||
    lowerName.includes('headphone')
  ) {
    return {
      name: "Upgrade Overlord",
      sprite:
        "assets/monsters/monster-beast-impulse.png"
    };
  }

  if (
    category === 'fashion' ||
    lowerName.includes('shoes') ||
    lowerName.includes('clothes')
  ) {
    return {
      name: "Fast-Fashion Phantom",
      sprite:
        "assets/monsters/monster-phantom-subscription.png"
    };
  }

  if (
    category === 'food' ||
    lowerName.includes('snack') ||
    lowerName.includes('coffee')
  ) {
    return {
      name: "Snack-Attack Slime",
      sprite:
        "assets/monsters/monster-gremlin-splurge.png"
    };
  }

  if (
    category === 'sub' ||
    lowerName.includes('subscription')
  ) {
    return {
      name: "Recurring Subscription Imp",
      sprite:
        "assets/monsters/monster-phantom-subscription.png"
    };
  }

  return safePrice < 30
    ? {
        name: "Splurge Gremlin",
        sprite:
          "assets/monsters/monster-gremlin-splurge.png"
      }
    : {
        name: "FOMO Beast",
        sprite:
          "assets/monsters/monster-beast-impulse.png"
      };
}

// ==========================================
// START BATTLE
// ==========================================

function startBattle() {
  if (!currentUser) {
    showScreen('screen-login');
    return;
  }

  const nameInput =
    document.getElementById('target-name');

  const priceInput =
    document.getElementById('target-price');

  if (!nameInput || !priceInput) {
    console.error(
      'Battle inputs target-name / target-price were not found.'
    );
    return;
  }

  const name =
    nameInput.value.trim();

  const price =
    parseFloat(priceInput.value);

  const categorySelect =
    document.getElementById('target-category');

  const category =
    categorySelect
      ? categorySelect.value
      : 'general';

  if (
    !name ||
    !Number.isFinite(price) ||
    price <= 0
  ) {
    showAppMessage(
      "Please enter a valid item name and price.",
      "Input Error"
    );
    return;
  }

  const playerLvl =
    getCurrentLevel();

  battleState.itemName = name;
  battleState.price = price;
  battleState.category = category;

  battleState.maxEnemyHP =
    price > 100 ? 150 : 100;

  battleState.enemyHP =
    battleState.maxEnemyHP;

  battleState.maxPlayerHP =
    getPlayerMaxHP(playerLvl);

  battleState.playerHP =
    battleState.maxPlayerHP;

  battleState.isSubmitting = false;

  const monster =
    getMonsterData(
      name,
      price,
      category
    );

  const enemyName =
    document.getElementById('enemy-name');

  const enemySprite =
    document.getElementById('enemy-sprite');

  const playerBattleName =
    document.getElementById(
      'player-battle-name'
    );

  const playerBattleLevel =
    document.getElementById(
      'player-battle-lvl'
    );

  if (enemyName) {
    enemyName.textContent =
      monster.name;
  }

  if (enemySprite) {
    enemySprite.innerHTML = '';

    const img =
      document.createElement('img');

    img.src = monster.sprite;
    img.alt = monster.name;
    img.className = 'character-img';

    enemySprite.appendChild(img);
  }

  if (playerBattleName) {
    playerBattleName.textContent =
      currentUser.trainer_name || 'Hero';
  }

  if (playerBattleLevel) {
    playerBattleLevel.textContent =
      `Lv ${playerLvl}`;
  }

  updateHPUI();

  setDialogue(
    `A wild ${monster.name} appears! Choose a reflection tactic to fight back.`
  );

  showAttackMenu();

  showScreen('screen-battle');
}

// ==========================================
// HP UI
// ==========================================

function updateHPUI() {
  const enemyHPBar =
    document.getElementById('enemy-hp');

  const playerHPBar =
    document.getElementById('player-hp');

  if (enemyHPBar) {
    const enemyPct =
      battleState.maxEnemyHP > 0
        ? Math.max(
            0,
            Math.min(
              100,
              (battleState.enemyHP /
                battleState.maxEnemyHP) *
                100
            )
          )
        : 0;

    enemyHPBar.style.width =
      `${enemyPct}%`;
  }

  if (playerHPBar) {
    const playerPct =
      battleState.maxPlayerHP > 0
        ? Math.max(
            0,
            Math.min(
              100,
              (battleState.playerHP /
                battleState.maxPlayerHP) *
                100
            )
          )
        : 0;

    playerHPBar.style.width =
      `${playerPct}%`;
  }
}

// ==========================================
// BATTLE DIALOGUE
// ==========================================

function setDialogue(msg) {
  const dialogue =
    document.getElementById('battle-text');

  if (dialogue) {
    dialogue.textContent = msg;
  }
}

// ==========================================
// ATTACK MENU
// ==========================================

function showAttackMenu() {
  battleState.isSubmitting = false;

  const container =
    document.getElementById('quiz-answers');

  if (!container) return;

  container.innerHTML = `
    <div class="attack-grid">

      <button
        class="attack-btn"
        onclick="startQuestionFlow('necessity')"
      >
        Necessity Check
        <small>Evaluate need vs. want</small>
      </button>

      <button
        class="attack-btn"
        onclick="startQuestionFlow('utility')"
      >
        Utility Rate
        <small>Calculate cost-per-use</small>
      </button>

      <button
        class="attack-btn"
        onclick="startQuestionFlow('wait')"
      >
        Opportunity Cost
        <small>Explore alternative uses</small>
      </button>

      <button
        class="attack-btn flee"
        onclick="giveInAndSpend()"
      >
        Give In & Buy
        <small>Resign and purchase</small>
      </button>

    </div>
  `;
}

// ==========================================
// QUESTION FLOW
// ==========================================

function startQuestionFlow(attackType) {
  if (battleState.isSubmitting) return;

  const container =
    document.getElementById('quiz-answers');

  if (!container) return;

  const pool =
    REFLECTION_QUESTIONS[attackType] ||
    REFLECTION_QUESTIONS.necessity;

  const question =
    pool[
      Math.floor(
        Math.random() * pool.length
      )
    ];

  setDialogue(question);

  container.innerHTML = `
    <div class="input-field">
      <input
        type="text"
        id="user-reflection-single"
        placeholder="Type your answer here..."
        autocomplete="off"
      />
    </div>

    <button
      id="btn-submit-reflection"
      class="btn btn-primary"
      onclick="processPlayerAttack('${attackType}')"
    >
      Submit Reflection
    </button>
  `;

  const input =
    document.getElementById(
      'user-reflection-single'
    );

  if (input) {
    input.focus();

    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        processPlayerAttack(attackType);
      }
    });
  }
}

// ==========================================
// PROCESS PLAYER ATTACK
// ==========================================

function processPlayerAttack(attackType) {
  if (battleState.isSubmitting) return;

  const inputEl =
    document.getElementById(
      'user-reflection-single'
    );

  const submitBtn =
    document.getElementById(
      'btn-submit-reflection'
    );

  if (!inputEl) return;

  const ans =
    inputEl.value.trim();

  if (!ans) {
    showAppMessage(
      "Please type an answer first!",
      "Input Required"
    );
    return;
  }

  battleState.isSubmitting = true;

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.5";
    submitBtn.textContent = "Processing...";
  }

  const playerLvl =
    getCurrentLevel();

  const baseDmg =
    Math.floor(
      Math.random() * 15
    ) + 35;

  const dmgMultiplier =
    getPlayerDamageMultiplier(
      playerLvl
    );

  const dmg =
    Math.floor(
      baseDmg * dmgMultiplier
    );

  battleState.enemyHP =
    Math.max(
      0,
      battleState.enemyHP - dmg
    );

  updateHPUI();

  setDialogue(
    `Your mindful reflection hit the impulse for ${dmg} damage!`
  );

  if (battleState.enemyHP <= 0) {
    setTimeout(
      victorySavedMoney,
      1200
    );
  } else {
    setTimeout(
      () => {
        monsterRealityCounter(
          attackType
        );
      },
      1500
    );
  }
}

// ==========================================
// MONSTER COUNTER ATTACK
// ==========================================

function monsterRealityCounter(attackType) {
  const price =
    Number(battleState.price) || 0;

  const wage =
    currentUser
      ? Number(currentUser.wage) || 15.00
      : 15.00;

  const food =
    currentUser
      ? Number(currentUser.food_price) || 7.50
      : 7.50;

  const eventVal =
    currentUser
      ? Number(currentUser.event_price) || 25.00
      : 25.00;

  const hoursWorked =
    wage > 0
      ? (price / wage).toFixed(1)
      : '0.0';

  const mealsCount =
    food > 0
      ? Math.floor(price / food)
      : 0;

  const outingsCount =
    eventVal > 0
      ? (price / eventVal).toFixed(1)
      : '0.0';

  const counterAttacks = [
    `The Monster strikes back! "This costs $${price.toFixed(2)}—that is ${hoursWorked} hours of work at your wage!"`,

    `The Monster counters! "That $${price.toFixed(2)} equals ${mealsCount} full meals you could buy!"`,

    `The Monster resists! "This purchase equals ${outingsCount} fun social outings with friends!"`
  ];

  const chosenCounter =
    counterAttacks[
      Math.floor(
        Math.random() *
        counterAttacks.length
      )
    ];

  const playerDmg =
    Math.floor(
      Math.random() * 10
    ) + 15;

  battleState.playerHP =
    Math.max(
      0,
      battleState.playerHP - playerDmg
    );

  updateHPUI();

  setDialogue(
    chosenCounter
  );

  if (battleState.playerHP <= 0) {
    setTimeout(() => {
      showAppMessage(
        "You were overwhelmed by the purchase impulse!",
        "Battle Defeat",
        () => {
          giveInAndSpend();
        }
      );
    }, 1500);
  } else {
    setTimeout(
      showAttackMenu,
      2500
    );
  }
}

// ==========================================
// VICTORY
// ==========================================

function victorySavedMoney() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 80,
      spread: 70
    });
  }

  showAppMessage(
    `Great job! You beat the impulse and saved $${battleState.price.toFixed(2)}.`,
    "Victory!",
    () => {
      if (currentUser) {
        currentUser.vault_unlock_time =
          Date.now() +
          (15 * 60 * 1000);
      }

      updateTrainerStats(
        50,
        battleState.price,
        {
          name: battleState.itemName,
          price: battleState.price,
          type: 'SAVED',
          date: new Date().toLocaleDateString()
        }
      );

      checkVaultDirect();
    }
  );
}

// ==========================================
// GIVE IN / PURCHASE
// ==========================================

function giveInAndSpend() {
  if (!battleState.itemName) {
    showAppMessage(
      "There is no active purchase battle.",
      "Purchase Error"
    );
    return;
  }

  showAppMessage(
    `You purchased ${battleState.itemName} for $${battleState.price.toFixed(2)}.`,
    "Purchase Confirmed",
    () => {
      updateTrainerStats(
        10,
        0,
        {
          name: battleState.itemName,
          price: battleState.price,
          type: 'SPENT',
          date: new Date().toLocaleDateString()
        }
      );

      checkVaultDirect();
    }
  );
}

// ==========================================
// 3. SETTINGS & ACCOUNT ACTIONS
// ==========================================

function updateTrainerName() {
  const input =
    document.getElementById(
      'settings-name'
    );

  if (!input) return;

  const newName =
    input.value.trim();

  if (!newName) {
    showAppMessage(
      "Please enter a valid name.",
      "Settings Error"
    );
    return;
  }

  if (!currentUser) {
    showScreen('screen-login');
    return;
  }

  currentUser.trainer_name =
    newName;

  saveUserData();

  showAppMessage(
    "Trainer name saved successfully.",
    "Settings Updated",
    () => {
      loadTrainerSession();
    }
  );
}

// ==========================================
// UPDATE FINANCIAL SETTINGS
// ==========================================

function updateMetricsSettings() {
  if (!currentUser) {
    showScreen('screen-login');
    return;
  }

  const wageInput =
    document.getElementById(
      'settings-wage'
    );

  const foodInput =
    document.getElementById(
      'settings-food'
    );

  const eventInput =
    document.getElementById(
      'settings-event'
    );

  const wage =
    wageInput
      ? parseFloat(wageInput.value)
      : 15.00;

  const food =
    foodInput
      ? parseFloat(foodInput.value)
      : 7.50;

  const eventVal =
    eventInput
      ? parseFloat(eventInput.value)
      : 25.00;

  currentUser.wage =
    Number.isFinite(wage) && wage > 0
      ? wage
      : 15.00;

  currentUser.food_price =
    Number.isFinite(food) && food > 0
      ? food
      : 7.50;

  currentUser.event_price =
    Number.isFinite(eventVal) && eventVal > 0
      ? eventVal
      : 25.00;

  saveUserData();

  showAppMessage(
    "Financial metrics saved successfully.",
    "Settings Updated",
    () => {
      loadTrainerSession();
    }
  );
}

// ==========================================
// DELETE ACCOUNT
// ==========================================

function deleteAccount() {
  if (!currentUser) return;

  const confirmed =
    window.confirm(
      "Are you sure you want to delete your account? This will erase all your progress."
    );

  if (!confirmed) return;

  localStorage.removeItem(
    `user_${currentUser.email}`
  );

  localStorage.removeItem(
    'session_user'
  );

  currentUser = null;

  showAppMessage(
    "Account deleted.",
    "Account Status",
    () => {
      showScreen('screen-login');
    }
  );
}

// ==========================================
// UPDATE TRAINER STATS
// ==========================================

function updateTrainerStats(
  xpGained,
  goldSaved,
  logEntry = null
) {
  if (!currentUser) return;

  let newXp =
    (Number(currentUser.xp) || 0) +
    (Number(xpGained) || 0);

  let newLvl =
    Math.max(
      1,
      Number(currentUser.lvl) || 1
    );

  let newSaved =
    (Number(currentUser.saved_total) || 0) +
    (Number(goldSaved) || 0);

  let newLogs =
    Array.isArray(currentUser.logs)
      ? currentUser.logs
      : [];

  if (logEntry) {
    newLogs.unshift(logEntry);
  }

  // Support multiple level-ups if XP ever exceeds 200+.
  let didLevelUp = false;

  while (newXp >= 100) {
    newXp -= 100;
    newLvl += 1;
    didLevelUp = true;
  }

  currentUser.xp =
    newXp;

  currentUser.lvl =
    newLvl;

  currentUser.saved_total =
    Math.max(0, newSaved);

  currentUser.logs =
    newLogs;

  saveUserData();

  if (didLevelUp) {
    const newMaxHP =
      getPlayerMaxHP(newLvl);

    showAppMessage(
      `You reached Level ${newLvl}! Your Max HP increased to ${newMaxHP} and attack power increased by 10%!`,
      "Level Up!"
    );
  }

  loadTrainerSession();
}

// ==========================================
// LOGOUT
// ==========================================

function logoutTrainer() {
  localStorage.removeItem(
    'session_user'
  );

  currentUser = null;

  if (battleState.timerInterval) {
    clearInterval(
      battleState.timerInterval
    );

    battleState.timerInterval = null;
  }

  showScreen('screen-login');
}

// ==========================================
// 4. VAULT & HISTORY LOGS
// ==========================================

function startVaultTimer(unlockTimestamp) {
  if (battleState.timerInterval) {
    clearInterval(
      battleState.timerInterval
    );

    battleState.timerInterval = null;
  }

  const vaultTimer =
    document.getElementById(
      'vault-timer'
    );

  if (!vaultTimer) return;

  function updateDisplay() {
    const remaining =
      Number(unlockTimestamp) -
      Date.now();

    if (remaining <= 0) {
      clearInterval(
        battleState.timerInterval
      );

      battleState.timerInterval = null;

      vaultTimer.textContent =
        "Ready";

      if (currentUser) {
        currentUser.vault_unlock_time =
          null;

        saveUserData();

        checkLockStatus(
          currentUser
        );
      }

      return;
    }

    const mins =
      Math.floor(
        remaining /
        (1000 * 60)
      );

    const secs =
      Math.floor(
        (remaining %
          (1000 * 60)) /
          1000
      );

    vaultTimer.textContent =
      `${mins
        .toString()
        .padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
  }

  updateDisplay();

  battleState.timerInterval =
    setInterval(
      updateDisplay,
      1000
    );
}

// ==========================================
// OPEN VAULT
// ==========================================

function checkVaultDirect() {
  if (!currentUser) {
    showScreen('screen-login');
    return;
  }

  const unlockTime =
    Number(
      currentUser.vault_unlock_time
    ) || 0;

  const timer =
    document.getElementById(
      'vault-timer'
    );

  if (unlockTime > Date.now()) {
    startVaultTimer(
      unlockTime
    );
  } else {
    if (timer) {
      timer.textContent =
        "Ready";
    }

    if (
      currentUser.vault_unlock_time !== null
    ) {
      currentUser.vault_unlock_time =
        null;

      saveUserData();
    }

    checkLockStatus(
      currentUser
    );
  }

  renderHistoryLogs(
    currentUser.logs || []
  );

  showScreen('screen-vault');
}

// ==========================================
// HISTORY LOGS
// ==========================================

function renderHistoryLogs(logs) {
  const container =
    document.getElementById(
      'history-list'
    );

  if (!container) return;

  container.innerHTML = '';

  if (
    !Array.isArray(logs) ||
    logs.length === 0
  ) {
    container.innerHTML =
      `<p class="empty-log">No transactions recorded yet.</p>`;

    return;
  }

  logs.forEach(item => {
    if (!item) return;

    const div =
      document.createElement('div');

    const isSaved =
      item.type === 'SAVED';

    div.className =
      `log-item ${isSaved ? 'saved' : 'spent'}`;

    const name =
      document.createElement('div');

    const logName =
      document.createElement('div');

    logName.className =
      'log-name';

    logName.textContent =
      item.name || 'Unknown Item';

    const subText =
      document.createElement('div');

    subText.className =
      'sub-text';

    subText.textContent =
      item.date || '';

    name.appendChild(logName);
    name.appendChild(subText);

    const value =
      document.createElement('div');

    value.className =
      `log-val ${isSaved ? 'saved' : 'spent'}`;

    const numericPrice =
      parseFloat(item.price) || 0;

    value.textContent =
      `${isSaved ? '+' : '-'}$${numericPrice.toFixed(2)}`;

    div.appendChild(name);
    div.appendChild(value);

    container.appendChild(div);
  });
}

// ==========================================
// 5. SHOP SYSTEM
// ==========================================

function openShop() {
  if (!currentUser) {
    showScreen('screen-login');
    return;
  }

  const goldValue =
    document.getElementById(
      'shop-gold-val'
    );

  if (goldValue) {
    goldValue.textContent =
      parseFloat(
        currentUser.saved_total || 0
      ).toFixed(2);
  }

  updateShopButtons(
    currentUser
  );

  showScreen('screen-shop');
}

// ==========================================
// FIND CATALOG ITEM BY EQUIPPED PATH
// ==========================================

function findCatalogItemByPath(path) {
  if (!path) return null;

  return Object.values(
    ITEM_CATALOG
  ).find(item =>
    item.path === path ||
    item.idlePath === path
  ) || null;
}

// ==========================================
// UPDATE SHOP BUTTONS
// ==========================================

function updateShopButtons(user) {
  if (!user) return;

  const equipped =
    Array.isArray(user.equipped_items)
      ? user.equipped_items
      : [];

  const inventory =
    Array.isArray(user.inventory)
      ? user.inventory
      : ['hat_default'];

  const starterBtn =
    document.getElementById(
      'btn-hat_default'
    );

  if (starterBtn) {
    starterBtn.textContent =
      equipped.length === 0
        ? "Equipped"
        : "Unequip All";

    starterBtn.className =
      equipped.length === 0
        ? "btn btn-sm btn-equipped"
        : "btn btn-secondary btn-sm";
  }

  Object.keys(
    ITEM_CATALOG
  ).forEach(itemId => {
    const btn =
      document.getElementById(
        `btn-${itemId}`
      );

    if (!btn) return;

    const itemData =
      ITEM_CATALOG[itemId];

    const isOwned =
      inventory.includes(
        itemId
      );

    const isEquipped =
      equipped.includes(
        itemData.path
      ) ||
      equipped.includes(
        itemData.idlePath
      );

    if (isEquipped) {
      btn.textContent =
        "Unequip";

      btn.className =
        "btn btn-sm btn-equipped";
    } else if (isOwned) {
      btn.textContent =
        "Equip";

      btn.className =
        "btn btn-secondary btn-sm";
    } else {
      btn.textContent =
        "Unlock";

      btn.className =
        "btn btn-primary btn-sm";
    }
  });
}

// ==========================================
// BUY / EQUIP / UNEQUIP
// ==========================================

function buyOrEquip(
  itemId,
  price,
  spritePath
) {
  if (!currentUser) {
    showScreen('screen-login');
    return;
  }

  let equipped =
    Array.isArray(
      currentUser.equipped_items
    )
      ? [
          ...currentUser.equipped_items
        ]
      : [];

  let inventory =
    Array.isArray(
      currentUser.inventory
    )
      ? [
          ...currentUser.inventory
        ]
      : ['hat_default'];

  let savedTotal =
    parseFloat(
      currentUser.saved_total || 0
    );

  // ----------------------------------------
  // DEFAULT LOOK
  // ----------------------------------------

  if (itemId === 'hat_default') {
    currentUser.equipped_items =
      [];

    saveUserData();

    loadTrainerSession();

    openShop();

    return;
  }

  const targetItem =
    ITEM_CATALOG[itemId];

  if (!targetItem) {
    console.warn(
      `Unknown shop item: ${itemId}`
    );
    return;
  }

  const isOwned =
    inventory.includes(
      itemId
    );

  // ----------------------------------------
  // ALREADY OWNED
  // ----------------------------------------

  if (isOwned) {
    const isEquipped =
      equipped.includes(
        targetItem.path
      ) ||
      equipped.includes(
        targetItem.idlePath
      );

    if (isEquipped) {
      // Unequip this item.
      equipped =
        equipped.filter(
          equippedPath =>
            equippedPath !==
              targetItem.path &&
            equippedPath !==
              targetItem.idlePath
        );
    } else {
      // Remove any other item from
      // the same category.
      equipped =
        equipped.filter(
          equippedPath => {
            const catalogItem =
              findCatalogItemByPath(
                equippedPath
              );

            return (
              !catalogItem ||
              catalogItem.category !==
                targetItem.category
            );
          }
        );

      // Equip the static path.
      equipped.push(
        spritePath ||
          targetItem.path
      );
    }
  }

  // ----------------------------------------
  // NOT OWNED: PURCHASE
  // ----------------------------------------

  else {
    const itemPrice =
      Number(price) || 0;

    if (savedTotal < itemPrice) {
      showAppMessage(
        "You need more saved money to unlock this item!",
        "Insufficient Funds"
      );

      return;
    }

    savedTotal -=
      itemPrice;

    inventory.push(
      itemId
    );

    // Remove another item from
    // the same category.
    equipped =
      equipped.filter(
        equippedPath => {
          const catalogItem =
            findCatalogItemByPath(
              equippedPath
            );

          return (
            !catalogItem ||
            catalogItem.category !==
              targetItem.category
          );
        }
      );

    equipped.push(
      spritePath ||
        targetItem.path
    );

    currentUser.equipped_items =
      equipped;

    currentUser.inventory =
      inventory;

    currentUser.saved_total =
      Math.max(
        0,
        savedTotal
      );

    saveUserData();

    loadTrainerSession();

    showAppMessage(
      `${targetItem.name} unlocked and equipped!`,
      "Shop Success",
      () => {
        openShop();
      }
    );

    return;
  }

  // ----------------------------------------
  // SAVE EQUIP/UNEQUIP
  // ----------------------------------------

  currentUser.equipped_items =
    equipped;

  currentUser.inventory =
    inventory;

  currentUser.saved_total =
    Math.max(
      0,
      savedTotal
    );

  saveUserData();

  loadTrainerSession();

  openShop();
}

// ==========================================
// 6. INITIALIZATION & EVENT LISTENERS
// ==========================================

window.addEventListener(
  'DOMContentLoaded',
  () => {

    // --------------------------------------
    // AUTH FORMS
    // --------------------------------------

    const signupForm =
      document.getElementById(
        'form-signup'
      );

    if (signupForm) {
      signupForm.addEventListener(
        'submit',
        handleLocalSignup
      );
    }

    const loginForm =
      document.getElementById(
        'form-login'
      );

    if (loginForm) {
      loginForm.addEventListener(
        'submit',
        handleLocalLogin
      );
    }

    // --------------------------------------
    // AUTH TABS
    // --------------------------------------

    const tabLogin =
      document.getElementById(
        'tab-login'
      );

    const tabSignup =
      document.getElementById(
        'tab-signup'
      );

    if (tabLogin) {
      tabLogin.addEventListener(
        'click',
        () => {
          switchAuthTab(
            'login'
          );
        }
      );
    }

    if (tabSignup) {
      tabSignup.addEventListener(
        'click',
        () => {
          switchAuthTab(
            'signup'
          );
        }
      );
    }

    // --------------------------------------
    // MOVEMENT CONTROLS
    // --------------------------------------

    const moveKeys = [
      'KeyW',
      'KeyA',
      'KeyS',
      'KeyD',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight'
    ];

    const activeKeys =
      new Set();

    window.addEventListener(
      'keydown',
      event => {
        if (
          moveKeys.includes(
            event.code
          )
        ) {
          activeKeys.add(
            event.code
          );

          setMovementState(
            true
          );

          // Prevent page scrolling
          // with arrow keys.
          if (
            event.code.startsWith(
              'Arrow'
            )
          ) {
            event.preventDefault();
          }
        }
      }
    );

    window.addEventListener(
      'keyup',
      event => {
        if (
          moveKeys.includes(
            event.code
          )
        ) {
          activeKeys.delete(
            event.code
          );

          if (
            activeKeys.size === 0
          ) {
            setMovementState(
              false
            );
          }
        }
      }
    );

    // --------------------------------------
    // RESET MOVEMENT IF WINDOW LOSES FOCUS
    // --------------------------------------

    window.addEventListener(
      'blur',
      () => {
        activeKeys.clear();
        setMovementState(false);
      }
    );

    // --------------------------------------
    // START APPLICATION
    // --------------------------------------

    loadTrainerSession();

    startGlobalAvatarLoop();
  }
);

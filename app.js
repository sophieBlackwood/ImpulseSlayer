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
      // The global animation loop will pick up the loaded image.
    };

    img.onerror = () => {
      console.warn(`Failed to load image: ${src}`);
    };

    img.src = src;
    imageCache[src] = img;
  }

  return imageCache[src];
}

// ==========================================
// UTILITY HELPERS
// ==========================================

function getElement(id) {
  return document.getElementById(id);
}

function safeNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getCurrentUserName() {
  return currentUser?.trainer_name || 'Hero';
}

function getPlayerMaxHP(level) {
  const safeLevel = Math.max(1, Number(level) || 1);
  return 100 + ((safeLevel - 1) * 15);
}

function getPlayerDamageMultiplier(level) {
  const safeLevel = Math.max(1, Number(level) || 1);
  return 1 + ((safeLevel - 1) * 0.10);
}

// ==========================================
// IN-APP POPUP / MODAL SYSTEM
// ==========================================

function showAppMessage(message, title = "Notification", callback = null) {
  let modal = getElement('custom-app-modal');

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

  const titleElement = getElement('app-modal-title');
  const messageElement = getElement('app-modal-msg');
  const buttonElement = getElement('app-modal-btn');

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
// LOCAL STORAGE
// ==========================================

function saveUserData() {
  if (!currentUser || !currentUser.email) {
    return;
  }

  try {
    localStorage.setItem(
      `user_${currentUser.email}`,
      JSON.stringify(currentUser)
    );
  } catch (error) {
    console.error('Unable to save user data:', error);

    showAppMessage(
      'Your progress could not be saved. Your browser storage may be full or disabled.',
      'Save Error'
    );
  }
}

function getStoredUser(email) {
  if (!email) return null;

  try {
    const userData = localStorage.getItem(`user_${email}`);

    if (!userData) {
      return null;
    }

    return JSON.parse(userData);
  } catch (error) {
    console.error('Unable to read stored user:', error);
    return null;
  }
}

// ==========================================
// SYNCHRONIZED CANVAS RENDERING SYSTEM
// ==========================================

function renderCharacterAvatar(
  canvasId,
  user,
  forceStationary = false
) {
  const canvas = getElement(canvasId);

  if (!canvas || !user) {
    return;
  }

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return;
  }

  const isMoving = forceStationary
    ? false
    : battleState.isMoving;

  let baseSprite =
    user.base_sprite_static ||
    'assets/characters/hero-male.png';

  if (!forceStationary) {
    baseSprite = isMoving
      ? (
          user.base_sprite_walk ||
          'assets/characters/hero-male-walk.gif'
        )
      : (
          user.base_sprite_idle ||
          'assets/characters/hero-male-idle.gif'
        );
  }

  const layers = [baseSprite];

  const equippedList = Array.isArray(user.equipped_items)
    ? user.equipped_items
    : [];

  equippedList.forEach(path => {
    if (!path || path === 'BASE') {
      return;
    }

    let activeOverlayPath = path;

    const catalogItem = Object.values(ITEM_CATALOG).find(
      item =>
        item.path === path ||
        item.idlePath === path
    );

    if (catalogItem) {
      if (forceStationary) {
        activeOverlayPath = catalogItem.path;
      } else {
        activeOverlayPath =
          !isMoving && catalogItem.idlePath
            ? catalogItem.idlePath
            : catalogItem.path;
      }
    }

    layers.push(activeOverlayPath);
  });

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  layers.forEach(src => {
    const img = getCachedImage(src);

    if (
      img &&
      img.complete &&
      img.naturalWidth > 0
    ) {
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

function startGlobalAvatarLoop() {
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
  battleState.isMoving = Boolean(moving);
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

  const target = getElement(id);

  if (target) {
    target.classList.add('active');
  } else {
    console.warn(`Screen not found: ${id}`);
  }

  setMovementState(false);
}

function switchAuthTab(tab) {
  const isLogin = tab === 'login';

  const loginForm = getElement('form-login');
  const signupForm = getElement('form-signup');

  if (loginForm) {
    loginForm.classList.toggle(
      'hidden',
      !isLogin
    );
  }

  if (signupForm) {
    signupForm.classList.toggle(
      'hidden',
      isLogin
    );
  }

  const tabLogin = getElement('tab-login');
  const tabSignup = getElement('tab-signup');

  if (tabLogin) {
    tabLogin.classList.toggle(
      'active',
      isLogin
    );
  }

  if (tabSignup) {
    tabSignup.classList.toggle(
      'active',
      !isLogin
    );
  }
}

function handleLocalSignup(event) {
  event.preventDefault();

  const nameInput = getElement('signup-name');
  const emailInput = getElement('signup-email');
  const passInput = getElement('signup-pass');

  if (!emailInput || !passInput) {
    return;
  }

  const name = nameInput
    ? nameInput.value.trim()
    : 'Hero';

  const email = emailInput.value
    .trim()
    .toLowerCase();

  const pass = passInput.value;

  if (!email || !pass) {
    showAppMessage(
      'Please fill out all fields.',
      'Signup Error'
    );
    return;
  }

  const existingUser = getStoredUser(email);

  if (existingUser) {
    showAppMessage(
      'An account with this email already exists!',
      'Email Already Exists'
    );
    return;
  }

  const newUser = {
    email,
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

  try {
    localStorage.setItem(
      `user_${email}`,
      JSON.stringify(newUser)
    );

    localStorage.setItem(
      'session_user',
      email
    );
  } catch (error) {
    console.error('Signup storage error:', error);

    showAppMessage(
      'Unable to create your account. Please check your browser storage settings.',
      'Signup Error'
    );

    return;
  }

  currentUser = newUser;

  showScreen('screen-survey');
}

function handleLocalLogin(event) {
  event.preventDefault();

  const emailInput = getElement('login-email');
  const passInput = getElement('login-pass');

  if (!emailInput || !passInput) {
    return;
  }

  const email = emailInput.value
    .trim()
    .toLowerCase();

  const pass = passInput.value;

  const user = getStoredUser(email);

  if (!user) {
    showAppMessage(
      'User not found!',
      'Login Error'
    );
    return;
  }

  if (user.password !== pass) {
    showAppMessage(
      'Incorrect password!',
      'Login Error'
    );
    return;
  }

  try {
    localStorage.setItem(
      'session_user',
      email
    );
  } catch (error) {
    console.error('Session storage error:', error);

    showAppMessage(
      'Unable to create a login session.',
      'Login Error'
    );

    return;
  }

  currentUser = user;

  loadTrainerSession();
}

function saveFinancialProfile(event) {
  if (event) {
    event.preventDefault();
  }

  if (!currentUser) {
    showScreen('screen-login');
    return;
  }

  const wageInput = getElement('survey-wage');
  const foodInput = getElement('survey-food');
  const eventInput = getElement('survey-event');

  currentUser.wage =
    safeNumber(
      wageInput?.value,
      15.00
    ) || 15.00;

  currentUser.food_price =
    safeNumber(
      foodInput?.value,
      7.50
    ) || 7.50;

  currentUser.event_price =
    safeNumber(
      eventInput?.value,
      25.00
    ) || 25.00;

  saveUserData();

  showScreen('screen-sprite');
}

function selectSprite(
  staticSrc,
  idleSrc,
  element
) {
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

function loadTrainerSession() {
  const sessionEmail =
    localStorage.getItem('session_user');

  if (!sessionEmail) {
    currentUser = null;
    showScreen('screen-login');
    return;
  }

  const userData =
    getStoredUser(sessionEmail);

  if (!userData) {
    localStorage.removeItem('session_user');
    currentUser = null;
    showScreen('screen-login');
    return;
  }

  currentUser = userData;

  // Ensure older accounts receive newer fields.
  if (!Array.isArray(currentUser.equipped_items)) {
    currentUser.equipped_items = [];
  }

  if (!Array.isArray(currentUser.inventory)) {
    currentUser.inventory = ['hat_default'];
  }

  if (!Array.isArray(currentUser.logs)) {
    currentUser.logs = [];
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

  const hubTrainerName =
    getElement('hub-trainer-name');

  const hubTrainerLvl =
    getElement('hub-trainer-lvl');

  const hubSaved =
    getElement('hub-saved');

  const hubExp =
    getElement('hub-exp');

  const settingsName =
    getElement('settings-name');

  const settingsWage =
    getElement('settings-wage');

  const settingsFood =
    getElement('settings-food');

  const settingsEvent =
    getElement('settings-event');

  if (hubTrainerName) {
    hubTrainerName.textContent =
      currentUser.trainer_name || 'Hero';
  }

  if (hubTrainerLvl) {
    hubTrainerLvl.textContent =
      `Level ${currentUser.lvl || 1}`;
  }

  if (hubSaved) {
    hubSaved.textContent =
      `$${safeNumber(
        currentUser.saved_total
      ).toFixed(2)}`;
  }

  if (hubExp) {
    hubExp.textContent =
      `${currentUser.xp || 0} / 100`;
  }

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

function checkLockStatus(user) {
  const button =
    getElement('btn-engage-boss');

  if (!button) {
    return;
  }

  const unlockTime =
    Number(user?.vault_unlock_time) || 0;

  if (
    unlockTime > Date.now()
  ) {
    button.textContent =
      'Cooldown Active';

    button.style.opacity = '0.6';
  } else {
    button.textContent =
      'Start Impulse Battle';

    button.style.opacity = '1';
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
      'Battles are temporarily paused during your cooling period. Check your vault timer!',
      'Cooldown Active',
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

function getMonsterData(
  itemName,
  price,
  category
) {
  const lowerName =
    String(itemName || '').toLowerCase();

  if (price >= 150) {
    return {
      name: "Buyer's Remorse Titan",
      sprite:
        'assets/monsters/monster-dragon-fomo.png'
    };
  }

  if (
    category === 'tech' ||
    lowerName.includes('phone') ||
    lowerName.includes('headphone')
  ) {
    return {
      name: 'Upgrade Overlord',
      sprite:
        'assets/monsters/monster-beast-impulse.png'
    };
  }

  if (
    category === 'fashion' ||
    lowerName.includes('shoes') ||
    lowerName.includes('clothes')
  ) {
    return {
      name: 'Fast-Fashion Phantom',
      sprite:
        'assets/monsters/monster-phantom-subscription.png'
    };
  }

  if (
    category === 'food' ||
    lowerName.includes('snack') ||
    lowerName.includes('coffee')
  ) {
    return {
      name: 'Snack-Attack Slime',
      sprite:
        'assets/monsters/monster-gremlin-splurge.png'
    };
  }

  if (
    category === 'sub' ||
    lowerName.includes('subscription')
  ) {
    return {
      name: 'Recurring Subscription Imp',
      sprite:
        'assets/monsters/monster-phantom-subscription.png'
    };
  }

  return price < 30
    ? {
        name: 'Splurge Gremlin',
        sprite:
          'assets/monsters/monster-gremlin-splurge.png'
      }
    : {
        name: 'FOMO Beast',
        sprite:
          'assets/monsters/monster-beast-impulse.png'
      };
}

function startBattle() {
  if (!currentUser) {
    showScreen('screen-login');
    return;
  }

  const nameInput =
    getElement('target-name');

  const priceInput =
    getElement('target-price');

  if (!nameInput || !priceInput) {
    console.error(
      'Battle inputs are missing from the HTML.'
    );
    return;
  }

  const name =
    nameInput.value.trim();

  const price =
    safeNumber(priceInput.value, NaN);

  const categorySelect =
    getElement('target-category');

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
      'Please enter a valid item name and price.',
      'Input Error'
    );
    return;
  }

  const playerLvl =
    Number(currentUser.lvl) || 1;

  battleState.itemName = name;
  battleState.price = price;
  battleState.category = category;

  battleState.maxEnemyHP =
    price > 100
      ? 150
      : 100;

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
    getElement('enemy-name');

  const enemySprite =
    getElement('enemy-sprite');

  const playerBattleName =
    getElement('player-battle-name');

  const playerBattleLvl =
    getElement('player-battle-lvl');

  if (enemyName) {
    enemyName.textContent =
      monster.name;
  }

  if (enemySprite) {
    enemySprite.innerHTML = '';

    const image =
      document.createElement('img');

    image.src = monster.sprite;
    image.alt = monster.name;
    image.className = 'character-img';

    enemySprite.appendChild(image);
  }

  if (playerBattleName) {
    playerBattleName.textContent =
      getCurrentUserName();
  }

  if (playerBattleLvl) {
    playerBattleLvl.textContent =
      `Lv ${playerLvl}`;
  }

  updateHPUI();

  setDialogue(
    `A wild ${monster.name} appears! Choose a reflection tactic to fight back.`
  );

  showAttackMenu();

  showScreen('screen-battle');
}

function updateHPUI() {
  const enemyHP =
    getElement('enemy-hp');

  const playerHP =
    getElement('player-hp');

  const enemyPct =
    battleState.maxEnemyHP > 0
      ? Math.max(
          0,
          Math.min(
            100,
            (
              battleState.enemyHP /
              battleState.maxEnemyHP
            ) * 100
          )
        )
      : 0;

  const playerPct =
    battleState.maxPlayerHP > 0
      ? Math.max(
          0,
          Math.min(
            100,
            (
              battleState.playerHP /
              battleState.maxPlayerHP
            ) * 100
          )
        )
      : 0;

  if (enemyHP) {
    enemyHP.style.width =
      `${enemyPct}%`;
  }

  if (playerHP) {
    playerHP.style.width =
      `${playerPct}%`;
  }
}

function setDialogue(message) {
  const dialogue =
    getElement('battle-text');

  if (dialogue) {
    dialogue.textContent =
      message;
  }
}

function showAttackMenu() {
  const container =
    getElement('quiz-answers');

  if (!container) {
    return;
  }

  battleState.isSubmitting = false;

  container.innerHTML = `
    <div class="attack-grid">
      <button
        class="attack-btn"
        type="button"
        onclick="startQuestionFlow('necessity')"
      >
        Necessity Check
        <small>Evaluate need vs. want</small>
      </button>

      <button
        class="attack-btn"
        type="button"
        onclick="startQuestionFlow('utility')"
      >
        Utility Rate
        <small>Calculate cost-per-use</small>
      </button>

      <button
        class="attack-btn"
        type="button"
        onclick="startQuestionFlow('wait')"
      >
        Opportunity Cost
        <small>Explore alternative uses</small>
      </button>

      <button
        class="attack-btn flee"
        type="button"
        onclick="giveInAndSpend()"
      >
        Give In & Buy
        <small>Resign and purchase</small>
      </button>
    </div>
  `;
}

function startQuestionFlow(attackType) {
  const container =
    getElement('quiz-answers');

  if (!container) {
    return;
  }

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
      type="button"
      onclick="processPlayerAttack('${attackType}')"
    >
      Submit Reflection
    </button>
  `;

  const input =
    getElement('user-reflection-single');

  if (input) {
    input.focus();

    input.addEventListener(
      'keydown',
      event => {
        if (
          event.key === 'Enter'
        ) {
          event.preventDefault();
          processPlayerAttack(
            attackType
          );
        }
      }
    );
  }
}

function processPlayerAttack(attackType) {
  if (battleState.isSubmitting) {
    return;
  }

  const inputEl =
    getElement('user-reflection-single');

  const submitBtn =
    getElement('btn-submit-reflection');

  if (!inputEl) {
    return;
  }

  const answer =
    inputEl.value.trim();

  if (!answer) {
    showAppMessage(
      'Please type an answer first!',
      'Input Required'
    );
    return;
  }

  battleState.isSubmitting = true;

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
    submitBtn.textContent =
      'Processing...';
  }

  const playerLvl =
    Number(currentUser?.lvl) || 1;

  const baseDmg =
    Math.floor(
      Math.random() * 15
    ) + 35;

  const damageMultiplier =
    getPlayerDamageMultiplier(
      playerLvl
    );

  const damage =
    Math.floor(
      baseDmg * damageMultiplier
    );

  battleState.enemyHP =
    Math.max(
      0,
      battleState.enemyHP - damage
    );

  updateHPUI();

  setDialogue(
    `Your mindful reflection hit the impulse for ${damage} damage!`
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

function monsterRealityCounter(attackType) {
  const price =
    Number(battleState.price) || 0;

  const wage =
    Number(currentUser?.wage) || 15.00;

  const food =
    Number(currentUser?.food_price) || 7.50;

  const eventVal =
    Number(currentUser?.event_price) || 25.00;

  const hoursWorked =
    wage > 0
      ? (price / wage).toFixed(1)
      : '0.0';

  const mealsCount =
    food > 0
      ? Math.floor(
          price / food
        )
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

  const playerDamage =
    Math.floor(
      Math.random() * 10
    ) + 15;

  battleState.playerHP =
    Math.max(
      0,
      battleState.playerHP -
        playerDamage
    );

  updateHPUI();

  setDialogue(
    chosenCounter
  );

  if (battleState.playerHP <= 0) {
    setTimeout(() => {
      showAppMessage(
        'You were overwhelmed by the purchase impulse!',
        'Battle Defeat',
        () => {
          giveInAndSpend();
        }
      );
    }, 1500);

    return;
  }

  setTimeout(
    showAttackMenu,
    2500
  );
}

function victorySavedMoney() {
  if (
    typeof confetti === 'function'
  ) {
    confetti({
      particleCount: 80,
      spread: 70
    });
  }

  const savedAmount =
    Number(battleState.price) || 0;

  showAppMessage(
    `Great job! You beat the impulse and saved $${savedAmount.toFixed(2)}.`,
    'Victory!',
    () => {
      if (currentUser) {
        currentUser.vault_unlock_time =
          Date.now() +
          (15 * 60 * 1000);
      }

      updateTrainerStats(
        50,
        savedAmount,
        {
          name:
            battleState.itemName,

          price:
            savedAmount,

          type:
            'SAVED',

          date:
            new Date().toLocaleDateString()
        }
      );

      checkVaultDirect();
    }
  );
}

function giveInAndSpend() {
  const price =
    Number(battleState.price) || 0;

  showAppMessage(
    `You purchased ${battleState.itemName} for $${price.toFixed(2)}.`,
    'Purchase Confirmed',
    () => {
      updateTrainerStats(
        10,
        0,
        {
          name:
            battleState.itemName,

          price:
            price,

          type:
            'SPENT',

          date:
            new Date().toLocaleDateString()
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
  const nameInput =
    getElement('settings-name');

  if (!nameInput) {
    return;
  }

  const newName =
    nameInput.value.trim();

  if (!newName) {
    showAppMessage(
      'Please enter a valid name.',
      'Settings Error'
    );
    return;
  }

  if (currentUser) {
    currentUser.trainer_name =
      newName;

    saveUserData();

    showAppMessage(
      'Trainer name saved successfully.',
      'Settings Updated',
      () => {
        loadTrainerSession();
      }
    );
  }
}

function updateMetricsSettings() {
  if (!currentUser) {
    return;
  }

  const wageInput =
    getElement('settings-wage');

  const foodInput =
    getElement('settings-food');

  const eventInput =
    getElement('settings-event');

  const wage =
    safeNumber(
      wageInput?.value,
      15.00
    );

  const food =
    safeNumber(
      foodInput?.value,
      7.50
    );

  const eventVal =
    safeNumber(
      eventInput?.value,
      25.00
    );

  currentUser.wage =
    wage > 0
      ? wage
      : 15.00;

  currentUser.food_price =
    food > 0
      ? food
      : 7.50;

  currentUser.event_price =
    eventVal > 0
      ? eventVal
      : 25.00;

  saveUserData();

  showAppMessage(
    'Financial metrics saved successfully.',
    'Settings Updated',
    () => {
      loadTrainerSession();
    }
  );
}

function deleteAccount() {
  if (!currentUser) {
    return;
  }

  const confirmed =
    window.confirm(
      'Are you sure you want to delete your account? This will erase all your progress.'
    );

  if (!confirmed) {
    return;
  }

  try {
    localStorage.removeItem(
      `user_${currentUser.email}`
    );

    localStorage.removeItem(
      'session_user'
    );
  } catch (error) {
    console.error(
      'Account deletion error:',
      error
    );
  }

  currentUser = null;

  showAppMessage(
    'Account deleted.',
    'Account Status',
    () => {
      showScreen('screen-login');
    }
  );
}

function updateTrainerStats(
  xpGained,
  goldSaved,
  logEntry = null
) {
  if (!currentUser) {
    return;
  }

  let newXp =
    (Number(currentUser.xp) || 0) +
    (Number(xpGained) || 0);

  let newLvl =
    Number(currentUser.lvl) || 1;

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

  // Handle multiple level-ups safely.
  let didLevelUp = false;

  while (newXp >= 100) {
    newXp -= 100;
    newLvl += 1;
    didLevelUp = true;
  }

  currentUser.xp = newXp;
  currentUser.lvl = newLvl;
  currentUser.saved_total = newSaved;
  currentUser.logs = newLogs;

  saveUserData();

  if (didLevelUp) {
    const newMaxHP =
      getPlayerMaxHP(newLvl);

    showAppMessage(
      `You reached Level ${newLvl}! Your Max HP increased to ${newMaxHP} and attack power increased by 10%!`,
      'Level Up!',
      () => {
        loadTrainerSession();
      }
    );
  } else {
    loadTrainerSession();
  }
}

function logoutTrainer() {
  if (battleState.timerInterval) {
    clearInterval(
      battleState.timerInterval
    );

    battleState.timerInterval = null;
  }

  localStorage.removeItem(
    'session_user'
  );

  currentUser = null;

  showScreen('screen-login');
}

// ==========================================
// 4. VAULT & HISTORY LOGS
// ==========================================

function startVaultTimer(
  unlockTimestamp
) {
  if (battleState.timerInterval) {
    clearInterval(
      battleState.timerInterval
    );

    battleState.timerInterval = null;
  }

  const timerElement =
    getElement('vault-timer');

  if (!timerElement) {
    return;
  }

  function updateDisplay() {
    const remaining =
      Number(unlockTimestamp) -
      Date.now();

    if (remaining <= 0) {
      if (
        battleState.timerInterval
      ) {
        clearInterval(
          battleState.timerInterval
        );

        battleState.timerInterval = null;
      }

      timerElement.textContent =
        'Ready';

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

    timerElement.textContent =
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

function checkVaultDirect() {
  if (!currentUser) {
    showScreen('screen-login');
    return;
  }

  const timerElement =
    getElement('vault-timer');

  const unlockTime =
    Number(
      currentUser.vault_unlock_time
    ) || 0;

  if (
    unlockTime > Date.now()
  ) {
    startVaultTimer(
      unlockTime
    );
  } else {
    if (
      battleState.timerInterval
    ) {
      clearInterval(
        battleState.timerInterval
      );

      battleState.timerInterval = null;
    }

    if (timerElement) {
      timerElement.textContent =
        'Ready';
    }

    if (
      currentUser.vault_unlock_time
    ) {
      currentUser.vault_unlock_time =
        null;

      saveUserData();
    }
  }

  renderHistoryLogs(
    currentUser.logs || []
  );

  showScreen('screen-vault');
}

function renderHistoryLogs(logs) {
  const container =
    getElement('history-list');

  if (!container) {
    return;
  }

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
    const div =
      document.createElement('div');

    const isSaved =
      item.type === 'SAVED';

    div.className =
      `log-item ${
        isSaved
          ? 'saved'
          : 'spent'
      }`;

    const name =
      document.createElement('div');

    const nameText =
      document.createElement('div');

    nameText.className =
      'log-name';

    nameText.textContent =
      item.name || 'Transaction';

    const dateText =
      document.createElement('div');

    dateText.className =
      'sub-text';

    dateText.textContent =
      item.date || '';

    name.appendChild(nameText);
    name.appendChild(dateText);

    const value =
      document.createElement('div');

    value.className =
      `log-val ${
        isSaved
          ? 'saved'
          : 'spent'
      }`;

    const price =
      safeNumber(
        item.price,
        0
      ).toFixed(2);

    value.textContent =
      `${isSaved ? '+' : '-'}$${price}`;

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

  const goldElement =
    getElement('shop-gold-val');

  if (goldElement) {
    goldElement.textContent =
      safeNumber(
        currentUser.saved_total,
        0
      ).toFixed(2);
  }

  updateShopButtons(
    currentUser
  );

  showScreen('screen-shop');
}

function updateShopButtons(user) {
  const equipped =
    Array.isArray(
      user?.equipped_items
    )
      ? user.equipped_items
      : [];

  const inventory =
    Array.isArray(
      user?.inventory
    )
      ? user.inventory
      : ['hat_default'];

  const starterButton =
    getElement(
      'btn-hat_default'
    );

  if (starterButton) {
    const hasNothingEquipped =
      equipped.length === 0;

    starterButton.textContent =
      hasNothingEquipped
        ? 'Equipped'
        : 'Unequip All';

    starterButton.className =
      hasNothingEquipped
        ? 'btn btn-sm btn-equipped'
        : 'btn btn-secondary btn-sm';
  }

  Object.keys(
    ITEM_CATALOG
  ).forEach(itemId => {
    const button =
      getElement(
        `btn-${itemId}`
      );

    if (!button) {
      return;
    }

    const itemData =
      ITEM_CATALOG[itemId];

    const isOwned =
      inventory.includes(itemId);

    const isEquipped =
      equipped.includes(
        itemData.path
      ) ||
      equipped.includes(
        itemData.idlePath
      );

    if (isEquipped) {
      button.textContent =
        'Unequip';

      button.className =
        'btn btn-sm btn-equipped';
    } else if (isOwned) {
      button.textContent =
        'Equip';

      button.className =
        'btn btn-secondary btn-sm';
    } else {
      button.textContent =
        'Unlock';

      button.className =
        'btn btn-primary btn-sm';
    }
  });
}

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
      ? [...currentUser.equipped_items]
      : [];

  let inventory =
    Array.isArray(
      currentUser.inventory
    )
      ? [...currentUser.inventory]
      : ['hat_default'];

  let savedTotal =
    safeNumber(
      currentUser.saved_total,
      0
    );

  // Default appearance.
  if (itemId === 'hat_default') {
    currentUser.equipped_items = [];

    saveUserData();

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

  const numericPrice =
    safeNumber(
      price,
      0
    );

  const isOwned =
    inventory.includes(itemId);

  if (isOwned) {
    const isEquipped =
      equipped.includes(
        targetItem.path
      ) ||
      equipped.includes(
        targetItem.idlePath
      );

    if (isEquipped) {
      // Unequip item.
      equipped =
        equipped.filter(
          equippedPath =>
            equippedPath !==
              targetItem.path &&
            equippedPath !==
              targetItem.idlePath
        );
    } else {
      // Remove another item from the
      // same category before equipping.
      equipped =
        equipped.filter(
          equippedPath => {
            const catalogItem =
              Object.values(
                ITEM_CATALOG
              ).find(
                item =>
                  item.path ===
                    equippedPath ||
                  item.idlePath ===
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
    }
  } else {
    if (
      savedTotal <
      numericPrice
    ) {
      showAppMessage(
        'You need more saved money to unlock this item!',
        'Insufficient Funds'
      );

      return;
    }

    savedTotal -=
      numericPrice;

    inventory.push(
      itemId
    );

    equipped =
      equipped.filter(
        equippedPath => {
          const catalogItem =
            Object.values(
              ITEM_CATALOG
            ).find(
              item =>
                item.path ===
                  equippedPath ||
                item.idlePath ===
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

    currentUser.saved_total =
      savedTotal;

    currentUser.inventory =
      inventory;

    currentUser.equipped_items =
      equipped;

    saveUserData();

    loadTrainerSession();

    showAppMessage(
      `${targetItem.name} unlocked and equipped!`,
      'Shop Success',
      () => {
        openShop();
      }
    );

    return;
  }

  currentUser.equipped_items =
    equipped;

  currentUser.inventory =
    inventory;

  currentUser.saved_total =
    savedTotal;

  saveUserData();

  // Don't let loadTrainerSession
  // interrupt the shop state.
  updateShopButtons(
    currentUser
  );

  const goldElement =
    getElement('shop-gold-val');

  if (goldElement) {
    goldElement.textContent =
      safeNumber(
        currentUser.saved_total,
        0
      ).toFixed(2);
  }
}

// ==========================================
// 6. INITIALIZATION & LISTENERS
// ==========================================

window.addEventListener(
  'DOMContentLoaded',
  () => {
    // --------------------------------------
    // Authentication
    // --------------------------------------

    const signupForm =
      getElement('form-signup');

    if (signupForm) {
      signupForm.addEventListener(
        'submit',
        handleLocalSignup
      );
    }

    const loginForm =
      getElement('form-login');

    if (loginForm) {
      loginForm.addEventListener(
        'submit',
        handleLocalLogin
      );
    }

    const tabLogin =
      getElement('tab-login');

    const tabSignup =
      getElement('tab-signup');

    if (tabLogin) {
      tabLogin.addEventListener(
        'click',
        () =>
          switchAuthTab('login')
      );
    }

    if (tabSignup) {
      tabSignup.addEventListener(
        'click',
        () =>
          switchAuthTab('signup')
      );
    }

    // --------------------------------------
    // Keyboard Movement
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

    // Prevent stuck movement if the
    // browser window loses focus.
    window.addEventListener(
      'blur',
      () => {
        activeKeys.clear();
        setMovementState(false);
      }
    );

    // --------------------------------------
    // Restore Existing Session
    // --------------------------------------

    loadTrainerSession();

    // --------------------------------------
    // Start Avatar Rendering
    // --------------------------------------

    startGlobalAvatarLoop();
  }
);

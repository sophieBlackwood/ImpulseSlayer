let selectedSpriteTemp = '🧙‍♂️';

const battleState = {
  price: 0,
  enemyHP: 100,
  maxEnemyHP: 100,
  playerHP: 100,
  maxPlayerHP: 100,
  qIndex: 0,
  timerInterval: null
};

// UI & TAB NAVIGATION
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

// LOCAL AUTHENTICATION SYSTEM (AUTO-SAVED SESSION)
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
    wage: 15,
    mealPrice: 12,
    subPrice: 15,
    sprite: '🧙‍♂️',
    lvl: 1,
    xp: 0,
    savedTotal: 0,
    vaultUnlockTime: null
  };

  localStorage.setItem('slayer_users', JSON.stringify(users));
  localStorage.setItem('slayer_active_user', email);

  // Transition to Financial Survey
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
    users[activeEmail].wage = parseFloat(document.getElementById('survey-wage').value) || 15;
    users[activeEmail].mealPrice = parseFloat(document.getElementById('survey-meal').value) || 12;
    users[activeEmail].subPrice = parseFloat(document.getElementById('survey-sub').value) || 15;

    localStorage.setItem('slayer_users', JSON.stringify(users));
  }

  showScreen('screen-sprite');
}

// SPRITE SELECTION SYSTEM
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
    users[activeEmail].sprite = selectedSpriteTemp;
    localStorage.setItem('slayer_users', JSON.stringify(users));
  }

  loadTrainerSession();
}

// LOAD PROFILE DATA INTO HUB & BATTLE
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
    
    document.getElementById('hub-avatar').textContent = user.sprite || '🧙‍♂️';
    document.getElementById('player-sprite').textContent = user.sprite || '🧙‍♂️';

    // Resume vault timer if lock is active
    if (user.vaultUnlockTime && user.vaultUnlockTime > Date.now()) {
      startVaultTimer(user.vaultUnlockTime);
    }

    showScreen('screen-hub');
  }
}

function updateTrainerStats(xpGained, goldSaved) {
  const activeEmail = localStorage.getItem('slayer_active_user');
  if (!activeEmail) return;

  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  const user = users[activeEmail];

  if (user) {
    user.xp += xpGained;
    user.savedTotal += goldSaved;

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

// BATTLE MECHANICS & ENEMY AI
function startBattle() {
  const name = document.getElementById('target-name').value;
  const price = parseFloat(document.getElementById('target-price').value);

  if (!name || isNaN(price) || price <= 0) return alert("ENTER VALID ITEM DETAILS");

  const activeEmail = localStorage.getItem('slayer_active_user');
  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  const user = users[activeEmail] || { trainerName: 'RED', lvl: 1 };

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

// ENEMY COUNTER-ATTACK AI
function enemyCounterAttack() {
  if (battleState.enemyHP <= 0) return;

  const dmg = Math.floor(Math.random() * 15) + 10;
  battleState.playerHP -= dmg;
  updateHPUI();

  if (battleState.playerHP <= 0) {
    alert("YOUR WILLPOWER FAILED! The monster tempted you!");
    showScreen('screen-hub');
  } else {
    setDialogue(`Monster attacked back! Took ${dmg} damage.`);
  }
}

function showMetrics() {
  const activeEmail = localStorage.getItem('slayer_active_user');
  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  const user = users[activeEmail] || { wage: 15, mealPrice: 12, subPrice: 15 };

  const hours = (battleState.price / user.wage).toFixed(1);
  const meals = (battleState.price / user.mealPrice).toFixed(1);

  setDialogue(`COSTS: ${hours}h work | ${meals} meals.`);
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
  updateTrainerStats(25, battleState.price);
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
    updateTrainerStats(50, 0);

    // Save 24-Hour Cooldown Timestamp
    const activeEmail = localStorage.getItem('slayer_active_user');
    const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
    if (users[activeEmail]) {
      const unlockTime = Date.now() + (24 * 60 * 60 * 1000);
      users[activeEmail].vaultUnlockTime = unlockTime;
      localStorage.setItem('slayer_users', JSON.stringify(users));
      startVaultTimer(unlockTime);
    }

    showScreen('screen-vault');
  }
}

// PERSISTENT COOLDOWN TIMER LOGIC
function startVaultTimer(unlockTimestamp) {
  if (battleState.timerInterval) clearInterval(battleState.timerInterval);

  function updateDisplay() {
    const remaining = unlockTimestamp - Date.now();

    if (remaining <= 0) {
      clearInterval(battleState.timerInterval);
      document.getElementById('vault-timer').textContent = "UNLOCKED";
      return;
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((remaining % (1000 * 60)) / 1000);

    document.getElementById('vault-timer').textContent = 
      `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    document.getElementById('vault-timer').textContent = "NO LOCK";
  }

  showScreen('screen-vault');
}

// AUTO-LOGIN & APP INIT
window.addEventListener('DOMContentLoaded', () => {
  loadTrainerSession();
});

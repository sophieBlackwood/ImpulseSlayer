// GLOBAL BATTLE STATE
let selectedSpriteTemp = '🧙‍♂️';

const battleState = {
  price: 0,
  enemyHP: 100,
  maxHP: 100,
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

// LOCAL AUTHENTICATION SYSTEM
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

  // Create new profile structure
  users[email] = {
    password: pass,
    trainerName: name.toUpperCase(),
    sprite: '🧙‍♂️',
    lvl: 1,
    xp: 0,
    savedTotal: 0
  };

  localStorage.setItem('slayer_users', JSON.stringify(users));
  localStorage.setItem('slayer_active_user', email);

  // Transition to Sprite Selection
  showScreen('screen-sprite');
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
    
    // Set avatars
    document.getElementById('hub-avatar').textContent = user.sprite || '🧙‍♂️';
    document.getElementById('player-sprite').textContent = user.sprite || '🧙‍♂️';

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

// BATTLE MECHANICS
function startBattle() {
  const name = document.getElementById('target-name').value;
  const price = parseFloat(document.getElementById('target-price').value);

  if (!name || isNaN(price) || price <= 0) return alert("ENTER VALID ITEM DETAILS");

  const activeEmail = localStorage.getItem('slayer_active_user');
  const users = JSON.parse(localStorage.getItem('slayer_users')) || {};
  const user = users[activeEmail] || { trainerName: 'RED', lvl: 1 };

  battleState.price = price;
  battleState.maxHP = price > 100 ? 150 : 100;
  battleState.enemyHP = battleState.maxHP;
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
  const pct = Math.max(0, (battleState.enemyHP / battleState.maxHP) * 100);
  document.getElementById('enemy-hp').style.width = `${pct}%`;
}

function setDialogue(msg) {
  document.getElementById('battle-text').textContent = msg;
}

function showMetrics() {
  const hours = (battleState.price / 15).toFixed(1);
  setDialogue(`Metric: Costs ~${hours} hrs of average work.`);
}

function restTurn() {
  battleState.enemyHP -= 20;
  updateHPUI();
  setDialogue("You paused for reflection. Monster HP decreased!");
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
      loadQuizQuestion();
    };
    container.appendChild(btn);
  });
}

function checkBattleEnd() {
  if (battleState.enemyHP <= 30) {
    confetti({ particleCount: 70, spread: 60 });
    updateTrainerStats(50, 0);
    showScreen('screen-vault');
  } else if (battleState.qIndex >= questions.length) {
    setDialogue("Monster withstands attack! Consider running away to save gold.");
    document.getElementById('battle-commands').classList.remove('hidden');
    document.getElementById('quiz-deck').classList.add('hidden');
  }
}

function checkVaultDirect() {
  showScreen('screen-vault');
}

// INITIALIZE APP
window.addEventListener('DOMContentLoaded', () => {
  loadTrainerSession();
});

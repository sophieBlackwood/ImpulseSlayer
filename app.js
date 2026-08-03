// PERSISTENT DATA STORAGE OBJECT
const db = {
  profile: {
    wage: 15.00,
    mealPrice: 12.00,
    gamePrice: 70.00,
    isConfigured: false
  },
  player: {
    lvl: 1,
    xp: 0,
    xpToNext: 100,
    savedTotal: 0
  }
};

// CURRENT BATTLE STATE
const state = {
  targetName: '',
  targetPrice: 0,
  enemyName: 'IMPULSE GOBLIN',
  enemyHP: 100,
  enemyMaxHP: 100,
  currentQ: 0,
  timerInterval: null
};

// QUIZ DATA
const questions = [
  {
    q: "Will this item maintain high utility in 30 days?",
    opts: [
      { text: "HIGH UTILITY - USE DAILY", dmg: 40 },
      { text: "MODERATE UTILITY", dmg: 20 },
      { text: "LOW UTILITY - RARELY", dmg: 0 }
    ]
  },
  {
    q: "Is this purchase planned within your budget?",
    opts: [
      { text: "YES - PLANNED SAVINGS", dmg: 40 },
      { text: "PARTIAL - IMPULSE AD", dmg: 15 },
      { text: "NO - UNPLANNED BUY", dmg: 0 }
    ]
  }
];

window.addEventListener('DOMContentLoaded', () => {
  loadStoredData();
  checkVaultLock();
});

function loadStoredData() {
  const savedDb = localStorage.getItem('impulse_slayer_db');
  if (savedDb) {
    Object.assign(db, JSON.parse(savedDb));
  }

  if (db.profile.isConfigured) {
    showQuestScreen();
  } else {
    showScreen('screen-survey');
  }
}

function saveData() {
  localStorage.setItem('impulse_slayer_db', JSON.stringify(db));
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// SURVEY LOGIC
function saveSurvey(e) {
  e.preventDefault();
  db.profile.wage = parseFloat(document.getElementById('user-wage').value) || 15.00;
  db.profile.mealPrice = parseFloat(document.getElementById('user-item1').value) || 12.00;
  db.profile.gamePrice = parseFloat(document.getElementById('user-item2').value) || 70.00;
  db.profile.isConfigured = true;

  saveData();
  showQuestScreen();
}

function resetSurvey() {
  db.profile.isConfigured = false;
  saveData();
  showScreen('screen-survey');
}

function showQuestScreen() {
  showScreen('screen-quest');
}

// BATTLE INITIALIZATION
function startBattle() {
  const nameInput = document.getElementById('target-name').value;
  const priceInput = parseFloat(document.getElementById('target-price').value);

  if (!nameInput || isNaN(priceInput) || priceInput <= 0) {
    alert('ENTER VALID ITEM NAME AND PRICE');
    return;
  }

  state.targetName = nameInput;
  state.targetPrice = priceInput;

  // Scale Enemy HP and Sprite based on price
  if (priceInput < 30) {
    state.enemyName = "IMPULSE SLIME";
    state.enemyMaxHP = 60;
    document.getElementById('enemy-sprite').textContent = "🟢";
  } else if (priceInput < 100) {
    state.enemyName = "FOMO KNIGHT";
    state.enemyMaxHP = 100;
    document.getElementById('enemy-sprite').textContent = "👾";
  } else {
    state.enemyName = "OVERSPEND DRAGON";
    state.enemyMaxHP = 150;
    document.getElementById('enemy-sprite').textContent = "🐉";
  }

  state.enemyHP = state.enemyMaxHP;
  state.currentQ = 0;

  // Update Battle HUD
  document.getElementById('enemy-name').textContent = state.enemyName;
  document.getElementById('player-lvl').textContent = `Lv${db.player.lvl}`;
  document.getElementById('player-exp').textContent = `EXP: ${db.player.xp}/${db.player.xpToNext}`;
  
  updateHPUI();
  setDialogue(`A wild ${state.enemyName} appeared! What will you do?`);
  
  document.getElementById('menu-main').classList.remove('hidden');
  document.getElementById('menu-quiz').classList.add('hidden');

  showScreen('screen-battle');
}

function updateHPUI() {
  const pct = Math.max(0, (state.enemyHP / state.enemyMaxHP) * 100);
  document.getElementById('enemy-hp-fill').style.width = `${pct}%`;
}

function setDialogue(msg) {
  document.getElementById('dialogue-box').textContent = msg;
}

// BATTLE ACTIONS
function showMicroMetrics() {
  const hours = (state.targetPrice / db.profile.wage).toFixed(1);
  const meals = (state.targetPrice / db.profile.mealPrice).toFixed(1);
  const games = (state.targetPrice / db.profile.gamePrice).toFixed(1);

  setDialogue(`COSTS: ${hours}h work | ${meals} meals | ${games} games`);
}

function takeRest() {
  setDialogue("You paused to reflect for 10 mins. Temptation weakened!");
  state.enemyHP -= 20;
  updateHPUI();
  checkBattleEnd();
}

function fleeBattle() {
  db.player.savedTotal += state.targetPrice;
  addXP(Math.round(state.targetPrice));
  alert(`YOU ESCAPED! Saved $${state.targetPrice.toFixed(2)}.`);
  showQuestScreen();
}

// QUIZ BATTLE MECHANIC
function openAttackMenu() {
  document.getElementById('menu-main').classList.add('hidden');
  document.getElementById('menu-quiz').classList.remove('hidden');
  loadQuestion();
}

function loadQuestion() {
  if (state.currentQ >= questions.length) {
    checkBattleEnd();
    return;
  }

  const q = questions[state.currentQ];
  document.getElementById('quiz-question').textContent = q.q;
  const optsContainer = document.getElementById('quiz-options');
  optsContainer.innerHTML = '';

  q.opts.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt.text;
    btn.onclick = () => {
      state.enemyHP -= opt.dmg;
      updateHPUI();
      state.currentQ++;
      
      if (state.enemyHP <= 20) {
        checkBattleEnd();
      } else {
        loadQuestion();
      }
    };
    optsContainer.appendChild(btn);
  });
}

function checkBattleEnd() {
  if (state.enemyHP <= 20) {
    confetti({ particleCount: 60, spread: 60 });
    const endTime = new Date().getTime() + (24 * 60 * 60 * 1000);
    localStorage.setItem('slayer_vault_lock', endTime);
    
    addXP(50);
    runVaultTimer(endTime);
    showScreen('screen-vault');
  } else if (state.currentQ >= questions.length) {
    setDialogue("Enemy resists! Try using REST or RUNNING.");
    document.getElementById('menu-main').classList.remove('hidden');
    document.getElementById('menu-quiz').classList.add('hidden');
  }
}

function addXP(amount) {
  db.player.xp += amount;
  if (db.player.xp >= db.player.xpToNext) {
    db.player.lvl++;
    db.player.xp -= db.player.xpToNext;
    db.player.xpToNext = Math.round(db.player.xpToNext * 1.5);
    alert(`LEVEL UP! You reached Level ${db.player.lvl}!`);
  }
  saveData();
}

// VAULT LOCK TIMER
function runVaultTimer(endTime) {
  if (state.timerInterval) clearInterval(state.timerInterval);

  state.timerInterval = setInterval(() => {
    const now = new Date().getTime();
    const distance = endTime - now;

    const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById('vault-timer').textContent = 
      `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    if (distance < 0) {
      clearInterval(state.timerInterval);
      localStorage.removeItem('slayer_vault_lock');
      document.getElementById('vault-timer').textContent = "UNLOCKED";
    }
  }, 1000);
}

function checkVaultLock() {
  const savedLock = localStorage.getItem('slayer_vault_lock');
  if (savedLock) {
    const endTime = parseInt(savedLock, 10);
    if (endTime > new Date().getTime()) {
      runVaultTimer(endTime);
      showScreen('screen-vault');
    } else {
      localStorage.removeItem('slayer_vault_lock');
    }
  }
}

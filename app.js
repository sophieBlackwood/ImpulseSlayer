// PERSISTENT PLAYER STATE
const player = {
  lvl: 1,
  xp: 0,
  xpToNext: 100,
  goldSaved: 0
};

// CURRENT BATTLE STATE
const battle = {
  itemName: '',
  price: 0,
  enemyName: '',
  enemyMaxHP: 100,
  enemyHP: 100,
  sprite: '👾',
  timerInterval: null
};

// INITIALIZE APP
window.addEventListener('DOMContentLoaded', () => {
  loadPlayerData();
  checkExistingLock();
});

function loadPlayerData() {
  const saved = localStorage.getItem('slayer_player_data');
  if (saved) {
    Object.assign(player, JSON.parse(saved));
  }
  updateHUD();
}

function savePlayerData() {
  localStorage.setItem('slayer_player_data', JSON.stringify(player));
  updateHUD();
}

function updateHUD() {
  document.getElementById('player-lvl').textContent = player.lvl;
  document.getElementById('player-xp').textContent = `${player.xp}/${player.xpToNext}`;
  document.getElementById('player-gold').textContent = `$${player.goldSaved.toFixed(0)}`;
}

// DYNAMIC ENEMY GENERATOR
function generateEnemy(price) {
  if (price < 25) {
    return { name: "IMPULSE GOBLIN", hp: 60, sprite: "👺" };
  } else if (price < 100) {
    return { name: "FOMO KNIGHT", hp: 100, sprite: "👾" };
  } else {
    return { name: "OVERSPEND DRAGON", hp: 160, sprite: "🐉" };
  }
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function initiateBattle() {
  const nameInput = document.getElementById('item-name').value;
  const priceInput = parseFloat(document.getElementById('item-price').value);

  if (!nameInput || isNaN(priceInput) || priceInput <= 0) {
    alert('ENTER A VALID ITEM AND PRICE');
    return;
  }

  battle.itemName = nameInput;
  battle.price = priceInput;

  const enemy = generateEnemy(priceInput);
  battle.enemyName = enemy.name;
  battle.enemyMaxHP = enemy.hp;
  battle.enemyHP = enemy.hp;
  battle.sprite = enemy.sprite;

  // Update UI
  document.getElementById('enemy-sprite').textContent = battle.sprite;
  document.getElementById('enemy-name').textContent = battle.enemyName;
  
  const hoursWork = (priceInput / 12).toFixed(1);
  document.getElementById('metric-card').innerHTML = `COST: ${hoursWork} HRS OF WORK`;
  
  updateHPBar();
  document.getElementById('battle-text').textContent = `A wild ${battle.enemyName} appears!`;
  
  document.getElementById('action-menu').classList.remove('hidden');
  document.getElementById('quiz-container').classList.add('hidden');

  showScreen('step-boss');
}

function updateHPBar() {
  const pct = Math.max(0, (battle.enemyHP / battle.enemyMaxHP) * 100);
  document.getElementById('enemy-hp-fill').style.width = `${pct}%`;
}

// BATTLE ACTIONS
function handleAction(type) {
  const textEl = document.getElementById('battle-text');

  if (type === 'attack') {
    startQuiz();
  } else if (type === 'defend') {
    textEl.textContent = "You pause and take a 10 min break. Temptation reduced!";
    battle.enemyHP -= 20;
    updateHPBar();
    checkBattleEnd();
  } else if (type === 'item') {
    const futureVal = (battle.price * 1.5).toFixed(0);
    textEl.textContent = `Investing this $${battle.price} could yield ~$${futureVal} in 5 yrs!`;
  } else if (type === 'flee') {
    // Fleeing means skipping the purchase = WINNING
    player.goldSaved += battle.price;
    addXP(Math.round(battle.price));
    alert(`YOU ESCAPED! Saved $${battle.price.toFixed(2)}.`);
    showScreen('step-setup');
  }
}

// QUIZ LOGIC
const questions = [
  {
    q: "WILL YOU USE THIS NEXT MONTH?",
    opts: [
      { text: "YES, REGULARLY", dmg: 40 },
      { text: "MAYBE ONCE", dmg: 15 },
      { text: "PROBABLY NOT", dmg: 0 }
    ]
  },
  {
    q: "IS THIS WITHIN BUDGET?",
    opts: [
      { text: "YES, SAVED UP", dmg: 40 },
      { text: "TIGHT FIT", dmg: 15 },
      { text: "NO, IMPULSE BUY", dmg: 0 }
    ]
  }
];

let currentQ = 0;

function startQuiz() {
  currentQ = 0;
  document.getElementById('action-menu').classList.add('hidden');
  document.getElementById('quiz-container').classList.remove('hidden');
  loadQuizQuestion();
}

function loadQuizQuestion() {
  if (currentQ >= questions.length) {
    checkBattleEnd();
    return;
  }

  const q = questions[currentQ];
  document.getElementById('quiz-q').textContent = q.q;
  const optsDiv = document.getElementById('quiz-opts');
  optsDiv.innerHTML = '';

  q.opts.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt.text;
    btn.onclick = () => {
      battle.enemyHP -= opt.dmg;
      updateHPBar();
      currentQ++;
      loadQuizQuestion();
    };
    optsDiv.appendChild(btn);
  });
}

function checkBattleEnd() {
  if (battle.enemyHP <= 30) {
    confetti({ particleCount: 50, spread: 60 });
    const endTime = new Date().getTime() + (24 * 60 * 60 * 1000);
    localStorage.setItem('slayer_lock_time', endTime);
    
    addXP(50);
    runTimer(endTime);
    showScreen('step-timer');
  } else if (currentQ >= questions.length) {
    document.getElementById('battle-text').textContent = "Monster too strong! Consider fleeing to save gold.";
    document.getElementById('action-menu').classList.remove('hidden');
    document.getElementById('quiz-container').classList.add('hidden');
  }
}

function addXP(amount) {
  player.xp += amount;
  if (player.xp >= player.xpToNext) {
    player.lvl++;
    player.xp -= player.xpToNext;
    player.xpToNext = Math.round(player.xpToNext * 1.5);
    alert(`LEVEL UP! You are now Level ${player.lvl}`);
  }
  savePlayerData();
}

// TIMER LOGIC
function runTimer(endTime) {
  if (battle.timerInterval) clearInterval(battle.timerInterval);

  battle.timerInterval = setInterval(() => {
    const now = new Date().getTime();
    const distance = endTime - now;

    const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById('countdown-timer').textContent = 
      `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    if (distance < 0) {
      clearInterval(battle.timerInterval);
      localStorage.removeItem('slayer_lock_time');
      document.getElementById('countdown-timer').textContent = "UNLOCKED";
    }
  }, 1000);
}

function checkExistingLock() {
  const savedLock = localStorage.getItem('slayer_lock_time');
  if (savedLock) {
    const endTime = parseInt(savedLock, 10);
    if (endTime > new Date().getTime()) {
      runTimer(endTime);
      showScreen('step-timer');
    } else {
      localStorage.removeItem('slayer_lock_time');
    }
  }
}

function resetApp() {
  localStorage.removeItem('slayer_lock_time');
  if (battle.timerInterval) clearInterval(battle.timerInterval);
  document.getElementById('item-name').value = '';
  document.getElementById('item-price').value = '';
  showScreen('step-setup');
}

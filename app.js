// GLOBAL ACCOUNT STATE
let currentTrainer = null;

const state = {
  price: 0,
  enemyHP: 100,
  maxHP: 100,
  qIndex: 0
};

// USER ACCOUNT MANAGEMENT
function loginTrainer() {
  const name = document.getElementById('trainer-name').value.trim();
  if (!name) return alert("ENTER A TRAINER NAME");

  currentTrainer = name.toUpperCase();
  loadTrainerData();
  showScreen('screen-hub');
}

function logoutTrainer() {
  currentTrainer = null;
  document.getElementById('trainer-name').value = '';
  showScreen('screen-login');
}

function loadTrainerData() {
  const data = JSON.parse(localStorage.getItem(`trainer_${currentTrainer}`)) || {
    lvl: 1,
    xp: 0,
    saved: 0
  };

  document.getElementById('hub-trainer-name').textContent = `TRAINER ${currentTrainer}`;
  document.getElementById('hub-trainer-lvl').textContent = `LVL ${data.lvl}`;
  document.getElementById('hub-saved').textContent = `$${data.saved.toFixed(2)}`;
  document.getElementById('hub-exp').textContent = `${data.xp}/100`;
}

function updateTrainerStats(xpGained, goldSaved) {
  const key = `trainer_${currentTrainer}`;
  const data = JSON.parse(localStorage.getItem(key)) || { lvl: 1, xp: 0, saved: 0 };

  data.xp += xpGained;
  data.saved += goldSaved;

  if (data.xp >= 100) {
    data.lvl += 1;
    data.xp -= 100;
    alert(`LEVEL UP! You are now Level ${data.lvl}!`);
  }

  localStorage.setItem(key, JSON.stringify(data));
  loadTrainerData();
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// BATTLE SYSTEM
function startBattle() {
  const name = document.getElementById('target-name').value;
  const price = parseFloat(document.getElementById('target-price').value);

  if (!name || isNaN(price) || price <= 0) return alert("ENTER VALID ITEM DETAILS");

  state.price = price;
  state.maxHP = price > 100 ? 150 : 100;
  state.enemyHP = state.maxHP;
  state.qIndex = 0;

  document.getElementById('enemy-name').textContent = price > 100 ? "OVERSPEND DRAGON" : "FOMO MONSTER";
  document.getElementById('enemy-sprite').textContent = price > 100 ? "🐉" : "👹";
  document.getElementById('player-battle-name').textContent = currentTrainer;

  updateHPUI();
  setDialogue(`A wild impulse monster appeared!`);

  document.getElementById('battle-commands').classList.remove('hidden');
  document.getElementById('quiz-deck').classList.add('hidden');

  showScreen('screen-battle');
}

function updateHPUI() {
  const pct = Math.max(0, (state.enemyHP / state.maxHP) * 100);
  document.getElementById('enemy-hp').style.width = `${pct}%`;
}

function setDialogue(msg) {
  document.getElementById('battle-text').textContent = msg;
}

function showMetrics() {
  const hours = (state.price / 15).toFixed(1);
  setDialogue(`Metric: Costs ${hours} hrs of average hourly work.`);
}

function restTurn() {
  state.enemyHP -= 20;
  updateHPUI();
  setDialogue("You paused for reflection. Monster HP decreased!");
  checkEnd();
}

function runAway() {
  updateTrainerStats(25, state.price);
  alert(`YOU ESCAPED! Saved $${state.price.toFixed(2)}.`);
  showScreen('screen-hub');
}

// QUIZ FLOW
const questions = [
  { q: "WILL YOU USE THIS IN 30 DAYS?", opts: [{ t: "DEFINITELY", d: 40 }, { t: "PROBABLY NOT", d: 0 }] },
  { q: "IS THIS IN YOUR BUDGET?", opts: [{ t: "YES, SAVED UP", d: 40 }, { t: "NO, IMPULSE BUY", d: 0 }] }
];

function triggerQuiz() {
  document.getElementById('battle-commands').classList.add('hidden');
  document.getElementById('quiz-deck').classList.remove('hidden');
  loadQuizQuestion();
}

function loadQuizQuestion() {
  if (state.qIndex >= questions.length) return checkEnd();

  const q = questions[state.qIndex];
  document.getElementById('quiz-q').textContent = q.q;

  const container = document.getElementById('quiz-answers');
  container.innerHTML = '';

  q.opts.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt.t;
    btn.onclick = () => {
      state.enemyHP -= opt.d;
      updateHPUI();
      state.qIndex++;
      loadQuizQuestion();
    };
    container.appendChild(btn);
  });
}

function checkEnd() {
  if (state.enemyHP <= 30) {
    confetti({ particleCount: 70, spread: 60 });
    updateTrainerStats(50, 0);
    showScreen('screen-vault');
  } else if (state.qIndex >= questions.length) {
    setDialogue("Monster withstands attack! Consider running away to save money.");
    document.getElementById('battle-commands').classList.remove('hidden');
    document.getElementById('quiz-deck').classList.add('hidden');
  }
}

function checkVaultDirect() {
  showScreen('screen-vault');
}

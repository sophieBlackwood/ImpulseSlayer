// ==========================================
// CONFIG & INITIALIZATION
// ==========================================
let selectedSpriteStaticTemp = 'assets/characters/hero-male.png';
let selectedSpriteIdleTemp = 'assets/characters/hero-male-idle.gif';

const SUPABASE_URL = 'https://jojqltaalzoukopmwwu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvanFsdGFhbHpvdWtvcG5td3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NDA0OTUsImV4cCI6MjEwMTUxNjQ5NX0.kKUXuQS-cAzRkALyXg2XMqlxa4DXbCNBaC5khRITULQ';

const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const battleState = {
  price: 0,
  itemName: '',
  category: 'general',
  enemyHP: 100,
  maxEnemyHP: 100,
  playerHP: 100,
  maxPlayerHP: 100,
  timerInterval: null,
  lastAnswer1: ''
};

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

function renderCharacterAvatar(containerId, user) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const baseSprite = user.base_sprite_idle || 'assets/characters/hero-male-idle.gif';
  const equippedList = user.equipped_items || [];

  let layersHTML = `<img src="${baseSprite}" alt="Base Hero" class="character-img base-layer" />`;

  equippedList.forEach(path => {
    if (path && path !== 'BASE') {
      layersHTML += `<img src="${path}" alt="Costume Layer" class="character-img costume-overlay-layer" />`;
    }
  });

  container.innerHTML = layersHTML;
}

// ==========================================
// 2. AUTHENTICATION & PROFILE SETUP
// ==========================================

async function handleLocalSignup(e) {
  e.preventDefault();
  if (!supabaseClient) return alert("Supabase library is not loaded properly.");

  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim().toLowerCase();
  const pass = document.getElementById('signup-pass').value;

  if (pass.length < 6) {
    alert("Password must be at least 6 characters long.");
    return;
  }

  const { data: authData, error: authError } = await supabaseClient.auth.signUp({
    email: email,
    password: pass
  });

  if (authError) {
    alert("Signup failed: " + authError.message);
    return;
  }

  if (!authData.user) {
    alert("Signup initiated. Please check your email for a confirmation link.");
    return;
  }

  const userId = authData.user.id;

  const { error: dbError } = await supabaseClient
    .from('profiles')
    .insert([{
      id: userId,
      email: email,
      trainer_name: name || 'Hero',
      wage: 15.00,
      food_price: 7.50,
      event_price: 25.00,
      lvl: 1,
      xp: 0,
      saved_total: 0,
      equipped_items: [],
      inventory: ['hat_default'],
      logs: []
    }]);

  if (dbError) {
    alert("Profile creation failed: " + dbError.message);
    return;
  }

  showScreen('screen-survey');
}

async function handleLocalLogin(e) {
  e.preventDefault();
  if (!supabaseClient) return alert("Supabase library is not loaded properly.");

  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pass = document.getElementById('login-pass').value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: pass
  });

  if (error) {
    alert("Login failed: " + error.message);
    return;
  }

  loadTrainerSession();
}

async function saveFinancialProfile(e) {
  if (e) e.preventDefault();
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return showScreen('screen-login');

  const wage = parseFloat(document.getElementById('survey-wage').value) || 15.00;
  const food = parseFloat(document.getElementById('survey-food').value) || 7.50;
  const eventVal = parseFloat(document.getElementById('survey-event').value) || 25.00;

  await supabaseClient
    .from('profiles')
    .update({ wage: wage, food_price: food, event_price: eventVal })
    .eq('id', session.user.id);

  showScreen('screen-sprite');
}

function selectSprite(staticSrc, idleSrc, element) {
  selectedSpriteStaticTemp = staticSrc;
  selectedSpriteIdleTemp = idleSrc;

  document.querySelectorAll('.sprite-option').forEach(opt => opt.classList.remove('active'));
  element.classList.add('active');
}

async function confirmSpriteSelection() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return showScreen('screen-login');

  await supabaseClient
    .from('profiles')
    .update({
      base_sprite_static: selectedSpriteStaticTemp,
      base_sprite_idle: selectedSpriteIdleTemp
    })
    .eq('id', session.user.id);

  loadTrainerSession();
}

async function loadTrainerSession() {
  if (!supabaseClient) return;
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session) {
    showScreen('screen-login');
    return;
  }

  const { data: user, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error || !user) {
    console.error("Error fetching profile:", error);
    return;
  }

  if (document.getElementById('hub-trainer-name')) document.getElementById('hub-trainer-name').textContent = user.trainer_name || 'Hero';
  if (document.getElementById('hub-trainer-lvl')) document.getElementById('hub-trainer-lvl').textContent = `Level ${user.lvl || 1}`;
  if (document.getElementById('hub-saved')) document.getElementById('hub-saved').textContent = `$${parseFloat(user.saved_total || 0).toFixed(2)}`;
  if (document.getElementById('hub-exp')) document.getElementById('hub-exp').textContent = `${user.xp || 0} / 100`;

  renderCharacterAvatar('hub-avatar', user);
  renderCharacterAvatar('player-sprite', user);
  renderCharacterAvatar('shop-preview-avatar', user);

  if (document.getElementById('settings-name')) document.getElementById('settings-name').value = user.trainer_name || '';
  if (document.getElementById('settings-wage')) document.getElementById('settings-wage').value = user.wage || 15.00;
  if (document.getElementById('settings-food')) document.getElementById('settings-food').value = user.food_price || 7.50;
  if (document.getElementById('settings-event')) document.getElementById('settings-event').value = user.event_price || 25.00;

  checkLockStatus(user);
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

async function checkBossAvailability() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return showScreen('screen-login');

  const { data: user } = await supabaseClient.from('profiles').select('vault_unlock_time').eq('id', session.user.id).single();

  if (user && user.vault_unlock_time && user.vault_unlock_time > Date.now()) {
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

async function startBattle() {
  const name = document.getElementById('target-name').value.trim();
  const price = parseFloat(document.getElementById('target-price').value);
  const categorySelect = document.getElementById('target-category');
  const category = categorySelect ? categorySelect.value : 'general';

  if (!name || isNaN(price) || price <= 0) return alert("Please enter a valid item name and price.");

  const { data: { session } } = await supabaseClient.auth.getSession();
  const { data: user } = await supabaseClient.from('profiles').select('trainer_name, lvl').eq('id', session.user.id).single();

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

  document.getElementById('player-battle-name').textContent = user ? user.trainer_name : 'Hero';
  document.getElementById('player-battle-lvl').textContent = `Lv ${user ? user.lvl : 1}`;

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

async function monsterRealityCounter(attackType) {
  const { data: { session } } = await supabaseClient.auth.getSession();
  const { data: user } = await supabaseClient.from('profiles').select('wage, food_price, event_price').eq('id', session.user.id).single();

  const price = battleState.price;
  const wage = user ? user.wage : 15.00;
  const food = user ? user.food_price : 7.50;
  const eventVal = user ? user.event_price : 25.00;

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

async function victorySavedMoney() {
  if (typeof confetti === 'function') confetti({ particleCount: 80, spread: 70 });
  alert(`Great job! You beat the impulse and saved $${battleState.price.toFixed(2)}.`);

  const { data: { session } } = await supabaseClient.auth.getSession();
  const unlockTime = Date.now() + (15 * 60 * 1000);

  await supabaseClient.from('profiles').update({ vault_unlock_time: unlockTime }).eq('id', session.user.id);

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

async function updateTrainerName() {
  const newName = document.getElementById('settings-name').value.trim();
  if (!newName) return alert("Please enter a valid name.");

  const { data: { session } } = await supabaseClient.auth.getSession();
  await supabaseClient.from('profiles').update({ trainer_name: newName }).eq('id', session.user.id);

  alert("Trainer name saved.");
  loadTrainerSession();
}

async function updateMetricsSettings() {
  const wage = parseFloat(document.getElementById('settings-wage').value);
  const food = parseFloat(document.getElementById('settings-food').value);
  const eventVal = parseFloat(document.getElementById('settings-event').value);

  const { data: { session } } = await supabaseClient.auth.getSession();
  await supabaseClient.from('profiles').update({
    wage: wage || 15.00,
    food_price: food || 7.50,
    event_price: eventVal || 25.00
  }).eq('id', session.user.id);

  alert("Financial metrics saved.");
  loadTrainerSession();
}

async function deleteAccount() {
  if (confirm("Are you sure you want to delete your account? This will erase all your progress.")) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    await supabaseClient.from('profiles').delete().eq('id', session.user.id);
    await supabaseClient.auth.signOut();
    alert("Account deleted.");
    showScreen('screen-login');
  }
}

async function updateTrainerStats(xpGained, goldSaved, logEntry = null) {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return;

  const { data: user } = await supabaseClient.from('profiles').select('xp, lvl, saved_total, logs').eq('id', session.user.id).single();
  if (!user) return;

  let newXp = (user.xp || 0) + xpGained;
  let newLvl = user.lvl || 1;
  let newSaved = parseFloat(user.saved_total || 0) + goldSaved;
  let newLogs = user.logs || [];

  if (logEntry) newLogs.unshift(logEntry);

  if (newXp >= 100) {
    newLvl += 1;
    newXp -= 100;
    alert(`Level Up! You reached Level ${newLvl}.`);
  }

  await supabaseClient.from('profiles').update({
    xp: newXp,
    lvl: newLvl,
    saved_total: newSaved,
    logs: newLogs
  }).eq('id', session.user.id);

  loadTrainerSession();
}

async function logoutTrainer() {
  await supabaseClient.auth.signOut();
  showScreen('screen-login');
}

// ==========================================
// 5. VAULT & HISTORY LOGS
// ==========================================

function startVaultTimer(unlockTimestamp) {
  if (battleState.timerInterval) clearInterval(battleState.timerInterval);

  async function updateDisplay() {
    const remaining = unlockTimestamp - Date.now();

    if (remaining <= 0) {
      clearInterval(battleState.timerInterval);
      document.getElementById('vault-timer').textContent = "Ready";

      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session) {
        await supabaseClient.from('profiles').update({ vault_unlock_time: null }).eq('id', session.user.id);
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

async function checkVaultDirect() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return showScreen('screen-login');

  const { data: user } = await supabaseClient.from('profiles').select('vault_unlock_time, logs').eq('id', session.user.id).single();

  if (user && user.vault_unlock_time && user.vault_unlock_time > Date.now()) {
    startVaultTimer(user.vault_unlock_time);
  } else {
    document.getElementById('vault-timer').textContent = "Ready";
  }

  renderHistoryLogs(user ? user.logs || [] : []);
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
// 6. SHOP & MULTI-EQUIP SYSTEM
// ==========================================

async function openShop() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return showScreen('screen-login');

  const { data: user } = await supabaseClient.from('profiles').select('*').eq('id', session.user.id).single();
  if (!user) return;

  if (document.getElementById('shop-gold-val')) {
    document.getElementById('shop-gold-val').textContent = parseFloat(user.saved_total || 0).toFixed(2);
  }
  renderCharacterAvatar('shop-preview-avatar', user);

  updateShopButtons(user);
  showScreen('screen-shop');
}

function updateShopButtons(user) {
  const items = [
    'hat_crown', 'hat_wizard', 'hat_ninja', 'hat_party', 'hat_helmet',
    'face_sunglasses', 'face_eyepatch', 'face_visor',
    'item_sword', 'item_staff', 'item_shield', 'item_laser',
    'hat_default'
  ];

  const itemPathMap = {
    'hat_crown': 'assets/costumes/overlay-crown.png',
    'hat_wizard': 'assets/costumes/overlay-wizard-hat.png',
    'hat_ninja': 'assets/costumes/overlay-ninja-headband.png',
    'hat_party': 'assets/costumes/overlay-party-hat.png',
    'hat_helmet': 'assets/costumes/overlay-helmet.png',
    'face_sunglasses': 'assets/costumes/overlay-sunglasses.png',
    'face_eyepatch': 'assets/costumes/overlay-eyepatch.png',
    'face_visor': 'assets/costumes/overlay-visor.png',
    'item_sword': 'assets/costumes/overlay-wooden-sword.png',
    'item_staff': 'assets/costumes/overlay-magic-staff.png',
    'item_shield': 'assets/costumes/overlay-shield.png',
    'item_laser': 'assets/costumes/overlay-laser-blaster.png'
  };

  const equipped = user.equipped_items || [];
  const inventory = user.inventory || ['hat_default'];

  items.forEach(itemId => {
    const btn = document.getElementById(`btn-${itemId}`);
    if (!btn) return;

    if (itemId === 'hat_default') {
      btn.textContent = equipped.length === 0 ? "Equipped" : "Unequip All";
      btn.className = equipped.length === 0 ? "btn btn-sm btn-equipped" : "btn btn-secondary btn-sm";
      return;
    }

    const isOwned = inventory.includes(itemId);
    const targetPath = itemPathMap[itemId];
    const isEquipped = equipped.includes(targetPath);

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

async function buyOrEquip(itemId, price, spritePath) {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return showScreen('screen-login');

  const { data: user } = await supabaseClient.from('profiles').select('*').eq('id', session.user.id).single();
  if (!user) return;

  let equipped = user.equipped_items || [];
  let inventory = user.inventory || ['hat_default'];
  let savedTotal = parseFloat(user.saved_total || 0);

  if (itemId === 'hat_default') {
    equipped = [];
  } else {
    const isOwned = inventory.includes(itemId);

    if (isOwned) {
      const index = equipped.indexOf(spritePath);
      if (index > -1) {
        equipped.splice(index, 1);
      } else {
        equipped.push(spritePath);
      }
    } else {
      if (savedTotal < price) {
        alert("You need more saved money to unlock this item!");
        return;
      }
      savedTotal -= price;
      inventory.push(itemId);
      equipped.push(spritePath);
      alert("Item unlocked and equipped!");
    }
  }

  await supabaseClient.from('profiles').update({
    equipped_items: equipped,
    inventory: inventory,
    saved_total: savedTotal
  }).eq('id', session.user.id);

  loadTrainerSession();
  openShop();
}

// ==========================================
// 7. INITIALIZATION & EVENT BINDING
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('form-signup');
  if (signupForm) {
    signupForm.addEventListener('submit', handleLocalSignup);
  }

  const loginForm = document.getElementById('form-login');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLocalLogin);
  }

  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');

  if (tabLogin) {
    tabLogin.addEventListener('click', () => switchAuthTab('login'));
  }
  if (tabSignup) {
    tabSignup.addEventListener('click', () => switchAuthTab('signup'));
  }

  loadTrainerSession();
});

// ==========================================
// IMPULSE SLAYER - PIXEL RPG
// Main Game Logic
// ==========================================


// ==========================================
// PLAYER DATA
// ==========================================

const player = {

    lvl: 1,

    xp: 0,

    xpToNext: 100,

    goldSaved: 0

};


// ==========================================
// CURRENT BATTLE STATE
// ==========================================

const battle = {

    itemName: "",

    price: 0,

    enemyName: "",

    enemyMaxHP: 100,

    enemyHP: 100,

    enemySprite:
        "assets/sprites/enemies/placeholder_enemy.png",

    timerInterval: null,

    rewardXP: 0

};


// ==========================================
// STARTUP
// ==========================================

window.addEventListener(
    "DOMContentLoaded",
    () => {

        loadPlayerData();

        checkExistingLock();

        updateHUD();

    }
);



// ==========================================
// SAVE SYSTEM
// ==========================================

function loadPlayerData(){

    const saved =
        localStorage.getItem(
            "slayer_player_data"
        );


    if(saved){

        Object.assign(
            player,
            JSON.parse(saved)
        );

    }

}



function savePlayerData(){

    localStorage.setItem(
        "slayer_player_data",
        JSON.stringify(player)
    );

    updateHUD();

}



function updateHUD(){

    const lvl =
        document.getElementById(
            "player-lvl"
        );

    const xp =
        document.getElementById(
            "player-xp"
        );

    const gold =
        document.getElementById(
            "player-gold"
        );


    if(lvl)
        lvl.textContent = player.lvl;


    if(xp)
        xp.textContent =
        `${player.xp}/${player.xpToNext}`;


    if(gold)
        gold.textContent =
        `$${player.goldSaved.toFixed(0)}`;

}



// ==========================================
// SCREEN MANAGEMENT
// ==========================================

function showScreen(id){

    document
    .querySelectorAll(".screen")
    .forEach(screen=>{

        screen.classList.remove(
            "active"
        );

    });


    const target =
        document.getElementById(id);


    if(target){

        target.classList.add(
            "active"
        );

    }

}



// ==========================================
// ENEMY GENERATION
// ==========================================

function generateEnemy(price){

    if(price < 25){

        return {

            name:
            "IMPULSE GOBLIN",

            hp:60,

            sprite:
            "assets/sprites/enemies/goblin.png"

        };

    }


    if(price < 100){

        return {

            name:
            "FOMO KNIGHT",

            hp:100,

            sprite:
            "assets/sprites/enemies/knight.png"

        };

    }


    return {

        name:
        "OVERSPEND DRAGON",

        hp:160,

        sprite:
        "assets/sprites/enemies/dragon.png"

    };

}



// ==========================================
// START BATTLE
// ==========================================

function initiateBattle(){

    const item =
        document
        .getElementById("item-name")
        .value
        .trim();


    const price =
        parseFloat(
            document
            .getElementById("item-price")
            .value
        );


    if(
        !item ||
        isNaN(price) ||
        price <= 0
    ){

        updateBattleText(
            "Enter a valid item and price."
        );

        return;

    }


    battle.itemName = item;

    battle.price = price;


    const enemy =
        generateEnemy(price);


    battle.enemyName =
        enemy.name;


    battle.enemyMaxHP =
        enemy.hp;


    battle.enemyHP =
        enemy.hp;


    battle.enemySprite =
        enemy.sprite;



    const sprite =
        document.getElementById(
            "enemy-sprite"
        );


    sprite.src =
        battle.enemySprite;


    document
    .getElementById("enemy-name")
    .textContent =
        battle.enemyName;



    const workHours =
        (price / 12)
        .toFixed(1);


    document
    .getElementById("metric-card")
    .innerHTML =
    `
        COST: $${price.toFixed(2)}
        <br>
        EQUALS ${workHours} HOURS OF WORK
    `;



    updateHPBar();


    updateBattleText(
        `A wild ${battle.enemyName} appears!`
    );


    document
    .getElementById("action-menu")
    .classList.remove(
        "hidden"
    );


    document
    .getElementById("quiz-container")
    .classList.add(
        "hidden"
    );


    showScreen(
        "step-boss"
    );

}



// ==========================================
// BATTLE UI HELPERS
// ==========================================

function updateBattleText(text){

    const box =
        document.getElementById(
            "battle-text"
        );


    if(box){

        box.textContent = text;

    }

}



function updateHPBar(){

    const fill =
        document.getElementById(
            "enemy-hp-fill"
        );


    if(!fill)
        return;


    const percent =
        Math.max(
            0,
            (battle.enemyHP /
            battle.enemyMaxHP) * 100
        );


    fill.style.width =
        `${percent}%`;

}
// ==========================================
// BATTLE ACTIONS
// ==========================================

function handleAction(type){

    switch(type){


        case "attack":

            startQuiz();

            break;



        case "defend":

            battle.enemyHP -= 20;

            if(battle.enemyHP < 0){

                battle.enemyHP = 0;

            }


            updateHPBar();


            updateBattleText(
                "You waited. The impulse weakened."
            );


            checkBattleEnd();

            break;



        case "item":

            const futureValue =
                Math.round(
                    battle.price * 1.5
                );


            updateBattleText(
                `Think long term. That $${battle.price.toFixed(2)} could become about $${futureValue} with time.`
            );


            break;



        case "flee":

            defeatImpulse();


            break;

    }

}



// ==========================================
// QUIZ SYSTEM
// ==========================================


const questions = [

    {

        q:
        "WILL YOU USE THIS NEXT MONTH?",


        opts:[

            {
                text:
                "YES, REGULARLY",

                dmg:40

            },

            {
                text:
                "MAYBE ONCE",

                dmg:15

            },

            {
                text:
                "PROBABLY NOT",

                dmg:0

            }

        ]

    },


    {

        q:
        "IS THIS WITHIN YOUR BUDGET?",


        opts:[

            {
                text:
                "YES, SAVED UP",

                dmg:40

            },

            {
                text:
                "TIGHT FIT",

                dmg:15

            },

            {
                text:
                "NO, IMPULSE BUY",

                dmg:0

            }

        ]

    },


    {

        q:
        "WILL THIS IMPROVE YOUR LIFE?",


        opts:[

            {
                text:
                "CLEARLY YES",

                dmg:40

            },

            {
                text:
                "NOT SURE",

                dmg:10

            },

            {
                text:
                "JUST EXCITED",

                dmg:0

            }

        ]

    }

];


let currentQuestion = 0;



function startQuiz(){

    currentQuestion = 0;


    document
    .getElementById("action-menu")
    .classList
    .add("hidden");


    document
    .getElementById("quiz-container")
    .classList
    .remove("hidden");


    loadQuizQuestion();

}



function loadQuizQuestion(){

    const container =
        document.getElementById(
            "quiz-opts"
        );


    if(currentQuestion >= questions.length){

        checkBattleEnd();

        return;

    }


    const question =
        questions[currentQuestion];


    document
    .getElementById("quiz-q")
    .textContent =
        question.q;



    container.innerHTML = "";



    question.opts.forEach(option=>{


        const button =
            document.createElement(
                "button"
            );


        button.textContent =
            option.text;



        button.onclick = ()=>{


            battle.enemyHP -=
                option.dmg;


            if(battle.enemyHP < 0){

                battle.enemyHP = 0;

            }


            updateHPBar();


            currentQuestion++;


            loadQuizQuestion();


        };


        container.appendChild(
            button
        );


    });


}



// ==========================================
// BATTLE END CHECK
// ==========================================

function checkBattleEnd(){


    if(
        battle.enemyHP <= 30
    ){

        defeatImpulse();


        return;

    }



    if(
        currentQuestion >=
        questions.length
    ){

        document
        .getElementById("action-menu")
        .classList
        .remove("hidden");


        document
        .getElementById("quiz-container")
        .classList
        .add("hidden");


        updateBattleText(
            "The monster survived. Try another strategy."
        );

    }

}



// ==========================================
// VICTORY / REWARD SYSTEM
// ==========================================


function defeatImpulse(){

    if(window.confetti){

        confetti({

            particleCount:80,

            spread:70

        });

    }



    const xp =
        Math.max(
            25,
            Math.round(
                battle.price
            )
        );


    battle.rewardXP = xp;



    player.goldSaved +=
        battle.price;



    addXP(xp);



    document
    .getElementById("reward-xp")
    .textContent =
        xp;



    document
    .getElementById("reward-money")
    .textContent =
        battle.price.toFixed(2);



    document
    .getElementById("reward-level")
    .textContent =
        player.lvl;



    showScreen(
        "step-victory"
    );


}



// ==========================================
// EXPERIENCE SYSTEM
// ==========================================

function addXP(amount){


    player.xp += amount;



    while(
        player.xp >= player.xpToNext
    ){

        player.xp -=
            player.xpToNext;


        player.lvl++;


        player.xpToNext =
            Math.floor(
                player.xpToNext * 1.5
            );


        updateBattleText(
            `LEVEL UP! You reached Level ${player.lvl}.`
        );

    }



    savePlayerData();


}



// ==========================================
// TIMER SYSTEM
// ==========================================

function startCoolingTimer(){


    const duration =
        24 *
        60 *
        60 *
        1000;



    const endTime =
        Date.now()
        + duration;



    localStorage.setItem(
        "slayer_lock_time",
        endTime
    );



    runTimer(endTime);


    showScreen(
        "step-timer"
    );

}
// ==========================================
// TIMER COUNTDOWN
// ==========================================

function runTimer(endTime){

    if(battle.timerInterval){

        clearInterval(
            battle.timerInterval
        );

    }



    const timer =
        document.getElementById(
            "countdown-timer"
        );


    const finishButton =
        document.getElementById(
            "finish-btn"
        );



    function updateTimer(){


        const now =
            Date.now();


        const distance =
            endTime - now;



        if(distance <= 0){


            clearInterval(
                battle.timerInterval
            );


            localStorage.removeItem(
                "slayer_lock_time"
            );


            if(timer){

                timer.textContent =
                    "UNLOCKED";

            }


            if(finishButton){

                finishButton.disabled =
                    false;

            }


            return;

        }



        const hours =
            Math.floor(
                distance /
                (1000 * 60 * 60)
            );



        const minutes =
            Math.floor(
                (distance %
                (1000 * 60 * 60)) /
                (1000 * 60)
            );



        const seconds =
            Math.floor(
                (distance %
                (1000 * 60)) /
                1000
            );



        if(timer){

            timer.textContent =

                `${hours
                .toString()
                .padStart(2,"0")}:` +

                `${minutes
                .toString()
                .padStart(2,"0")}:` +

                `${seconds
                .toString()
                .padStart(2,"0")}`;

        }

    }



    updateTimer();



    battle.timerInterval =
        setInterval(
            updateTimer,
            1000
        );

}



// ==========================================
// CHECK SAVED TIMER ON LOAD
// ==========================================

function checkExistingLock(){


    const saved =
        localStorage.getItem(
            "slayer_lock_time"
        );



    if(!saved){

        return;

    }



    const endTime =
        parseInt(
            saved,
            10
        );



    if(endTime > Date.now()){


        runTimer(
            endTime
        );


        showScreen(
            "step-timer"
        );


    } else {


        localStorage.removeItem(
            "slayer_lock_time"
        );

    }

}



// ==========================================
// FINISH TIMER REWARD
// ==========================================

function finishTimer(){


    const button =
        document.getElementById(
            "finish-btn"
        );



    if(button &&
       button.disabled){

        return;

    }



    updateBattleText(
        "The waiting period is complete."
    );



    showScreen(
        "step-victory"
    );


}



// ==========================================
// RETURN TO QUEST BOARD
// ==========================================

function returnToMenu(){


    if(battle.timerInterval){

        clearInterval(
            battle.timerInterval
        );

    }



    showScreen(
        "step-setup"
    );



}



// ==========================================
// RESET GAME SESSION
// ==========================================

function resetApp(){


    localStorage.removeItem(
        "slayer_lock_time"
    );



    if(battle.timerInterval){

        clearInterval(
            battle.timerInterval
        );

    }



    battle.itemName = "";

    battle.price = 0;

    battle.enemyHP = 0;



    const item =
        document.getElementById(
            "item-name"
        );


    const price =
        document.getElementById(
            "item-price"
        );



    if(item){

        item.value = "";

    }



    if(price){

        price.value = "";

    }



    const finishButton =
        document.getElementById(
            "finish-btn"
        );



    if(finishButton){

        finishButton.disabled =
            true;

    }



    showScreen(
        "step-setup"
    );

}



// ==========================================
// DEBUG / DEVELOPMENT HELPERS
// ==========================================


// TODO REMOVE BEFORE RELEASE
// Useful while building pixel art assets.

function resetSaveData(){

    localStorage.removeItem(
        "slayer_player_data"
    );

    localStorage.removeItem(
        "slayer_lock_time"
    );


    location.reload();

}

// [TIMESTAMP] 2026-01-10 10:00:00 - minigames.js - Game Logic (Hacking, Lockpicking, Dice)

window.MiniGames = {
    active: null,

    // --- HACKING ---
    hacking: {
        words: [], password: "", attempts: 4, logs: [],
        
        init: function() {
            const int = Game.getStat('INT');
            const diff = 12 - Math.min(8, int);
            const wordList = ["PASS", "FAIL", "DATA", "CODE", "HACK", "BIOS", "BOOT", "USER", "ROOT", "WIFI", "LINK", "NODE", "CORE", "DISK"];
            this.words = [];
            for(let i=0; i<diff; i++) {
                this.words.push(wordList[Math.floor(Math.random() * wordList.length)]);
            }
            this.password = this.words[Math.floor(Math.random() * this.words.length)];
            this.attempts = 4;
            this.logs = ["> SYSTEM LOCKED", "> ENTER PASSWORD"];
            if (typeof UI.renderHacking === 'function') UI.renderHacking();
        },

        checkWord: function(word) {
            if(this.attempts <= 0) return;
            let likeness = 0;
            for(let i=0; i<4; i++) {
                if(word[i] === this.password[i]) likeness++;
            }
            this.logs.unshift(`> ${word}: ${likeness}/4 MATCH`);
            this.attempts--;

            if(word === this.password) {
                this.logs.unshift("> ACCESS GRANTED");
                setTimeout(() => this.end(true), 1000);
            } else if (this.attempts <= 0) {
                this.logs.unshift("> SYSTEM LOCKOUT");
                setTimeout(() => this.end(false), 1000);
            }
            if (typeof UI.renderHacking === 'function') UI.renderHacking();
        },

        end: function(success) {
            if(success) {
                if(typeof Game.updateQuestProgress === 'function') {
                    Game.updateQuestProgress('hack', 'terminal', 1);
                }
                UI.log("Terminal gehackt!", "text-green-400");
            } else {
                UI.log("Zugriff verweigert.", "text-red-500");
            }
            UI.stopMinigame();
        }
    },

    // --- LOCKPICKING ---
    lockpicking: {
        difficulty: 'easy', lockAngle: 0, currentAngle: 0, sweetSpot: 0, health: 100,

        init: function(diff = 'easy') {
            this.difficulty = diff;
            this.lockAngle = 0;
            this.currentAngle = 0;
            this.health = 100;
            this.sweetSpot = Math.floor(Math.random() * 160) - 80;
            if (typeof UI.renderLockpicking === 'function') UI.renderLockpicking(true);
        },

        rotateLock: function() {
            const dist = Math.abs(this.currentAngle - this.sweetSpot);
            const maxRot = Math.max(0, 90 - dist);
            this.lockAngle = maxRot;
            
            if(dist < 10) {
                this.lockAngle = 90;
                setTimeout(() => this.end(true), 500);
            } else {
                this.health -= 10;
                if(this.health <= 0) {
                    Game.removeFromInventory('bobby_pin', 1);
                    this.end(false);
                }
            }
            if (typeof UI.renderLockpicking === 'function') UI.renderLockpicking();
        },

        releaseLock: function() {
            this.lockAngle = 0;
            if (typeof UI.renderLockpicking === 'function') UI.renderLockpicking();
        },

        end: function(success) {
            if(success) UI.log("Schloss geknackt!", "text-green-400");
            else UI.log("Dietrich abgebrochen!", "text-red-500");
            UI.stopMinigame();
        }
    },

    // --- DICE GAME (Wasteland Gamble) ---
    dice: {
        d1: 1, d2: 1, rolling: false,

        init: function() {
            this.d1 = 1; this.d2 = 1;
            this.rolling = false;
            // Da Dice ein Overlay ist, rendern wir es direkt hier via UI Aufruf
            if (typeof UI.renderDice === 'function') UI.renderDice();
        },

        roll: function() {
            if(this.rolling) return;
            this.rolling = true;
            
            let rolls = 0;
            const maxRolls = 10;
            const rollInterval = setInterval(() => {
                this.d1 = Math.floor(Math.random() * 6) + 1;
                this.d2 = Math.floor(Math.random() * 6) + 1;
                if (typeof UI.renderDice === 'function') UI.renderDice();
                rolls++;
                if(rolls >= maxRolls) {
                    clearInterval(rollInterval);
                    this.rolling = false;
                    this.finish();
                }
            }, 100);
        },

        finish: function() {
            const sum = this.d1 + this.d2;
            const luck = Game.getStat('LUC') || 1;
            const bonus = Math.floor(luck / 2);
            const total = sum + bonus;

            UI.log(`Würfel: ${sum} + Glück(${bonus}) = ${total}`, "text-yellow-400");
            
            // Render one last time to show result state
            if (typeof UI.renderDice === 'function') UI.renderDice();

            if(typeof Game.gambleLegendaryLoot === 'function') {
                Game.gambleLegendaryLoot(total);
            }

            setTimeout(() => {
                UI.stopMinigame();
            }, 2500);
        }
    }
};

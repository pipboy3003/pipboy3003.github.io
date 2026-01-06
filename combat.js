window.Combat = {
    enemy: null,
    turn: 'player', // 'player' or 'enemy'
    logData: [], // Umbenannt, da 'log' Funktionsname ist
    selectedPart: 1, // 0: Head, 1: Body, 2: Legs
    
    bodyParts: [
        { name: "KOPF", hitMod: 0.6, dmgMod: 2.0 }, 
        { name: "KÖRPER", hitMod: 1.0, dmgMod: 1.0 }, 
        { name: "BEINE", hitMod: 1.3, dmgMod: 0.8 }
    ],

    start: function(enemyEntity) {
        // Deep copy enemy to avoid modifying original template
        Game.state.enemy = JSON.parse(JSON.stringify(enemyEntity)); 
        Game.state.enemy.maxHp = Game.state.enemy.hp; // Ensure maxHp is set
        this.enemy = Game.state.enemy;

        Game.state.view = 'combat';
        
        this.logData = [];
        this.turn = 'player';
        this.selectedPart = 1; 
        
        // Soundeffekt (Dummy Call, falls Audio später erweitert wird)
        // if(Game.Audio) Game.Audio.playEffect('combat_start');

        this.log(`Kampf gestartet gegen: ${this.enemy.name}`, 'text-yellow-400 blink-red');
        UI.switchView('combat').then(() => {
            this.render();
            // Highlight initial selection
            this.moveSelection(0); 
        });
    },

    log: function(msg, color='text-gray-300') {
        this.logData.unshift({t: msg, c: color});
        if(this.logData.length > 6) this.logData.pop();
        this.renderLogs();
    },

    renderLogs: function() {
        const el = document.getElementById('combat-log');
        if(!el) return;
        el.innerHTML = this.logData.map(l => `<div class="${l.c}">${l.t}</div>`).join('');
    },

    render: function() {
        UI.renderCombat();
        this.renderLogs();
    },

    // --- V.A.T.S. INPUT ---
    moveSelection: function(dir) {
        if (typeof this.selectedPart === 'undefined') this.selectedPart = 1;
        this.selectedPart += dir;
        
        if (this.selectedPart < 0) this.selectedPart = 2;
        if (this.selectedPart > 2) this.selectedPart = 0;

        // Visual Feedback Update
        for(let i=0; i<3; i++) {
            const btn = document.getElementById(`btn-vats-${i}`);
            if(btn) {
                btn.classList.remove('border-yellow-400', 'text-yellow-400', 'bg-yellow-900/40');
                if(i === this.selectedPart) {
                    btn.classList.add('border-yellow-400', 'text-yellow-400', 'bg-yellow-900/40');
                }
            }
        }
        
        // Update Hit Chance Display live
        UI.renderCombat(); 
    },
    
    // UI Click Helper
    selectPart: function(index) {
        this.selectedPart = index;
        this.moveSelection(0); // Trigger visual update
    },

    confirmSelection: function() {
        if(this.turn === 'player') {
            this.playerAttack();
        }
    },

    // --- VISUAL FX ---
    triggerFeedback: function(type, value) {
        const layer = document.getElementById('combat-feedback-layer');
        if(!layer) return;

        const el = document.createElement('div');
        el.className = "float-text absolute font-bold text-4xl pointer-events-none z-50 text-shadow-black";
        
        const offset = Math.floor(Math.random() * 40) - 20;
        const offsetY = Math.floor(Math.random() * 40) - 20;
        el.style.transform = `translate(${offset}px, ${offsetY}px)`;

        if(type === 'hit') {
            el.innerHTML = `-${value}`;
            el.className += " text-yellow-400 animate-float-up"; 
        } else if(type === 'crit') {
            el.innerHTML = `CRIT! -${value}`;
            el.className += " text-red-500 text-6xl blink-red animate-float-up"; 
        } else if(type === 'miss') {
            el.innerHTML = "MISS";
            el.className += " text-gray-500 text-2xl animate-fade-out";
        } else if(type === 'damage') {
            el.innerHTML = `-${value}`;
            el.className += " text-red-600 animate-shake"; 
            
            const flash = document.getElementById('damage-flash');
            if(flash) {
                flash.classList.remove('hidden');
                flash.style.opacity = 0.5;
                setTimeout(() => { flash.style.opacity = 0; flash.classList.add('hidden'); }, 300);
            }
        } else if(type === 'dodge') {
            el.innerHTML = "AUSGEWICHEN";
            el.className += " text-blue-400 text-2xl animate-fade-out";
        }

        layer.appendChild(el);
        setTimeout(() => { el.remove(); }, 1000);
    },

    // --- CORE MECHANICS ---
    calculateHitChance: function(partIndex) {
        const part = this.bodyParts[partIndex];
        const perception = Game.getStat('PER');
        
        // Base: 50% + (PER * 5)
        let chance = 50 + (perception * 5);
        
        // Zone Modifier
        chance *= part.hitMod;
        
        // Distance Logic (Simulated)
        const weapon = Game.state.equip.weapon;
        if(weapon && (!weapon.type || ['fists','knife','bat','machete','sledgehammer'].includes(weapon.id))) {
            chance += 20; // Melee is easier to hit
        }

        return Math.min(95, Math.floor(chance));
    },

    playerAttack: function() {
        if(this.turn !== 'player') return;

        const partIndex = this.selectedPart;
        const part = this.bodyParts[partIndex];
        const hitChance = this.calculateHitChance(partIndex);
        
        // --- AMMO CHECK ---
        let wpn = Game.state.equip.weapon || { id: 'fists', name: "Fäuste" };
        const isMelee = ['fists','knife','bat','machete','sledgehammer'].includes(wpn.id);
        
        // Wenn Waffe Munition braucht (nicht Melee und kein "Special" Item)
        if(!isMelee && wpn.id !== 'alien_blaster') { // Alien Blaster hat evtl eigene Ammo, hier als Beispiel
             const hasAmmo = Game.removeFromInventory('ammo', 1);
             if(!hasAmmo) {
                 this.log("KLICK! Munition leer!", "text-red-500 font-bold");
                 
                 // Auto-Switch to Fists?
                 Game.unequipItem('weapon');
                 // Check if switch worked
                 wpn = Game.state.equip.weapon || { id: 'fists', name: "Fäuste" };
                 
                 if(['fists'].includes(wpn.id)) {
                     this.log("Wechsle zu Nahkampf!", "text-yellow-400");
                     // Continue attack logic with fists
                 } else {
                     this.triggerFeedback('miss');
                     return; // Stop attack
                 }
             }
        }

        const roll = Math.random() * 100;
        
        // Player Animation Shake
        const screen = document.getElementById('game-screen');
        if(screen) {
            screen.classList.add('shake-anim'); // Ensure CSS has this class
            setTimeout(() => screen.classList.remove('shake-anim'), 200);
        }

        if(roll <= hitChance) {
            // HIT CALCULATION
            let dmg = wpn.baseDmg || 2;
            
            // Mods
            if(wpn.props && wpn.props.dmgMult) dmg *= wpn.props.dmgMult;

            // Stats Bonus
            if(isMelee) {
                // Strength Bonus
                dmg += Math.floor(Game.getStat('STR') / 2);
                
                // Perk: Slugger
                const sluggerLvl = Game.getPerkLevel('slugger');
                if(sluggerLvl > 0) dmg = Math.floor(dmg * (1 + (sluggerLvl * 0.1)));
            } else {
                // Perk: Gunslinger
                const gunLvl = Game.getPerkLevel('gunslinger');
                if(gunLvl > 0) dmg = Math.floor(dmg * (1 + (gunLvl * 0.1)));
            }

            // Zone Modifier
            dmg *= part.dmgMod;

            // Critical Hit
            let isCrit = false;
            // Base Crit Chance from Game Core (Luck based)
            // Plus Mysterious Stranger Perk check logic
            let critChance = Game.state.critChance || 5; 
            
            if(Math.random() * 100 <= critChance) {
                dmg *= 2;
                isCrit = true;
                this.log(">> KRITISCHER TREFFER! <<", "text-yellow-400 font-bold animate-pulse");
                if (Game.getPerkLevel('mysterious_stranger') > 0) {
                    this.log("Der Fremde hilft dir...", "text-gray-400 text-xs");
                }
            }

            dmg = Math.floor(dmg);
            this.enemy.hp -= dmg;
            
            this.log(`Treffer: ${part.name} für ${dmg} Schaden!`, 'text-green-400 font-bold');
            this.triggerFeedback(isCrit ? 'crit' : 'hit', dmg);

            // Enemy Shake
            const el = document.getElementById('enemy-img'); 
            if(el) {
                el.classList.add('animate-pulse');
                setTimeout(() => el.classList.remove('animate-pulse'), 200);
            }

            if(this.enemy.hp <= 0) {
                this.win();
                return;
            }
        } else {
            this.log("Daneben!", 'text-gray-500');
            this.triggerFeedback('miss');
        }

        this.turn = 'enemy';
        this.render(); // Update Logs & UI
        setTimeout(() => this.enemyTurn(), 1000);
    },

    enemyTurn: function() {
        if(!this.enemy || this.enemy.hp <= 0) return;
        
        // Enemy Hit Chance vs Agility
        const agi = Game.getStat('AGI');
        const enemyHitChance = 85 - (agi * 3); // Max 30% dodge chance at 10 AGI
        
        const roll = Math.random() * 100;

        if(roll <= enemyHitChance) {
            let dmg = this.enemy.dmg;
            
            // Armor Calculation
            let armor = 0;
            const slots = ['body', 'head', 'legs', 'feet', 'arms'];
            slots.forEach(s => {
                if(Game.state.equip[s]) {
                    if (Game.state.equip[s].def) armor += Game.state.equip[s].def;
                    // Check Props Bonus (e.g. Legendary Armor)
                    if (Game.state.equip[s].props && Game.state.equip[s].props.bonus && Game.state.equip[s].props.bonus.DEF) {
                        armor += Game.state.equip[s].props.bonus.DEF;
                    }
                }
            });
            
            // Damage Reduction: Armor reduces damage flat, minimum 1 dmg
            // Optional: Percentage reduction logic can be added here
            let dmgTaken = Math.max(1, dmg - Math.floor(armor / 2));
            
            Game.state.hp -= dmgTaken;
            this.log(`${this.enemy.name} trifft dich: -${dmgTaken} HP`, 'text-red-500 font-bold');
            this.triggerFeedback('damage', dmgTaken);
            
            if(Game.state.hp <= 0) {
                Game.state.isGameOver = true;
                if(UI && UI.showGameOver) UI.showGameOver();
                return;
            }
        } else {
            this.log(`${this.enemy.name} verfehlt dich!`, 'text-blue-300');
            this.triggerFeedback('dodge');
        }

        this.turn = 'player';
        UI.update(); 
        this.render();
    },

    win: function() {
        this.log(`${this.enemy.name} besiegt!`, 'text-yellow-400 font-bold');
        
        // XP Reward (Perk Logic for XP handled in Game.gainExp)
        const xpBase = Array.isArray(this.enemy.xp) ? (this.enemy.xp[0] + Math.floor(Math.random()*(this.enemy.xp[1]-this.enemy.xp[0]))) : this.enemy.xp;
        Game.gainExp(xpBase);
        
        // Loot (Perk: Fortune Finder already applied to this.enemy.loot in Game.startCombat)
        if(this.enemy.loot > 0) {
            let caps = Math.floor(Math.random() * this.enemy.loot) + 1;
            Game.state.caps += caps;
            this.log(`Gefunden: ${caps} Kronkorken`, 'text-yellow-200');
        }
        
        // Drops
        if(this.enemy.drops) {
            this.enemy.drops.forEach(d => {
                if(Math.random() < d.c) {
                    Game.addToInventory(d.id, 1);
                    // UI Log happens in addToInventory
                }
            });
        }

        // Quest Progress
        // Try to find Mob ID by Name match (Reverse Lookup)
        let mobId = null;
        if(Game.monsters) {
            for(let k in Game.monsters) {
                if(Game.monsters[k].name === this.enemy.name.replace('Legendäre ', '')) {
                    mobId = k;
                    break;
                }
            }
        }
        if(mobId && typeof Game.updateQuestProgress === 'function') {
            Game.updateQuestProgress('kill', mobId, 1);
        }

        if(Game.state.kills === undefined) Game.state.kills = 0;
        Game.state.kills++;
        Game.saveGame();

        setTimeout(() => {
            Game.state.enemy = null;
            UI.switchView('map');
        }, 1500);
    },

    flee: function() {
        if(Math.random() < 0.5) {
            this.log("Flucht gelungen!", 'text-green-400');
            this.triggerFeedback('dodge'); 
            setTimeout(() => {
                Game.state.enemy = null;
                UI.switchView('map');
            }, 800);
        } else {
            this.log("Flucht fehlgeschlagen!", 'text-red-500');
            this.turn = 'enemy';
            setTimeout(() => this.enemyTurn(), 800);
        }
    }
};

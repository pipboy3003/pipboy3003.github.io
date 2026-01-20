// [TIMESTAMP] 2026-01-20 12:00:00 - game_combat.js - VATS Logic + Mod Support

window.Combat = {
    enemy: null,
    turn: 'player', 
    logData: [], 
    selectedPart: 1, 
    
    bodyParts: [
        { name: "KOPF", hitMod: 0.6, dmgMod: 2.0 }, 
        { name: "KÖRPER", hitMod: 1.0, dmgMod: 1.0 }, 
        { name: "BEINE", hitMod: 1.3, dmgMod: 0.8 }
    ],

    start: function(enemyEntity) {
        Game.state.enemy = JSON.parse(JSON.stringify(enemyEntity)); 
        Game.state.enemy.maxHp = Game.state.enemy.hp; 
        this.enemy = Game.state.enemy;

        Game.state.view = 'combat';
        
        this.logData = [];
        this.turn = 'player';
        this.selectedPart = 1; 
        
        this.log(`Kampf gestartet gegen: ${this.enemy.name}`, 'text-yellow-400 blink-red');
        UI.switchView('combat').then(() => {
            this.render();
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
        if(typeof UI.renderCombat === 'function') UI.renderCombat();
        this.renderLogs();
    },

    moveSelection: function(dir) {
        if (typeof this.selectedPart === 'undefined') this.selectedPart = 1;
        this.selectedPart += dir;
        
        if (this.selectedPart < 0) this.selectedPart = 2;
        if (this.selectedPart > 2) this.selectedPart = 0;

        for(let i=0; i<3; i++) {
            const btn = document.getElementById(`btn-vats-${i}`);
            if(btn) {
                btn.classList.remove('border-yellow-400', 'text-yellow-400', 'bg-yellow-900/40');
                if(i === this.selectedPart) {
                    btn.classList.add('border-yellow-400', 'text-yellow-400', 'bg-yellow-900/40');
                }
            }
        }
    },
    
    selectPart: function(index) {
        this.selectedPart = index;
        this.moveSelection(0); 
    },

    confirmSelection: function() {
        if(this.turn === 'player') {
            Game.playerAttack();
        }
    },

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

    getSafeWeapon: function() {
        let wpn = Game.state.equip.weapon;
        if (!wpn) return { id: 'fists', name: 'Fäuste', baseDmg: 2 };

        if (!wpn.id && wpn.name) {
            const foundId = Object.keys(Game.items).find(k => Game.items[k].name === wpn.name);
            if(foundId) wpn.id = foundId; 
            else return { id: 'fists', name: 'Fäuste (Fallback)', baseDmg: 2 };
        }
        
        if (!wpn.id) return { id: 'fists', name: 'Fäuste', baseDmg: 2 };

        return wpn;
    },

    calculateHitChance: function(partIndex) {
        const part = this.bodyParts[partIndex];
        const perception = Game.getStat('PER');
        
        let chance = 50 + (perception * 5);
        chance *= part.hitMod;
        
        const wpn = this.getSafeWeapon();
        const wId = wpn.id.toLowerCase();
        
        const rangedKeywords = ['pistol', 'rifle', 'gun', 'shotgun', 'smg', 'minigun', 'blaster', 'sniper', 'cannon', 'gewehr', 'flinte', 'revolver'];
        const isRanged = rangedKeywords.some(k => wId.includes(k));

        if (!isRanged) chance += 20; 

        return Math.min(95, Math.floor(chance));
    }
};

// [GAME EXTENSIONS FOR COMBAT & MODS]
Object.assign(Game, {
    
    // [MOD SYSTEM UPDATE] Berechnet Stats inkl. Mods
    getWeaponStats: function(item) {
        const dbItem = this.items[item.id] || {};
        
        // 1. Basis Werte (Instanz > DB > Default)
        let stats = {
            dmg: (item.dmg !== undefined) ? item.dmg : (item.baseDmg || dbItem.baseDmg || 2),
            ammoType: item.ammoType || dbItem.ammo || null, // Hier korrigiert: data_items nutzt 'ammo', nicht 'ammoType'
            ammoCost: (item.ammoCost !== undefined) ? item.ammoCost : (dbItem.ammoCost || 1),
            name: item.name || dbItem.name
        };

        // 2. MODS Checken
        if (item.mods && Array.isArray(item.mods)) {
            item.mods.forEach(modId => {
                const modDef = this.items[modId];
                if (modDef && modDef.stats) {
                    if (modDef.stats.dmg) stats.dmg += modDef.stats.dmg;
                    if (modDef.stats.ammoCost) stats.ammoCost += modDef.stats.ammoCost;
                }
            });
        }

        return stats;
    },

    playerAttack: function() {
        if(Combat.turn !== 'player') return;

        const partIndex = Combat.selectedPart;
        const part = Combat.bodyParts[partIndex];
        const hitChance = Combat.calculateHitChance(partIndex);
        
        let wpn = Combat.getSafeWeapon();
        const stats = this.getWeaponStats(wpn); // [NEU] Stats inkl. Mods laden
        const wId = wpn.id.toLowerCase();

        // Ammo Check (Wichtig: Prüfen ob Waffe Munition braucht -> usesAmmo)
        const dbItem = this.items[wpn.id] || {};
        const usesAmmo = (wpn.usesAmmo !== undefined) ? wpn.usesAmmo : dbItem.usesAmmo;

        if(usesAmmo && stats.ammoType && wId !== 'alien_blaster') { 
             const hasAmmo = Game.removeFromInventory(stats.ammoType, stats.ammoCost);
             if(!hasAmmo) {
                 if(typeof UI.showCombatEffect === 'function') UI.showCombatEffect("* KLICK *", "LEER!", "red", 1000);
                 Combat.log("WAFFE LEER! *KLICK*", "text-red-500 font-bold");
                 setTimeout(() => this.switchToBestMelee(), 800);
                 return; 
             }
        }

        const roll = Math.random() * 100;
        const screen = document.getElementById('game-screen');
        if(screen) {
            screen.classList.add('shake-anim'); 
            setTimeout(() => screen.classList.remove('shake-anim'), 200);
        }

        if(roll <= hitChance) {
            let dmg = stats.dmg; // Schaden inkl. Mods
            
            // Multiplikatoren (Perks etc)
            if(wpn.props && wpn.props.dmgMult) dmg *= wpn.props.dmgMult;
            
            // Skill Boni
            if(!usesAmmo) dmg += Math.floor(this.getStat('STR')/2); // Melee Bonus
            else {
                // Ranged Bonus (optional)
                const gunLvl = this.getPerkLevel('gunslinger');
                if(gunLvl > 0) dmg = Math.floor(dmg * (1 + (gunLvl * 0.1)));
            }
            
            dmg *= part.dmgMod;

            // Crit Logic
            let isCrit = false;
            if(Math.random()*100 <= (this.state.critChance || 5)) {
                dmg *= 2; isCrit = true;
                Combat.log(">> CRIT! <<", "text-yellow-400 font-bold animate-pulse");
                if (this.getPerkLevel('mysterious_stranger') > 0) Combat.log("Der Fremde hilft...", "text-gray-400 text-xs");
            }

            dmg = Math.floor(dmg);
            Combat.enemy.hp -= dmg;
            
            // Item-Effekte (z.B. Vampir)
            if(wpn.effectHeal) {
                this.state.hp = Math.min(this.getMaxHp(), this.state.hp + wpn.effectHeal);
                Combat.log(`Vampir: +${wpn.effectHeal} HP`, "text-green-400");
            }

            Combat.log(`Treffer: ${part.name} für ${dmg} Schaden`, 'text-green-400 font-bold');
            Combat.triggerFeedback(isCrit ? 'crit' : 'hit', dmg);

            const el = document.getElementById('enemy-img'); 
            if(el) {
                el.classList.add('animate-pulse');
                setTimeout(() => el.classList.remove('animate-pulse'), 200);
            }

            if(Combat.enemy.hp <= 0) { Combat.win(); return; }
        } else {
            Combat.log("Daneben!", 'text-gray-500');
            Combat.triggerFeedback('miss');
        }

        Combat.turn = 'enemy';
        Combat.render(); 
        setTimeout(() => Combat.enemyTurn(), 1000);
    },

    enemyTurn: function() {
        if(!Combat.enemy || Combat.enemy.hp <= 0) return;
        
        const agi = this.getStat('AGI');
        const enemyHitChance = 85 - (agi * 3); 
        const roll = Math.random() * 100;

        if(roll <= enemyHitChance) {
            let dmg = Combat.enemy.dmg;
            let armor = 0;
            const slots = ['body', 'head', 'legs', 'feet', 'arms'];
            slots.forEach(s => {
                if(this.state.equip[s]) {
                    if (this.state.equip[s].def) armor += this.state.equip[s].def;
                    if (this.state.equip[s].props && this.state.equip[s].props.bonus && this.state.equip[s].props.bonus.DEF) {
                        armor += this.state.equip[s].props.bonus.DEF;
                    }
                }
            });
            
            let dmgTaken = Math.max(1, dmg - Math.floor(armor / 2));
            this.state.hp -= dmgTaken;
            Combat.log(`${Combat.enemy.name} trifft dich: -${dmgTaken} HP`, 'text-red-500 font-bold');
            Combat.triggerFeedback('damage', dmgTaken);

            if(this.state.hp <= 0) {
                this.state.hp = 0;
                this.state.isGameOver = true;
                
                console.log("☠️ PERMADEATH: Player died.");
                
                const slotToDelete = this.state.saveSlot;
                if(typeof Network !== 'undefined' && Network.active) Network.registerDeath(this.state);
                
                if (typeof Network !== 'undefined' && slotToDelete !== undefined && slotToDelete !== null && slotToDelete !== -1) {
                    Network.deleteSlot(slotToDelete).catch(err => console.error(err));
                }
                
                if(typeof UI !== 'undefined' && UI.showGameOver) UI.showGameOver();
                
                this.state.saveSlot = -1; 
                setTimeout(() => { 
                    this.state = null; 
                    localStorage.removeItem('pipboy_save');
                }, 1000);
                return;
            }
        } else {
            Combat.log(`${Combat.enemy.name} verfehlt dich!`, 'text-blue-300');
            Combat.triggerFeedback('dodge');
        }
        Combat.turn = 'player';
        UI.update(); 
        Combat.render();
    }
});

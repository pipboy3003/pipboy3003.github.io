// [TIMESTAMP] 2026-01-20 21:30:00 - game_combat.js - Fixed 'this' Context & Win Crash

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
        Combat.enemy = Game.state.enemy; // Explizit Combat nutzen

        Game.state.view = 'combat';
        
        Combat.logData = [];
        Combat.turn = 'player';
        Combat.selectedPart = 1; 
        
        Combat.log(`Kampf gestartet gegen: ${Combat.enemy.name}`, 'text-yellow-400 blink-red');
        UI.switchView('combat').then(() => {
            Combat.render();
            Combat.moveSelection(0); 
        });
    },

    log: function(msg, color='text-gray-300') {
        Combat.logData.unshift({t: msg, c: color});
        if(Combat.logData.length > 6) Combat.logData.pop();
        Combat.renderLogs();
    },

    renderLogs: function() {
        const el = document.getElementById('combat-log');
        if(!el) return;
        el.innerHTML = Combat.logData.map(l => `<div class="${l.c}">${l.t}</div>`).join('');
    },

    render: function() {
        if(typeof UI.renderCombat === 'function') UI.renderCombat();
        Combat.renderLogs();
    },

    moveSelection: function(dir) {
        if (typeof Combat.selectedPart === 'undefined') Combat.selectedPart = 1;
        Combat.selectedPart += dir;
        
        if (Combat.selectedPart < 0) Combat.selectedPart = 2;
        if (Combat.selectedPart > 2) Combat.selectedPart = 0;

        for(let i=0; i<3; i++) {
            const btn = document.getElementById(`btn-vats-${i}`);
            if(btn) {
                btn.classList.remove('border-yellow-400', 'text-yellow-400', 'bg-yellow-900/40');
                if(i === Combat.selectedPart) {
                    btn.classList.add('border-yellow-400', 'text-yellow-400', 'bg-yellow-900/40');
                }
            }
        }
    },
    
    selectPart: function(index) {
        Combat.selectedPart = index;
        Combat.moveSelection(0); 
    },

    confirmSelection: function() {
        if(Combat.turn === 'player') {
            Combat.playerAttack();
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
        const part = Combat.bodyParts[partIndex];
        const perception = Game.getStat('PER');
        
        let chance = 50 + (perception * 5);
        chance *= part.hitMod;
        
        const wpn = Combat.getSafeWeapon();
        const wId = wpn.id.toLowerCase();
        
        const rangedKeywords = ['pistol', 'rifle', 'gun', 'shotgun', 'smg', 'minigun', 'blaster', 'sniper', 'cannon', 'gewehr', 'flinte', 'revolver'];
        const isRanged = rangedKeywords.some(k => wId.includes(k));

        if (!isRanged) chance += 20; 

        return Math.min(95, Math.floor(chance));
    },

    playerAttack: function() {
        if(Combat.turn !== 'player') return;

        const partIndex = Combat.selectedPart;
        const part = Combat.bodyParts[partIndex];
        const hitChance = Combat.calculateHitChance(partIndex);
        
        let wpn = Combat.getSafeWeapon();
        // Fallback falls getWeaponStats noch nicht bereit
        const stats = (Game.getWeaponStats) ? Game.getWeaponStats(wpn) : { dmg: wpn.baseDmg || 2, ammoCost: 1, ammoType: null };
        const wId = wpn.id.toLowerCase();

        // Ammo Check
        const dbItem = Game.items[wpn.id] || {};
        const usesAmmo = (wpn.usesAmmo !== undefined) ? wpn.usesAmmo : dbItem.usesAmmo;

        if(usesAmmo && stats.ammoType && wId !== 'alien_blaster') { 
             const hasAmmo = Game.removeFromInventory(stats.ammoType, stats.ammoCost);
             if(!hasAmmo) {
                 if(typeof UI.showCombatEffect === 'function') UI.showCombatEffect("* KLICK *", "LEER!", "red", 1000);
                 Combat.log("WAFFE LEER! *KLICK*", "text-red-500 font-bold");
                 setTimeout(() => {
                     if(typeof Game.switchToBestMelee === 'function') Game.switchToBestMelee();
                 }, 800);
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
            let dmg = stats.dmg;
            
            if(wpn.props && wpn.props.dmgMult) dmg *= wpn.props.dmgMult;
            
            if(!usesAmmo) dmg += Math.floor(Game.getStat('STR')/2); 
            else {
                const gunLvl = Game.getPerkLevel('gunslinger');
                if(gunLvl > 0) dmg = Math.floor(dmg * (1 + (gunLvl * 0.1)));
            }
            
            dmg *= part.dmgMod;

            let isCrit = false;
            if(Math.random()*100 <= (Game.state.critChance || 5)) {
                dmg *= 2; isCrit = true;
                Combat.log(">> CRIT! <<", "text-yellow-400 font-bold animate-pulse");
                if (Game.getPerkLevel('mysterious_stranger') > 0) Combat.log("Der Fremde hilft...", "text-gray-400 text-xs");
            }

            dmg = Math.floor(dmg);
            Combat.enemy.hp -= dmg;
            
            if(wpn.effectHeal) {
                Game.state.hp = Math.min(Game.getMaxHp(), Game.state.hp + wpn.effectHeal);
                Combat.log(`Vampir: +${wpn.effectHeal} HP`, "text-green-400");
            }

            Combat.log(`Treffer: ${part.name} für ${dmg} Schaden`, 'text-green-400 font-bold');
            Combat.triggerFeedback(isCrit ? 'crit' : 'hit', dmg);

            const el = document.getElementById('enemy-img'); 
            if(el) {
                el.classList.add('animate-pulse');
                setTimeout(() => el.classList.remove('animate-pulse'), 200);
            }

            // CRASH FIX: Combat.win() statt this.win()
            if(Combat.enemy.hp <= 0) { 
                Combat.win(); 
                return; 
            }
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
        
        const agi = Game.getStat('AGI');
        const enemyHitChance = 85 - (agi * 3); 
        const roll = Math.random() * 100;

        if(roll <= enemyHitChance) {
            let dmg = Combat.enemy.dmg;
            let armor = 0;
            const slots = ['body', 'head', 'legs', 'feet', 'arms'];
            slots.forEach(s => {
                if(Game.state.equip[s]) {
                    if (Game.state.equip[s].def) armor += Game.state.equip[s].def;
                    if (Game.state.equip[s].props && Game.state.equip[s].props.bonus && Game.state.equip[s].props.bonus.DEF) {
                        armor += Game.state.equip[s].props.bonus.DEF;
                    }
                }
            });
            
            let dmgTaken = Math.max(1, dmg - Math.floor(armor / 2));
            Game.state.hp -= dmgTaken;
            Combat.log(`${Combat.enemy.name} trifft dich: -${dmgTaken} HP`, 'text-red-500 font-bold');
            Combat.triggerFeedback('damage', dmgTaken);

            if(Game.state.hp <= 0) {
                Game.state.hp = 0;
                Game.state.isGameOver = true;
                
                console.log("☠️ PERMADEATH: Player died.");
                
                const slotToDelete = Game.state.saveSlot;
                if(typeof Network !== 'undefined' && Network.active) Network.registerDeath(Game.state);
                
                if (typeof Network !== 'undefined' && slotToDelete !== undefined && slotToDelete !== null && slotToDelete !== -1) {
                    Network.deleteSlot(slotToDelete).catch(err => console.error(err));
                }
                
                if(typeof UI !== 'undefined' && UI.showGameOver) UI.showGameOver();
                
                Game.state.saveSlot = -1; 
                setTimeout(() => { 
                    Game.state = null; 
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
    },

    win: function() {
        Combat.log(`${Combat.enemy.name} besiegt!`, 'text-yellow-400 font-bold');
        
        const xpBase = Array.isArray(Combat.enemy.xp) ? (Combat.enemy.xp[0] + Math.floor(Math.random()*(Combat.enemy.xp[1]-Combat.enemy.xp[0]))) : Combat.enemy.xp;
        Game.gainExp(xpBase);
        
        if(Combat.enemy.loot > 0) {
            let caps = Math.floor(Math.random() * Combat.enemy.loot) + 1;
            Game.state.caps += caps;
            Combat.log(`Gefunden: ${caps} Kronkorken`, 'text-yellow-200');
        }
        
        if(Combat.enemy.drops) {
            Combat.enemy.drops.forEach(d => {
                if(Math.random() < d.c) {
                    Game.addToInventory(d.id, 1);
                }
            });
        }

        let mobId = null;
        if(Game.monsters) {
            for(let k in Game.monsters) {
                if(Game.monsters[k].name === Combat.enemy.name.replace('Legendäre ', '')) {
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
            Combat.log("Flucht gelungen!", 'text-green-400');
            Combat.triggerFeedback('dodge'); 
            setTimeout(() => {
                Game.state.enemy = null;
                UI.switchView('map');
            }, 800);
        } else {
            Combat.log("Flucht fehlgeschlagen!", 'text-red-500');
            Combat.turn = 'enemy';
            setTimeout(() => Combat.enemyTurn(), 800);
        }
    }
};

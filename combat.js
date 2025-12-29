// [v0.9.0]
// [v0.9.0] - 2025-12-28 10:30pm (Dynamic Loot & Radio Support)
// ------------------------------------------------
// - Integrated Dynamic Loot drops in Victory
// - Weapon Damage now respects 'props.dmgMult'

const Combat = {
    enemy: null,
    log: [],
    
    start: function(enemy) {
        this.enemy = enemy;
        Game.state.enemy = enemy;
        this.log = [`KAMPF GEGEN ${enemy.name.toUpperCase()} GESTARTET!`];
        Game.state.view = 'combat'; 
        
        UI.switchView('combat').then(() => {
            this.render();
        });
    },

    render: function() {
        UI.renderCombat(); 
    },

    // --- VATS SYSTEM ---
    calculateHitChance: function(partIndex) {
        if(!this.enemy) return 0;
        
        const per = Game.getStat('PER');
        let baseChance = 50 + (per * 5); 
        
        if(partIndex === 0) baseChance -= 25; 
        if(partIndex === 1) baseChance += 10; 
        if(partIndex === 2) baseChance -= 10; 
        
        return Math.min(95, Math.max(0, Math.floor(baseChance)));
    },

    selectPart: function(partIndex) {
        this.selectedPart = partIndex;
    },
    
    confirmSelection: function() {
        if(this.selectedPart === undefined) this.selectedPart = 1; 
        this.playerAttack(this.selectedPart);
    },

    playerAttack: function(aimPart) {
        if(!this.enemy || this.enemy.hp <= 0) return;
        
        const wpn = Game.state.equip.weapon || {name: "Fäuste", baseDmg: 2};

        // --- AMMO LOGIC ---
        const meleeKeywords = ["Fäuste", "Messer", "Schläger", "Axt", "Speer", "Hammer", "Klinge", "Rohr"];
        const isMelee = meleeKeywords.some(kw => wpn.name.includes(kw));

        if(!isMelee) {
            if(Game.state.ammo > 0) {
                Game.state.ammo--; 
            } else {
                UI.log("> CLICK! Keine Munition!", "text-red-500 font-bold");
                UI.shakeView();
                setTimeout(() => this.enemyTurn(), 800);
                return;
            }
        }
        
        const hitChance = this.calculateHitChance(aimPart);
        const roll = Math.random() * 100;
        
        if(roll > hitChance) {
            UI.log(`> V.A.T.S.: DANEBEN! (${Math.floor(roll)} > ${hitChance})`, "text-gray-500");
            UI.shakeView();
            setTimeout(() => this.enemyTurn(), 600);
            return;
        }

        // TREFFER BERECHNUNG
        let dmg = wpn.baseDmg || 2;
        
        // [v0.9.0] Check Props Damage Multiplier (Dynamic Loot)
        if(wpn.props && wpn.props.dmgMult) {
            dmg = Math.floor(dmg * wpn.props.dmgMult);
        }

        const str = Game.getStat('STR');
        dmg += Math.floor(str * 0.5);
        
        const luc = Game.getStat('LUC');
        let critChance = luc * 0.02; 

        if(Game.state.perks && Game.state.perks.includes('mysterious_stranger')) {
            critChance += 0.10;
        }

        let isCrit = Math.random() < critChance; 
        
        if(aimPart === 0) { 
            dmg = Math.floor(dmg * 2.0);
            UI.log(`> BOOM! HEADSHOT! ${dmg} DMG`, "text-red-500 font-bold");
        } else if(aimPart === 2) { 
            if(Math.random() < 0.4) { 
                UI.log("> BEINTREFFER! Gegner strauchelt.", "text-yellow-400");
                dmg = Math.floor(dmg * 0.8);
                this.enemy.hp -= dmg;
                UI.shakeView();
                if(this.enemy.hp <= 0) this.victory();
                else this.render(); 
                return;
            }
            dmg = Math.floor(dmg * 0.8);
        } else {
            if(isCrit) {
                dmg *= 2;
                if(Game.state.perks && Game.state.perks.includes('mysterious_stranger')) {
                    UI.log(`> DER FREMDE ERSCHEINT! ${dmg} KRITISCHER SCHADEN!`, "text-yellow-400 font-bold");
                } else {
                    UI.log(`> KRITISCHER TREFFER! ${dmg} Schaden.`, "text-yellow-400");
                }
            } else {
                UI.log(`> Treffer: ${dmg} Schaden.`, "text-green-400");
            }
        }

        this.enemy.hp -= dmg;
        UI.shakeView();

        if(this.enemy.hp <= 0) {
            this.victory();
        } else {
            setTimeout(() => this.enemyTurn(), 800);
        }
        
        this.render();
    },

    enemyTurn: function() {
        if(!this.enemy || this.enemy.hp <= 0) return;
        
        let dmg = this.enemy.dmg || 2;
        const end = Game.getStat('END');
        let def = Math.floor(end * 0.2); 
        if(Game.state.equip.body && Game.state.equip.body.bonus && Game.state.equip.body.bonus.END) {
            def += Game.state.equip.body.bonus.END;
        }
        
        if(Game.state.perks && Game.state.perks.includes('toughness')) {
            def += 1; 
        }

        dmg = Math.max(1, dmg - def);
        
        Game.state.hp -= dmg;
        UI.log(`> ${this.enemy.name} greift an: -${dmg} HP`, "text-red-400");
        
        if(Game.state.hp <= 0) {
            Game.state.hp = 0;
            this.defeat();
        }
        
        this.render();
        UI.update(); 
    },
    
    flee: function() {
        const agi = Game.getStat('AGI');
        const chance = 30 + (agi * 5); 
        
        if(Math.random() * 100 < chance) {
            UI.log("FLUCHT ERFOLGREICH!", "text-green-400");
            UI.switchView('map');
        } else {
            UI.log("FLUCHT GESCHEITERT!", "text-red-500");
            UI.shakeView();
            setTimeout(() => this.enemyTurn(), 500);
        }
    },

    victory: function() {
        UI.log(`> ${this.enemy.name} besiegt!`, "text-green-500 font-bold");
        
        let xpGain = 10;
        if(this.enemy.xp) {
            xpGain = Array.isArray(this.enemy.xp) ? 
                Math.floor(Math.random() * (this.enemy.xp[1] - this.enemy.xp[0] + 1)) + this.enemy.xp[0] 
                : this.enemy.xp;
        }
        Game.gainExp(xpGain);
        if(Game.state.kills === undefined) Game.state.kills = 0;
        Game.state.kills++;
        
        let caps = Math.floor(Math.random() * (this.enemy.loot || 5)) + 1;
        
        if(Game.state.perks && Game.state.perks.includes('fortune_finder')) {
            caps = Math.floor(caps * 1.5) + 2;
            UI.log(`> Schatzsucher: +${caps} KK gefunden!`, "text-yellow-300 text-xs");
        }
        
        Game.state.caps += caps;
        
        // [v0.9.0] Dynamic Loot Logic
        if(this.enemy.drops) {
            this.enemy.drops.forEach(drop => {
                if(Math.random() <= drop.c) {
                    // Check if it's a weapon/armor for special loot generation
                    const itemDef = Game.items[drop.id];
                    if(itemDef && (itemDef.type === 'weapon' || itemDef.type === 'body')) {
                        // Generate dynamic loot
                        const dynamicItem = Game.generateLoot(drop.id);
                        Game.addToInventory(dynamicItem);
                    } else {
                        // Standard drop
                        Game.addToInventory(drop.id, 1);
                    }
                }
            });
        }

        Game.saveGame();
        
        setTimeout(() => {
             UI.log("Kampf gewonnen. Kehre zur Karte zurück...", "text-green-500");
             UI.switchView('map');
        }, 1200);
    },

    defeat: function() {
        UI.log("> DU BIST GESTORBEN.", "text-red-600 font-bold text-2xl");
        Game.state.isGameOver = true;
        if(typeof Network !== 'undefined') Network.registerDeath(Game.state);
        setTimeout(() => { if(UI.els.gameOver) UI.els.gameOver.classList.remove('hidden'); }, 1000);
    },

    confirmSelection: function() {
        if(this.selectedPart === undefined) this.selectedPart = 1; 
        this.playerAttack(this.selectedPart);
    },
    
    moveSelection: function(dir) {
        if(!this.selectedPart) this.selectedPart = 1;
        this.selectedPart += dir;
        if(this.selectedPart < 0) this.selectedPart = 2;
        if(this.selectedPart > 2) this.selectedPart = 0;
    }
};

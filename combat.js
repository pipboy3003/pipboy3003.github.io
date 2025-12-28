// [v0.7.5]
// [v0.7.5] - 2025-12-28 02:00pm (Ammo & Perk Update)
// ------------------------------------------------
// - Ammo consumption implemented
// - Mysterious Stranger Perk integrated

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
    // 0 = Head, 1 = Torso, 2 = Legs
    calculateHitChance: function(partIndex) {
        if(!this.enemy) return 0;
        
        const per = Game.getStat('PER');
        let baseChance = 50 + (per * 5); // Base 50% + 5% per PER
        
        // Modifier pro Körperteil
        if(partIndex === 0) baseChance -= 25; // Kopf ist schwerer (Headshot)
        if(partIndex === 1) baseChance += 10; // Torso ist leicht
        if(partIndex === 2) baseChance -= 10; // Beine mittel
        
        return Math.min(95, Math.max(0, Math.floor(baseChance)));
    },

    selectPart: function(partIndex) {
        this.selectedPart = partIndex;
    },
    
    confirmSelection: function() {
        if(this.selectedPart === undefined) this.selectedPart = 1; // Default Torso
        this.playerAttack(this.selectedPart);
    },

    playerAttack: function(aimPart) {
        if(!this.enemy || this.enemy.hp <= 0) return;
        
        const wpn = Game.state.equip.weapon || {name: "Fäuste", baseDmg: 2};

        // --- AMMO LOGIC (NEU) ---
        // Liste der Waffen, die KEINE Munition brauchen
        const meleeKeywords = ["Fäuste", "Messer", "Schläger", "Axt", "Speer", "Hammer", "Klinge", "Rohr"];
        const isMelee = meleeKeywords.some(kw => wpn.name.includes(kw));

        if(!isMelee) {
            // Es ist eine Schusswaffe
            if(Game.state.ammo > 0) {
                Game.state.ammo--; 
                // Visuelles Feedback im Log ist optional, um Spam zu vermeiden, 
                // aber wir könnten Ammo-Count im UI updaten, falls sichtbar.
            } else {
                UI.log("> CLICK! Keine Munition!", "text-red-500 font-bold");
                UI.shakeView();
                // Zug verloren, weil leer geschossen
                setTimeout(() => this.enemyTurn(), 800);
                return;
            }
        }
        // ------------------------
        
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
        
        // Stats Bonus (STR) - wirkt stärker im Nahkampf, aber auch minimal auf Rückstoßkontrolle/Wucht
        const str = Game.getStat('STR');
        dmg += Math.floor(str * 0.5);
        
        // Crit Chance (LUC)
        const luc = Game.getStat('LUC');
        let critChance = luc * 0.02; // 2% pro Luck Punkt

        // PERK: Mysteriöser Fremder (+10% Crit Chance)
        if(Game.state.perks && Game.state.perks.includes('mysterious_stranger')) {
            critChance += 0.10;
        }

        let isCrit = Math.random() < critChance; 
        
        if(aimPart === 0) { // HEADSHOT
            dmg = Math.floor(dmg * 2.0);
            UI.log(`> BOOM! HEADSHOT! ${dmg} DMG`, "text-red-500 font-bold");
        } else if(aimPart === 2) { // LEGS (Cripple)
            // Beinschuss: Chance Gegner auszusetzen
            if(Math.random() < 0.4) { 
                UI.log("> BEINTREFFER! Gegner strauchelt.", "text-yellow-400");
                dmg = Math.floor(dmg * 0.8);
                // Gegner verliert seinen Zug!
                this.enemy.hp -= dmg;
                UI.shakeView();
                if(this.enemy.hp <= 0) this.victory();
                else this.render(); // Kein enemyTurn()
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
        
        // Perk: Zähigkeit (Toughness) - reduziert Schaden direkt
        if(Game.state.perks && Game.state.perks.includes('toughness')) {
            def += 1; // Kleiner Flat Bonus
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
        const chance = 30 + (agi * 5); // Base 30% + 5% per AGI
        
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
        
        // Loot logic
        let caps = Math.floor(Math.random() * (this.enemy.loot || 5)) + 1;
        
        // Perk: Schatzsucher (Fortune Finder)
        if(Game.state.perks && Game.state.perks.includes('fortune_finder')) {
            caps = Math.floor(caps * 1.5) + 2;
            UI.log(`> Schatzsucher: +${caps} KK gefunden!`, "text-yellow-300 text-xs");
        }
        
        Game.state.caps += caps;
        
        // Rare Drop Check (Skorpionfleisch etc.)
        if(this.enemy.drops) {
            this.enemy.drops.forEach(drop => {
                if(Math.random() <= drop.c) {
                    Game.addToInventory(drop.id, 1);
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

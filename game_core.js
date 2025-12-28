// [v0.8.0]
window.Game = {
    TILE: 30, MAP_W: 40, MAP_H: 40,
    WORLD_W: 10, WORLD_H: 10, 
    
    colors: (typeof window.GameData !== 'undefined') ? window.GameData.colors : {},
    items: (typeof window.GameData !== 'undefined') ? window.GameData.items : {},
    monsters: (typeof window.GameData !== 'undefined') ? window.GameData.monsters : {},
    recipes: (typeof window.GameData !== 'undefined') ? window.GameData.recipes : [],
    perkDefs: (typeof window.GameData !== 'undefined') ? window.GameData.perks : [],

    state: null, worldData: {}, ctx: null, loopId: null, camera: { x: 0, y: 0 }, cacheCanvas: null, cacheCtx: null,

    initCache: function() { 
        this.cacheCanvas = document.createElement('canvas'); 
        this.cacheCanvas.width = this.MAP_W * this.TILE; 
        this.cacheCanvas.height = this.MAP_H * this.TILE; 
        this.cacheCtx = this.cacheCanvas.getContext('2d'); 
    }, 
    
    initCanvas: function() { 
        const cvs = document.getElementById('game-canvas'); 
        if(!cvs) return; 
        const viewContainer = document.getElementById('view-container'); 
        cvs.width = viewContainer.clientWidth; 
        cvs.height = viewContainer.clientHeight; 
        this.ctx = cvs.getContext('2d'); 
        this.ctx.imageSmoothingEnabled = false;
        if(this.loopId) cancelAnimationFrame(this.loopId); 
        this.drawLoop(); 
    },

    drawLoop: function() { 
        if(this.state && this.state.view === 'map' && !this.state.isGameOver) {
            this.draw(); 
            this.loopId = requestAnimationFrame(() => this.drawLoop());
        }
    },

    // --- GAME START & SAVE ---
    init: function(saveData, spawnTarget=null, slotIndex=0, newName=null) {
        this.worldData = {};
        this.initCache();
        try {
            let isNewGame = false;
            
            const defaultPOIs = [ 
                {type: 'V', x: 4, y: 4}, 
                {type: 'C', x: 3, y: 3},
                {type: 'M', x: 8, y: 1}, 
                {type: 'R', x: 1, y: 8}, 
                {type: 'T', x: 9, y: 9} 
            ];

            if (saveData) {
                this.state = saveData;
                // Checks
                if(!this.state.explored || typeof this.state.explored !== 'object') this.state.explored = {};
                if(!this.state.inDialog) this.state.inDialog = false; 
                if(!this.state.view) this.state.view = 'map';
                if(!this.state.visitedSectors) this.state.visitedSectors = [];
                if(!this.state.tutorialsShown) this.state.tutorialsShown = { hacking: false, lockpicking: false };
                if(typeof this.state.kills === 'undefined') this.state.kills = 0;

                // [v0.7.3] Perks States initialisieren
                if(!this.state.knownRecipes) this.state.knownRecipes = [];
                if(!this.state.hiddenItems) this.state.hiddenItems = {};
                if(!this.state.perks) this.state.perks = [];
                if(typeof this.state.perkPoints === 'undefined') this.state.perkPoints = 0;

                // [v0.8.0] Camp State
                if(!this.state.camp) this.state.camp = null;

                // Legacy Fix
                if(!this.state.worldPOIs || this.state.worldPOIs.length <= 2) {
                    this.state.worldPOIs = defaultPOIs;
                }
                
                this.state.saveSlot = slotIndex;
                UI.log(">> Spielstand geladen.", "text-cyan-400");
            } else {
                isNewGame = true;
                const vX = 4; const vY = 4;
                let startSecX = 4, startSecY = 4, startX = 20, startY = 20;

                if (spawnTarget && spawnTarget.sector) {
                    startSecX = spawnTarget.sector.x; startSecY = spawnTarget.sector.y;
                    startX = spawnTarget.x; startY = spawnTarget.y;
                    UI.log(`>> Signal verfolgt: Sektor ${startSecX},${startSecY}`, "text-yellow-400");
                }

                if(newName && typeof Network !== 'undefined') {
                    Network.checkAndRemoveDeadChar(newName);
                }

                this.state = {
                    saveSlot: slotIndex,
                    playerName: newName || "SURVIVOR",
                    sector: {x: startSecX, y: startSecY}, startSector: {x: 4, y: 4},
                    worldPOIs: defaultPOIs,
                    player: {x: startX, y: startY, rot: 0},
                    stats: { STR: 5, PER: 5, END: 5, INT: 5, AGI: 5, LUC: 5 }, 
                    equip: { weapon: this.items.fists, body: this.items.vault_suit },
                    inventory: [], 
                    hp: 100, maxHp: 100, xp: 0, lvl: 1, caps: 50, ammo: 10, statPoints: 0, 
                    perkPoints: 0, perks: [], 
                    camp: null, // [v0.8.0] NEU
                    kills: 0, 
                    view: 'map', zone: 'Ödland', inDialog: false, isGameOver: false, 
                    explored: {}, sectorExploredCache: null, visitedSectors: [`${startSecX},${startSecY}`],
                    tutorialsShown: { hacking: false, lockpicking: false },
                    tempStatIncrease: {}, buffEndTime: 0, cooldowns: {}, 
                    quests: [ { id: "q1", title: "Der Weg nach Hause", text: "Suche Zivilisation und finde Vault 101.", read: false } ], 
                    knownRecipes: [], 
                    hiddenItems: {},
                    startTime: Date.now(), savedPosition: null
                };
                this.addToInventory('stimpack', 1);
                this.state.hp = this.calculateMaxHP(this.getStat('END')); 
                this.state.maxHp = this.state.hp;
                
                UI.log(">> Neuer Charakter erstellt.", "text-green-400");
                this.saveGame(); 
                if(typeof Network !== 'undefined') Network.updateHighscore(this.state);
            }

            if (isNewGame) {
                this.loadSector(this.state.sector.x, this.state.sector.y);
            } else {
                if(this.renderStaticMap) this.renderStaticMap();
                this.reveal(this.state.player.x, this.state.player.y);
            }

            if(spawnTarget && !saveData) {
                this.state.player.x = spawnTarget.x;
                this.state.player.y = spawnTarget.y;
                this.reveal(spawnTarget.x, spawnTarget.y);
            }

            UI.switchView('map').then(() => { 
                if(UI.els.gameOver) UI.els.gameOver.classList.add('hidden'); 
                if(typeof Network !== 'undefined') Network.sendHeartbeat();
                if(isNewGame) { setTimeout(() => UI.showPermadeathWarning(), 500); }
            });
        } catch(e) {
            console.error(e);
            if(UI.error) UI.error("GAME INIT FAIL: " + e.message);
        }
    },

    saveGame: function(force=false) {
        if(typeof Network !== 'undefined') {
            Network.save(this.state);
            if(!this.state.isGameOver) Network.updateHighscore(this.state);
        }
        try { localStorage.setItem('pipboy_save', JSON.stringify(this.state)); } catch(e){}
    },

    hardReset: function() { if(typeof Network !== 'undefined') Network.deleteSave(); this.state = null; location.reload(); },

    // --- STATS ---
    calculateMaxHP: function(end) { 
        let bonus = 0;
        // Perk: Toughness
        if(this.state && this.state.perks && this.state.perks.includes('toughness')) bonus += 20;
        return 100 + (end - 5) * 10 + bonus; 
    }, 
    
    getStat: function(key) {
        if(!this.state) return 5;
        let val = this.state.stats[key] || 5;
        if(this.state.equip.body && this.state.equip.body.bonus && this.state.equip.body.bonus[key]) val += this.state.equip.body.bonus[key];
        if(this.state.equip.weapon && this.state.equip.weapon.bonus && this.state.equip.weapon.bonus[key]) val += this.state.equip.weapon.bonus[key];
        if(this.state.buffEndTime > Date.now()) val += 2; 
        return val;
    },

    expToNextLevel: function(lvl) { return Math.floor(100 * Math.pow(lvl, 1.5)); },

    gainExp: function(amount) {
        this.state.xp += amount;
        UI.log(`+${amount} XP`, "text-yellow-400");
        let next = this.expToNextLevel(this.state.lvl);
        if(this.state.xp >= next) {
            this.state.lvl++;
            this.state.xp -= next;
            this.state.statPoints++;
            
            // [v0.7.3] Perk Point Logic (Alle 3 Level)
            if(this.state.lvl % 3 === 0) {
                this.state.perkPoints++;
                UI.log("🌟 NEUER PERK PUNKT VERFÜGBAR! 🌟", "text-yellow-400 font-bold animate-pulse text-lg");
            }

            this.state.maxHp = this.calculateMaxHP(this.getStat('END'));
            this.state.hp = this.state.maxHp;
            UI.log(`LEVEL UP! Du bist jetzt Level ${this.state.lvl}`, "text-yellow-400 font-bold animate-pulse");
            this.saveGame(); 
        }
    }
};

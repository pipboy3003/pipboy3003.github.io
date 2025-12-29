// [v0.9.0]
window.Game = {
    TILE: 30, MAP_W: 40, MAP_H: 40,
    WORLD_W: 10, WORLD_H: 10, 
    
    colors: (typeof window.GameData !== 'undefined') ? window.GameData.colors : {},
    items: (typeof window.GameData !== 'undefined') ? window.GameData.items : {},
    monsters: (typeof window.GameData !== 'undefined') ? window.GameData.monsters : {},
    recipes: (typeof window.GameData !== 'undefined') ? window.GameData.recipes : [],
    perkDefs: (typeof window.GameData !== 'undefined') ? window.GameData.perks : [],

    // [v0.9.0] Radio Data
    radioStations: [
        {
            name: "GALAXY NEWS",
            freq: "101.5",
            tracks: [
                "Nachrichten: Supermutanten in Sektor 7 gesichtet...",
                "Song: 'I Don't Want to Set the World on Fire'",
                "Three Dog: 'Kämpft den guten Kampf!'",
                "Song: 'Maybe'",
                "Werbung: Nuka Cola - Trink das Strahlen!"
            ]
        },
        {
            name: "ENCLAVE RADIO",
            freq: "98.2",
            tracks: [
                "Präsident Eden: 'Die Wiederherstellung Amerikas...'",
                "Marschmusik: 'Stars and Stripes Forever'",
                "Präsident Eden: 'Vertraut eurem Präsidenten.'",
                "Hymne: 'America the Beautiful'"
            ]
        },
        {
            name: "KLASSIK FM",
            freq: "88.0",
            tracks: [
                "Agatha: 'Eine Melodie für das Ödland...'",
                "Violin Solo No. 4",
                "Bach: Cello Suite",
                "Stille (Rauschen)"
            ]
        }
    ],

    // [v0.9.0] Loot Prefixes
    lootPrefixes: {
        'rusty': { name: 'Rostige', dmgMult: 0.8, valMult: 0.5, color: 'text-gray-500' },
        'hardened': { name: 'Gehärtete', dmgMult: 1.2, valMult: 1.3, color: 'text-gray-300' },
        'precise': { name: 'Präzise', dmgMult: 1.1, valMult: 1.5, bonus: {PER: 1}, color: 'text-blue-300' },
        'radiated': { name: 'Verstrahlte', dmgMult: 1.0, valMult: 1.2, effect: 'rads', color: 'text-green-300' },
        'legendary': { name: 'Legendäre', dmgMult: 1.5, valMult: 3.0, bonus: {LUC: 2}, color: 'text-yellow-400 font-bold' }
    },

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

    init: function(saveData, spawnTarget=null, slotIndex=0, newName=null) {
        this.worldData = {};
        this.initCache();
        try {
            let isNewGame = false;
            const defaultPOIs = [ {type: 'V', x: 4, y: 4}, {type: 'C', x: 3, y: 3}, {type: 'M', x: 8, y: 1}, {type: 'R', x: 1, y: 8}, {type: 'T', x: 9, y: 9} ];

            if (saveData) {
                this.state = saveData;
                // Checks
                if(!this.state.explored) this.state.explored = {};
                if(!this.state.view) this.state.view = 'map';
                
                // [v0.9.0] Init Radio State
                if(!this.state.radio) this.state.radio = { on: false, station: 0, trackIndex: 0 };

                if(!this.state.camp) this.state.camp = null;
                if(!this.state.knownRecipes) this.state.knownRecipes = ['craft_ammo', 'craft_stimpack_simple', 'rcp_camp']; 
                if(!this.state.perks) this.state.perks = [];
                
                this.state.saveSlot = slotIndex;
                UI.log(">> Spielstand geladen.", "text-cyan-400");
            } else {
                isNewGame = true;
                this.state = {
                    saveSlot: slotIndex,
                    playerName: newName || "SURVIVOR",
                    sector: {x: 4, y: 4}, startSector: {x: 4, y: 4},
                    worldPOIs: defaultPOIs,
                    player: {x: 20, y: 20, rot: 0},
                    stats: { STR: 5, PER: 5, END: 5, INT: 5, AGI: 5, LUC: 5 }, 
                    equip: { weapon: this.items.fists, body: this.items.vault_suit },
                    inventory: [], 
                    hp: 100, maxHp: 100, xp: 0, lvl: 1, caps: 50, ammo: 10, statPoints: 0, 
                    perkPoints: 0, perks: [], 
                    camp: null, 
                    // [v0.9.0] Radio Init
                    radio: { on: false, station: 0, trackIndex: 0 },
                    kills: 0, 
                    view: 'map', zone: 'Ödland', inDialog: false, isGameOver: false, 
                    explored: {}, visitedSectors: ["4,4"],
                    tutorialsShown: { hacking: false, lockpicking: false },
                    quests: [ { id: "q1", title: "Der Weg nach Hause", text: "Suche Zivilisation und finde Vault 101.", read: false } ], 
                    knownRecipes: ['craft_ammo', 'craft_stimpack_simple', 'rcp_camp'], 
                    hiddenItems: {},
                    startTime: Date.now()
                };
                this.addToInventory('stimpack', 1);
                this.state.hp = this.calculateMaxHP(this.getStat('END')); 
                this.state.maxHp = this.state.hp;
                
                UI.log(">> Neuer Charakter erstellt.", "text-green-400");
                this.saveGame(); 
            }

            if (isNewGame) { this.loadSector(this.state.sector.x, this.state.sector.y); } 
            else { if(this.renderStaticMap) this.renderStaticMap(); this.reveal(this.state.player.x, this.state.player.y); }

            UI.switchView('map').then(() => { 
                if(UI.els.gameOver) UI.els.gameOver.classList.add('hidden'); 
                if(isNewGame) { setTimeout(() => UI.showPermadeathWarning(), 500); }
            });
        } catch(e) {
            console.error(e);
        }
    },

    saveGame: function() {
        if(typeof Network !== 'undefined') { Network.save(this.state); if(!this.state.isGameOver) Network.updateHighscore(this.state); }
        try { localStorage.setItem('pipboy_save', JSON.stringify(this.state)); } catch(e){}
    },

    hardReset: function() { if(typeof Network !== 'undefined') Network.deleteSave(); this.state = null; location.reload(); },

    calculateMaxHP: function(end) { 
        let bonus = 0;
        if(this.state && this.state.perks && this.state.perks.includes('toughness')) bonus += 20;
        return 100 + (end - 5) * 10 + bonus; 
    }, 
    
    getStat: function(key) {
        if(!this.state) return 5;
        let val = this.state.stats[key] || 5;
        
        // Check Armor Bonus
        if(this.state.equip.body && this.state.equip.body.bonus && this.state.equip.body.bonus[key]) 
            val += this.state.equip.body.bonus[key];
        
        // Check Weapon Bonus (NEU: Präfixe können auch Bonus geben)
        const wpn = this.state.equip.weapon;
        if(wpn) {
            if(wpn.bonus && wpn.bonus[key]) val += wpn.bonus[key];
            // Präzise Waffe?
            if(wpn.props && wpn.props.bonus && wpn.props.bonus[key]) val += wpn.props.bonus[key];
        }

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
            if(this.state.lvl % 3 === 0) {
                this.state.perkPoints++;
                UI.log("🌟 NEUER PERK PUNKT VERFÜGBAR! 🌟", "text-yellow-400 font-bold animate-pulse text-lg");
            }
            this.state.maxHp = this.calculateMaxHP(this.getStat('END'));
            this.state.hp = this.state.maxHp;
            UI.log(`LEVEL UP! Du bist jetzt Level ${this.state.lvl}`, "text-yellow-400 font-bold animate-pulse");
            this.saveGame(); 
        }
    },

    // [v0.9.0] LOOT GENERATOR
    generateLoot: function(baseId) {
        const itemDef = this.items[baseId];
        if(!itemDef || itemDef.type !== 'weapon') return { id: baseId, count: 1 };

        const roll = Math.random();
        let prefixKey = null;

        // Chances
        if(roll < 0.3) prefixKey = 'rusty';      // 30% Rostig
        else if(roll < 0.45) prefixKey = 'precise'; // 15% Präzise
        else if(roll < 0.55) prefixKey = 'hardened';// 10% Gehärtet
        else if(roll < 0.58) prefixKey = 'radiated';// 3% Verstrahlt
        else if(roll < 0.60) prefixKey = 'legendary';// 2% Legendär (sehr selten)
        
        if(!prefixKey) return { id: baseId, count: 1 }; // Normal

        const prefixDef = this.lootPrefixes[prefixKey];
        
        // Neues Item Objekt bauen
        const newItem = {
            id: baseId,
            count: 1,
            props: {
                prefix: prefixKey,
                name: `${prefixDef.name} ${itemDef.name}`,
                dmgMult: prefixDef.dmgMult || 1,
                valMult: prefixDef.valMult || 1,
                bonus: prefixDef.bonus || null,
                color: prefixDef.color
            }
        };
        
        return newItem;
    }
};

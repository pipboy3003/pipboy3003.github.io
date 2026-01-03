// [v4.3] - 2026-01-03 07:00pm (Time & Visibility Fix)
// - FIX: Zeit läuft nun 1 Spiel-Stunde pro Echtzeit-Minute (via 'startTimeTicker').
// - LOGIC: Helligkeitsberechnung angepasst (Tag = 100% Sicht).

window.Game = {
    TILE: 32, MAP_W: 40, MAP_H: 40, 
    WORLD_W: 10, WORLD_H: 10, 
    
    colors: (typeof window.GameData !== 'undefined') ? window.GameData.colors : {},
    items: (typeof window.GameData !== 'undefined') ? window.GameData.items : {},
    monsters: (typeof window.GameData !== 'undefined') ? window.GameData.monsters : {},
    recipes: (typeof window.GameData !== 'undefined') ? window.GameData.recipes : [],
    perkDefs: (typeof window.GameData !== 'undefined') ? window.GameData.perks : [],
    questDefs: (typeof window.GameData !== 'undefined') ? window.GameData.questDefs : [],

    DAY_LENGTH: 1440, 
    weatherTypes: ['clear', 'clear', 'clear', 'cloudy', 'rain', 'fog', 'storm'],
    
    radioStations: [
        { name: "GALAXY NEWS", freq: "101.5", synthType: "square", pitch: 220, tracks: ["News...", "Song..."] },
        { name: "ENCLAVE RADIO", freq: "98.2", synthType: "sawtooth", pitch: 110, tracks: ["Anthem..."] }
    ],

    Audio: {
        ctx: null, masterGain: null,
        init: function() {
            if(this.ctx) return;
            const AC = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AC();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.ctx.destination);
        },
        toggle: function(isOn) { this.init(); if(this.ctx.state==='suspended') this.ctx.resume(); } 
    },

    lootPrefixes: {
        'rusty': { name: 'Rostige', dmgMult: 0.8, color: 'text-gray-500' },
        'legendary': { name: 'Legendäre', dmgMult: 1.5, color: 'text-yellow-400 font-bold' }
    },

    state: null, worldData: {}, ctx: null, loopId: null, camera: { x: 0, y: 0 }, 
    cacheCanvas: null, cacheCtx: null,
    
    saveTimer: null, isDirty: false,
    timeTicker: null, 

    // [v4.3] TIME TICKER START
    startTimeTicker: function() {
        if(this.timeTicker) clearInterval(this.timeTicker);
        // 1 Real-Sekunde = 1 Spiel-Minute => 60 Real-Sekunden = 1 Spiel-Stunde
        this.timeTicker = setInterval(() => {
            if(!this.state || this.state.isGameOver) return;
            this.tickWorld(1); 
        }, 1000); 
    },

    initWorldState: function() {
        if(!this.state) return;
        if(typeof this.state.worldTime === 'undefined') this.state.worldTime = 8 * 60; 
        if(!this.state.weather) this.state.weather = 'clear';
        if(!this.state.weatherTimer) this.state.weatherTimer = Date.now();
    },

    tickWorld: function(minutes = 1) {
        if(!this.state) return;
        this.initWorldState();

        this.state.worldTime += minutes;
        if(this.state.worldTime >= this.DAY_LENGTH) {
            this.state.worldTime = 0; 
        }

        // Wetter Check alle 5 min In-Game
        if(this.state.worldTime % 5 === 0 && Math.random() < 0.05) { 
            this.changeWeather();
        }
    },

    changeWeather: function() {
        const r = Math.floor(Math.random() * this.weatherTypes.length);
        const newWeather = this.weatherTypes[r];
        if(newWeather !== this.state.weather) {
            this.state.weather = newWeather;
            UI.log(`Wetter: ${newWeather.toUpperCase()}`, "text-blue-300 italic");
        }
    },

    getAmbientLight: function() {
        if(!this.state || typeof this.state.worldTime === 'undefined') return 1.0;
        const t = this.state.worldTime;
        // 06:00 (360) bis 18:00 (1080) ist TAG (1.0)
        if(t < 240) return 0.2; // Nacht
        if(t < 360) return 0.2 + ((t-240)/120) * 0.8; // Morgen
        if(t < 1080) return 1.0; // Tag (Volle Sicht)
        if(t < 1200) return 1.0 - ((t-1080)/120) * 0.8; // Abend
        return 0.2; // Nacht
    },

    getTimeString: function() {
        if(!this.state) return "00:00";
        const h = Math.floor(this.state.worldTime / 60);
        const m = this.state.worldTime % 60;
        return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
    },

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

    getMaxSlots: function() { return 10 + (this.getStat('STR')-5); },
    getUsedSlots: function() { return this.state ? this.state.inventory.length : 0; },
    getStackLimit: function(id) { return (id==='ammo'||id==='caps') ? 9999 : 1; },
    syncAmmo: function() { /*...*/ },

    init: function(saveData, spawnTarget=null, slotIndex=0, newName=null) {
        this.worldData = {};
        this.initCache();
        window.addEventListener('beforeunload', () => { if(this.isDirty) this.saveGame(true); });

        if(this.items) {
            this.items.ammo = { name: "Patronen", type: "ammo", cost: 2, icon: "bullet" };
        }

        try {
            let isNewGame = false;
            const defaultPOIs = [ {type: 'V', x: 4, y: 4}, {type: 'C', x: 3, y: 3}, {type: 'R', x: 1, y: 8} ];

            if (saveData) {
                this.state = saveData;
                this.initWorldState(); 
                UI.log(">> Spielstand geladen.", "text-cyan-400");
            } else {
                isNewGame = true;
                this.state = {
                    saveSlot: slotIndex, playerName: newName || "SURVIVOR",
                    sector: {x: 4, y: 4}, player: {x: 20, y: 20, rot: 0},
                    stats: { STR: 5, PER: 5, END: 5, INT: 5, AGI: 5, LUC: 5 }, 
                    equip: { weapon: this.items.fists, body: this.items.vault_suit, back: null, head: null, legs: null, feet: null, arms: null }, 
                    inventory: [], hp: 100, maxHp: 100, xp: 0, lvl: 1, caps: 50, ammo: 0, 
                    view: 'map', zone: 'Ödland', explored: {}, visitedSectors: ["4,4"],
                    activeQuests: [], completedQuests: [], shop: { nextRestock: 0, stock: {}, merchantCaps: 1000 },
                    startTime: Date.now()
                };
                this.initWorldState();
                this.addToInventory('stimpack', 1);
                this.saveGame(true);
            }

            if (isNewGame) { this.loadSector(this.state.sector.x, this.state.sector.y); } 
            else { if(this.renderStaticMap) this.renderStaticMap(); this.reveal(this.state.player.x, this.state.player.y); }

            // START TIMER
            this.startTimeTicker();

            UI.switchView('map');
        } catch(e) { console.error(e); }
    },

    saveGame: function(force=false) {
        this.isDirty = true;
        if(force) { this.performSave(); return; }
        if(this.saveTimer) return;
        this.saveTimer = setTimeout(() => this.performSave(), 2000);
    },
    performSave: function() {
        if(this.saveTimer) { clearTimeout(this.saveTimer); this.saveTimer = null; }
        if(!this.isDirty || !this.state) return;
        try { localStorage.setItem('pipboy_save', JSON.stringify(this.state)); } catch(e){}
        this.isDirty = false;
    },
    
    calculateMaxHP: function(end) { return 100 + (end-5)*10; },
    getStat: function(key) { return this.state ? (this.state.stats[key]||5) : 5; },
    gainExp: function(amt) { this.state.xp+=amt; this.saveGame(); },
    
    checkNewQuests: function() {},
    generateLoot: function(baseId) { return {id: baseId, count: 1}; }
};

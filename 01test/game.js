const Game = {
    // Konfiguration
    TILE_SIZE: 30,
    MAP_W: 20,
    MAP_H: 12,
    WORLD_SIZE: 10,
    
    // Farben (FIX: Hex Codes statt CSS Vars für Canvas)
    colors: {
        'V': '#39ff14', 'C': '#7a661f', 'X': '#ff3914', 'G': '#00ffff',
        '.': '#4a3d34', '#': '#8b7d6b', '^': '#5c544d', '~': '#224f80',
        'fog': '#000000', 'player': '#ff3914'
    },

    // Daten
    monsters: {
        moleRat: { name: "Maulwurfsratte", hp: 30, dmg: 15, loot: 10, minLvl: 1, desc: "Nervige Nager." }, 
        mutantRose: { name: "Mutanten Rose", hp: 45, dmg: 20, loot: 15, minLvl: 1, desc: "Dornige Pflanze." },
        deathclaw: { name: "Todesklaue", hp: 120, dmg: 45, loot: 50, minLvl: 5, desc: "Der Tod." }
    },
    items: {
        fists: { name: "Fäuste", slot: 'weapon', bonus: {}, cost: 0 },
        vault_suit: { name: "Vault-Anzug", slot: 'body', bonus: { END: 1 }, cost: 0 },
        knife: { name: "Messer", slot: 'weapon', bonus: { STR: 1 }, cost: 15 },
        stimpack: { name: "Stimpack", cost: 25, isConsumable: true }
    },

    // Status
    state: {},
    mapLayout: [],
    worldData: {},
    ctx: null,
    animId: null,

    // Initialisierung
    init: function() {
        this.worldData = {};
        this.state = {
            sector: {x: 5, y: 5},
            player: {x: 10, y: 6},
            stats: { STR: 5, PER: 5, END: 5, INT: 5, AGI: 5, LUC: 5 },
            equip: { weapon: this.items.fists, body: this.items.vault_suit, head: null, feet: null },
            hp: 100, maxHp: 100,
            xp: 0, lvl: 1, caps: 50, ammo: 10, statPoints: 0,
            view: 'map', zone: 'Ödland',
            explored: {}, inDialog: false, isGameOver: false,
            enemy: null
        };
        
        // Start-Map generieren
        this.loadSector(5, 5);
        
        // UI starten
        UI.switchView('map').then(() => {
            UI.log("System initialisiert. Willkommen im Ödland.", "text-yellow-400");
            this.update();
        });
    },

    // Map Logik
    loadSector: function(sx, sy) {
        const key = `${sx},${sy}`;
        if(this.worldData[key]) {
            this.mapLayout = this.worldData[key].layout;
            // Bekannte Orte bleiben bekannt
        } else {
            this.generateMap(sx, sy);
        }
        this.state.explored = this.worldData[key].explored || {};
    },

    generateMap: function(sx, sy) {
        let map = Array(this.MAP_H).fill().map(() => Array(this.MAP_W).fill('.'));
        
        // Ränder
        for(let x=0; x<this.MAP_W; x++) { map[0][x] = '^'; map[this.MAP_H-1][x] = '^'; }
        for(let y=0; y<this.MAP_H; y++) { map[y][0] = '^'; map[y][this.MAP_W-1] = '^'; }

        // Tore
        if(sy > 0) map[0][10] = 'G'; // Nord
        if(sy < 9) map[this.MAP_H-1][10] = 'G'; // Süd
        if(sx > 0) map[6][0] = 'G'; // West
        if(sx < 9) map[6][this.MAP_W-1] = 'G'; // Ost

        // Features
        if(sx===5 && sy===5) map[5][10] = 'V'; // Vault Start
        else if(Math.random() > 0.6) map[5][10] = 'C'; // Stadt Chance

        this.mapLayout = map;
        this.worldData[`${sx},${sy}`] = { layout: map, explored: {} };
    },

    // Gameplay
    move: function(dx, dy) {
        if(this.state.inDialog) return;
        
        const nx = this.state.player.x + dx;
        const ny = this.state.player.y + dy;
        const tile = this.mapLayout[ny][nx];

        if(tile === '^') { UI.log("Wand.", "text-gray-500"); return; }
        
        this.state.player.x = nx;
        this.state.player.y = ny;
        this.revealFog(nx, ny);

        if(tile === 'G') this.changeSector(nx, ny);
        else if(tile === 'C') UI.enterCity();
        else if(Math.random() < 0.15 && tile === '.') this.triggerCombat();
        
        this.update();
    },

    changeSector: function(px, py) {
        let dx=0, dy=0;
        if(py===0) dy=-1; else if(py===this.MAP_H-1) dy=1;
        if(px===0) dx=-1; else if(px===this.MAP_W-1) dx=1;

        this.state.sector.x += dx;
        this.state.sector.y += dy;
        this.loadSector(this.state.sector.x, this.state.sector.y);

        // Spieler gegenüber aufstellen
        if(dy===-1) this.state.player.y = this.MAP_H-2;
        if(dy===1) this.state.player.y = 1;
        if(dx===-1) this.state.player.x = this.MAP_W-2;
        if(dx===1) this.state.player.x = 1;

        this.revealFog(this.state.player.x, this.state.player.y);
        UI.log(`Sektor gewechselt: ${this.state.sector.x},${this.state.sector.y}`, "text-blue-400");
        this.update();
    },

    revealFog: function(px, py) {
        const key = `${this.state.sector.x},${this.state.sector.y}`;
        for(let y=py-2; y<=py+2; y++) {
            for(let x=px-2; x<=px+2; x++) {
                if(x>=0 && x<this.MAP_W && y>=0 && y<this.MAP_H) {
                    this.state.explored[`${x},${y}`] = true;
                }
            }
        }
        this.worldData[key].explored = this.state.explored;
    },

    // Rendering
    update: function() {
        UI.updateStats();
        if(this.state.view === 'map') this.drawMap();
    },

    drawMap: function() {
        const cvs = document.getElementById('game-canvas');
        if(!cvs) return; // Canvas noch nicht geladen
        
        // Canvas Größe setzen (wichtig!)
        cvs.width = this.MAP_W * this.TILE_SIZE;
        cvs.height = this.MAP_H * this.TILE_SIZE;
        const ctx = cvs.getContext('2d');

        // Schwarz füllen
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, cvs.width, cvs.height);

        for(let y=0; y<this.MAP_H; y++) {
            for(let x=0; x<this.MAP_W; x++) {
                const t = this.mapLayout[y][x];
                
                // Explored check
                if(this.state.explored[`${x},${y}`]) {
                    ctx.fillStyle = this.colors[t] || '#fff';
                    ctx.fillRect(x*this.TILE_SIZE, y*this.TILE_SIZE, this.TILE_SIZE, this.TILE_SIZE);
                    
                    // Gitter
                    ctx.strokeStyle = '#111';
                    ctx.strokeRect(x*this.TILE_SIZE, y*this.TILE_SIZE, this.TILE_SIZE, this.TILE_SIZE);

                    // Text
                    if(['V','C','G'].includes(t)) {
                        ctx.fillStyle = '#000';
                        ctx.font = '10px monospace';
                        ctx.fillText(t, x*this.TILE_SIZE+10, y*this.TILE_SIZE+20);
                    }
                }
            }
        }

        // Spieler
        ctx.fillStyle = this.colors['player'];
        ctx.beginPath();
        ctx.arc(this.state.player.x*this.TILE_SIZE + 15, this.state.player.y*this.TILE_SIZE + 15, 8, 0, Math.PI*2);
        ctx.fill();
    },

    // Combat
    triggerCombat: function() {
        this.state.enemy = { ...this.monsters.moleRat }; // Dummy
        this.state.enemy.maxHp = 30;
        UI.switchView('combat');
        UI.log("Kampf beginnt!", "text-red-500");
    },

    combatAction: function(type) {
        if(type === 'attack') {
            this.state.enemy.hp -= 10;
            UI.log("Gegner getroffen (-10)", "text-green-400");
            if(this.state.enemy.hp <= 0) {
                UI.log("Sieg! +XP", "text-yellow-400");
                this.state.xp += 20;
                this.endCombat();
            } else {
                this.state.hp -= 5;
                UI.log("Gegner greift an (-5 TP)", "text-red-400");
            }
        } else {
            UI.log("Geflohen.", "text-blue-400");
            this.endCombat();
        }
        UI.updateStats();
    },

    endCombat: function() {
        this.state.enemy = null;
        this.state.inDialog = false;
        UI.switchView('map');
    },
    
    // Utils
    getMaxHp: function() { return 100 + (this.state.stats.END * 5); }
};

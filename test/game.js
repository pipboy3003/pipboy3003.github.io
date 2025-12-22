const Game = {
    state: null,
    saveSlot: 0,
    
    // Canvas Vars
    canvasMap: null,
    ctx: null,
    mapWidth: 32,
    mapHeight: 24,
    tileSize: 32, // Erhöht auf 32px für "gute Grafik"
    tilesetImage: null,

    // --- INITIALISIERUNG ---

    init: function(saveData, dbRef, slotIndex, newName) {
        this.saveSlot = slotIndex;
        console.log("Initializing Game Loop...");

        if (saveData) {
            this.state = this.validateState(saveData);
            UI.log("System neu gestartet. Speicher geladen.", "text-green-500");
        } else {
            this.state = this.createNewState(newName);
            UI.log("Neue ID registriert: " + newName, "text-yellow-400");
            this.addToInventory('vault_suit', 1);
            this.equipItem('vault_suit');
            this.addToInventory('pistol', 1); 
            this.addToInventory('AMMO', 20);
        }

        if (!this.state.startTime) this.state.startTime = Date.now();
        UI.update();
        
        if (this.state.view === 'combat' && this.state.enemy && this.state.enemy.hp > 0) {
            if(typeof Combat !== 'undefined') Combat.start(this.state.enemy);
        } else {
            UI.switchView('map');
        }

        setInterval(() => this.autoSave(), 60000);
    },

    validateState: function(data) {
        const def = this.createNewState("Unknown");
        if (!data.player) data.player = def.player;
        if (!data.sector) data.sector = def.sector;
        if (typeof data.hp !== 'number' || isNaN(data.hp)) data.hp = def.hp;
        if (!data.maxHp) data.maxHp = def.maxHp;
        if (!data.caps) data.caps = 0;
        if (!data.xp) data.xp = 0;
        if (!data.lvl) data.lvl = 1;
        if (!data.stats) data.stats = def.stats;
        if (!data.inventory) data.inventory = [];
        if (!data.equip) data.equip = {};
        if (!data.quests) data.quests = [];
        if (!data.visitedSectors) data.visitedSectors = ["4,4"];
        if (!data.localMap) data.localMap = []; 
        
        data.inDialog = false;
        data.isGameOver = false;
        return data;
    },

    createNewState: function(name) {
        return {
            playerName: name || "Vault Dweller",
            hp: 30, maxHp: 30, xp: 0, lvl: 1, caps: 50,
            stats: { STR:1, PER:1, END:1, INT:1, AGI:1, LUC:1 },
            statPoints: 0,
            inventory: [],
            equip: { weapon: null, body: null },
            sector: { x:4, y:4 }, 
            player: { x:16, y:12 }, 
            visitedSectors: ["4,4"],
            localMap: [],
            quests: [{id: "start", title: "Willkommen", text: "Verlasse den Vault.", read: false}],
            buffEndTime: 0,
            view: 'map',
            ammo: 0
        };
    },

    // --- PIXEL ART GENERATOR ---

    createTileset: function() {
        const ts = this.tileSize;
        const canvas = document.createElement('canvas');
        canvas.width = ts * 8; 
        canvas.height = ts * 4; // Mehr Platz für Varianten
        const ctx = canvas.getContext('2d');

        // Helpers
        const rect = (x,y,w,h,c) => { ctx.fillStyle=c; ctx.fillRect(x,y,w,h); };
        const circle = (x,y,r,c) => { ctx.fillStyle=c; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); };
        const tri = (x1,y1,x2,y2,x3,y3,c) => { ctx.fillStyle=c; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.fill(); };

        // 1. BODEN & TERRAIN
        // Wasteland (.)
        rect(0,0,ts,ts, '#5d4037'); // Basis Braun
        for(let i=0; i<10; i++) rect(Math.random()*ts, Math.random()*ts, 2, 2, '#3e2723'); // Noise
        
        // Wüste (_)
        rect(ts,0,ts,ts, '#eecfa1'); 
        rect(ts, ts/2, ts, 2, '#d2b48c'); // Düne
        
        // Wald Boden (,)
        rect(ts*2,0,ts,ts, '#2e7d32'); 
        for(let i=0;i<5;i++) rect(ts*2+Math.random()*ts, Math.random()*ts, 2, 4, '#1b5e20'); // Gras
        
        // Sumpf (;)
        rect(ts*3,0,ts,ts, '#1b5e20'); 
        circle(ts*3+ts/2, ts/2, ts/3, '#2f4f2f'); // Pfütze
        
        // Straße (=)
        rect(ts*4,0,ts,ts, '#424242'); 
        rect(ts*4+ts/2-2, 0, 4, ts/2, '#ffeb3b'); // Mittelstreifen
        
        // Wasser (W)
        rect(0,ts,ts,ts, '#0288d1');
        rect(2, ts+ts/3, ts-4, 2, '#81d4fa'); // Welle 1
        rect(5, ts+ts*2/3, ts-10, 2, '#81d4fa'); // Welle 2

        // 2. OBJEKTE & WÄNDE
        // Baum (T/t) - Slot [2,1]
        rect(ts*2, ts, ts, ts, '#2e7d32'); // Gras Hintergrund
        rect(ts*2+ts/2-3, ts+ts-8, 6, 8, '#5d4037'); // Stamm
        tri(ts*2+ts/2, ts+2, ts*2+2, ts+ts-5, ts*2+ts-2, ts+ts-5, '#1b5e20'); // Tanne

        // Berg (M) - Slot [1,1]
        rect(ts, ts, ts, ts, '#5d4037'); // Boden
        tri(ts+ts/2, ts+2, ts+2, ts+ts, ts+ts-2, ts+ts, '#795548'); // Berg Groß
        tri(ts+ts/2, ts+2, ts+ts/2-4, ts+10, ts+ts/2+4, ts+10, '#ffffff'); // Schneekuppe

        // Wand (#) - Slot [4,1]
        rect(ts*4, ts, ts, ts, '#616161'); // Ziegel Grau
        for(let r=0; r<4; r++) {
            for(let c=0; c<4; c++) {
                rect(ts*4 + c*8, ts + r*8, 7, 7, '#757575'); // Steine
            }
        }

        // Vault (V) - Slot [3,1]
        rect(ts*3, ts, ts, ts, '#000');
        circle(ts*3+ts/2, ts+ts/2, ts/2-2, '#fdd835'); // Goldener Kreis
        circle(ts*3+ts/2, ts+ts/2, ts/2-6, '#000'); // Loch
        rect(ts*3+ts/2-2, ts+2, 4, ts, '#000'); // Zahnrad Zähne (Simple)
        rect(ts*3+2, ts+ts/2-2, ts, 4, '#000');

        // Stadt (C) - Slot [4,2] (Neu positioniert)
        rect(ts*4, ts*2, ts, ts, '#424242'); // Boden
        rect(ts*4+4, ts*2+4, ts-8, ts-4, '#9e9e9e'); // Gebäude
        rect(ts*4+ts/2-3, ts*2+ts-8, 6, 8, '#3e2723'); // Tür
        rect(ts*4+6, ts*2+8, 6, 6, '#81d4fa'); // Fenster

        // Treppe/Ziel (X) - Slot [3,2]
        rect(ts*3, ts*2, ts, ts, '#000');
        for(let i=0; i<4; i++) {
            rect(ts*3 + i*6, ts*2 + i*6, ts-i*6, 6, '#bdbdbd');
        }

        // Spieler (@) - Slot [5,1]
        // Wir zeichnen den Spieler separat, damit er über allem liegt, 
        // aber wir reservieren einen Slot für Inventory Icons
        
        // Image erzeugen
        const img = new Image();
        img.src = canvas.toDataURL();
        return img;
    },

    getTileCoords: function(char) {
        const map = {
            '.': {x:0, y:0}, '_': {x:1, y:0}, ',': {x:2, y:0}, ';': {x:3, y:0}, '=': {x:4, y:0},
            'W': {x:0, y:1}, '~': {x:3, y:0}, // Sumpf nutzt Boden
            'M': {x:1, y:1}, 
            'T': {x:2, y:1}, 't': {x:2, y:1}, 
            'V': {x:3, y:1}, 
            '#': {x:4, y:1}, // Mauer
            'C': {x:4, y:2}, 'E': {x:4, y:2}, // Stadt
            'X': {x:3, y:2}, // Treppe/Ziel
            '@': {x:5, y:1}  // Spieler Dummy
        };
        return map[char] || map['.']; 
    },

    initCanvas: function() {
        const canvas = document.getElementById('game-canvas');
        if (!canvas) return;
        
        this.canvasMap = canvas;
        this.ctx = canvas.getContext('2d');
        
        canvas.width = this.mapWidth * this.tileSize;
        canvas.height = this.mapHeight * this.tileSize;
        
        this.ctx.imageSmoothingEnabled = false;

        this.tilesetImage = this.createTileset();
        this.tilesetImage.onload = () => {
            if (!this.state.localMap || this.state.localMap.length === 0) {
                this.generateLocalMap();
            }
            this.drawMap();
        };
    },

    generateLocalMap: function() {
        if (typeof WorldGen === 'undefined') return;
        const biome = WorldGen.getSectorBiome(this.state.sector.x, this.state.sector.y);
        let pois = [];
        if(biome === 'city') pois.push({x: Math.floor(this.mapWidth/2), y: Math.floor(this.mapHeight/2), type: 'C'});
        if(biome === 'vault') pois.push({x: Math.floor(this.mapWidth/2), y: Math.floor(this.mapHeight/2), type: 'V'});
        this.state.localMap = WorldGen.createSector(this.mapWidth, this.mapHeight, biome, pois);
    },

    drawMap: function() {
        if (!this.ctx || !this.state.localMap || !this.tilesetImage) return;
        
        const map = this.state.localMap;
        const ts = this.tileSize;
        const ctx = this.ctx;
        const img = this.tilesetImage;
        
        // 1. Clear
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.canvasMap.width, this.canvasMap.height);
        
        // 2. Draw Tiles
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                if(!map[y] || !map[y][x]) continue;
                const char = map[y][x];
                const coords = this.getTileCoords(char);
                ctx.drawImage(img, coords.x * ts, coords.y * ts, ts, ts, x * ts, y * ts, ts, ts);
            }
        }
        
        // 3. Draw Player (Custom Draw für Animation/Leuchten)
        const p = this.state.player;
        const px = p.x * ts;
        const py = p.y * ts;
        
        // Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#39ff14';
        
        // Vault Boy (Simpel)
        ctx.fillStyle = '#0000ff'; // Anzug Blau
        ctx.fillRect(px+8, py+12, 16, 14);
        ctx.fillStyle = '#ffd700'; // Streifen Gelb
        ctx.fillRect(px+14, py+12, 4, 14);
        ctx.fillStyle = '#ffccaa'; // Kopf Hautfarbe
        ctx.fillRect(px+8, py+2, 16, 12);
        ctx.fillStyle = '#ffff00'; // Haare
        ctx.fillRect(px+8, py, 16, 4);
        
        ctx.shadowBlur = 0;
    },

    // --- ACTIONS ---

    move: function(dx, dy) {
        if (this.state.isGameOver || this.state.inDialog || !this.state.localMap) return;
        
        let newX = this.state.player.x + dx;
        let newY = this.state.player.y + dy;
        
        if (newX < 0 || newX >= this.mapWidth || newY < 0 || newY >= this.mapHeight) {
             UI.log("Ende des Sektors.", "text-gray-500");
             return;
        }
        
        const tile = this.state.localMap[newY][newX];
        const solidChars = ['M', 'W', '#', '|']; 
        if (solidChars.includes(tile)) {
             UI.log("Weg blockiert!", "text-red-500");
             UI.shakeView();
             return;
        }
        
        this.state.player.x = newX;
        this.state.player.y = newY;
        
        this.checkInteraction(tile);

        const biome = WorldGen.getSectorBiome(this.state.sector.x, this.state.sector.y);
        if (biome !== 'city' && biome !== 'vault' && Math.random() < 0.05) { 
            this.triggerRandomEncounter();
        }
        
        this.drawMap(); 
    },

    checkInteraction: function(tile) {
        if(tile === 'C' || tile === 'E' || tile === 'F') {
            UI.toggleView('city');
            UI.log("Betrete Rusty Springs...", "text-cyan-400");
        }
        if(tile === 'V') {
            UI.enterVault();
        }
        if(tile === 'X') {
            UI.log("Ebene abgeschlossen!", "text-yellow-400");
            // Hier könnte man eine neue Ebene generieren
        }
    },

    modifyHP: function(amount) {
        if (!this.state || this.state.isGameOver) return;
        const oldHp = this.state.hp;
        this.state.hp += amount;
        if (this.state.hp > this.state.maxHp) this.state.hp = this.state.maxHp;
        if (this.state.hp <= 0) {
            this.state.hp = 0;
            this.handleDeath();
        }
        if (amount < 0) UI.shakeView();
        UI.update();
        return this.state.hp - oldHp;
    },

    modifyCaps: function(amount) {
        if (!this.state) return false;
        if (this.state.caps + amount < 0) {
            UI.log("Nicht genug Kronkorken!", "text-red-500");
            return false;
        }
        this.state.caps += amount;
        UI.update();
        return true;
    },

    gainExp: function(amount) {
        if (!this.state) return;
        this.state.xp += amount;
        UI.log(`+${amount} XP`, "text-yellow-400");
        const next = this.expToNextLevel(this.state.lvl);
        if (this.state.xp >= next) this.levelUp();
        UI.update();
    },

    levelUp: function() {
        this.state.lvl++;
        this.state.statPoints += 1;
        this.state.xp = 0; 
        this.recalcMaxHp();
        this.state.hp = this.state.maxHp;
        UI.log(`LEVEL UP! Level ${this.state.lvl}.`, "text-yellow-400 font-bold alert-glow-yellow");
    },

    changeSector: function(sx, sy) {
        if (sx < 0 || sx > 7 || sy < 0 || sy > 7) return; 
        this.state.sector = {x: sx, y: sy};
        const key = `${sx},${sy}`;
        if (!this.state.visitedSectors.includes(key)) {
            this.state.visitedSectors.push(key);
            this.gainExp(10);
            UI.log(`Sektor [${sx},${sy}] entdeckt.`, "text-cyan-400");
        }
        this.state.localMap = []; 
        this.state.player.x = Math.floor(this.mapWidth/2);
        this.state.player.y = Math.floor(this.mapHeight/2);
        
        this.initCanvas(); 
        UI.renderWorldMap();
        this.saveGame();
    },

    triggerRandomEncounter: function() {
        const biome = WorldGen.getSectorBiome(this.state.sector.x, this.state.sector.y);
        const mobs = Object.values(window.GameData.monsters).filter(m => this.state.lvl >= m.minLvl);
        if (mobs.length === 0) return;
        
        const mobTemplate = mobs[Math.floor(Math.random() * mobs.length)];
        const enemy = JSON.parse(JSON.stringify(mobTemplate));
        
        enemy.maxHp = Math.floor(enemy.hp * (1 + (this.state.lvl * 0.1)));
        enemy.hp = enemy.maxHp;
        enemy.dmg = Math.floor(enemy.dmg * (1 + (this.state.lvl * 0.05)));
        
        if (Math.random() < 0.01 + (this.getStat('LUC') * 0.005)) {
            enemy.isLegendary = true;
            enemy.name = "Legendärer " + enemy.name;
            enemy.hp *= 2;
            enemy.dmg *= 1.5;
            enemy.loot *= 3;
        }
        if (typeof Combat !== 'undefined') Combat.start(enemy);
    },

    rest: function() {
        this.state.hp = this.state.maxHp;
        UI.log("Du hast dich ausgeruht. HP voll.", "text-green-400");
        this.saveGame();
        UI.update();
    },

    heal: function() {
        if (this.state.hp >= this.state.maxHp) { UI.log("Du bist gesund.", "text-gray-500"); return; }
        if (this.modifyCaps(-25)) {
            this.modifyHP(9999); 
            UI.log("Behandlung erfolgreich.", "text-green-400");
        }
    },

    buyAmmo: function() {
        if (this.modifyCaps(-10)) {
            this.state.ammo = (this.state.ammo || 0) + 10;
            UI.log("10 Patronen gekauft.", "text-green-400");
            UI.update(); 
        }
    },

    addToInventory: function(itemId, count=1) {
        if (!window.GameData.items[itemId]) return;
        let entry = this.state.inventory.find(i => i.id === itemId);
        if (entry) entry.count += count;
        else this.state.inventory.push({ id: itemId, count: count });
        
        if (itemId === 'AMMO') {
            this.state.ammo = (this.state.ammo || 0) + (15 * count); 
            const idx = this.state.inventory.findIndex(i => i.id === 'AMMO');
            if(idx > -1) this.state.inventory.splice(idx, 1);
        }
        UI.log(`${count}x ${window.GameData.items[itemId].name} erhalten.`, "text-green-400");
        if (this.state.view === 'inventory') UI.renderInventory();
    },

    useItem: function(itemId) {
        const item = window.GameData.items[itemId];
        const entry = this.state.inventory.find(i => i.id === itemId);
        if (!entry || entry.count <= 0) return;

        if (item.type === 'consumable') {
            if (item.effect === 'heal') {
                if(this.state.hp >= this.state.maxHp) { UI.log("HP sind voll!", "text-gray-500"); return; }
                this.modifyHP(item.val);
                UI.log(`${item.name} benutzt.`, "text-green-400");
            }
            entry.count--;
        } else if (item.type === 'weapon' || item.type === 'body') {
            this.equipItem(itemId);
        }

        if (entry.count <= 0) this.state.inventory = this.state.inventory.filter(i => i.count > 0);
        UI.update();
        if (this.state.view === 'inventory') UI.renderInventory();
        if (this.state.view === 'char') UI.renderChar();
    },

    equipItem: function(itemId) {
        const item = window.GameData.items[itemId];
        if (!item) return;
        if (this.state.lvl < (item.requiredLevel || 0)) { UI.log(`Level ${item.requiredLevel} benötigt!`, "text-red-500"); return; }
        this.state.equip[item.slot] = item;
        UI.log(`${item.name} ausgerüstet.`, "text-cyan-400");
        this.recalcMaxHp();
    },

    buyItem: function(itemId) {
        const item = window.GameData.items[itemId];
        if (!item) return;
        if (this.modifyCaps(-item.cost)) this.addToInventory(itemId, 1);
    },

    craftItem: function(recipeId) {
        const r = window.GameData.recipes.find(x => x.id === recipeId);
        if(!r) return;
        for(let reqId in r.req) {
            const entry = this.state.inventory.find(i => i.id === reqId);
            if(!entry || entry.count < r.req[reqId]) { UI.log("Zu wenig Material!", "text-red-500"); return; }
        }
        for(let reqId in r.req) {
            const entry = this.state.inventory.find(i => i.id === reqId);
            entry.count -= r.req[reqId];
        }
        this.state.inventory = this.state.inventory.filter(i => i.count > 0);
        this.addToInventory(r.out, r.count);
        UI.renderCrafting();
    },

    getStat: function(key) {
        let val = this.state.stats[key] || 1;
        if (this.state.equip.body && this.state.equip.body.bonus && this.state.equip.body.bonus[key]) val += this.state.equip.body.bonus[key];
        if (this.state.equip.weapon && this.state.equip.weapon.bonus && this.state.equip.weapon.bonus[key]) val += this.state.equip.weapon.bonus[key];
        if (Date.now() < this.state.buffEndTime) val += 2;
        return val;
    },

    upgradeStat: function(key) {
        if (this.state.statPoints > 0) {
            this.state.stats[key]++;
            this.state.statPoints--;
            this.recalcMaxHp();
            UI.renderChar();
            UI.update();
        }
    },

    recalcMaxHp: function() {
        const end = this.getStat('END');
        const oldMax = this.state.maxHp;
        this.state.maxHp = 30 + (end * 5) + (this.state.lvl * 5);
        if (this.state.maxHp > oldMax) this.state.hp += (this.state.maxHp - oldMax);
    },

    expToNextLevel: function(lvl) {
        return Math.floor(100 * Math.pow(1.5, lvl - 1));
    },

    handleDeath: function() {
        this.state.isGameOver = true;
        UI.showGameOver();
        if (typeof Network !== 'undefined') Network.deleteSlot(this.saveSlot);
    },

    hardReset: function() {
        if (typeof Network !== 'undefined') Network.deleteSlot(this.saveSlot).then(() => location.reload());
        else location.reload();
    },

    saveGame: function(manual = false) {
        if (!this.state || this.state.isGameOver) return;
        this.state.lastSave = Date.now();
        if (typeof Network !== 'undefined') {
            Network.saveGame(this.saveSlot, this.state);
            if (manual) UI.log("Spiel gespeichert.", "text-green-500");
        }
    },

    autoSave: function() {
        if (!this.state.inDialog && !this.state.isGameOver) this.saveGame(false);
    },

    initCanvasProxy: function() { this.initCanvas(); }
};

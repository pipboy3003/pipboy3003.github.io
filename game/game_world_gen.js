// [2026-02-17 17:00:00] game_world_gen.js - Global Connected Roads

const WorldGen = {
    _seed: 12345,
    locations: { vault: {x:4, y:4}, city: {x:7, y:7} }, 
    sectorRoads: {}, // Speichert, welche Straßen durch welchen Sektor laufen

    setSeed: function(val) {
        this._seed = val % 2147483647;
        if (this._seed <= 0) this._seed += 2147483646;
        this.calculateLocations(); 
    },

    rand: function() {
        this._seed = (this._seed * 16807) % 2147483647;
        return (this._seed - 1) / 2147483646;
    },

    // 1. Initialisierung: Orte & Straßennetz berechnen
    calculateLocations: function() {
        let tempSeed = this._seed;
        const pseudoRand = () => {
            tempSeed = (tempSeed * 16807) % 2147483647;
            return (tempSeed - 1) / 2147483646;
        };

        // POIs setzen
        this.locations.vault = { x: Math.floor(pseudoRand() * 8) + 1, y: Math.floor(pseudoRand() * 8) + 1 };
        do {
            this.locations.city = { x: Math.floor(pseudoRand() * 8) + 1, y: Math.floor(pseudoRand() * 8) + 1 };
        } while (this.locations.city.x === this.locations.vault.x && this.locations.city.y === this.locations.vault.y);

        // Straßennetz berechnen
        this.sectorRoads = {}; // Reset
        
        // Hauptstraße: Vault -> Stadt
        this.generateGlobalPath(this.locations.vault, this.locations.city, pseudoRand);

        // Nebenstraßen: 2 Zufällige Punkte verbinden
        for(let i=0; i<2; i++) {
            const start = { x: Math.floor(pseudoRand() * 10), y: Math.floor(pseudoRand() * 10) };
            const end = { x: Math.floor(pseudoRand() * 10), y: Math.floor(pseudoRand() * 10) };
            this.generateGlobalPath(start, end, pseudoRand);
        }
    },

    // Verbindet zwei Sektoren auf der 10x10 Weltkarte
    generateGlobalPath: function(start, end, rng) {
        let curr = { x: start.x, y: start.y };
        const target = { x: end.x, y: end.y };
        
        // Einfacher "Dogleg" Pfad (Erst X, dann Y oder gemischt)
        // Wir speichern für jeden Sektor "Eingang" und "Ausgang"
        
        let steps = 0;
        while ((curr.x !== target.x || curr.y !== target.y) && steps < 30) {
            let next = { x: curr.x, y: curr.y };
            
            // Richtung wählen
            if (curr.x !== target.x && (curr.y === target.y || rng() > 0.5)) {
                next.x += (target.x > curr.x) ? 1 : -1;
            } else {
                next.y += (target.y > curr.y) ? 1 : -1;
            }

            // Verbindung speichern: Current -> Next
            this.addRoadSegment(curr, next);
            
            curr = next;
            steps++;
        }
    },

    addRoadSegment: function(s1, s2) {
        // Ermittelt Richtung: N, S, E, W
        let dirFromS1 = '';
        if (s2.y < s1.y) dirFromS1 = 'N';
        if (s2.y > s1.y) dirFromS1 = 'S';
        if (s2.x > s1.x) dirFromS1 = 'E';
        if (s2.x < s1.x) dirFromS1 = 'W';

        const s1Key = `${s1.x},${s1.y}`;
        const s2Key = `${s2.x},${s2.y}`;

        // In S1 speichern: "Geht nach [Richtung]"
        if (!this.sectorRoads[s1Key]) this.sectorRoads[s1Key] = [];
        // Vermeide Duplikate
        if (!this.sectorRoads[s1Key].includes(dirFromS1)) this.sectorRoads[s1Key].push(dirFromS1);

        // In S2 speichern: "Kommt von [Gegen-Richtung]"
        let dirFromS2 = '';
        if (dirFromS1 === 'N') dirFromS2 = 'S';
        if (dirFromS1 === 'S') dirFromS2 = 'N';
        if (dirFromS1 === 'E') dirFromS2 = 'W';
        if (dirFromS1 === 'W') dirFromS2 = 'E';

        if (!this.sectorRoads[s2Key]) this.sectorRoads[s2Key] = [];
        if (!this.sectorRoads[s2Key].includes(dirFromS2)) this.sectorRoads[s2Key].push(dirFromS2);
    },

    getStartSector: function() { return this.locations.vault; },

    // Noise & Flüsse (beibehalten)
    noise: function(nx, ny) {
        const val = Math.sin(nx * 12.9898 + ny * 78.233) * 43758.5453;
        return val - Math.floor(val); 
    },
    smoothNoise: function(x, y, seed) {
        const corners = (this.noise(x-1 + seed, y-1 + seed) + this.noise(x+1 + seed, y-1 + seed) + this.noise(x-1 + seed, y+1 + seed) + this.noise(x+1 + seed, y+1 + seed)) / 16;
        const sides = (this.noise(x-1 + seed, y + seed) + this.noise(x+1 + seed, y + seed) + this.noise(x + seed, y-1 + seed) + this.noise(x + seed, y+1 + seed)) / 8;
        const center = this.noise(x + seed, y + seed) / 4;
        return Math.abs(corners + sides + center);
    },
    isGlobalRiver: function(gx, gy) {
        const riverWidth = 2.5; 
        let r1 = 100 + Math.sin(gy * 0.02) * 40; if (Math.abs(gx - r1) < riverWidth) return true;
        let r2 = 380 + Math.sin(gy * 0.03 + 2) * 30; if (Math.abs(gx - r2) < riverWidth) return true;
        let r3 = 400 + Math.cos(gx * 0.015) * 50; if (Math.abs(gy - r3) < riverWidth + 1) return true;
        let r4 = gx + Math.sin(gx * 0.02) * 40; if (Math.abs(gy - r4) < riverWidth) return true;
        return false;
    },
    getSectorBiome: function(sx, sy) {
        const gx = sx * 50 + 25; const gy = sy * 50 + 25;
        const moisture = this.smoothNoise(gx * 0.003, gy * 0.003, this._seed + 200);
        const heat = this.smoothNoise(gx * 0.003 + 100, gy * 0.003 + 100, 888);
        if(moisture > 0.6 && heat < 0.5) return 'forest';
        if(moisture > 0.65 && heat > 0.5) return 'swamp';
        if(heat > 0.7 && moisture < 0.4) return 'desert';
        if(this.smoothNoise(gx * 0.005, gy * 0.005, this._seed + 100) > 0.75) return 'mountain';
        return 'wasteland';
    },

    // --- SEKTOR ERSTELLUNG ---
    createSector: function(width, height, sx, sy) {
        let map = Array(height).fill().map(() => Array(width).fill('.'));
        const worldSeed = this._seed;

        // 1. Terrain & Flüsse
        for(let y = 0; y < height; y++) {
            for(let x = 0; x < width; x++) {
                let gx = (sx * width) + x;
                let gy = (sy * height) + y;
                let moisture = this.smoothNoise(gx * 0.003, gy * 0.003, worldSeed + 200); 
                let heat = this.smoothNoise(gx * 0.003 + 500, gy * 0.003 + 500, worldSeed + 500);
                let elevation = this.smoothNoise(gx * 0.006, gy * 0.006, worldSeed + 100); 
                let ruins = this.smoothNoise(gx * 0.04, gy * 0.04, worldSeed + 800); 
                let isRiver = this.isGlobalRiver(gx, gy);

                let ground = '.'; 
                let treeThresh = 0.99;
                
                if(heat > 0.7 && moisture < 0.4) { ground = '_'; }
                else if(moisture > 0.65 && heat > 0.5) { ground = ';'; treeThresh = 0.65; }
                else if(moisture > 0.6 && heat < 0.5) { ground = '"'; treeThresh = 0.45; }
                
                let detail = this.smoothNoise(gx * 0.15, gy * 0.15, worldSeed + 300);
                map[y][x] = ground; 

                if (isRiver) map[y][x] = '~';
                else if (elevation > 0.85) map[y][x] = '^';
                else if (ruins > 0.88) map[y][x] = '#';
                else if (detail < treeThresh) map[y][x] = 't';
                
                // Ränder passierbar machen
                if(x < 2 || x > width - 3 || y < 2 || y > height - 3) {
                    if(['^', 't', '#'].includes(map[y][x])) map[y][x] = ground;
                }
            }
        }

        // 2. POIs
        if(sx === this.locations.vault.x && sy === this.locations.vault.y) {
            this.placePOI(map, 25, 25, 'V', 4);
        }
        if(sx === this.locations.city.x && sy === this.locations.city.y) {
            this.placePOI(map, 25, 25, 'C', 6);
            for(let i=0; i<15; i++) {
                let rx = 20 + Math.floor(this.rand()*10); let ry = 20 + Math.floor(this.rand()*10);
                if(!['~', 'C'].includes(map[ry][rx])) map[ry][rx] = '#';
            }
        }

        // Random Dungeons (klein)
        let sectorRNG = (sx * 17 + sy * 23 + this._seed) % 100;
        if(map[25][25] !== 'V' && map[25][25] !== 'C' && sectorRNG < 15) { 
            let type = 'S';
            if(sectorRNG < 5) type = 'H'; else if(sectorRNG < 8) type = 'A'; else if(sectorRNG < 12) type = 'R';
            let dx = 10 + (sectorRNG * 3) % 30; let dy = 10 + (sectorRNG * 7) % 30;
            this.placePOI(map, dx, dy, type, 3);
            // Dungeons binden sich an das Straßennetz an, wenn möglich (hier vereinfacht lokale Zufallsstraße)
            this.buildRoad(map, this.getRandomEdgePoint(width, height), {x:dx, y:dy});
        }

        // 3. GLOBALE STRASSEN (Das Herzstück!)
        const connections = this.sectorRoads[`${sx},${sy}`] || [];
        // Wir sammeln alle "Tore" (Ein-/Ausgänge an den Rändern)
        let gates = [];

        connections.forEach(dir => {
            let gate = {x: 25, y: 25}; // Default Center
            // Deterministische Position am Rand (Seed basiert auf Kante, nicht Sektor!)
            // Beispiel: Nord-Kante von Sektor (4,4) muss identisch sein mit Süd-Kante von (4,3)
            
            if(dir === 'N') {
                let seed = sx * 1000 + sy; // Kanten-Seed (Y)
                let pos = Math.floor(this.seededRand(seed) * (width - 4)) + 2;
                gate = { x: pos, y: 0 };
            }
            if(dir === 'S') {
                let seed = sx * 1000 + (sy + 1); // Kanten-Seed (Y+1)
                let pos = Math.floor(this.seededRand(seed) * (width - 4)) + 2;
                gate = { x: pos, y: height - 1 };
            }
            if(dir === 'W') {
                let seed = sx * 1000 + sy + 5000; // Kanten-Seed (X)
                let pos = Math.floor(this.seededRand(seed) * (height - 4)) + 2;
                gate = { x: 0, y: pos };
            }
            if(dir === 'E') {
                let seed = (sx + 1) * 1000 + sy + 5000; // Kanten-Seed (X+1)
                let pos = Math.floor(this.seededRand(seed) * (height - 4)) + 2;
                gate = { x: width - 1, y: pos };
            }
            gates.push(gate);
        });

        // Alle Tore mit der Mitte (oder untereinander) verbinden
        // Damit entsteht ein durchgehendes Netz
        if(gates.length > 0) {
            // Wenn es ein POI Sektor ist, verbinden wir alle Tore mit dem POI (Mitte)
            if(map[25][25] === 'V' || map[25][25] === 'C') {
                gates.forEach(g => this.buildRoad(map, g, {x:25, y:25}));
            } else {
                // Sonst verbinden wir die Tore direkt (Durchgangsstraße)
                // Einfachheit: Alle Tore zur Mitte, von Mitte zu anderen Toren -> Sternförmig
                let center = {x: 25, y: 25};
                gates.forEach(g => this.buildRoad(map, g, center));
            }
        }

        return map;
    },

    // Hilfsfunktion für deterministische Zufallszahlen an Kanten
    seededRand: function(seed) {
        let t = seed % 2147483647;
        if (t <= 0) t += 2147483646;
        t = (t * 16807) % 2147483647;
        return (t - 1) / 2147483646;
    },

    placePOI: function(map, cx, cy, type, radius) {
        const h = map.length; const w = map[0].length;
        for(let dy=-radius; dy<=radius; dy++) for(let dx=-radius; dx<=radius; dx++) {
            const ny = cy+dy, nx = cx+dx;
            if(ny>=0 && ny<h && nx>=0 && nx<w) {
                const t = map[ny][nx];
                if(['^', 't', '~', '#'].includes(t)) map[ny][nx] = '.';
            }
        }
        map[cy][cx] = type;
    },

    getRandomEdgePoint: function(w, h) {
        // Fallback für lokale Dungeons
        const side = Math.floor(this.rand() * 4);
        if(side === 0) return {x: Math.floor(this.rand()*(w-4))+2, y: 0}; 
        if(side === 1) return {x: Math.floor(this.rand()*(w-4))+2, y: h-1}; 
        if(side === 2) return {x: 0, y: Math.floor(this.rand()*(h-4))+2}; 
        return {x: w-1, y: Math.floor(this.rand()*(h-4))+2}; 
    },

    buildRoad: function(map, start, end) {
        let x = start.x, y = start.y;
        let steps = 0;
        
        while((x !== end.x || y !== end.y) && steps < 200) {
            steps++;
            // Deterministischer Weg (kein Random mehr hier, damit es reproduzierbar ist!)
            // Simple Manhatten-like movement with wiggle
            let dx = end.x - x;
            let dy = end.y - y;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                x += dx > 0 ? 1 : -1;
            } else {
                y += dy > 0 ? 1 : -1;
            }
            
            if(x < 0 || x >= map[0].length || y < 0 || y >= map.length) continue;
            
            const setRoad = (tx, ty) => {
                if(tx<0||tx>=map[0].length||ty<0||ty>=map.length) return;
                const t = map[ty][tx];
                if(t === '~' || t === '+') map[ty][tx] = '+'; 
                else {
                    if(['^', 't', '#'].includes(t)) map[ty][tx] = '='; 
                    else map[ty][tx] = '='; 
                    // Rodung
                    this.clearArea(map, tx, ty, 1);
                }
            };
            setRoad(x, y);
            if(x+1 < map[0].length && map[y][x+1] !== '~') setRoad(x+1, y); 
        }
    },

    clearArea: function(map, cx, cy, radius) {
        const h = map.length; const w = map[0].length;
        for(let dy=-radius; dy<=radius; dy++) for(let dx=-radius; dx<=radius; dx++) {
            const ny = cy+dy, nx = cx+dx;
            if(ny>=0 && ny<h && nx>=0 && nx<w) {
                if(['^', 't', '#'].includes(map[ny][nx])) map[ny][nx] = '.';
            }
        }
    },
    
    generateCityLayout: function(w, h) { return this._genBox(w,h,'='); },
    generateDungeonLayout: function(w, h) { return this._genBox(w,h,'#'); },
    _genBox: function(w, h, fill) {
        let map = Array(h).fill().map(() => Array(w).fill('.'));
        for(let y=0; y<h; y++) { map[y][0]=fill; map[y][w-1]=fill; }
        for(let x=0; x<w; x++) { map[0][x]=fill; map[h-1][x]=fill; }
        map[h-1][Math.floor(w/2)] = 'E'; if(fill==='#') map[Math.floor(h/2)][Math.floor(w/2)]='X';
        return {map, startX: Math.floor(w/2), startY: h-2};
    }
};

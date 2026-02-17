// [2026-02-17 08:00:00] game_world_gen.js - Global Coordinates & Continuous Rivers

const WorldGen = {
    _seed: 12345,
    // Speicher für POI Locations (damit sie fest bleiben)
    locations: { vault: {x:4, y:4}, city: {x:7, y:7} }, 

    setSeed: function(val) {
        this._seed = val % 2147483647;
        if (this._seed <= 0) this._seed += 2147483646;
        this.calculateLocations(); // POIs auswürfeln
    },

    rand: function() {
        this._seed = (this._seed * 16807) % 2147483647;
        return (this._seed - 1) / 2147483646;
    },

    // Bestimmt einmalig, wo Vault und Stadt liegen
    calculateLocations: function() {
        // Wir nutzen einen temporären Seed, um die Positionen zu bestimmen
        let tempSeed = this._seed;
        const pseudoRand = () => {
            tempSeed = (tempSeed * 16807) % 2147483647;
            return (tempSeed - 1) / 2147483646;
        };

        // Zufällige Sektoren (Randabstand 1 Sektor, damit nicht ganz außen)
        this.locations.vault = {
            x: Math.floor(pseudoRand() * 8) + 1,
            y: Math.floor(pseudoRand() * 8) + 1
        };
        
        do {
            this.locations.city = {
                x: Math.floor(pseudoRand() * 8) + 1,
                y: Math.floor(pseudoRand() * 8) + 1
            };
        } while (this.locations.city.x === this.locations.vault.x && this.locations.city.y === this.locations.vault.y);
        
        console.log("World Gen Locations:", this.locations);
    },

    getStartSector: function() {
        return this.locations.vault;
    },

    // Basis Noise (0.0 bis 1.0)
    noise: function(nx, ny) {
        const val = Math.sin(nx * 12.9898 + ny * 78.233) * 43758.5453;
        return val - Math.floor(val); 
    },

    smoothNoise: function(x, y, seed) {
        const corners = (this.noise(x-1 + seed, y-1 + seed) + this.noise(x+1 + seed, y-1 + seed) + this.noise(x-1 + seed, y+1 + seed) + this.noise(x+1 + seed, y+1 + seed)) / 16;
        const sides = (this.noise(x-1 + seed, y + seed) + this.noise(x+1 + seed, y + seed) + this.noise(x + seed, y-1 + seed) + this.noise(x + seed, y+1 + seed)) / 8;
        const center = this.noise(x + seed, y + seed) / 4;
        return corners + sides + center;
    },
    
    // Domain Warping für Flüsse (Global Scale)
    getRiverValue: function(gx, gy, seed) {
        // Sehr kleiner Scale für globale Zusammenhänge
        const scale = 0.008; 
        
        const warpX = this.smoothNoise(gx * 0.02, gy * 0.02, seed + 100) * 15.0; 
        const warpY = this.smoothNoise(gx * 0.02, gy * 0.02, seed + 200) * 15.0;

        const nx = (gx * scale) + warpX;
        const ny = (gy * scale) + warpY;
        
        return Math.abs(this.smoothNoise(nx, ny, seed) - 0.5);
    },

    // Bestimmt Biom anhand globaler Werte (Temperatur/Feuchtigkeit)
    // Nur für UI Anzeige nötig, Terrain generiert sich ja dynamisch
    getSectorBiome: function(sx, sy) {
        // Wir sampeln die Mitte des Sektors
        const gx = sx * 50 + 25;
        const gy = sy * 50 + 25;
        const moisture = this.smoothNoise(gx * 0.005, gy * 0.005, 999);
        const heat = this.smoothNoise(gx * 0.005 + 100, gy * 0.005 + 100, 888);

        if(moisture > 0.6 && heat < 0.6) return 'forest';
        if(moisture > 0.7 && heat > 0.6) return 'swamp';
        if(heat > 0.7 && moisture < 0.3) return 'desert';
        if(this.smoothNoise(gx * 0.01, gy * 0.01, 777) > 0.75) return 'mountain';
        
        return 'wasteland';
    },

    createSector: function(width, height, sx, sy, poiListIgnored) {
        let map = Array(height).fill().map(() => Array(width).fill('.'));
        
        // GLOBALER SEED (nicht random ändern, sonst passen Sektoren nicht zusammen!)
        const worldSeed = this._seed;

        for(let y = 0; y < height; y++) {
            for(let x = 0; x < width; x++) {
                // GLOBALE KOORDINATEN
                // Das ist der Schlüssel für nahtlose Übergänge
                let gx = (sx * width) + x;
                let gy = (sy * height) + y;

                // 1. GLOBALE NOISE MAPS (Sehr weiter Zoom für langsame Übergänge)
                // Feuchtigkeit: Bestimmt Wald vs Wüste
                let moisture = this.smoothNoise(gx * 0.005, gy * 0.005, worldSeed + 200); 
                // Höhe: Bestimmt Berge
                let elevation = this.smoothNoise(gx * 0.008, gy * 0.008, worldSeed + 100); 
                // Ruinen: Cluster
                let ruins = this.smoothNoise(gx * 0.05, gy * 0.05, worldSeed + 800);

                // 2. FLÜSSE (Überlagert alles)
                let river1 = this.getRiverValue(gx, gy, worldSeed);
                let river2 = this.getRiverValue(gx, gy, worldSeed + 5000); // Nebenflüsse
                
                // Schwellenwerte dynamisch an Biom anpassen
                let isRiver = (river1 < 0.03) || (river2 < 0.015);
                let isMountain = elevation > 0.75;
                let isTree = moisture > 0.55;
                let isRuin = ruins > 0.85;

                // Wüste trocknet aus (Modifikator)
                let heat = this.smoothNoise(gx * 0.004 + 500, gy * 0.004 + 500, worldSeed);
                if(heat > 0.7) { // Wüstengebiet
                    isTree = false;
                    isRiver = (river1 < 0.005); // Flüsse versiegen fast
                    isMountain = elevation > 0.65; // Mehr Felsen
                }

                // Sumpf (Viel Wasser, Viel Bäume)
                if(moisture > 0.7 && heat > 0.5) {
                    isRiver = (river1 < 0.15); // Sehr breite Flüsse
                    isTree = moisture > 0.6;
                }

                // SETZEN DER TILES
                map[y][x] = '.'; // Boden

                if (isRiver) map[y][x] = '~';
                else if (isMountain) map[y][x] = '^';
                else if (isRuin) map[y][x] = '#';
                else if (isTree) map[y][x] = 't';
            }
        }

        // 3. POIs PLATZIEREN (Basierend auf festen Locations)
        let hasPOI = false;
        
        // Vault?
        if(sx === this.locations.vault.x && sy === this.locations.vault.y) {
            map[25][25] = 'V';
            this.clearArea(map, 25, 25, 4, true);
            hasPOI = true;
        }
        
        // Stadt?
        if(sx === this.locations.city.x && sy === this.locations.city.y) {
            map[25][25] = 'C'; // City Icon
            // Kleine Siedlung drumherum
            this.clearArea(map, 25, 25, 6, true);
            for(let i=0; i<10; i++) {
                let rx = 20 + Math.floor(this.rand()*10);
                let ry = 20 + Math.floor(this.rand()*10);
                if(map[ry][rx] === '.') map[ry][rx] = '#'; // Häuser
            }
            map[25][25] = 'C'; 
            hasPOI = true;
        }

        // Zufällige Dungeons (Prozedural, aber deterministisch durch Seed)
        // Wir nutzen den Sektor-Index für den RNG, damit es beim Neuladen gleich bleibt
        let sectorRNG = (sx * 17 + sy * 23 + this._seed) % 100;
        if(!hasPOI && sectorRNG < 15) { // 15% Chance auf Dungeon
            let type = 'S';
            if(sectorRNG < 5) type = 'H';
            else if(sectorRNG < 8) type = 'A';
            else if(sectorRNG < 12) type = 'R';
            
            let dx = 10 + (sectorRNG * 3) % 30;
            let dy = 10 + (sectorRNG * 7) % 30;
            map[dy][dx] = type;
            this.clearArea(map, dx, dy, 3, true);
            
            // Kleine Straße zum Dungeon
            this.buildRoad(map, this.getRandomEdgePoint(width, height), {x:dx, y:dy});
        }

        // 4. STRASSEN & PFADE
        // Verbindung zwischen Vault und Stadt (Global Pathfinding ist schwer, wir faken es)
        // Wir bauen in jedem Sektor 2-3 "Alte Pfade", die über Flüsse führen.
        // Da die Flüsse global sind, wirken auch die Brücken logisch.
        
        const numTrails = 3;
        // Seed resetten für konsistente Straßen pro Sektor
        let roadSeed = (sx * 100 + sy) + this._seed;
        const localRand = () => { roadSeed = (roadSeed * 9301 + 49297) % 233280; return roadSeed / 233280; };

        for(let i=0; i<numTrails; i++) {
            const p1 = this.getRandomEdgePoint(width, height, localRand);
            const p2 = this.getRandomEdgePoint(width, height, localRand);
            this.buildRoad(map, p1, p2, localRand);
        }

        return map;
    },

    getRandomEdgePoint: function(w, h, rngFunc) {
        const rand = rngFunc || Math.random;
        const side = Math.floor(rand() * 4);
        if(side === 0) return {x: Math.floor(rand()*(w-4))+2, y: 0}; 
        if(side === 1) return {x: Math.floor(rand()*(w-4))+2, y: h-1}; 
        if(side === 2) return {x: 0, y: Math.floor(rand()*(h-4))+2}; 
        return {x: w-1, y: Math.floor(rand()*(h-4))+2}; 
    },

    clearArea: function(map, cx, cy, radius, force = false) {
        const h = map.length;
        const w = map[0].length;
        for(let dy=-radius; dy<=radius; dy++) {
            for(let dx=-radius; dx<=radius; dx++) {
                const ny = cy+dy, nx = cx+dx;
                if(ny>=0 && ny<h && nx>=0 && nx<w) {
                    const t = map[ny][nx];
                    if(map[ny][nx] !== map[cy][cx]) {
                        if(force) {
                             if(['^', 't', '~', '#'].includes(t)) map[ny][nx] = '.';
                        } else {
                             if(['^', 't', '#'].includes(t)) map[ny][nx] = '.';
                        }
                    }
                }
            }
        }
    },

    // Layouts für Innenräume bleiben gleich
    generateCityLayout: function(width, height) { return this._genBoxRoom(width, height, '='); },
    generateDungeonLayout: function(width, height) { return this._genBoxRoom(width, height, '#'); },
    
    // Helper für Innenräume (vereinfacht, da Fokus auf Welt)
    _genBoxRoom: function(w, h, fill) {
        let map = Array(h).fill().map(() => Array(w).fill(fill === '=' ? '.' : '.')); // Boden
        // Wände
        for(let y=0; y<h; y++) { map[y][0] = fill; map[y][w-1] = fill; }
        for(let x=0; x<w; x++) { map[0][x] = fill; map[h-1][x] = fill; }
        map[h-1][Math.floor(w/2)] = 'E'; // Ausgang
        if(fill === '#') map[Math.floor(h/2)][Math.floor(w/2)] = 'X'; // Loot
        return { map, startX: Math.floor(w/2), startY: h-2 };
    },

    buildRoad: function(map, start, end, rngFunc) {
        const rand = rngFunc || Math.random;
        let x = start.x, y = start.y;
        
        let steps = 0;
        const maxSteps = 200; // Prevent infinite loops

        while((x !== end.x || y !== end.y) && steps < maxSteps) {
            steps++;
            // Zufällige Bewegung Richtung Ziel
            if(rand() < 0.3) { 
                const dir = rand() < 0.5 ? 0 : 1; 
                if(dir === 0 && x !== end.x) x += (end.x > x ? 1 : -1); 
                else if(y !== end.y) y += (end.y > y ? 1 : -1); 
            } else { 
                if(Math.abs(end.x - x) > Math.abs(end.y - y)) x += (end.x > x ? 1 : -1); 
                else y += (end.y > y ? 1 : -1); 
            }
            
            if(x < 0 || x >= map[0].length || y < 0 || y >= map.length) continue;
            
            const makeRoad = (cx, cy) => {
                if(cx < 0 || cx >= map[0].length || cy < 0 || cy >= map.length) return;
                if (map[cy][cx] === '~' || map[cy][cx] === '+') {
                    map[cy][cx] = '+'; 
                } else {
                    map[cy][cx] = '='; 
                    this.clearArea(map, cx, cy, 1, false);
                }
            };
            makeRoad(x, y);
            if (x+1 < map[0].length && map[y][x+1] !== '~') makeRoad(x+1, y); // Breite Straße
        }
    }
};

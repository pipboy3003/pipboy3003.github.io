// [2026-02-17 16:00:00] game_world_gen.js - 4 Global Rivers & Biomes

const WorldGen = {
    _seed: 12345,
    locations: { vault: {x:4, y:4}, city: {x:7, y:7} }, 

    setSeed: function(val) {
        this._seed = val % 2147483647;
        if (this._seed <= 0) this._seed += 2147483646;
        this.calculateLocations(); 
    },

    rand: function() {
        this._seed = (this._seed * 16807) % 2147483647;
        return (this._seed - 1) / 2147483646;
    },

    calculateLocations: function() {
        let tempSeed = this._seed;
        const pseudoRand = () => {
            tempSeed = (tempSeed * 16807) % 2147483647;
            return (tempSeed - 1) / 2147483646;
        };
        // POIs einmalig festlegen (Randabstand beachten)
        this.locations.vault = { x: Math.floor(pseudoRand() * 8) + 1, y: Math.floor(pseudoRand() * 8) + 1 };
        do {
            this.locations.city = { x: Math.floor(pseudoRand() * 8) + 1, y: Math.floor(pseudoRand() * 8) + 1 };
        } while (this.locations.city.x === this.locations.vault.x && this.locations.city.y === this.locations.vault.y);
    },

    getStartSector: function() { return this.locations.vault; },

    // Basis Rauschen
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
    
    // --- 4 FESTE FLÜSSE LOGIK ---
    // Prüft global (gx, gy), ob hier Wasser ist.
    isGlobalRiver: function(gx, gy) {
        const riverWidth = 2.5; // Breite (Halber Radius)

        // 1. Der "Nord-Süd Strom" (Westen)
        // Schlängelt sich vertikal bei X=100
        let r1 = 100 + Math.sin(gy * 0.02) * 40; 
        if (Math.abs(gx - r1) < riverWidth) return true;

        // 2. Der "Ost-Fluss" (Osten)
        // Vertikal bei X=380, etwas wilder
        let r2 = 380 + Math.sin(gy * 0.03 + 2) * 30;
        if (Math.abs(gx - r2) < riverWidth) return true;

        // 3. Der "Süd-Mäander" (Süden)
        // Horizontal bei Y=400
        let r3 = 400 + Math.cos(gx * 0.015) * 50;
        if (Math.abs(gy - r3) < riverWidth + 1) return true;

        // 4. Die "Diagonale" (Quer durch)
        // Y = X Verbindung
        let r4 = gx + Math.sin(gx * 0.02) * 40;
        if (Math.abs(gy - r4) < riverWidth) return true;

        return false;
    },

    getSectorBiome: function(sx, sy) {
        const gx = sx * 50 + 25;
        const gy = sy * 50 + 25;
        // Globale Temperatur/Feuchtigkeit Maps
        const moisture = this.smoothNoise(gx * 0.003, gy * 0.003, this._seed + 200);
        const heat = this.smoothNoise(gx * 0.003 + 100, gy * 0.003 + 100, this._seed + 500);

        if(moisture > 0.6 && heat < 0.5) return 'forest';
        if(moisture > 0.65 && heat > 0.5) return 'swamp';
        if(heat > 0.7 && moisture < 0.4) return 'desert';
        if(this.smoothNoise(gx * 0.005, gy * 0.005, this._seed + 100) > 0.75) return 'mountain';
        return 'wasteland';
    },

    createSector: function(width, height, sx, sy) {
        let map = Array(height).fill().map(() => Array(width).fill('.'));
        const worldSeed = this._seed;

        for(let y = 0; y < height; y++) {
            for(let x = 0; x < width; x++) {
                // GLOBALE KOORDINATEN (0..500)
                let gx = (sx * width) + x;
                let gy = (sy * height) + y;

                // 1. Biome berechnen
                let moisture = this.smoothNoise(gx * 0.003, gy * 0.003, worldSeed + 200); 
                let heat = this.smoothNoise(gx * 0.003 + 500, gy * 0.003 + 500, worldSeed + 500);
                let elevation = this.smoothNoise(gx * 0.006, gy * 0.006, worldSeed + 100); 
                let ruins = this.smoothNoise(gx * 0.04, gy * 0.04, worldSeed + 800); // Häufigere Cluster

                // 2. Fluss prüfen (Exakt 4 Stück)
                let isRiver = this.isGlobalRiver(gx, gy);

                // 3. Boden-Typ festlegen (Damit man Biome SIEHT)
                let ground = '.'; // Erde (Standard)
                let treeProb = 0.0;

                // Wüste (Heiß & Trocken)
                if(heat > 0.7 && moisture < 0.4) {
                    ground = '_'; // Sand
                    // Flüsse in der Wüste bleiben, sind aber Oasen
                }
                // Sumpf (Heiß & Nass)
                else if(moisture > 0.65 && heat > 0.5) {
                    ground = ';'; // Sumpfboden
                    treeProb = 0.4;
                }
                // Wald (Kalt & Nass)
                else if(moisture > 0.6 && heat < 0.5) {
                    ground = '"'; // Gras
                    treeProb = 0.6;
                }
                
                // Lokale Details (Bäume, Steine)
                let detail = this.smoothNoise(gx * 0.15, gy * 0.15, worldSeed + 300);

                map[y][x] = ground; // Boden setzen

                // Objekte darauf platzieren
                if (isRiver) {
                    map[y][x] = '~';
                }
                else if (elevation > 0.85) {
                    map[y][x] = '^'; // Berg
                }
                else if (ruins > 0.88) {
                    map[y][x] = '#'; // Ruine
                }
                else if (detail < treeProb) {
                    map[y][x] = 't'; // Baum
                }
                
                // Ränder freihalten (außer Wasser)
                if(x < 2 || x > width - 3 || y < 2 || y > height - 3) {
                    if(['^', 't', '#'].includes(map[y][x])) map[y][x] = ground;
                }
            }
        }

        // POIs (Vault / Stadt)
        if(sx === this.locations.vault.x && sy === this.locations.vault.y) {
            this.placePOI(map, 25, 25, 'V', 4);
        }
        if(sx === this.locations.city.x && sy === this.locations.city.y) {
            this.placePOI(map, 25, 25, 'C', 6);
            // Siedlung
            for(let i=0; i<12; i++) {
                let rx = 20 + Math.floor(this.rand()*10); 
                let ry = 20 + Math.floor(this.rand()*10);
                if(!['~', 'C'].includes(map[ry][rx])) map[ry][rx] = '#'; 
            }
        }

        // Zufalls-Dungeons
        let sectorRNG = (sx * 17 + sy * 23 + this._seed) % 100;
        if(map[25][25] !== 'V' && map[25][25] !== 'C' && sectorRNG < 15) { 
            let type = 'S';
            if(sectorRNG < 5) type = 'H'; else if(sectorRNG < 8) type = 'A'; else if(sectorRNG < 12) type = 'R';
            let dx = 10 + (sectorRNG * 3) % 30; 
            let dy = 10 + (sectorRNG * 7) % 30;
            this.placePOI(map, dx, dy, type, 3);
            // Weg zum Dungeon
            this.buildRoad(map, this.getRandomEdgePoint(width, height), {x:dx, y:dy});
        }

        // "Alte Pfade" (Straßen, die Brücken erzeugen)
        const numTrails = 3;
        // Lokaler RNG für Straßen
        let roadSeed = (sx * 100 + sy) + this._seed;
        const localRand = () => { roadSeed = (roadSeed * 9301 + 49297) % 233280; return roadSeed / 233280; };

        for(let i=0; i<numTrails; i++) {
            this.buildRoad(map, this.getRandomEdgePoint(width, height, localRand), this.getRandomEdgePoint(width, height, localRand), localRand);
        }

        return map;
    },

    placePOI: function(map, cx, cy, type, radius) {
        const h = map.length; const w = map[0].length;
        for(let dy=-radius; dy<=radius; dy++) for(let dx=-radius; dx<=radius; dx++) {
            const ny = cy+dy, nx = cx+dx;
            if(ny>=0 && ny<h && nx>=0 && nx<w) {
                const t = map[ny][nx];
                // Fundament bauen (auch im Wasser)
                if(['^', 't', '~', '#'].includes(t)) map[ny][nx] = '.';
            }
        }
        map[cy][cx] = type;
    },

    getRandomEdgePoint: function(w, h, rngFunc) {
        const rand = rngFunc || Math.random;
        const side = Math.floor(rand() * 4);
        if(side === 0) return {x: Math.floor(rand()*(w-4))+2, y: 0}; 
        if(side === 1) return {x: Math.floor(rand()*(w-4))+2, y: h-1}; 
        if(side === 2) return {x: 0, y: Math.floor(rand()*(h-4))+2}; 
        return {x: w-1, y: Math.floor(rand()*(h-4))+2}; 
    },

    buildRoad: function(map, start, end, rngFunc) {
        const rand = rngFunc || Math.random;
        let x = start.x, y = start.y;
        let steps = 0;
        
        while((x !== end.x || y !== end.y) && steps < 250) {
            steps++;
            if(rand() < 0.25) { 
                const dir = rand() < 0.5 ? 0 : 1; 
                if(dir === 0 && x !== end.x) x += (end.x > x ? 1 : -1); 
                else if(y !== end.y) y += (end.y > y ? 1 : -1); 
            } else { 
                if(Math.abs(end.x - x) > Math.abs(end.y - y)) x += (end.x > x ? 1 : -1); 
                else y += (end.y > y ? 1 : -1); 
            }
            
            if(x < 0 || x >= map[0].length || y < 0 || y >= map.length) continue;
            
            // Straßenbau
            const setRoad = (tx, ty) => {
                if(tx<0||tx>=map[0].length||ty<0||ty>=map.length) return;
                const t = map[ty][tx];
                
                // BRÜCKE ÜBER WASSER
                if(t === '~' || t === '+') map[ty][tx] = '+'; 
                else {
                    map[ty][tx] = '='; // Straße
                    // Umgebung roden (außer Wasser)
                    this.clearAreaAroundRoad(map, tx, ty);
                }
            };
            setRoad(x, y);
            // Breite Straße
            if(x+1 < map[0].length && map[y][x+1] !== '~') setRoad(x+1, y); 
        }
    },

    clearAreaAroundRoad: function(map, cx, cy) {
        const h = map.length; const w = map[0].length;
        for(let dy=-1; dy<=1; dy++) for(let dx=-1; dx<=1; dx++) {
            const ny = cy+dy, nx = cx+dx;
            if(ny>=0 && ny<h && nx>=0 && nx<w) {
                // Nur Hindernisse entfernen, Wasser lassen
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

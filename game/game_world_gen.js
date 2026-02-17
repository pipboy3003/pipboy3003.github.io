// [2026-02-17 12:00:00] game_world_gen.js - Seamless Rivers & Visible Biomes

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
        // POIs deterministisch festlegen
        this.locations.vault = { x: Math.floor(pseudoRand() * 8) + 1, y: Math.floor(pseudoRand() * 8) + 1 };
        do {
            this.locations.city = { x: Math.floor(pseudoRand() * 8) + 1, y: Math.floor(pseudoRand() * 8) + 1 };
        } while (this.locations.city.x === this.locations.vault.x && this.locations.city.y === this.locations.vault.y);
    },

    getStartSector: function() { return this.locations.vault; },

    // Standard Noise (-1 bis 1)
    noise: function(nx, ny) {
        const val = Math.sin(nx * 12.9898 + ny * 78.233) * 43758.5453;
        return val - Math.floor(val); 
    },

    // Glatter Noise (0 bis 1)
    smoothNoise: function(x, y, seed) {
        const corners = (this.noise(x-1 + seed, y-1 + seed) + this.noise(x+1 + seed, y-1 + seed) + this.noise(x-1 + seed, y+1 + seed) + this.noise(x+1 + seed, y+1 + seed)) / 16;
        const sides = (this.noise(x-1 + seed, y + seed) + this.noise(x+1 + seed, y + seed) + this.noise(x + seed, y-1 + seed) + this.noise(x + seed, y+1 + seed)) / 8;
        const center = this.noise(x + seed, y + seed) / 4;
        return Math.abs(corners + sides + center);
    },
    
    // Ridge Noise für Flüsse (Erzeugt Linien/Täler)
    getRiverValue: function(gx, gy, seed) {
        // Extrem weiter Zoom (kleine Zahl) für lange, weltumspannende Flüsse
        const scale = 0.005; 
        
        // Warping für Kurven
        const warpX = this.smoothNoise(gx * 0.01, gy * 0.01, seed + 100) * 20.0; 
        const warpY = this.smoothNoise(gx * 0.01, gy * 0.01, seed + 200) * 20.0;

        const nx = (gx * scale) + warpX;
        const ny = (gy * scale) + warpY;
        
        // Werte nahe 0.5 sind "Täler"
        return Math.abs(this.smoothNoise(nx, ny, seed) - 0.5);
    },

    getSectorBiome: function(sx, sy) {
        // Nur für UI-Text
        const gx = sx * 50 + 25;
        const gy = sy * 50 + 25;
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
        
        // WICHTIG: Wir nutzen IMMER den globalen Seed, keinen Random-Seed pro Sektor!
        const worldSeed = this._seed;

        for(let y = 0; y < height; y++) {
            for(let x = 0; x < width; x++) {
                // Globale Koordinaten
                let gx = (sx * width) + x;
                let gy = (sy * height) + y;

                // 1. GLOBALE BIOME (Sehr "langsamer" Noise für riesige Flächen)
                let moisture = this.smoothNoise(gx * 0.003, gy * 0.003, worldSeed + 200); 
                let heat = this.smoothNoise(gx * 0.003 + 500, gy * 0.003 + 500, worldSeed + 500);
                let elevation = this.smoothNoise(gx * 0.006, gy * 0.006, worldSeed + 100); 
                let ruins = this.smoothNoise(gx * 0.04, gy * 0.04, worldSeed + 800); // Lokaler/Häufiger

                // 2. FLUSS (Global durchgehend)
                // Threshold: Kleiner = Breiterer Fluss.
                let riverVal = this.getRiverValue(gx, gy, worldSeed);
                let isRiver = riverVal < 0.025; // Hauptfluss

                // 3. BODEN TYP BESTIMMEN (Damit man Biome sieht!)
                let ground = '.'; // Default Wasteland (Grau)
                let treeThresh = 0.99; // Standard: Keine Bäume
                
                // BIOM LOGIK
                if(heat > 0.7 && moisture < 0.4) {
                    ground = '_'; // Wüste (Sand)
                    isRiver = riverVal < 0.005; // Versiegende Flüsse
                }
                else if(moisture > 0.65 && heat > 0.5) {
                    ground = ';'; // Sumpf (Schlamm)
                    isRiver = riverVal < 0.08; // Breite Flüsse
                    treeThresh = 0.65;
                }
                else if(moisture > 0.6 && heat < 0.5) {
                    ground = '"'; // Wald (Gras)
                    treeThresh = 0.45; // Viele Bäume
                }
                
                // Noise für Details (Bäume/Steine)
                let detailNoise = this.smoothNoise(gx * 0.1, gy * 0.1, worldSeed + 300);

                // ZUWEISUNG IN PRIORITÄT
                map[y][x] = ground; // Erstmal Boden setzen

                if (isRiver) {
                    map[y][x] = '~';
                }
                else if (elevation > 0.85) {
                    map[y][x] = '^'; // Hohe Berge
                }
                else if (ruins > 0.88) {
                    map[y][x] = '#'; // Ruinen Cluster
                }
                else if (detailNoise > treeThresh) {
                    map[y][x] = 't'; // Baum
                }
                
                // Sicherheits-Korridor am Rand (damit Sektor-Wechsel immer geht)
                // Wir löschen nur blockierende Objekte, der Boden (Sand/Gras) bleibt!
                if(x < 2 || x > width - 3 || y < 2 || y > height - 3) {
                    if(['^', 't', '#'].includes(map[y][x])) map[y][x] = ground;
                }
            }
        }

        // POIs
        if(sx === this.locations.vault.x && sy === this.locations.vault.y) {
            this.placePOI(map, 25, 25, 'V', 4);
        }
        if(sx === this.locations.city.x && sy === this.locations.city.y) {
            this.placePOI(map, 25, 25, 'C', 6);
            // Ein paar Häuser um die Stadt
            for(let i=0; i<15; i++) {
                let rx = 20 + Math.floor(this.rand()*10); 
                let ry = 20 + Math.floor(this.rand()*10);
                if(!['~', 'C'].includes(map[ry][rx])) map[ry][rx] = '#';
            }
        }

        // Zufalls-Dungeons (Deterministisch pro Sektor)
        let sectorRNG = (sx * 17 + sy * 23 + this._seed) % 100;
        if(map[25][25] === map[0][0] && sectorRNG < 20) { // Wenn Mitte leer & Glück
            let type = 'S';
            if(sectorRNG < 5) type = 'H'; else if(sectorRNG < 10) type = 'R'; else if(sectorRNG < 15) type = 'A';
            let dx = 10 + (sectorRNG * 3) % 30; 
            let dy = 10 + (sectorRNG * 7) % 30;
            this.placePOI(map, dx, dy, type, 3);
            this.buildRoad(map, this.getRandomEdgePoint(width, height), {x:dx, y:dy});
        }

        // Alte Pfade (Global Roads)
        const numTrails = 3;
        let roadSeed = (sx * 99 + sy * 33) + this._seed;
        const localRand = () => { roadSeed = (roadSeed * 9301 + 49297) % 233280; return roadSeed / 233280; };

        for(let i=0; i<numTrails; i++) {
            this.buildRoad(map, this.getRandomEdgePoint(width, height, localRand), this.getRandomEdgePoint(width, height, localRand), localRand);
        }

        return map;
    },

    placePOI: function(map, cx, cy, type, radius) {
        // Freiräumen
        const h = map.length; const w = map[0].length;
        const ground = map[cy][cx] === '~' ? '.' : map[cy][cx]; // Bodenart merken
        
        for(let dy=-radius; dy<=radius; dy++) {
            for(let dx=-radius; dx<=radius; dx++) {
                const ny = cy+dy, nx = cx+dx;
                if(ny>=0 && ny<h && nx>=0 && nx<w) {
                    // Alles platt machen
                    map[ny][nx] = ['.', '_', '"', ';'].includes(map[ny][nx]) ? map[ny][nx] : '.';
                }
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

    // Brückenbau-Logik
    buildRoad: function(map, start, end, rngFunc) {
        const rand = rngFunc || Math.random;
        let x = start.x, y = start.y;
        let steps = 0;
        
        // Bestimmt Boden-Typ am Start für Straßenfarbe? Egal, Straße ist Straße.
        
        while((x !== end.x || y !== end.y) && steps < 200) {
            steps++;
            if(rand() < 0.2) { 
                const dir = rand() < 0.5 ? 0 : 1; 
                if(dir === 0 && x !== end.x) x += (end.x > x ? 1 : -1); 
                else if(y !== end.y) y += (end.y > y ? 1 : -1); 
            } else { 
                if(Math.abs(end.x - x) > Math.abs(end.y - y)) x += (end.x > x ? 1 : -1); 
                else y += (end.y > y ? 1 : -1); 
            }
            
            if(x < 0 || x >= map[0].length || y < 0 || y >= map.length) continue;
            
            const setRoad = (tx, ty) => {
                if(tx<0||tx>=map[0].length||ty<0||ty>=map.length) return;
                const t = map[ty][tx];
                if(t === '~' || t === '+') map[ty][tx] = '+'; // Brücke
                else {
                    // Wenn Hindernis -> Boden machen
                    if(['^', 't', '#'].includes(t)) map[ty][tx] = '='; // Straße planiert Berg
                    else map[ty][tx] = '='; // Straße auf Boden
                }
            };
            setRoad(x, y);
            if(x+1 < map[0].length && map[y][x+1] !== '~') setRoad(x+1, y); // Breite
        }
    },
    
    // Layouts
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

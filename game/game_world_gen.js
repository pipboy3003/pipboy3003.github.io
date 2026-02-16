// [2026-02-16 17:00:00] game_world_gen.js - Hybrid: Old Logic + New Nature

const WorldGen = {
    _seed: 12345,

    setSeed: function(val) {
        this._seed = val % 2147483647;
        if (this._seed <= 0) this._seed += 2147483646;
    },

    rand: function() {
        this._seed = (this._seed * 16807) % 2147483647;
        return (this._seed - 1) / 2147483646;
    },

    // NEU: Simplex-Noise für natürliche Formen (Flüsse, Gebirge)
    noise: function(nx, ny) {
        return Math.sin(nx * 12.9898 + ny * 78.233) * 43758.5453 % 1;
    },

    smoothNoise: function(x, y, seed) {
        // Einfache Glättung für zusammenhängende Gebiete
        const corners = (this.noise(x-1 + seed, y-1 + seed) + this.noise(x+1 + seed, y-1 + seed) + this.noise(x-1 + seed, y+1 + seed) + this.noise(x+1 + seed, y+1 + seed)) / 16;
        const sides = (this.noise(x-1 + seed, y + seed) + this.noise(x+1 + seed, y + seed) + this.noise(x + seed, y-1 + seed) + this.noise(x + seed, y+1 + seed)) / 8;
        const center = this.noise(x + seed, y + seed) / 4;
        return Math.abs(corners + sides + center); // Absolutwert für 0..1
    },
    
    // Biome-Zuweisung (Deine Logik)
    getSectorBiome: function(x, y) {
        if (x <= 2 && y <= 2) return 'forest';      // NW: Wald/Oase
        if (x >= 7 && y >= 7) return 'desert';      // SO: Die Grube
        if (x >= 7 && y <= 2) return 'swamp';       // NO: Sumpf
        if (x <= 2 && y >= 7) return 'mountain';    // SW: Gebirge
        return 'wasteland'; // Standard
    },

    createSector: function(width, height, biomeType, poiList) {
        let map = Array(height).fill().map(() => Array(width).fill('.'));
        
        // Seed Basis für diesen Sektor generieren (nutzt aktuellen Seed)
        const sectorSeed = this.rand() * 1000;

        // BIOM CONFIG (Parameter für den Generator)
        let waterLevel = 0.2;  // Wie viel Wasser? (0.0 - 1.0)
        let mountainLevel = 0.8; // Ab wann Berge?
        let treeDensity = 0.1; // Wie viele Bäume?
        let groundChar = '.';

        if(biomeType === 'forest') { waterLevel = 0.3; treeDensity = 0.6; mountainLevel = 0.85; }
        if(biomeType === 'swamp')  { waterLevel = 0.5; treeDensity = 0.3; mountainLevel = 0.95; }
        if(biomeType === 'desert') { waterLevel = 0.05; treeDensity = 0.02; mountainLevel = 0.7; groundChar = '.'; }
        if(biomeType === 'mountain') { waterLevel = 0.1; treeDensity = 0.1; mountainLevel = 0.5; }

        for(let y = 0; y < height; y++) {
            for(let x = 0; x < width; x++) {
                // Koordinaten für Noise normalisieren (Zoom-Faktor 0.1)
                let nx = x * 0.15;
                let ny = y * 0.15;
                
                // 1. Terrain Noise (Berge & Wasser)
                let elevation = this.smoothNoise(nx, ny, sectorSeed);
                // 2. Moisture Noise (Bäume)
                let moisture = this.smoothNoise(nx + 100, ny + 100, sectorSeed);

                map[y][x] = groundChar;

                // Logik anwenden
                if (elevation < waterLevel) {
                    map[y][x] = '~'; // Wasser (NEU)
                } 
                else if (elevation > mountainLevel) {
                    map[y][x] = '^'; // Berg (NEU)
                }
                else {
                    // Vegetation (nur wenn kein Wasser/Berg)
                    if (moisture < treeDensity) {
                        map[y][x] = 't'; // Baum (NEU)
                    }
                }
                
                // Ränder schließen (damit man nicht rausläuft)
                if(x===0 || x===width-1 || y===0 || y===height-1) map[y][x] = '^';
            }
        }

        // POIs platzieren (Deine Logik, angepasst an neue Tiles)
        if(poiList) {
            poiList.forEach(poi => {
                if(poi.x >= 0 && poi.x < width && poi.y >= 0 && poi.y < height) {
                    map[poi.y][poi.x] = poi.type;
                    // Freiraum um POI schaffen (Bäume/Berge/Wasser weg)
                    for(let dy=-2; dy<=2; dy++) {
                        for(let dx=-2; dx<=2; dx++) {
                            const ny = poi.y+dy, nx = poi.x+dx;
                            if(ny>=0 && ny<height && nx>=0 && nx<width) {
                                if(map[ny][nx] !== poi.type) map[ny][nx] = '.'; 
                            }
                        }
                    }
                }
            });
        }

        // Straßen bauen (Deine Logik)
        if(poiList && poiList.length > 1) {
            for(let i=0; i<poiList.length-1; i++) {
                this.buildRoad(map, poiList[i], poiList[i+1]);
            }
        }

        return map;
    },

    generateCityLayout: function(width, height) {
        let map = Array(height).fill().map(() => Array(width).fill('=')); 
        for(let y=0; y<height; y++) { map[y][0] = '|'; map[y][width-1] = '|'; }
        for(let x=0; x<width; x++) { map[0][x] = '|'; map[height-1][x] = '|'; }
        // City Gates
        map[height-1][width/2] = 'E'; map[height-1][width/2-1] = 'E'; map[height-1][width/2+1] = 'E';
        const cx = Math.floor(width/2), cy = Math.floor(height/2);
        // Central Plaza
        for(let dy=-1; dy<=1; dy++) for(let dx=-1; dx<=1; dx++) map[cy+dy][cx+dx] = 'F';
        // Buildings
        for(let y=5; y<12; y++) for(let x=5; x<15; x++) map[y][x] = '|'; for(let y=6; y<11; y++) for(let x=6; x<14; x++) map[y][x] = '.'; map[11][10] = '='; map[8][10] = '$'; 
        for(let y=5; y<12; y++) for(let x=25; x<35; x++) map[y][x] = '|'; for(let y=6; y<11; y++) for(let x=26; x<34; x++) map[y][x] = '.'; map[11][30] = '='; map[8][30] = 'P'; 
        for(let y=25; y<32; y++) for(let x=5; x<15; x++) map[y][x] = '|'; for(let y=26; y<31; y++) for(let x=6; x<14; x++) map[y][x] = '.'; map[25][10] = '='; map[28][10] = '&'; 
        return map;
    },
    
    generateDungeonLayout: function(width, height) {
        // Dungeons bleiben klassisch '#', da sie innen sind
        let map = Array(height).fill().map(() => Array(width).fill('#')); 
        const rooms = [];
        const numRooms = 8;
        for(let i=0; i<numRooms; i++) {
            const w = Math.floor(this.rand() * 6) + 4;
            const h = Math.floor(this.rand() * 6) + 4;
            const x = Math.floor(this.rand() * (width - w - 2)) + 1;
            const y = Math.floor(this.rand() * (height - h - 2)) + 1;
            for(let ry=y; ry<y+h; ry++) { for(let rx=x; rx<x+w; rx++) { map[ry][rx] = 'B'; } }
            rooms.push({x, y, w, h, cx: Math.floor(x+w/2), cy: Math.floor(y+h/2)});
            if(i > 0) { const prev = rooms[i-1]; this.buildDungeonCorridor(map, prev.cx, prev.cy, rooms[i].cx, rooms[i].cy); }
        }
        const start = rooms[0];
        map[start.cy][start.cx] = 'E';
        const end = rooms[rooms.length-1];
        map[end.cy][end.cx] = 'X';
        for(let y=0; y<height; y++) { map[y][0] = '#'; map[y][width-1] = '#'; }
        for(let x=0; x<width; x++) { map[0][x] = '#'; map[height-1][x] = '#'; }
        return { map, startX: start.cx, startY: start.cy };
    },
    
    buildDungeonCorridor: function(map, x1, y1, x2, y2) {
        let x = x1, y = y1;
        while(x !== x2) { map[y][x] = 'B'; x += (x < x2) ? 1 : -1; }
        while(y !== y2) { map[y][x] = 'B'; y += (y < y2) ? 1 : -1; }
    },

    buildRoad: function(map, start, end) {
        let x = start.x, y = start.y;
        while(x !== end.x || y !== end.y) {
            if(this.rand() < 0.2) { const dir = this.rand() < 0.5 ? 0 : 1; if(dir === 0 && x !== end.x) x += (end.x > x ? 1 : -1); else if(y !== end.y) y += (end.y > y ? 1 : -1); } 
            else { if(Math.abs(end.x - x) > Math.abs(end.y - y)) x += (end.x > x ? 1 : -1); else y += (end.y > y ? 1 : -1); }
            if(x < 0 || x >= map[0].length || y < 0 || y >= map.length) continue;
            
            const clearRadius = (cx, cy) => {
                map[cy][cx] = '='; // Straße
                // Straßen planieren Berge und Wälder
                if (cx+1 < map[0].length && ['^','t'].includes(map[cy][cx+1])) map[cy][cx+1] = '.';
                if (cx-1 >= 0 && ['^','t'].includes(map[cy][cx-1])) map[cy][cx-1] = '.';
                if (cy+1 < map.length && ['^','t'].includes(map[cy+1][cx])) map[cy+1][cx] = '.';
                if (cy-1 >= 0 && ['^','t'].includes(map[cy-1][cx])) map[cy-1][cx] = '.';
                // Brücke über Wasser
                if (map[cy][cx] === '~') map[cy][cx] = '='; 
            };
            clearRadius(x, y);
            if (x+1 < map[0].length) map[y][x+1] = '=';
        }
    }
};

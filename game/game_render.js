// [2026-01-18 18:00:00] game_render.js - Fixed: Canvas-based Tiles (No Async Loading Issues)

if(typeof Game === 'undefined') Game = {};

Object.assign(Game, {
    
    // Speicher für unsere generierten Grafiken (jetzt Canvases, keine Images!)
    tiles: {},
    tileSize: 32, 

    // --- 1. TILE GENERATOR (Malt die Grafiken im Code) ---
    generateTiles: function() {
        console.log("[RENDER] Generating Procedural Tiles...");
        
        const createTile = (key, colorBase, drawDetails) => {
            // Offscreen Canvas erstellen
            const canvas = document.createElement('canvas');
            canvas.width = this.tileSize;
            canvas.height = this.tileSize;
            const ctx = canvas.getContext('2d');

            // Hintergrund
            ctx.fillStyle = colorBase;
            ctx.fillRect(0, 0, this.tileSize, this.tileSize);

            // Details zeichnen
            if (drawDetails) drawDetails(ctx, this.tileSize);

            // [FIX] Canvas direkt speichern statt toDataURL -> Sofort verfügbar!
            this.tiles[key] = canvas;
        };

        // > ÖDLAND (Basis)
        createTile('wasteland', '#3e3529', (ctx, s) => { 
            for(let i=0; i<8; i++) { 
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                let x = Math.random() * s, y = Math.random() * s;
                ctx.fillRect(x, y, 2, 2);
            }
        });

        // > GRASLAND (Verstrahltes Grün)
        createTile('grass', '#1a331a', (ctx, s) => { 
            for(let i=0; i<12; i++) { 
                ctx.fillStyle = '#2b552b';
                let x = Math.random() * s, y = Math.random() * s;
                ctx.fillRect(x, y, 1, 3);
            }
        });

        // > WALD (Dunkelgrün + Bäume)
        createTile('forest', '#0d1a0d', (ctx, s) => {
            ctx.fillStyle = '#001100';
            // Baum 1
            ctx.beginPath(); ctx.moveTo(8, 24); ctx.lineTo(16, 4); ctx.lineTo(24, 24); ctx.fill();
            // Baum 2
            ctx.beginPath(); ctx.moveTo(4, 28); ctx.lineTo(10, 12); ctx.lineTo(16, 28); ctx.fill();
        });

        // > WASSER (Blau + Wellen)
        createTile('water', '#0a1a2a', (ctx, s) => {
            ctx.strokeStyle = '#1a3a5a';
            ctx.lineWidth = 1;
            for(let i=4; i<s; i+=6) {
                ctx.beginPath(); ctx.moveTo(2, i); ctx.lineTo(s-2, i); ctx.stroke();
            }
        });

        // > BERGE (Grau + Felsen)
        createTile('mountain', '#2a2a2a', (ctx, s) => {
            ctx.fillStyle = '#1a1a1a'; 
            ctx.beginPath(); ctx.moveTo(0, s); ctx.lineTo(s/2, 0); ctx.lineTo(s, s); ctx.fill();
            ctx.fillStyle = '#444'; 
            ctx.beginPath(); ctx.moveTo(s/2 - 4, 8); ctx.lineTo(s/2, 0); ctx.lineTo(s/2 + 4, 8); ctx.fill();
        });

        // > STADT (Dunkelgrau + Gebäudereste)
        createTile('city', '#111', (ctx, s) => {
            ctx.fillStyle = '#222'; 
            ctx.fillRect(4, 8, 10, 20);
            ctx.fillStyle = '#1a1a1a'; 
            ctx.fillRect(18, 4, 10, 24);
            ctx.fillStyle = '#0f0'; 
            ctx.fillRect(20, 8, 2, 2);
        });
        
        // > SUMPF (Dunkelbraun/Grün)
        createTile('swamp', '#1f1f0f', (ctx, s) => {
            ctx.fillStyle = '#2f3f1f';
            ctx.fillRect(0,0, s, s); 
            ctx.fillStyle = 'rgba(0,0,0,0.4)'; 
            ctx.fillRect(5, 15, 10, 5);
            ctx.fillRect(20, 5, 8, 8);
        });
    },

    // --- 2. HAUPT RENDER LOOP ---
    
    // [FIX] Alias für game_core.js Kompatibilität
    draw: function() {
        this.render();
    },

    render: function() {
        const canvas = document.getElementById('game-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Tiles generieren, falls noch nicht passiert
        if (!this.tiles['wasteland']) this.generateTiles();

        // Canvas löschen (Schwarz)
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Welchen View zeigen wir?
        // [FIX] Fallback, falls View undefiniert ist
        const currentView = this.state.view || 'map';

        if (currentView === 'map') {
            this.renderWorldMap(ctx, canvas);
        } 
    },

    // --- 3. WELTKARTE ZEICHNEN ---
    renderWorldMap: function(ctx, canvas) {
        if (!this.state.player) {
            // Debugging: Falls kein Player da ist, zeigen wir das an
            ctx.fillStyle = "red";
            ctx.font = "20px monospace";
            ctx.fillText("WAITING FOR PLAYER DATA...", 50, 50);
            return;
        }

        if (!this.worldData) {
             ctx.fillStyle = "yellow";
             ctx.font = "20px monospace";
             ctx.fillText("GENERATING WORLD...", 50, 50);
             return;
        }

        const pX = this.state.player.x;
        const pY = this.state.player.y;
        
        // Raster-Größe (Zoom)
        const tileSize = 40; 
        
        // Wie viele Tiles passen auf den Screen?
        const tilesX = Math.ceil(canvas.width / tileSize) + 1; // +1 gegen Ränder-Flackern
        const tilesY = Math.ceil(canvas.height / tileSize) + 1;
        
        // Offset berechnen, damit Spieler in der Mitte ist
        const startX = pX - Math.floor(tilesX / 2);
        const startY = pY - Math.floor(tilesY / 2);

        // --- LAYER 1: TILES ---
        for (let y = 0; y < tilesY; y++) {
            for (let x = 0; x < tilesX; x++) {
                const worldX = startX + x;
                const worldY = startY + y;
                const key = `${worldX},${worldY}`;
                
                // Welches Biom ist hier?
                const sector = this.worldData[key];
                let biome = 'wasteland'; // Fallback
                
                if (sector) {
                    biome = sector.biome; 
                    if (sector.isCity) biome = 'city';
                }

                // Bild (Canvas) holen
                const img = this.tiles[biome] || this.tiles['wasteland'];
                
                // Zeichnen
                if (img) {
                    ctx.drawImage(img, x * tileSize, y * tileSize, tileSize, tileSize);
                } else {
                    ctx.fillStyle = '#330000';
                    ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                }

                // Grid Overlay (leicht)
                ctx.strokeStyle = 'rgba(0, 20, 0, 0.3)';
                ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
        }

        // --- LAYER 2: SPIELER ---
        // Exakte Mitte des Canvas berechnen
        const centerX = Math.floor(tilesX / 2) * tileSize;
        const centerY = Math.floor(tilesY / 2) * tileSize;
        
        // Schatten
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.arc(centerX + tileSize/2, centerY + tileSize - 5, 8, 0, Math.PI*2);
        ctx.fill();

        // Spieler-Icon (Grüner Kreis mit PIP-BOY Style)
        ctx.fillStyle = '#39ff14';
        ctx.beginPath();
        ctx.arc(centerX + tileSize/2, centerY + tileSize/2, 10, 0, Math.PI*2);
        ctx.fill();
        
        // Scan-Animation um Spieler
        ctx.strokeStyle = `rgba(57, 255, 20, ${0.2 + Math.sin(Date.now() / 200) * 0.1})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX + tileSize/2, centerY + tileSize/2, 16, 0, Math.PI*2);
        ctx.stroke();

        // --- LAYER 3: OBJEKTE (Camp) ---
        if (this.state.camp) {
            const cX = this.state.camp.x;
            const cY = this.state.camp.y;
            
            const relX = cX - startX;
            const relY = cY - startY;

            if(relX >= 0 && relX < tilesX && relY >= 0 && relY < tilesY) {
                // Camp Zeichnen
                ctx.fillStyle = '#ffff00'; // Gelb
                // Kleines Zelt-Dreieck malen statt Emoji (sieht besser aus)
                const tX = relX * tileSize;
                const tY = relY * tileSize;
                
                ctx.beginPath();
                ctx.moveTo(tX + tileSize/2, tY + 5);
                ctx.lineTo(tX + 5, tY + 25);
                ctx.lineTo(tX + tileSize - 5, tY + 25);
                ctx.fill();
            }
        }
    },

    // Helfer: Canvas Größe anpassen
    resizeCanvas: function() {
        const canvas = document.getElementById('game-canvas');
        const container = document.getElementById('game-screen'); 
        if(canvas && container) {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            // Einmal force-render
            this.render();
        }
    }
});

// Listener für Resize, damit die Karte scharf bleibt
window.addEventListener('resize', () => {
    if(Game.resizeCanvas) Game.resizeCanvas();
});

// Initialer Aufruf
setTimeout(() => {
    if(Game.resizeCanvas) Game.resizeCanvas();
}, 500);

// [2026-02-16 14:00:00] game_render.js - "Charm & Details" Update (Connected Textures)

Object.assign(Game, {
    // Cache Canvas für statische Welt (Boden & Wände)
    initCache: function() {
        this.cacheCanvas = document.createElement('canvas');
        this.cacheCanvas.width = this.MAP_W * this.TILE;
        this.cacheCanvas.height = this.MAP_H * this.TILE;
        this.cacheCtx = this.cacheCanvas.getContext('2d'); 
    },

    // Generiert deterministischen "Zufall" basierend auf Position (damit Wände nicht flackern)
    pseudoRand: function(x, y) {
        return Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
    },

    renderStaticMap: function() { 
        if(!this.cacheCtx) this.initCache();
        const ctx = this.cacheCtx; 
        const map = this.state.currentMap;
        
        // Hintergrund füllen
        ctx.fillStyle = "#0a0a0a"; 
        ctx.fillRect(0, 0, this.cacheCanvas.width, this.cacheCanvas.height); 
        
        if(!map) return;

        for(let y=0; y<this.MAP_H; y++) {
            for(let x=0; x<this.MAP_W; x++) {
                const t = map[y][x];
                
                // 1. BODEN (Überall zeichnen, auch unter Wänden für Lückenlosigkeit)
                this.drawFloorDetail(ctx, x, y, t);

                // 2. WÄNDE (Mit Verbindungs-Logik)
                if(t === '#') {
                    this.drawConnectedWall(ctx, x, y, map);
                }
                // 3. DEKO (Vault, Shop, etc. statisch vorrendern)
                else if(t !== '.' && t !== 'M' && t !== 'W' && t !== 'X') {
                    // M, W, X sind dynamisch (Gegner/Loot), die rendern wir live in draw()
                    this.drawTile(ctx, x, y, t, true); 
                }
            }
        }
    },

    drawFloorDetail: function(ctx, x, y, type) {
        const ts = this.TILE;
        const px = x * ts;
        const py = y * ts;
        const rand = this.pseudoRand(x, y);

        // Basis Boden
        ctx.fillStyle = (rand > 0.8) ? "#1a1a1a" : "#111111"; // Leichte Varianz
        if(['M', 'W', '~'].includes(type)) ctx.fillStyle = "#1a0f0f"; // Gefahrenzone rötlich
        ctx.fillRect(px, py, ts, ts);

        // Details (Steine, Kratzer)
        if(rand > 0.6) {
            ctx.fillStyle = "rgba(255,255,255,0.03)";
            const s = rand * 4; 
            ctx.fillRect(px + (ts*rand), py + (ts*(1-rand)), s, s);
        }
        
        // Gitter ganz subtil
        ctx.strokeStyle = "rgba(57, 255, 20, 0.03)";
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, ts, ts);
    },

    drawConnectedWall: function(ctx, x, y, map) {
        const ts = this.TILE;
        const px = x * ts;
        const py = y * ts;
        
        // Nachbarn checken
        const n = (y > 0) && map[y-1][x] === '#';
        const s = (y < this.MAP_H-1) && map[y+1][x] === '#';
        const w = (x > 0) && map[y][x-1] === '#';
        const e = (x < this.MAP_W-1) && map[y][x+1] === '#';

        // Basis-Wandfarbe (Beton/Metall Look)
        const baseColor = "#333";
        const lightColor = "#4a4a4a";
        const shadowColor = "#1a1a1a";

        ctx.fillStyle = baseColor;
        ctx.fillRect(px, py, ts, ts);

        // 3D-Effekt simulieren durch Kantenbeleuchtung
        
        // Oben (Lichtkante)
        if(!n) {
            ctx.fillStyle = lightColor;
            ctx.fillRect(px, py, ts, 4);
        }
        
        // Unten (Schattenkante) - gibt Tiefe
        if(!s) {
            ctx.fillStyle = shadowColor;
            ctx.fillRect(px, py + ts - 6, ts, 6);
        }

        // Links/Rechts Verbindungen
        if(!w) {
            ctx.fillStyle = lightColor;
            ctx.fillRect(px, py, 2, ts);
        }
        if(!e) {
            ctx.fillStyle = shadowColor;
            ctx.fillRect(px + ts - 2, py, 2, ts);
        }

        // DETAILS (Nieten, Rohre, Risse)
        const rand = this.pseudoRand(x, y);
        
        // Nieten an den Ecken
        ctx.fillStyle = "#111";
        if(rand > 0.5) {
            ctx.fillRect(px+2, py+2, 2, 2);
            ctx.fillRect(px+ts-4, py+2, 2, 2);
            ctx.fillRect(px+2, py+ts-4, 2, 2);
            ctx.fillRect(px+ts-4, py+ts-4, 2, 2);
        }

        // Lüftungsschlitze (zufällig)
        if(rand > 0.85) {
            ctx.fillStyle = "#111";
            ctx.fillRect(px + 6, py + 10, ts - 12, 2);
            ctx.fillRect(px + 6, py + 14, ts - 12, 2);
            ctx.fillRect(px + 6, py + 18, ts - 12, 2);
        }
    },

    // Bresenham Line Algorithm (Unverändert gut)
    checkLineOfSight: function(x0, y0, x1, y1) {
        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        let sx = (x0 < x1) ? 1 : -1;
        let sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;
        let dist = 0;

        while(true) {
            if(x0 === x1 && y0 === y1) return true; 
            if(dist > 0) { // Startpunkt (Spieler) ignorieren
                if(x0 >= 0 && x0 < this.MAP_W && y0 >= 0 && y0 < this.MAP_H) {
                    const t = this.state.currentMap[y0][x0];
                    if(['#'].includes(t)) return false; // Nur Wände blockieren Sicht
                }
            }
            
            let e2 = 2 * err;
            if(e2 > -dy) { err -= dy; x0 += sx; }
            if(e2 < dx) { err += dx; y0 += sy; }
            dist++;
        }
    },

    draw: function() { 
        if(!this.ctx || !this.cacheCanvas) return; 
        if(!this.state.currentMap) return;

        const ctx = this.ctx; 
        const cvs = ctx.canvas; 
        
        if (cvs.clientWidth === 0) return;

        const viewW = cvs.clientWidth;
        const viewH = cvs.clientHeight;
        
        // Kamera
        let targetCamX = (this.state.player.x * this.TILE) - (viewW / 2); 
        let targetCamY = (this.state.player.y * this.TILE) - (viewH / 2); 
        const maxCamX = (this.MAP_W * this.TILE) - viewW; 
        const maxCamY = (this.MAP_H * this.TILE) - viewH; 
        
        // Smooth Camera Follow
        const lerp = 0.1;
        this.camera.x += (Math.max(0, Math.min(targetCamX, maxCamX)) - this.camera.x) * lerp;
        this.camera.y += (Math.max(0, Math.min(targetCamY, maxCamY)) - this.camera.y) * lerp;
        
        // 1. Alles löschen
        ctx.fillStyle = "#000"; 
        ctx.fillRect(0, 0, viewW, viewH); 
        
        ctx.save(); 
        ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y)); 
        
        const startX = Math.floor(this.camera.x / this.TILE); 
        const startY = Math.floor(this.camera.y / this.TILE); 
        const endX = startX + Math.ceil(viewW / this.TILE) + 1; 
        const endY = startY + Math.ceil(viewH / this.TILE) + 1; 

        // 2. RENDER LOOP
        const px = this.state.player.x;
        const py = this.state.player.y;
        const viewDist = 9; // Etwas mehr Sichtweite

        for(let y=startY; y<endY; y++) { 
            for(let x=startX; x<endX; x++) { 
                if(y>=0 && y<this.MAP_H && x>=0 && x<this.MAP_W) { 
                    
                    const dist = Math.sqrt((x-px)**2 + (y-py)**2);
                    
                    // Außerhalb der Reichweite?
                    if(dist > viewDist) continue;

                    // Sichtlinie?
                    if(!this.checkLineOfSight(px, py, x, y)) continue;

                    // A. Zeichne statische Welt (Boden & Wände)
                    ctx.drawImage(
                        this.cacheCanvas, 
                        x*this.TILE, y*this.TILE, this.TILE, this.TILE,
                        x*this.TILE, y*this.TILE, this.TILE, this.TILE
                    );

                    // B. Dynamische Objekte (Loot, Gegner)
                    const t = this.state.currentMap[y][x]; 
                    if(t === 'M' || t === 'W' || t === 'X') {
                        this.drawTile(ctx, x, y, t);
                    }
                    
                    // C. Schatten-Vignette (Atmosphäre)
                    // Je weiter weg, desto stärker der Schatten
                    const opacity = Math.max(0, (dist - 3) / (viewDist - 3));
                    if(opacity > 0) {
                        ctx.fillStyle = `rgba(0,0,0,${opacity})`;
                        ctx.fillRect(x*this.TILE, y*this.TILE, this.TILE, this.TILE);
                    }
                    
                    // D. Hidden Items Sparkle
                    if(this.state.hiddenItems && this.state.hiddenItems[`${x},${y}`]) {
                        const pulse = (Math.sin(Date.now() / 200) + 1) * 0.5;
                        ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + pulse * 0.3})`;
                        ctx.beginPath();
                        ctx.arc(x * this.TILE + this.TILE/2, y * this.TILE + this.TILE/2, 2 + pulse*2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                } 
            } 
        } 
        
        // 3. Player Zeichnen
        this.drawPlayer(ctx);
        
        // 4. Andere Spieler (Multiplayer)
        this.drawOtherPlayers(ctx);

        ctx.restore(); 

        // 5. Scanlines Overlay (Subtil)
        ctx.fillStyle = "rgba(0, 255, 0, 0.02)";
        for(let i=0; i<viewH; i+=4) {
            ctx.fillRect(0, i, viewW, 1);
        }
    },
    
    drawPlayer: function(ctx) {
        const px = this.state.player.x * this.TILE + this.TILE/2; 
        const py = this.state.player.y * this.TILE + this.TILE/2; 
        
        ctx.save();
        ctx.translate(px, py); 
        ctx.rotate(this.state.player.rot); 
        
        // Taschenlampen-Kegel
        const gradient = ctx.createRadialGradient(0, 0, 10, 0, 0, 120);
        gradient.addColorStop(0, "rgba(255, 255, 200, 0.2)");
        gradient.addColorStop(1, "rgba(255, 255, 200, 0)");
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 120, -Math.PI/5, Math.PI/5);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Player Body (Dreieck mit Details)
        ctx.fillStyle = "#39ff14"; 
        ctx.shadowBlur = 10; 
        ctx.shadowColor = "#39ff14"; 
        
        ctx.beginPath(); 
        ctx.moveTo(8, 0); 
        ctx.lineTo(-6, 7); 
        ctx.lineTo(-2, 0); 
        ctx.lineTo(-6, -7); 
        ctx.fill(); 
        
        ctx.shadowBlur = 0; 
        ctx.restore(); 
    },

    drawOtherPlayers: function(ctx) {
        if(typeof Network === 'undefined' || !Network.otherPlayers) return;
        for(let pid in Network.otherPlayers) { 
            const p = Network.otherPlayers[pid]; 
            if(p.sector && (p.sector.x !== this.state.sector.x || p.sector.y !== this.state.sector.y)) continue; 
            
            const ox = p.x * this.TILE + this.TILE/2; 
            const oy = p.y * this.TILE + this.TILE/2; 
            
            // Simpler Kreis für andere
            ctx.fillStyle = "#00ffff"; 
            ctx.beginPath(); 
            ctx.arc(ox, oy, 6, 0, Math.PI*2); 
            ctx.fill(); 
            
            // Kleiner Nametag
            ctx.fillStyle = "white";
            ctx.font = "10px monospace";
            ctx.textAlign = "center";
            ctx.fillText(p.name ? p.name.substring(0,3) : "UNK", ox, oy - 10);
        } 
    },

    // Spezielle Formen für Objekte statt nur Buchstaben
    drawTile: function(ctx, x, y, type) { 
        const ts = this.TILE; 
        const cx = x * ts + ts/2; 
        const cy = y * ts + ts/2;
        
        // Hilfsfunktion: Zeichnet das Icon zentriert
        const drawIcon = (char, color, size=20) => {
            ctx.font = `bold ${size}px monospace`;
            ctx.fillStyle = color;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.shadowColor = color;
            ctx.shadowBlur = 5;
            ctx.fillText(char, cx, cy);
            ctx.shadowBlur = 0;
        };

        switch(type) { 
            case 'V': // VAULT (Zahnrad)
                drawIcon("⚙️", "#ffff00", 24);
                break; 

            case 'R': // SHOP (Einkaufswagen/Tasche)
                drawIcon("💰", "#ff3333", 22);
                break;
                
            case 'M': // MONSTER (Totenkopf rot)
                drawIcon("💀", "#ff0000", 20);
                break;

            case 'W': // WANDERER (Auge?)
                drawIcon("👁️", "#ff8800", 20);
                break;

            case 'X': // KISTE (Loot)
                ctx.fillStyle = "#8B4513"; // Braun
                ctx.fillRect(cx - 8, cy - 6, 16, 12);
                ctx.strokeStyle = "#ffd700"; // Goldrand
                ctx.strokeRect(cx - 8, cy - 6, 16, 12);
                break;

            case 'S': // Dungeon Market
                drawIcon("🏪", "#00ff00", 22);
                break;
            case 'H': // Dungeon Cave
                drawIcon("⛰️", "#888", 22);
                break;
            
            case 'E': drawIcon("EXIT", "#00ffff", 10); break;
            case 'P': drawIcon("✚", "#ff0000", 18); break; // Doctor
        } 
    }
});

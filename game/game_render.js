// [2026-02-16 15:30:00] game_render.js - Fix Rotation & Lighting Direction

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
                
                // 1. BODEN
                this.drawFloorDetail(ctx, x, y, t);

                // 2. WÄNDE
                if(t === '#') {
                    this.drawConnectedWall(ctx, x, y, map);
                }
                // 3. STATISCHE DEKO (Vault, Shop etc.)
                else if(t !== '.' && t !== 'M' && t !== 'W' && t !== 'X') {
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
        ctx.fillStyle = (rand > 0.8) ? "#1a1a1a" : "#111111"; 
        if(['M', 'W', '~'].includes(type)) ctx.fillStyle = "#1a0f0f"; 
        ctx.fillRect(px, py, ts, ts);

        // Details
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

        const baseColor = "#333";
        const lightColor = "#4a4a4a";
        const shadowColor = "#1a1a1a";

        ctx.fillStyle = baseColor;
        ctx.fillRect(px, py, ts, ts);

        // Kantenbeleuchtung für 3D-Effekt
        if(!n) { ctx.fillStyle = lightColor; ctx.fillRect(px, py, ts, 4); }
        if(!s) { ctx.fillStyle = shadowColor; ctx.fillRect(px, py + ts - 6, ts, 6); }
        if(!w) { ctx.fillStyle = lightColor; ctx.fillRect(px, py, 2, ts); }
        if(!e) { ctx.fillStyle = shadowColor; ctx.fillRect(px + ts - 2, py, 2, ts); }

        // Details (Nieten/Schlitze)
        const rand = this.pseudoRand(x, y);
        if(rand > 0.5) {
            ctx.fillStyle = "#111";
            ctx.fillRect(px+2, py+2, 2, 2);
            ctx.fillRect(px+ts-4, py+2, 2, 2);
            ctx.fillRect(px+2, py+ts-4, 2, 2);
            ctx.fillRect(px+ts-4, py+ts-4, 2, 2);
        }
    },

    checkLineOfSight: function(x0, y0, x1, y1) {
        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        let sx = (x0 < x1) ? 1 : -1;
        let sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;
        let dist = 0;

        while(true) {
            if(x0 === x1 && y0 === y1) return true; 
            if(dist > 0) { 
                if(x0 >= 0 && x0 < this.MAP_W && y0 >= 0 && y0 < this.MAP_H) {
                    const t = this.state.currentMap[y0][x0];
                    if(['#'].includes(t)) return false; 
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
        const viewDist = 9; 

        for(let y=startY; y<endY; y++) { 
            for(let x=startX; x<endX; x++) { 
                if(y>=0 && y<this.MAP_H && x>=0 && x<this.MAP_W) { 
                    
                    const dist = Math.sqrt((x-px)**2 + (y-py)**2);
                    if(dist > viewDist) continue;
                    if(!this.checkLineOfSight(px, py, x, y)) continue;

                    // A. Statische Welt
                    ctx.drawImage(
                        this.cacheCanvas, 
                        x*this.TILE, y*this.TILE, this.TILE, this.TILE,
                        x*this.TILE, y*this.TILE, this.TILE, this.TILE
                    );

                    // B. Dynamische Objekte
                    const t = this.state.currentMap[y][x]; 
                    if(t === 'M' || t === 'W' || t === 'X') {
                        this.drawTile(ctx, x, y, t);
                    }
                    
                    // C. Schatten-Vignette
                    const opacity = Math.max(0, (dist - 3) / (viewDist - 3));
                    if(opacity > 0) {
                        ctx.fillStyle = `rgba(0,0,0,${opacity})`;
                        ctx.fillRect(x*this.TILE, y*this.TILE, this.TILE, this.TILE);
                    }
                    
                    // D. Hidden Items
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
        
        // 4. Andere Spieler
        this.drawOtherPlayers(ctx);

        ctx.restore(); 

        // 5. Scanlines Overlay
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
        
        // FIX: Rotation um -90 Grad (-PI/2) korrigieren
        ctx.rotate(this.state.player.rot - Math.PI / 2); 
        
        // Taschenlampen-Kegel
        const gradient = ctx.createRadialGradient(0, 0, 10, 0, 0, 120);
        gradient.addColorStop(0, "rgba(255, 255, 200, 0.2)");
        gradient.addColorStop(1, "rgba(255, 255, 200, 0)");
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        // Da wir rotiert haben, zeichnen wir den Kegel jetzt nach "Rechts" (0 Grad im Canvas System)
        // und die Rotation oben sorgt dafür, dass es im Spiel richtig ausgerichtet ist.
        ctx.arc(0, 0, 120, -Math.PI/5, Math.PI/5);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Player Body
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
            
            ctx.fillStyle = "#00ffff"; 
            ctx.beginPath(); 
            ctx.arc(ox, oy, 6, 0, Math.PI*2); 
            ctx.fill(); 
            
            ctx.fillStyle = "white";
            ctx.font = "10px monospace";
            ctx.textAlign = "center";
            ctx.fillText(p.name ? p.name.substring(0,3) : "UNK", ox, oy - 10);
        } 
    },

    drawTile: function(ctx, x, y, type) { 
        const ts = this.TILE; 
        const cx = x * ts + ts/2; 
        const cy = y * ts + ts/2;
        
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
            case 'V': drawIcon("⚙️", "#ffff00", 24); break; 
            case 'R': drawIcon("💰", "#ff3333", 22); break;
            case 'M': drawIcon("💀", "#ff0000", 20); break;
            case 'W': drawIcon("👁️", "#ff8800", 20); break;
            case 'X': 
                ctx.fillStyle = "#8B4513"; 
                ctx.fillRect(cx - 8, cy - 6, 16, 12);
                ctx.strokeStyle = "#ffd700"; 
                ctx.strokeRect(cx - 8, cy - 6, 16, 12);
                break;
            case 'S': drawIcon("🏪", "#00ff00", 22); break;
            case 'H': drawIcon("⛰️", "#888", 22); break;
            case 'A': drawIcon("🛡️", "#555", 22); break; // Military
            case 'K': drawIcon("📡", "#aaf", 22); break; // Tower
            case 'E': drawIcon("EXIT", "#00ffff", 10); break;
            case 'P': drawIcon("✚", "#ff0000", 18); break; 
        } 
    }
});

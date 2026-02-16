// [2026-02-16 16:15:00] game_render.js - Nature & Atmosphere Update

Object.assign(Game, {
    initCache: function() {
        this.cacheCanvas = document.createElement('canvas');
        this.cacheCanvas.width = this.MAP_W * this.TILE;
        this.cacheCanvas.height = this.MAP_H * this.TILE;
        this.cacheCtx = this.cacheCanvas.getContext('2d'); 
    },

    pseudoRand: function(x, y) {
        return Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
    },

    renderStaticMap: function() { 
        if(!this.cacheCtx) this.initCache();
        const ctx = this.cacheCtx; 
        const map = this.state.currentMap;
        
        ctx.fillStyle = "#0d0d0d"; // Dunklerer Hintergrund für Kontrast
        ctx.fillRect(0, 0, this.cacheCanvas.width, this.cacheCanvas.height); 
        
        if(!map) return;

        for(let y=0; y<this.MAP_H; y++) {
            for(let x=0; x<this.MAP_W; x++) {
                const t = map[y][x];
                
                // 1. BODEN (Basis)
                this.drawFloorDetail(ctx, x, y, t);

                // 2. STATISCHE OBJEKTE
                if(t === '#') this.drawConnectedWall(ctx, x, y, map);
                else if(t === '^') this.drawMountain(ctx, x, y);
                // Bäume und Wasser rendern wir dynamisch im Loop für Animationen!
                // Aber wir zeichnen hier eine Basis, damit keine Löcher entstehen
                else if(t === '~') {
                    ctx.fillStyle = "#001133";
                    ctx.fillRect(x*this.TILE, y*this.TILE, this.TILE, this.TILE);
                }
            }
        }
    },

    drawFloorDetail: function(ctx, x, y, type) {
        const ts = this.TILE;
        const px = x * ts;
        const py = y * ts;
        const rand = this.pseudoRand(x, y);

        // Biome Farben
        let color = "#1a1a1a"; // Wasteland
        if(type === 't') color = "#141f14"; // Waldboden (dunkelgrünlich)
        if(type === '^') color = "#222"; // Felsboden
        if(type === '~') return; // Wasser hat eigenen Renderer

        ctx.fillStyle = color;
        ctx.fillRect(px, py, ts, ts);

        // Details (Kieselsteine, Risse)
        if(rand > 0.7) {
            ctx.fillStyle = "rgba(255,255,255,0.05)";
            const s = rand * 3; 
            ctx.fillRect(px + (ts*rand), py + (ts*(1-rand)), s, s);
        }
    },

    drawConnectedWall: function(ctx, x, y, map) {
        const ts = this.TILE;
        const px = x * ts;
        const py = y * ts;
        
        // Nachbarn checken für Verbindungen
        const n = (y > 0) && map[y-1][x] === '#';
        const s = (y < this.MAP_H-1) && map[y+1][x] === '#';

        ctx.fillStyle = "#444"; // Beton Grau
        ctx.fillRect(px, py, ts, ts);

        // 3D Fake
        ctx.fillStyle = "#222"; // Frontseite
        ctx.fillRect(px, py + ts - 8, ts, 8);
        ctx.fillStyle = "#555"; // Top Highlight
        if(!n) ctx.fillRect(px, py, ts, 4);
    },

    // --- NEUE RENDER FUNKTIONEN ---

    drawMountain: function(ctx, x, y) {
        const ts = this.TILE;
        const px = x * ts;
        const py = y * ts;
        const rand = this.pseudoRand(x, y);

        // Basis Fels
        ctx.fillStyle = "#2a2a2a";
        ctx.beginPath();
        ctx.moveTo(px, py + ts);
        ctx.lineTo(px + ts/2, py + ts * 0.1); // Spitze
        ctx.lineTo(px + ts, py + ts);
        ctx.fill();

        // Highlight (Schnee oder Licht)
        ctx.fillStyle = (rand > 0.6) ? "#e0e0e0" : "#555"; // Manchmal Schnee
        ctx.beginPath();
        ctx.moveTo(px + ts/2, py + ts * 0.1);
        ctx.lineTo(px + ts * 0.3, py + ts * 0.5);
        ctx.lineTo(px + ts * 0.7, py + ts * 0.5);
        ctx.fill();

        // Schattenseite (Rechts)
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.beginPath();
        ctx.moveTo(px + ts/2, py + ts * 0.1);
        ctx.lineTo(px + ts/2, py + ts); // Senkrecht runter
        ctx.lineTo(px + ts, py + ts);
        ctx.fill();
    },

    drawTree: function(ctx, x, y, time) {
        const ts = this.TILE;
        const px = x * ts;
        const py = y * ts;
        const rand = this.pseudoRand(x, y);
        
        // Wind-Effekt (sanftes Wackeln der Krone)
        const sway = Math.sin(time / 1000 + x) * 2;

        // Schatten (Oval am Boden)
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.beginPath();
        ctx.ellipse(px + ts/2, py + ts - 5, ts/3, ts/6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stamm
        ctx.fillStyle = "#3e2723"; // Dunkelbraun
        ctx.fillRect(px + ts/2 - 3, py + ts/2, 6, ts/2);

        // Krone (Mehrere Kreise für Volumen)
        // Farbe variiert leicht pro Baum
        const green = (rand > 0.5) ? "#2e7d32" : "#1b5e20"; 
        
        ctx.fillStyle = green;
        
        // Unterer Busch
        ctx.beginPath();
        ctx.arc(px + ts/2 + sway, py + ts/2, ts/2.5, 0, Math.PI*2);
        ctx.fill();

        // Oberer Busch (Heller)
        ctx.fillStyle = (rand > 0.5) ? "#4caf50" : "#388e3c";
        ctx.beginPath();
        ctx.arc(px + ts/2 + (sway*1.5), py + ts/3, ts/3, 0, Math.PI*2);
        ctx.fill();
    },

    drawWater: function(ctx, x, y, time) {
        const ts = this.TILE;
        const px = x * ts;
        const py = y * ts;

        // Basis Blau
        ctx.fillStyle = "#0d47a1"; 
        ctx.fillRect(px, py, ts, ts);

        // Wellen-Effekt (Sinus-Linien)
        ctx.strokeStyle = "rgba(66, 165, 245, 0.5)"; // Hellblau transparent
        ctx.lineWidth = 2;
        
        const offset = (time / 200) % ts; // Bewegt sich
        
        ctx.beginPath();
        ctx.moveTo(px, py + offset);
        ctx.lineTo(px + ts, py + offset);
        ctx.stroke();
        
        // Zweite Welle
        const offset2 = ((time / 200) + ts/2) % ts;
        ctx.beginPath();
        ctx.moveTo(px, py + offset2);
        ctx.lineTo(px + ts, py + offset2);
        ctx.stroke();
    },

    drawGrass: function(ctx, x, y, time) {
        // Zeichnet Grasbüschel auf normalen Boden
        const ts = this.TILE;
        const px = x * ts;
        const py = y * ts;
        const rand = this.pseudoRand(x, y);

        // Nur auf manchen Feldern Gras
        if(rand < 0.6) return;

        const sway = Math.sin(time / 500 + x * y) * 3;

        ctx.strokeStyle = (rand > 0.8) ? "#558b2f" : "#33691e"; // Trockenes vs Grünes Gras
        ctx.lineWidth = 1;

        ctx.beginPath();
        // 3 Grashalme
        ctx.moveTo(px + 10, py + ts);
        ctx.lineTo(px + 10 + sway, py + ts - 8);
        
        ctx.moveTo(px + 15, py + ts);
        ctx.lineTo(px + 15 + sway/2, py + ts - 10);

        ctx.moveTo(px + 20, py + ts);
        ctx.lineTo(px + 20 + sway, py + ts - 6);
        ctx.stroke();
    },

    checkLineOfSight: function(x0, y0, x1, y1) {
        // Standard Bresenham, blockiert durch Wände, Berge, Bäume
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
                    // Durch Wasser kann man schauen, durch Bäume/Berge nicht
                    if(['#', '^', 't'].includes(t)) return false; 
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
        const time = Date.now();
        
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
        const viewDist = 10; 

        for(let y=startY; y<endY; y++) { 
            for(let x=startX; x<endX; x++) { 
                if(y>=0 && y<this.MAP_H && x>=0 && x<this.MAP_W) { 
                    
                    const dist = Math.sqrt((x-px)**2 + (y-py)**2);
                    if(dist > viewDist) continue;
                    if(!this.checkLineOfSight(px, py, x, y)) continue;

                    // A. Statische Welt (Boden, Wände, Berge)
                    ctx.drawImage(
                        this.cacheCanvas, 
                        x*this.TILE, y*this.TILE, this.TILE, this.TILE,
                        x*this.TILE, y*this.TILE, this.TILE, this.TILE
                    );

                    const t = this.state.currentMap[y][x]; 
                    
                    // B. Dynamische Natur (Wasser, Bäume, Gras)
                    if(t === '~') this.drawWater(ctx, x, y, time);
                    else if(t === 't') this.drawTree(ctx, x, y, time);
                    else if(t === '.') this.drawGrass(ctx, x, y, time); // Gras auf Boden

                    // C. Dynamische Objekte (Loot, Gegner)
                    if(['M', 'W', 'X', 'V', 'R', 'S'].includes(t)) {
                        this.drawTile(ctx, x, y, t);
                    }
                    
                    // D. Schatten-Vignette
                    const opacity = Math.max(0, (dist - 4) / (viewDist - 4));
                    if(opacity > 0) {
                        ctx.fillStyle = `rgba(0,0,0,${opacity})`;
                        ctx.fillRect(x*this.TILE, y*this.TILE, this.TILE, this.TILE);
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
        ctx.rotate(this.state.player.rot - Math.PI / 2); // Korrektur -90 Grad
        
        // Taschenlampen-Kegel
        const gradient = ctx.createRadialGradient(0, 0, 10, 0, 0, 140);
        gradient.addColorStop(0, "rgba(255, 255, 200, 0.25)");
        gradient.addColorStop(1, "rgba(255, 255, 200, 0)");
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 140, -Math.PI/5, Math.PI/5);
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
            case 'E': drawIcon("EXIT", "#00ffff", 10); break;
            case 'P': drawIcon("✚", "#ff0000", 18); break; 
        } 
    }
});

// [2026-02-16 13:00:00] game_render.js - Advanced 2.5D Lighting (Raycasting)

Object.assign(Game, {
    initCache: function() {
        this.cacheCanvas = document.createElement('canvas');
        this.cacheCanvas.width = this.MAP_W * this.TILE;
        this.cacheCanvas.height = this.MAP_H * this.TILE;
        this.cacheCtx = this.cacheCanvas.getContext('2d'); 
    },

    renderStaticMap: function() { 
        if(!this.cacheCtx) this.initCache();
        const ctx = this.cacheCtx; 
        
        ctx.fillStyle = "#000"; 
        ctx.fillRect(0, 0, this.cacheCanvas.width, this.cacheCanvas.height); 
        
        if(!this.state.currentMap) return;

        // Render nur Boden (statisch)
        for(let y=0; y<this.MAP_H; y++) {
            for(let x=0; x<this.MAP_W; x++) {
                if(this.state.currentMap[y]) {
                    this.drawTile(ctx, x, y, this.state.currentMap[y][x], true); // true = nur Boden
                }
            }
        }
    },

    // Bresenham Line Algorithm für Sichtprüfung
    checkLineOfSight: function(x0, y0, x1, y1) {
        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        let sx = (x0 < x1) ? 1 : -1;
        let sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;

        while(true) {
            if(x0 === x1 && y0 === y1) return true; // Ziel erreicht
            
            // Check Collision (Blockiert Sicht?)
            // Wir erlauben Durchsicht durch Spieler/Boden, aber nicht Wände
            if(x0 >= 0 && x0 < this.MAP_W && y0 >= 0 && y0 < this.MAP_H) {
                const t = this.state.currentMap[y0][x0];
                if(['#', 'M', 'W'].includes(t)) return false; // Sicht blockiert
            }

            let e2 = 2 * err;
            if(e2 > -dy) { err -= dy; x0 += sx; }
            if(e2 < dx) { err += dx; y0 += sy; }
        }
    },

    draw: function() { 
        if(!this.ctx || !this.cacheCanvas) return; 
        if(!this.state.currentMap) return;

        const ctx = this.ctx; 
        const cvs = ctx.canvas; 
        
        if (cvs.clientWidth === 0 || cvs.clientHeight === 0) return;

        const viewW = cvs.clientWidth;
        const viewH = cvs.clientHeight;
        
        // Kamera Smooth Lerp (Optional, hier direkt)
        let targetCamX = (this.state.player.x * this.TILE) - (viewW / 2); 
        let targetCamY = (this.state.player.y * this.TILE) - (viewH / 2); 
        
        const maxCamX = (this.MAP_W * this.TILE) - viewW; 
        const maxCamY = (this.MAP_H * this.TILE) - viewH; 
        
        this.camera.x = Math.max(0, Math.min(targetCamX, maxCamX)); 
        this.camera.y = Math.max(0, Math.min(targetCamY, maxCamY)); 
        
        // 1. Hintergrund löschen
        ctx.fillStyle = "#000"; 
        ctx.fillRect(0, 0, viewW, viewH); 
        
        ctx.save(); 
        ctx.translate(-this.camera.x, -this.camera.y); 
        
        const startX = Math.floor(this.camera.x / this.TILE); 
        const startY = Math.floor(this.camera.y / this.TILE); 
        const endX = startX + Math.ceil(viewW / this.TILE) + 1; 
        const endY = startY + Math.ceil(viewH / this.TILE) + 1; 

        // 2. RAYCASTING LOOP
        // Wir zeichnen nur Tiles, die der Spieler sehen kann
        
        const px = this.state.player.x;
        const py = this.state.player.y;
        const viewDist = 8; // Sichtweite

        for(let y=startY; y<endY; y++) { 
            for(let x=startX; x<endX; x++) { 
                if(y>=0 && y<this.MAP_H && x>=0 && x<this.MAP_W) { 
                    
                    const dist = Math.sqrt((x-px)**2 + (y-py)**2);
                    
                    // A. Distanz Check
                    if(dist > viewDist) {
                        // Zu weit weg -> Schwarz (oder extrem dunkel)
                        // Wir zeichnen nichts = Schwarz (durch Background)
                        continue;
                    }

                    // B. Line of Sight Check (Schatten)
                    // Wir checken vom Spieler-Zentrum zum Tile-Zentrum
                    const isVisible = this.checkLineOfSight(px, py, x, y);
                    
                    if(!isVisible) {
                        // Im Schatten -> Schwarz
                        continue;
                    }

                    // C. Zeichne Boden (aus Cache) & Objekt
                    const t = this.state.currentMap[y][x]; 
                    
                    // Boden zeichnen (aus Cache für Performance, aber nur den Ausschnitt)
                    ctx.drawImage(
                        this.cacheCanvas, 
                        x*this.TILE, y*this.TILE, this.TILE, this.TILE,
                        x*this.TILE, y*this.TILE, this.TILE, this.TILE
                    );

                    // Objekt darauf zeichnen
                    if(t !== '.') {
                        this.drawTile(ctx, x, y, t, 1);
                    }
                    
                    // D. Dynamische Beleuchtung (Vignette pro Tile)
                    // Je weiter weg, desto dunkler
                    const opacity = Math.min(0.9, dist / viewDist);
                    if(opacity > 0) {
                        ctx.fillStyle = `rgba(0,0,0,${opacity})`;
                        ctx.fillRect(x*this.TILE, y*this.TILE, this.TILE, this.TILE);
                    }
                    
                    // Hidden Items Glow
                    if(this.state.hiddenItems && this.state.hiddenItems[`${x},${y}`]) {
                        ctx.fillStyle = "rgba(255,255,255,0.2)";
                        ctx.beginPath();
                        ctx.arc(x * this.TILE + this.TILE/2, y * this.TILE + this.TILE/2, 4, 0, Math.PI * 2);
                        ctx.fill();
                    }
                } 
            } 
        } 
        
        // 3. Andere Spieler
        if(typeof Network !== 'undefined' && Network.otherPlayers) { 
            for(let pid in Network.otherPlayers) { 
                const p = Network.otherPlayers[pid]; 
                if(p.sector && (p.sector.x !== this.state.sector.x || p.sector.y !== this.state.sector.y)) continue; 
                
                // Nur zeichnen wenn sichtbar? Optional. Hier immer zeichnen.
                const ox = p.x * this.TILE + this.TILE/2; 
                const oy = p.y * this.TILE + this.TILE/2; 
                
                ctx.fillStyle = "#00ffff"; 
                ctx.beginPath(); 
                ctx.arc(ox, oy, 5, 0, Math.PI*2); 
                ctx.fill(); 
                Game.drawText(ctx, p.name ? p.name.substring(0,3) : "P", ox+6, oy, 10, "white", "left");
            } 
        } 
        
        // 4. Player Zeichnen (mit Taschenlampen-Kegel)
        const screenPx = this.state.player.x * this.TILE + this.TILE/2; 
        const screenPy = this.state.player.y * this.TILE + this.TILE/2; 
        
        ctx.save();
        ctx.translate(screenPx, screenPy); 
        ctx.rotate(this.state.player.rot); 
        
        // Taschenlampe (Kegel)
        // Wir malen "Licht" über die Dunkelheit? 
        // Nein, wir haben die Dunkelheit schon per Tile-Opacity gemacht.
        // Hier malen wir nur den Schein der Lampe (optional)
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 150, -Math.PI/6, Math.PI/6);
        ctx.fillStyle = "rgba(255, 255, 200, 0.1)"; // Gelblicher Schein
        ctx.fill();

        // Player Icon
        ctx.rotate(-this.state.player.rot); // Reset Rotation für Icon (optional)
        ctx.rotate(this.state.player.rot); // Wieder hin
        
        ctx.fillStyle = "#39ff14"; 
        ctx.shadowBlur = 10; 
        ctx.shadowColor = "#39ff14"; 
        ctx.beginPath(); 
        ctx.moveTo(0, -8); 
        ctx.lineTo(6, 8); 
        ctx.lineTo(0, 5); 
        ctx.lineTo(-6, 8); 
        ctx.fill(); 
        ctx.shadowBlur = 0; 
        
        ctx.restore(); 
        
        ctx.restore(); 

        // 5. Global Vignette (für Atmosphäre am Rand)
        const gradient = ctx.createRadialGradient(viewW/2, viewH/2, viewH*0.3, viewW/2, viewH/2, viewH*0.8);
        gradient.addColorStop(0, "rgba(0,0,0,0)");
        gradient.addColorStop(1, "rgba(0,10,0,0.6)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, viewW, viewH);
    },

    drawTile: function(ctx, x, y, type, onlyFloor = false) { 
        const ts = this.TILE; const px = x * ts; const py = y * ts; 
        const cx = px + ts/2; const cy = py + ts/2;
        
        // Bodenfarbe
        let bg = "#111"; // Standard dunkel
        if(['M', 'W', '~'].includes(type)) bg = "#221111"; // Gefahrenzone Boden
        
        if (onlyFloor) {
            ctx.fillStyle = bg; 
            ctx.fillRect(px, py, ts, ts);
            // Gittermuster
            ctx.strokeStyle = "rgba(40, 90, 40, 0.05)"; 
            ctx.lineWidth = 1; 
            ctx.strokeRect(px, py, ts, ts);
            return;
        }
        
        // Objekte
        ctx.beginPath(); 
        switch(type) { 
            case '#': // Wand 
                ctx.fillStyle = "#444"; 
                ctx.fillRect(px, py, ts, ts); 
                // 3D Effekt (Top Face)
                ctx.fillStyle = "#555";
                ctx.fillRect(px, py, ts, ts-4);
                // Front Face
                ctx.fillStyle = "#222";
                ctx.fillRect(px, py+ts-4, ts, 4);
                break; 
            
            case 'V': 
                Game.drawText(ctx, "⚙️", cx, cy, 35, "#ffff00", "center", true);
                break; 

            case 'R':
                Game.drawText(ctx, "🛒", cx, cy, 30, "#ff3333", "center", true);
                break;

            case 'C': ctx.fillStyle = this.colors['C']; ctx.fillRect(px+6, py+14, 18, 12); break; 
            case 'S': ctx.fillStyle = this.colors['S']; ctx.arc(px+ts/2, py+12, 6, 0, Math.PI*2); ctx.fill(); break; 
            case 'H': ctx.fillStyle = this.colors['H']; ctx.arc(px+ts/2, py+ts/2, ts/2.5, 0, Math.PI*2); ctx.fill(); break; 
            
            case '$': Game.drawText(ctx, "$$", cx, py+20, 12, this.colors['$']); break;
            case '&': Game.drawText(ctx, "🔧", cx, py+20, 12, this.colors['&']); break;
            case 'P': Game.drawText(ctx, "✚", cx, py+20, 12, this.colors['P']); break;
            case 'E': Game.drawText(ctx, "EXIT", cx, py+20, 10, this.colors['E']); break;
            
            case 'F': ctx.fillStyle = this.colors['F']; ctx.arc(px+ts/2, py+ts/2, ts/3, 0, Math.PI*2); ctx.fill(); break;
            case '|': ctx.fillStyle = this.colors['|']; ctx.fillRect(px, py, ts, ts); break;
            case 'X': ctx.fillStyle = this.colors['X']; ctx.fillRect(px+5, py+10, 20, 15); ctx.fillStyle = "#ffd700"; ctx.fillRect(px+12, py+15, 6, 5); break;
        } 
    }
});

Object.assign(Game, {
    drawHelpers: {
        // --- BEREITS VORHANDEN (Map Objekte) ---
        tree: function(ctx, x, y, size) {
            const wind = Math.sin(Date.now() / 1000 + x) * 2;
            ctx.fillStyle = "rgba(0,0,0,0.4)";
            ctx.beginPath(); ctx.ellipse(x + size/2, y + size - 2, size/3, size/5, 0, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#4e342e"; ctx.fillRect(x + size/2 - size/8, y + size/2, size/4, size/2);
            const crownX = x + size/2 + wind; const crownY = y + size/2 - 5;
            ctx.fillStyle = "#1b5e20"; ctx.beginPath(); ctx.arc(crownX, crownY, size/2.5, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#2e7d32"; ctx.beginPath(); ctx.arc(crownX - 6, crownY + 5, size/3, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#388e3c"; ctx.beginPath(); ctx.arc(crownX + 4, crownY + 2, size/3.5, 0, Math.PI*2); ctx.fill();
        },
        wall: function(ctx, x, y, size) {
            const grad = ctx.createLinearGradient(x, y, x + size, y + size);
            grad.addColorStop(0, "#263238"); grad.addColorStop(0.5, "#455a64"); grad.addColorStop(1, "#1c2326");
            ctx.fillStyle = grad; ctx.fillRect(x, y, size, size);
            if((x+y)%5 === 0) { ctx.fillStyle = "rgba(180, 50, 0, 0.3)"; ctx.fillRect(x+5, y+5, size/2, size/2); }
            ctx.strokeStyle = "#111"; ctx.strokeRect(x, y, size, size);
        },
        mountain: function(ctx, x, y, size) {
            ctx.fillStyle = "#3e2723"; ctx.beginPath(); ctx.moveTo(x, y + size); ctx.lineTo(x + size/2, y + size/4); ctx.lineTo(x + size, y + size); ctx.fill();
            ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.moveTo(x + size/2, y + size/4); ctx.lineTo(x + size, y + size); ctx.lineTo(x + size/2, y + size); ctx.fill();
        },
        grass: function(ctx, x, y, size, density) {
            const count = (x * y) % density + 1; ctx.strokeStyle = "#33691e"; ctx.lineWidth = 1;
            for(let i=0; i<count; i++) {
                const offX = ((x * i * 17) % size); const offY = ((y * i * 23) % size);
                ctx.beginPath(); ctx.moveTo(x+offX, y+offY); ctx.lineTo(x+offX-2, y+offY-4); ctx.moveTo(x+offX, y+offY); ctx.lineTo(x+offX+2, y+offY-5); ctx.stroke();
            }
        },
        player: function(ctx, x, y, size, color) {
             ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.beginPath(); ctx.ellipse(x, y + size/3, size/2, size/4, 0, 0, Math.PI*2); ctx.fill();
             ctx.fillStyle = "#0277bd"; ctx.fillRect(x - size/3, y - size/3, size/1.5, size/1.5);
             ctx.fillStyle = "#ffeb3b"; ctx.fillRect(x - size/10, y - size/3, size/5, size/1.5);
             ctx.fillStyle = "#ffccbc"; ctx.beginPath(); ctx.arc(x, y - size/4, size/3, 0, Math.PI*2); ctx.fill();
             ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, size/1.5, 0, Math.PI*2); ctx.stroke();
        },

        // --- NEU: MONSTER RENDERER ---
        
        enemy_rat: function(ctx, x, y, s) { // s = scale
            const breath = Math.sin(Date.now() / 200) * 2;
            
            // Schatten
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.beginPath(); ctx.ellipse(x, y + 80, 70, 20, 0, 0, Math.PI*2); ctx.fill();

            // Schwanz (Kurve)
            ctx.strokeStyle = "#f48fb1"; ctx.lineWidth = 8; ctx.beginPath();
            ctx.moveTo(x + 40, y + 40);
            ctx.quadraticCurveTo(x + 100, y + 50, x + 120, y + 20 + breath);
            ctx.stroke();

            // Körper
            ctx.fillStyle = "#5d4037"; // Dunkelbraun
            ctx.beginPath(); ctx.ellipse(x, y + 20, 60, 45 + breath/2, 0, 0, Math.PI*2); ctx.fill();
            
            // Kopf
            ctx.fillStyle = "#6d4c41"; 
            ctx.beginPath(); ctx.arc(x - 50, y + 10 + breath, 30, 0, Math.PI*2); ctx.fill();

            // Ohren
            ctx.fillStyle = "#8d6e63"; 
            ctx.beginPath(); ctx.arc(x - 45, y - 15 + breath, 15, 0, Math.PI*2); ctx.fill();
            
            // Augen (Rot leuchtend)
            ctx.fillStyle = "#ff0000"; 
            ctx.shadowBlur = 10; ctx.shadowColor = "red";
            ctx.beginPath(); ctx.arc(x - 60, y + 5 + breath, 4, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;

            // Zähne
            ctx.fillStyle = "#fff";
            ctx.fillRect(x - 75, y + 20 + breath, 5, 8);
        },

        enemy_raider: function(ctx, x, y, s) {
            const idle = Math.sin(Date.now() / 500) * 3;
            
            // Körper (Rüstung)
            ctx.fillStyle = "#424242"; // Grau
            ctx.fillRect(x - 30, y - 20, 60, 80);
            
            // Plattenrüstung Details
            ctx.fillStyle = "#616161";
            ctx.fillRect(x - 25, y - 10 + idle, 50, 40);
            
            // Kopf
            ctx.fillStyle = "#ffccbc"; // Haut
            ctx.beginPath(); ctx.arc(x, y - 40 + idle, 25, 0, Math.PI*2); ctx.fill();
            
            // Irokesen-Schnitt
            ctx.fillStyle = "#d50000"; // Rot
            ctx.beginPath();
            ctx.moveTo(x - 5, y - 60 + idle);
            ctx.lineTo(x + 15, y - 80 + idle);
            ctx.lineTo(x + 5, y - 55 + idle);
            ctx.fill();

            // Brille/Visier
            ctx.fillStyle = "#000";
            ctx.fillRect(x - 15, y - 45 + idle, 30, 8);
            ctx.fillStyle = "#00ff00"; // Nachtsicht
            ctx.beginPath(); ctx.arc(x - 8, y - 41 + idle, 3, 0, Math.PI*2); ctx.fill();
            
            // Waffe (grob angedeutet)
            ctx.fillStyle = "#212121";
            ctx.fillRect(x + 30, y + idle, 10, 40);
            ctx.fillRect(x + 20, y + 30 + idle, 40, 10);
        },
        
        enemy_generic: function(ctx, x, y, s) {
            // Unbekanntes Monster (Schatten)
            ctx.fillStyle = "#000";
            ctx.beginPath(); ctx.arc(x, y, 50, 0, Math.PI*2); ctx.fill();
            // Fragezeichen
            ctx.fillStyle = "#f00";
            ctx.font = "bold 60px monospace"; ctx.textAlign = "center";
            ctx.fillText("?", x, y + 20);
        }
    },

    renderWeather: function(ctx, width, height) {
        const time = Date.now();
        const opacity = 0.05 + Math.sin(time / 2000) * 0.02;
        ctx.fillStyle = `rgba(50, 255, 50, ${opacity})`;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "rgba(200, 255, 200, 0.3)";
        for(let i=0; i<30; i++) {
            const px = (i * 123 + time * 0.1) % width;
            const py = (i * 234 + time * 0.2) % height;
            ctx.fillRect(px, py, 1, 2);
        }
    },

    // --- KAMPF RENDERER ---
    renderCombat: function(ctx, w, h) {
        // 1. Hintergrund (Dunkel und bedrohlich)
        const grad = ctx.createRadialGradient(w/2, h/2, 50, w/2, h/2, h);
        grad.addColorStop(0, "#222");
        grad.addColorStop(1, "#000");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Boden-Gitter (Retro Effekt)
        ctx.strokeStyle = "#1b5e20";
        ctx.lineWidth = 1;
        const time = Date.now() / 50;
        ctx.beginPath();
        for(let i=0; i<w; i+=50) {
            ctx.moveTo(i, h/2); ctx.lineTo((i - w/2)*3 + w/2, h); // Perspektive
        }
        ctx.stroke();
        
        // 2. Gegner Zeichnen
        if(this.state.enemy) {
            const name = this.state.enemy.name.toLowerCase();
            const cx = w/2;
            const cy = h/2 + 50;
            
            // Wähle passenden Renderer
            if(name.includes("ratte")) {
                this.drawHelpers.enemy_rat(ctx, cx, cy, 1);
            } else if (name.includes("plünderer") || name.includes("raider")) {
                this.drawHelpers.enemy_raider(ctx, cx, cy, 1);
            } else {
                this.drawHelpers.enemy_generic(ctx, cx, cy, 1);
            }
            
            // Treffer-Effekt (Bildschirm wackeln wenn Monster verletzt wurde)
            // (Kannst du über state.hitFlash steuern, wenn du willst)
        }
        
        // 3. Overlay (Scanlines bleiben vom CSS)
        // Hier könnten wir noch HP Balken direkt in Canvas malen, 
        // aber das HTML Interface liegt wahrscheinlich drüber.
    },

    renderStaticMap: function() { 
        if(!this.cacheCtx) this.initCache();
        const ctx = this.cacheCtx; 
        ctx.fillStyle = "#1b1b1b"; ctx.fillRect(0, 0, this.cacheCanvas.width, this.cacheCanvas.height); 
        if(!this.state.currentMap) return;
        for(let y=0; y<this.MAP_H; y++) {
            for(let x=0; x<this.MAP_W; x++) {
                if(this.state.currentMap[y]) this.drawTile(ctx, x, y, this.state.currentMap[y][x]);
            }
        }
    },

    draw: function() { 
        if(!this.ctx || !this.cacheCanvas) return; 

        const ctx = this.ctx; const cvs = ctx.canvas; 
        
        // ENTSCHEIDUNG: WELCHE SZENE?
        if (this.state.view === 'combat') {
            this.renderCombat(ctx, cvs.width, cvs.height);
            return; // Kampf fertig, Map nicht zeichnen
        }
        
        // --- MAP RENDER (WIE ZUVOR) ---
        if(!this.state.currentMap) return;

        let targetCamX = (this.state.player.x * this.TILE) - (cvs.width / 2); 
        let targetCamY = (this.state.player.y * this.TILE) - (cvs.height / 2); 
        const maxCamX = (this.MAP_W * this.TILE) - cvs.width; 
        const maxCamY = (this.MAP_H * this.TILE) - cvs.height; 
        this.camera.x = Math.max(0, Math.min(targetCamX, maxCamX)); 
        this.camera.y = Math.max(0, Math.min(targetCamY, maxCamY)); 
        
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, cvs.width, cvs.height); 
        ctx.drawImage(this.cacheCanvas, this.camera.x, this.camera.y, cvs.width, cvs.height, 0, 0, cvs.width, cvs.height); 
        
        ctx.save(); 
        ctx.translate(-this.camera.x, -this.camera.y); 
        
        const startX = Math.floor(this.camera.x / this.TILE); const startY = Math.floor(this.camera.y / this.TILE); 
        const endX = startX + Math.ceil(cvs.width / this.TILE) + 1; const endY = startY + Math.ceil(cvs.height / this.TILE) + 1; 
        const secKey = `${this.state.sector.x},${this.state.sector.y}`;
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7; 

        for(let y=startY; y<endY; y++) { 
            for(let x=startX; x<endX; x++) { 
                if(y>=0 && y<this.MAP_H && x>=0 && x<this.MAP_W) { 
                    const tileKey = `${secKey}_${x},${y}`;
                    const isCity = (this.state.zone && this.state.zone.includes("Stadt")); 
                    
                    if(!isCity && !this.state.explored[tileKey]) {
                        ctx.fillStyle = "#000"; ctx.fillRect(x * this.TILE, y * this.TILE, this.TILE, this.TILE); continue; 
                    }
                    if(!this.state.currentMap[y]) continue; 
                    const t = this.state.currentMap[y][x];

                    if(t === '~') { // Wasser Wellen
                        ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1; ctx.beginPath();
                        const waveX = (Date.now()/200 + y*10) % this.TILE;
                        ctx.moveTo(x*this.TILE + waveX, y*this.TILE + this.TILE/2); ctx.lineTo(x*this.TILE + waveX + 5, y*this.TILE + this.TILE/2); ctx.stroke();
                    }
                    if(this.state.hiddenItems && this.state.hiddenItems[`${x},${y}`]) { // Items
                        const shimmer = (Math.sin(Date.now() / 150) + 1) / 2; ctx.fillStyle = `rgba(255, 255, 100, ${shimmer})`;
                        ctx.beginPath(); ctx.arc(x * this.TILE + this.TILE/2, y * this.TILE + this.TILE/2, 2, 0, Math.PI * 2); ctx.fill();
                    }
                } 
            } 
        } 
        
        if(typeof Network !== 'undefined' && Network.otherPlayers) { 
            for(let pid in Network.otherPlayers) { 
                const p = Network.otherPlayers[pid]; 
                if(p.sector && (p.sector.x !== this.state.sector.x || p.sector.y !== this.state.sector.y)) continue; 
                const ox = p.x * this.TILE + this.TILE/2; const oy = p.y * this.TILE + this.TILE/2; 
                this.drawHelpers.player(ctx, ox, oy, this.TILE, "#00bcd4"); 
                ctx.font = "10px monospace"; ctx.fillStyle = "white"; ctx.fillText(p.name ? p.name.substring(0,3) : "P", ox+8, oy - 12); 
            } 
        } 
        
        const px = this.state.player.x * this.TILE + this.TILE/2; const py = this.state.player.y * this.TILE + this.TILE/2; 
        this.drawHelpers.player(ctx, px, py, this.TILE, "#76ff03"); 
        
        ctx.restore(); 
        
        if(!this.state.zone || !this.state.zone.includes("Bunker")) {
            this.renderWeather(ctx, cvs.width, cvs.height);
        }
    },

    drawTile: function(ctx, x, y, type, pulse = 1) { 
        const ts = this.TILE; const px = x * ts; const py = y * ts; 
        if(!['~', '#', 'M', 'W'].includes(type)) {
             if((x*y)%3 === 0) this.drawHelpers.grass(ctx, px, py, ts, 5);
             else if((x+y)%7 === 0) { ctx.fillStyle = "#555"; ctx.beginPath(); ctx.arc(px + ts/2, py + ts/2 + 5, 2, 0, Math.PI*2); ctx.fill(); }
        }
        switch(type) {
            case '#': this.drawHelpers.wall(ctx, px, py, ts); break;
            case 't': case 'T': this.drawHelpers.tree(ctx, px, py, ts); break;
            case 'M': case '^': this.drawHelpers.mountain(ctx, px, py, ts); break;
            case '~': ctx.fillStyle = "#01579b"; ctx.fillRect(px, py, ts, ts); break;
            case 'C': ctx.fillStyle = "#263238"; ctx.fillRect(px + 4, py + 8, ts-8, ts-8); ctx.fillStyle = `rgba(255, 193, 7, ${pulse})`; ctx.fillRect(px + 8, py + 15, 6, 6); break;
            case 'V': ctx.fillStyle = "#333"; ctx.beginPath(); ctx.arc(px+ts/2, py+ts/2, ts/2, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = "#ffeb3b"; ctx.beginPath(); ctx.arc(px+ts/2, py+ts/2, ts/3, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = "#000"; ctx.font="bold 12px monospace"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText("101", px+ts/2, py+ts/2); break;
            case 'R': ctx.fillStyle = "#b71c1c"; ctx.beginPath(); ctx.moveTo(px+ts/2, py+5); ctx.lineTo(px+ts-5, py+ts-5); ctx.lineTo(px+5, py+ts-5); ctx.fill(); ctx.fillStyle = "#fff"; ctx.font="10px monospace"; ctx.fillText("☠️", px+ts/2, py+ts/2+5); break;
            default: if (['$','&','P'].includes(type)) { ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.arc(px+ts/2, py+ts/2, ts/3, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = "#fff"; ctx.font="16px monospace"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(type, px+ts/2, py+ts/2); } break;
        }
    }
});

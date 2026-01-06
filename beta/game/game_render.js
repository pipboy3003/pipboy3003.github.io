Object.assign(Game, {
    // [ERWEITERT] Prozedurale Zeichen-Funktionen
    drawHelpers: {
        // ... (Player, Wall, Tree aus v0.0.1 bleiben, hier verbessert/ergänzt)
        tree: function(ctx, x, y, size) {
            // Leichte Wind-Animation für die Krone
            const wind = Math.sin(Date.now() / 1000 + x) * 2;
            
            // Schatten
            ctx.fillStyle = "rgba(0,0,0,0.4)";
            ctx.beginPath();
            ctx.ellipse(x + size/2, y + size - 2, size/3, size/5, 0, 0, Math.PI*2);
            ctx.fill();

            // Stamm
            ctx.fillStyle = "#4e342e";
            ctx.fillRect(x + size/2 - size/8, y + size/2, size/4, size/2);

            // Krone (mit Wind)
            const crownX = x + size/2 + wind;
            const crownY = y + size/2 - 5;
            
            ctx.fillStyle = "#1b5e20"; 
            ctx.beginPath(); ctx.arc(crownX, crownY, size/2.5, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#2e7d32"; 
            ctx.beginPath(); ctx.arc(crownX - 6, crownY + 5, size/3, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#388e3c"; // Highlight
            ctx.beginPath(); ctx.arc(crownX + 4, crownY + 2, size/3.5, 0, Math.PI*2); ctx.fill();
        },
        
        wall: function(ctx, x, y, size) {
            const grad = ctx.createLinearGradient(x, y, x + size, y + size);
            grad.addColorStop(0, "#263238");
            grad.addColorStop(0.5, "#455a64");
            grad.addColorStop(1, "#1c2326");
            ctx.fillStyle = grad;
            ctx.fillRect(x, y, size, size);
            
            // Rost-Flecken (Zufall basierend auf Position)
            if((x+y)%5 === 0) {
                ctx.fillStyle = "rgba(180, 50, 0, 0.3)";
                ctx.fillRect(x+5, y+5, size/2, size/2);
            }
            
            ctx.strokeStyle = "#111";
            ctx.strokeRect(x, y, size, size);
        },

        mountain: function(ctx, x, y, size) {
            // Ein Fels-Brocken
            ctx.fillStyle = "#3e2723"; // Dunkelbraun
            ctx.beginPath();
            ctx.moveTo(x, y + size);
            ctx.lineTo(x + size/2, y + size/4); // Spitze
            ctx.lineTo(x + size, y + size);
            ctx.fill();
            
            // Schattenseite (Licht kommt von links oben)
            ctx.fillStyle = "rgba(0,0,0,0.3)";
            ctx.beginPath();
            ctx.moveTo(x + size/2, y + size/4);
            ctx.lineTo(x + size, y + size);
            ctx.lineTo(x + size/2, y + size);
            ctx.fill();

            // Kleine Steine davor
            ctx.fillStyle = "#5d4037";
            ctx.beginPath(); ctx.arc(x + size/5, y + size - 5, 4, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(x + size/1.5, y + size - 3, 3, 0, Math.PI*2); ctx.fill();
        },

        grass: function(ctx, x, y, size, density) {
            // Zeichnet zufällige Grasbüschel auf das Tile
            // Wir nutzen x/y als "Seed" für den Zufall, damit es nicht flackert
            const count = (x * y) % density + 1; 
            ctx.strokeStyle = "#33691e";
            ctx.lineWidth = 1;
            
            for(let i=0; i<count; i++) {
                // Pseudo-Zufallspositionen auf dem Tile
                const offX = ((x * i * 17) % size);
                const offY = ((y * i * 23) % size);
                
                const gx = x + offX;
                const gy = y + offY;

                ctx.beginPath();
                ctx.moveTo(gx, gy);
                ctx.lineTo(gx - 2, gy - 4);
                ctx.moveTo(gx, gy);
                ctx.lineTo(gx + 2, gy - 5);
                ctx.stroke();
            }
        },

        player: function(ctx, x, y, size, color) {
             // Schatten
             ctx.fillStyle = "rgba(0,0,0,0.5)";
             ctx.beginPath(); ctx.ellipse(x, y + size/3, size/2, size/4, 0, 0, Math.PI*2); ctx.fill();

             // Vault Suit
             ctx.fillStyle = "#0277bd"; 
             ctx.fillRect(x - size/3, y - size/3, size/1.5, size/1.5);
             ctx.fillStyle = "#ffeb3b"; // Gelber Streifen
             ctx.fillRect(x - size/10, y - size/3, size/5, size/1.5);

             // Kopf
             ctx.fillStyle = "#ffccbc"; 
             ctx.beginPath(); ctx.arc(x, y - size/4, size/3, 0, Math.PI*2); ctx.fill();
             
             // Markierungs-Ring
             ctx.strokeStyle = color;
             ctx.lineWidth = 1.5;
             ctx.beginPath(); ctx.arc(x, y, size/1.5, 0, Math.PI*2); ctx.stroke();
        }
    },

    renderWeather: function(ctx, width, height) {
        // [NEU] Radioaktiver Regen / Staub
        const time = Date.now();
        
        // 1. Grüner Nebel (langsam pulsierend)
        const opacity = 0.05 + Math.sin(time / 2000) * 0.02;
        ctx.fillStyle = `rgba(50, 255, 50, ${opacity})`;
        ctx.fillRect(0, 0, width, height);

        // 2. Staubpartikel / Regen
        ctx.fillStyle = "rgba(200, 255, 200, 0.3)";
        const particleCount = 50;
        for(let i=0; i<particleCount; i++) {
            // Wir berechnen Positionen basierend auf Zeit, damit sie fliegen
            // (x + time) modulo width = Bewegung nach rechts
            const px = (i * 123 + time * 0.1) % width;
            const py = (i * 234 + time * 0.2) % height;
            
            ctx.fillRect(px, py, 1, 2);
        }
    },

    renderStaticMap: function() { 
        if(!this.cacheCtx) this.initCache();
        const ctx = this.cacheCtx; 
        
        // Grundboden: Dunkles Ödland-Braun statt Schwarz
        ctx.fillStyle = "#1b1b1b"; 
        ctx.fillRect(0, 0, this.cacheCanvas.width, this.cacheCanvas.height); 
        
        if(!this.state.currentMap) return;

        for(let y=0; y<this.MAP_H; y++) {
            for(let x=0; x<this.MAP_W; x++) {
                if(this.state.currentMap[y]) {
                    this.drawTile(ctx, x, y, this.state.currentMap[y][x]); 
                }
            }
        }
    },

    draw: function() { 
        if(!this.ctx || !this.cacheCanvas) return; 
        if(!this.state.currentMap) return;

        const ctx = this.ctx; const cvs = ctx.canvas; 
        
        let targetCamX = (this.state.player.x * this.TILE) - (cvs.width / 2); 
        let targetCamY = (this.state.player.y * this.TILE) - (cvs.height / 2); 
        const maxCamX = (this.MAP_W * this.TILE) - cvs.width; 
        const maxCamY = (this.MAP_H * this.TILE) - cvs.height; 
        
        this.camera.x = Math.max(0, Math.min(targetCamX, maxCamX)); 
        this.camera.y = Math.max(0, Math.min(targetCamY, maxCamY)); 
        
        // 1. Hintergrund löschen
        ctx.fillStyle = "#000"; 
        ctx.fillRect(0, 0, cvs.width, cvs.height); 
        
        // 2. Statische Map (Bäume, Wände, Berge)
        ctx.drawImage(this.cacheCanvas, this.camera.x, this.camera.y, cvs.width, cvs.height, 0, 0, cvs.width, cvs.height); 
        
        ctx.save(); 
        ctx.translate(-this.camera.x, -this.camera.y); 
        
        const startX = Math.floor(this.camera.x / this.TILE); 
        const startY = Math.floor(this.camera.y / this.TILE); 
        const endX = startX + Math.ceil(cvs.width / this.TILE) + 1; 
        const endY = startY + Math.ceil(cvs.height / this.TILE) + 1; 
        
        const secKey = `${this.state.sector.x},${this.state.sector.y}`;
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7; 

        // 3. Dynamische Layer (Wasser, Items, Nebel des Krieges)
        for(let y=startY; y<endY; y++) { 
            for(let x=startX; x<endX; x++) { 
                if(y>=0 && y<this.MAP_H && x>=0 && x<this.MAP_W) { 
                    
                    const tileKey = `${secKey}_${x},${y}`;
                    const isCity = (this.state.zone && this.state.zone.includes("Stadt")); 
                    
                    if(!isCity && !this.state.explored[tileKey]) {
                        ctx.fillStyle = "#000"; // Fog of War
                        ctx.fillRect(x * this.TILE, y * this.TILE, this.TILE, this.TILE);
                        continue; 
                    }

                    if(!this.state.currentMap[y]) continue; 
                    const t = this.state.currentMap[y][x];

                    // Wasser-Animation (Wellen)
                    if(t === '~') {
                        ctx.strokeStyle = "rgba(255,255,255,0.3)";
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        const waveX = (Date.now()/200 + y*10) % this.TILE;
                        ctx.moveTo(x*this.TILE + waveX, y*this.TILE + this.TILE/2);
                        ctx.lineTo(x*this.TILE + waveX + 5, y*this.TILE + this.TILE/2);
                        ctx.stroke();
                    }
                    
                    // Hidden Items Glitzern
                    if(this.state.hiddenItems && this.state.hiddenItems[`${x},${y}`]) {
                        const shimmer = (Math.sin(Date.now() / 150) + 1) / 2;
                        ctx.fillStyle = `rgba(255, 255, 100, ${shimmer})`;
                        ctx.beginPath();
                        ctx.arc(x * this.TILE + this.TILE/2, y * this.TILE + this.TILE/2, 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                } 
            } 
        } 
        
        // 4. Andere Spieler
        if(typeof Network !== 'undefined' && Network.otherPlayers) { 
            for(let pid in Network.otherPlayers) { 
                const p = Network.otherPlayers[pid]; 
                if(p.sector && (p.sector.x !== this.state.sector.x || p.sector.y !== this.state.sector.y)) continue; 
                const ox = p.x * this.TILE + this.TILE/2; 
                const oy = p.y * this.TILE + this.TILE/2; 
                this.drawHelpers.player(ctx, ox, oy, this.TILE, "#00bcd4"); // Cyan für andere
                ctx.font = "10px monospace"; ctx.fillStyle = "white"; 
                ctx.fillText(p.name ? p.name.substring(0,3) : "P", ox+8, oy - 12); 
            } 
        } 
        
        // 5. Eigener Spieler
        const px = this.state.player.x * this.TILE + this.TILE/2; 
        const py = this.state.player.y * this.TILE + this.TILE/2; 
        this.drawHelpers.player(ctx, px, py, this.TILE, "#76ff03"); // Hellgrün für dich
        
        ctx.restore(); 
        
        // 6. Wetter-Overlay (Ganz oben drüber)
        // Nur wenn wir nicht in einem Gebäude sind (Zone checken)
        if(!this.state.zone || !this.state.zone.includes("Bunker")) {
            this.renderWeather(ctx, cvs.width, cvs.height);
        }
    },

    drawTile: function(ctx, x, y, type, pulse = 1) { 
        const ts = this.TILE; const px = x * ts; const py = y * ts; 
        
        // Zuerst Boden-Details malen (Gras, Steine)
        // Nur auf begehbaren Flächen (nicht Wasser oder Wand)
        if(!['~', '#', 'M', 'W'].includes(type)) {
             // Gras dichte basierend auf Koordinaten
             if((x*y)%3 === 0) this.drawHelpers.grass(ctx, px, py, ts, 5);
             else if((x+y)%7 === 0) {
                 // Kleiner Kieselstein
                 ctx.fillStyle = "#555";
                 ctx.beginPath(); ctx.arc(px + ts/2, py + ts/2 + 5, 2, 0, Math.PI*2); ctx.fill();
             }
        }

        switch(type) {
            case '#': // WAND
                this.drawHelpers.wall(ctx, px, py, ts); break;
            case 't': // BAUM
            case 'T':
                this.drawHelpers.tree(ctx, px, py, ts); break;
            case 'M': // [NEU] BERG / FELS
            case '^': 
                this.drawHelpers.mountain(ctx, px, py, ts); break;
            case '~': // WASSER
                ctx.fillStyle = "#01579b"; ctx.fillRect(px, py, ts, ts); break;
            case 'C': // STADT
                ctx.fillStyle = "#263238";
                ctx.fillRect(px + 4, py + 8, ts-8, ts-8); // Haus
                ctx.fillStyle = `rgba(255, 193, 7, ${pulse})`; // Fenster Licht
                ctx.fillRect(px + 8, py + 15, 6, 6);
                break;
            case 'V': // VAULT TÜR
                ctx.fillStyle = "#333"; ctx.beginPath(); ctx.arc(px+ts/2, py+ts/2, ts/2, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = "#ffeb3b"; ctx.beginPath(); ctx.arc(px+ts/2, py+ts/2, ts/3, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = "#000"; ctx.font="bold 12px monospace"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText("101", px+ts/2, py+ts/2);
                break;
            case 'R': // RAIDER LAGER
                ctx.fillStyle = "#b71c1c"; 
                ctx.beginPath(); ctx.moveTo(px+ts/2, py+5); ctx.lineTo(px+ts-5, py+ts-5); ctx.lineTo(px+5, py+ts-5); ctx.fill();
                ctx.fillStyle = "#fff"; ctx.font="10px monospace"; ctx.fillText("☠️", px+ts/2, py+ts/2+5);
                break;
                
            default:
                // Fallback für Items und unbekanntes
                if (['$','&','P'].includes(type)) {
                    ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.arc(px+ts/2, py+ts/2, ts/3, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = "#fff"; ctx.font="16px monospace"; ctx.textAlign="center"; ctx.textBaseline="middle"; 
                    ctx.fillText(type, px+ts/2, py+ts/2);
                }
                break;
        }
    }
});

// [2026-02-18 14:35:00] ui_view_world.js - Black Screen Fix COMPLETE

Object.assign(UI, {
    mapState: {
        offsetX: 0, offsetY: 0,
        scale: 3, minScale: 0.5, maxScale: 12,
        isDragging: false, isPinching: false,
        lastX: 0, lastY: 0,
        pinchStartDist: 0, pinchStartScale: 3,
        needsRender: true,
        centeredOnce: false // Flag für initiale Zentrierung
    },

    getTouchDistance: function(t1, t2) {
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        return Math.sqrt(dx*dx + dy*dy);
    },

    initWorldMapInteraction: function() {
        const cvs = document.getElementById('world-map-canvas');
        if(!cvs) return;

        // Force Center beim ersten Klick/Touch/Init
        if(Game.state && Game.state.player && !this.mapState.centeredOnce) {
            const rect = cvs.getBoundingClientRect();
            // Nur zentrieren wenn das Rect valide ist
            if(rect.width > 0 && rect.height > 0) {
                this.centerMapOnPlayer(cvs, rect);
                this.mapState.centeredOnce = true;
            }
        }

        cvs.onmousedown = (e) => {
            if(e.button !== 0) return;
            this.mapState.isDragging = true;
            this.mapState.lastX = e.clientX;
            this.mapState.lastY = e.clientY;
            cvs.style.cursor = "grabbing";
        };
        
        cvs.onmousemove = (e) => {
            if(this.mapState.isDragging) {
                const dx = e.clientX - this.mapState.lastX;
                const dy = e.clientY - this.mapState.lastY;
                this.mapState.offsetX += dx;
                this.mapState.offsetY += dy;
                this.mapState.lastX = e.clientX;
                this.mapState.lastY = e.clientY;
                this.mapState.needsRender = true;
            }
        };

        const stopDrag = () => { this.mapState.isDragging = false; cvs.style.cursor = "move"; };
        cvs.onmouseup = stopDrag;
        cvs.onmouseleave = stopDrag;

        cvs.onwheel = (e) => {
            e.preventDefault();
            const zoomFactor = 1.1;
            const dir = e.deltaY < 0 ? 1 : -1;
            let newScale = this.mapState.scale * (dir > 0 ? zoomFactor : (1 / zoomFactor));
            newScale = Math.max(this.mapState.minScale, Math.min(this.mapState.maxScale, newScale));

            const rect = cvs.getBoundingClientRect();
            const mx = e.clientX - rect.left; 
            const my = e.clientY - rect.top;
            
            this.mapState.offsetX = mx - ((mx - this.mapState.offsetX) / this.mapState.scale) * newScale;
            this.mapState.offsetY = my - ((my - this.mapState.offsetY) / this.mapState.scale) * newScale;
            
            this.mapState.scale = newScale;
            this.mapState.needsRender = true;
        };

        cvs.ontouchstart = (e) => {
            if(e.touches.length === 1) {
                this.mapState.isDragging = true;
                this.mapState.isPinching = false;
                this.mapState.lastX = e.touches[0].clientX;
                this.mapState.lastY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                this.mapState.isDragging = false;
                this.mapState.isPinching = true;
                this.mapState.pinchStartDist = this.getTouchDistance(e.touches[0], e.touches[1]);
                this.mapState.pinchStartScale = this.mapState.scale;
            }
        };

        cvs.ontouchmove = (e) => {
            e.preventDefault();
            if(this.mapState.isDragging && e.touches.length === 1) {
                const dx = e.touches[0].clientX - this.mapState.lastX;
                const dy = e.touches[0].clientY - this.mapState.lastY;
                this.mapState.offsetX += dx;
                this.mapState.offsetY += dy;
                this.mapState.lastX = e.touches[0].clientX;
                this.mapState.lastY = e.touches[0].clientY;
                this.mapState.needsRender = true;
            } else if(this.mapState.isPinching && e.touches.length === 2) {
                const newDist = this.getTouchDistance(e.touches[0], e.touches[1]);
                const scaleRatio = newDist / this.mapState.pinchStartDist;
                let newScale = this.mapState.pinchStartScale * scaleRatio;
                newScale = Math.max(this.mapState.minScale, Math.min(this.mapState.maxScale, newScale));

                const rect = cvs.getBoundingClientRect();
                const mx = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left;
                const my = ((e.touches[0].clientY + e.touches[1].clientY) / 2) - rect.top;

                this.mapState.offsetX = mx - ((mx - this.mapState.offsetX) / this.mapState.scale) * newScale;
                this.mapState.offsetY = my - ((my - this.mapState.offsetY) / this.mapState.scale) * newScale;

                this.mapState.scale = newScale;
                this.mapState.needsRender = true;
            }
        };
        
        cvs.ontouchend = (e) => { 
            this.mapState.isDragging = false;
            if(e.touches.length < 2) this.mapState.isPinching = false;
        };
    },

    centerMapOnPlayer: function(cvs, rect) {
        if(!Game.state) return;
        this.mapState.scale = 3; 
        const globalX = Game.state.sector.x * Game.MAP_W + Game.state.player.x;
        const globalY = Game.state.sector.y * Game.MAP_H + Game.state.player.y;
        this.mapState.offsetX = (rect.width / 2) - (globalX * this.mapState.scale);
        this.mapState.offsetY = (rect.height / 2) - (globalY * this.mapState.scale);
        this.mapState.needsRender = true;
    },

    renderWorldMap: function() {
        if (!Game || !Game.state) return;

        const cvs = document.getElementById('world-map-canvas');
        if(!cvs) return;
        const ctx = cvs.getContext('2d');

        // --- HIGH DPI FIX & RESIZE ---
        const dpr = window.devicePixelRatio || 1;
        const rect = cvs.parentElement.getBoundingClientRect();
        
        // FIX: Prüfen ob der Container schon eine Größe hat
        // Wenn width 0 ist, ist der View noch nicht gerendert -> Warten
        if(rect.width === 0 || rect.height === 0) {
            requestAnimationFrame(() => this.renderWorldMap());
            return;
        }

        const targetWidth = Math.floor(rect.width * dpr);
        const targetHeight = Math.floor(rect.height * dpr);

        if (cvs.width !== targetWidth || cvs.height !== targetHeight) {
            cvs.width = targetWidth;
            cvs.height = targetHeight;
            ctx.scale(dpr, dpr);
            ctx.imageSmoothingEnabled = false;
            
            // Re-Center on resize (e.g. rotate)
            this.centerMapOnPlayer(cvs, rect); 
            this.mapState.needsRender = true;
        }

        if(!cvs.dataset.init) { 
            this.initWorldMapInteraction(); 
            cvs.dataset.init = "true"; 
            // Trigger initial center manually if not happened
            if(!this.mapState.centeredOnce) {
                this.centerMapOnPlayer(cvs, rect);
                this.mapState.centeredOnce = true;
            }
        }

        // Background
        ctx.fillStyle = "#050a05"; 
        ctx.fillRect(0, 0, rect.width, rect.height);

        // Grid Background
        this.drawBackgroundGrid(ctx, rect.width, rect.height);

        const s = this.mapState.scale;
        const ox = this.mapState.offsetX;
        const oy = this.mapState.offsetY;

        // Colors
        const colors = {
            '.': '#4a4036', '_': '#8b5a2b', '"': '#1a3300', ';': '#1e1e11',
            '~': '#2244aa', '^': '#555', '#': '#333', '=': '#555', '+': '#654321',
            't': '#0f2405', 'V': '#ffcc00', 'C': '#ff4400', 'G': '#cccccc'
        };
        
        // 1. Visited Sectors
        if (Game.state.visitedSectors) {
            Game.state.visitedSectors.forEach(secKey => {
                const [sx, sy] = secKey.split(',').map(Number);
                if(sx !== Game.state.sector.x || sy !== Game.state.sector.y) {
                    let color = '#222';
                    if(typeof WorldGen !== 'undefined' && WorldGen.getSectorBiome) {
                        const b = WorldGen.getSectorBiome(sx, sy);
                        if(b==='forest') color='#0d1a00'; if(b==='desert') color='#2b1d0a'; if(b==='swamp') color='#0f0f05'; if(b==='mountain') color='#1a1a1a';
                    }
                    const drawX = (sx * 50 * s) + ox;
                    const drawY = (sy * 50 * s) + oy;
                    
                    if(drawX + 50*s > 0 && drawX < rect.width && drawY + 50*s > 0 && drawY < rect.height) {
                        ctx.fillStyle = color;
                        ctx.globalAlpha = 0.8;
                        ctx.fillRect(drawX, drawY, 50*s, 50*s);
                        ctx.globalAlpha = 1.0;
                        ctx.strokeStyle = '#333';
                        ctx.lineWidth = Math.max(1, s * 0.05);
                        ctx.strokeRect(drawX, drawY, 50*s, 50*s);
                    }
                }
            });
        }

        // 2. Current Sector
        const currSX = Game.state.sector.x;
        const currSY = Game.state.sector.y;

        if (Game.state.currentMap) {
            const startDrawX = (currSX * 50 * s) + ox;
            const startDrawY = (currSY * 50 * s) + oy;

            if (startDrawX + 50*s > 0 && startDrawX < rect.width && startDrawY + 50*s > 0 && startDrawY < rect.height) {
                ctx.strokeStyle = '#666';
                ctx.lineWidth = Math.max(1, s * 0.1);
                ctx.strokeRect(startDrawX, startDrawY, 50*s, 50*s);

                for(let y=0; y<50; y++) for(let x=0; x<50; x++) {
                    const key = `${currSX},${currSY}_${x},${y}`;
                    if(Game.state.explored[key]) {
                        const t = Game.state.currentMap[y][x];
                        ctx.fillStyle = colors[t] || '#4a4036';
                        ctx.fillRect(startDrawX + x*s, startDrawY + y*s, s+0.5, s+0.5);
                    }
                }
            }
        }

        // 3. Player
        const pGlobalX = (currSX * 50) + Game.state.player.x;
        const pGlobalY = (currSY * 50) + Game.state.player.y;
        const pDrawX = (pGlobalX * s) + ox + (s/2);
        const pDrawY = (pGlobalY * s) + oy + (s/2);
        
        const pulse = 10 + Math.sin(Date.now() / 200) * 3;
        ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
        ctx.beginPath(); ctx.arc(pDrawX, pDrawY, Math.max(5, pulse * (s/3)), 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#39ff14"; ctx.beginPath(); ctx.arc(pDrawX, pDrawY, Math.max(2, 4 * (s/3)), 0, Math.PI*2); ctx.fill();

        // 4. POIs
        if(Game.state.worldPOIs) {
            Game.state.worldPOIs.forEach(poi => {
                const px = (poi.x * 50 + 25) * s + ox; 
                const py = (poi.y * 50 + 25) * s + oy;
                
                if(px > -50 && px < rect.width+50 && py > -50 && py < rect.height+50) {
                    ctx.font = `bold ${Math.max(12, 16 * (s/3))}px monospace`; 
                    ctx.textAlign = "center"; ctx.textBaseline = "middle";
                    let icon = "❓";
                    if(poi.type === 'V') icon = "⚙️";
                    if(poi.type === 'C') icon = "🏙️";
                    if(poi.type === 'G') icon = "👻";
                    
                    ctx.shadowColor = 'black'; ctx.shadowBlur = 4; ctx.fillStyle="#fff"; 
                    ctx.fillText(icon, px, py); ctx.shadowBlur = 0;
                }
            });
        }

        // 5. Compass & Text
        this.drawCompass(ctx, rect.width, rect.height);
        this.updateLocationText();

        this.mapState.needsRender = false;
        if(Game.state.view === 'worldmap') requestAnimationFrame(() => this.renderWorldMap());
    },

    drawBackgroundGrid: function(ctx, w, h) {
        ctx.strokeStyle = "rgba(0, 50, 0, 0.15)";
        ctx.lineWidth = 1;
        const step = 50;
        for(let x=0; x<w; x+=step) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
        for(let y=0; y<h; y+=step) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
    },

    drawCompass: function(ctx, w, h) {
        const cx = w - 60; const cy = h - 60; const r = 30;
        ctx.fillStyle = "rgba(0, 20, 0, 0.8)"; ctx.strokeStyle = "#00ff00"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#00ff00"; ctx.font = "bold 12px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("N", cx, cy - r + 10); ctx.fillText("S", cx, cy + r - 10);
        ctx.fillText("W", cx - r + 10, cy); ctx.fillText("O", cx + r - 10, cy);
        ctx.strokeStyle = "rgba(0, 255, 0, 0.3)"; ctx.beginPath(); ctx.moveTo(cx, cy - r + 15); ctx.lineTo(cx, cy + r - 15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - r + 15, cy); ctx.lineTo(cx + r - 15, cy); ctx.stroke();
        ctx.fillStyle = "#39ff14"; ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI*2); ctx.fill();
    },

    updateLocationText: function() {
        const el = document.getElementById('world-location-text');
        if(!el) return;
        if(!this._lastLocUpdate || Date.now() - this._lastLocUpdate > 500) {
            let txt = `SEKTOR [${Game.state.sector.x}, ${Game.state.sector.y}]`;
            if(Game.state.zone) {
                let zoneName = Game.state.zone.split('(')[0].trim();
                txt += ` // ${zoneName.toUpperCase()}`;
            } else { txt += " // UNBEKANNTES GEBIET"; }
            el.innerText = txt;
            this._lastLocUpdate = Date.now();
        }
    }
});

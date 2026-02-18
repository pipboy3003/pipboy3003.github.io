// [2026-02-18 15:00:00] ui_view_world.js - Persistent Fog of War & Buffer

Object.assign(UI, {
    mapState: {
        offsetX: 0, offsetY: 0,
        scale: 3, minScale: 0.5, maxScale: 12,
        isDragging: false, isPinching: false,
        lastX: 0, lastY: 0,
        pinchStartDist: 0, pinchStartScale: 3,
        needsRender: true,
        centeredOnce: false,
        // Buffer speichert die bereits aufgedeckte Karte als Bild
        worldBuffer: null, 
        renderedSectors: [] // Liste der Sektoren, die schon im Buffer sind
    },

    getTouchDistance: function(t1, t2) {
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        return Math.sqrt(dx*dx + dy*dy);
    },

    initWorldMapInteraction: function() {
        const cvs = document.getElementById('world-map-canvas');
        if(!cvs) return;

        // Force Center beim Start
        if(Game.state && Game.state.player && !this.mapState.centeredOnce) {
            const rect = cvs.getBoundingClientRect();
            if(rect.width > 0) {
                this.centerMapOnPlayer(cvs, rect);
                this.mapState.centeredOnce = true;
            }
        }

        // Buffer initialisieren (falls Spiel neu geladen wurde)
        this.updateWorldBuffer();

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
        cvs.ontouchend = (e) => { this.mapState.isDragging = false; if(e.touches.length < 2) this.mapState.isPinching = false; };
    },

    // --- NEU: Erstellt und aktualisiert den statischen Hintergrund ---
    updateWorldBuffer: function() {
        if(!Game.state || !Game.state.visitedSectors) return;

        // 1. Buffer erstellen falls nicht vorhanden (10x10 Sektoren a 50px = 500x500px)
        const totalW = Game.WORLD_W * Game.MAP_W; 
        const totalH = Game.WORLD_H * Game.MAP_H;

        if(!this.mapState.worldBuffer) {
            this.mapState.worldBuffer = document.createElement('canvas');
            this.mapState.worldBuffer.width = totalW;
            this.mapState.worldBuffer.height = totalH;
            // Initial schwarz füllen
            const ctx = this.mapState.worldBuffer.getContext('2d');
            ctx.fillStyle = "#000000"; 
            ctx.fillRect(0, 0, totalW, totalH);
            this.mapState.renderedSectors = [];
        }

        const ctx = this.mapState.worldBuffer.getContext('2d');
        const colors = {
            '.': '#4a4036', '_': '#8b5a2b', '"': '#1a3300', ';': '#1e1e11',
            '~': '#2244aa', '^': '#555', '#': '#333', '=': '#555', '+': '#654321',
            't': '#0f2405', 'V': '#ffcc00', 'C': '#ff4400', 'G': '#cccccc', 'X': '#8B4513'
        };

        // 2. Neue Sektoren zeichnen
        Game.state.visitedSectors.forEach(secKey => {
            // Wenn Sektor schon im Buffer ist, überspringen (Performance!)
            // Ausnahme: Der aktuelle Sektor wird immer neu gemalt, da er sich ändert? 
            // Nein, für die Worldmap reicht der statische Snapshot.
            if(this.mapState.renderedSectors.includes(secKey)) return;

            const [sx, sy] = secKey.split(',').map(Number);
            let mapData = null;

            // Ist es der aktuelle Sektor? Dann nimm die Live-Daten
            if (sx === Game.state.sector.x && sy === Game.state.sector.y) {
                mapData = Game.state.currentMap;
            } else {
                // Ist es ein alter Sektor? Regeneriere ihn deterministisch!
                if(typeof WorldGen !== 'undefined') {
                    // Seed setzen, damit es exakt gleich aussieht wie beim ersten Besuch
                    if(Game.state.worldSeed) WorldGen.setSeed(Game.state.worldSeed);
                    mapData = WorldGen.createSector(Game.MAP_W, Game.MAP_H, sx, sy);
                }
            }

            if(mapData) {
                // Pixel für Pixel auf den Buffer malen
                const startX = sx * Game.MAP_W;
                const startY = sy * Game.MAP_H;
                
                for(let y=0; y<Game.MAP_H; y++) {
                    for(let x=0; x<Game.MAP_W; x++) {
                        const t = mapData[y][x];
                        ctx.fillStyle = colors[t] || '#4a4036';
                        ctx.fillRect(startX + x, startY + y, 1, 1);
                    }
                }
                
                // Markieren als "erledigt"
                this.mapState.renderedSectors.push(secKey);
            }
        });
        
        this.mapState.needsRender = true;
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

        // --- RESIZE & DPI ---
        const dpr = window.devicePixelRatio || 1;
        const rect = cvs.parentElement.getBoundingClientRect();
        
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
            
            this.centerMapOnPlayer(cvs, rect); 
            this.mapState.needsRender = true;
        }

        if(!cvs.dataset.init) { 
            this.initWorldMapInteraction(); 
            cvs.dataset.init = "true"; 
            if(!this.mapState.centeredOnce) {
                this.centerMapOnPlayer(cvs, rect);
                this.mapState.centeredOnce = true;
            }
        }

        // --- UPDATE BUFFER ---
        // Prüfen ob wir neue Sektoren kennen, die noch nicht im Bild sind
        // Trick: Wir entfernen den aktuellen Sektor aus "rendered", damit er updates bekommt, 
        // oder wir lassen ihn statisch. Für "Fog of War" reicht statisch.
        // Wir rufen updateWorldBuffer bei jedem Frame auf? Nein, zu teuer.
        // Wir rufen es nur auf, wenn die Anzahl der visitedSectors sich geändert hat.
        if (Game.state.visitedSectors.length > this.mapState.renderedSectors.length) {
            this.updateWorldBuffer();
        }

        // --- DRAW ---
        
        // 1. Background (Schwarz)
        ctx.fillStyle = "#050a05"; 
        ctx.fillRect(0, 0, rect.width, rect.height);

        const s = this.mapState.scale;
        const ox = this.mapState.offsetX;
        const oy = this.mapState.offsetY;

        // 2. Draw World Buffer (Das ist die Karte!)
        if (this.mapState.worldBuffer) {
            // Zeichne das vorbereitete Bild skaliert
            // drawImage(image, dx, dy, dWidth, dHeight)
            // Wir zeichnen ALLES. Browser culling übernimmt den Rest.
            ctx.drawImage(
                this.mapState.worldBuffer, 
                ox, oy, 
                this.mapState.worldBuffer.width * s, 
                this.mapState.worldBuffer.height * s
            );
        }

        // 3. Grid Overlay (Optional, für Style)
        ctx.strokeStyle = "rgba(0, 255, 0, 0.1)";
        ctx.lineWidth = 1;
        // Zeichne Sektor-Grenzen (alle 50 Tiles)
        const gridSize = 50 * s;
        // Optimierung: Nur sichtbare Linien zeichnen
        const startGridX = Math.floor(-ox / gridSize);
        const endGridX = Math.ceil((rect.width - ox) / gridSize);
        const startGridY = Math.floor(-oy / gridSize);
        const endGridY = Math.ceil((rect.height - oy) / gridSize);

        ctx.beginPath();
        for(let x=startGridX; x<=endGridX; x++) {
            const pos = ox + x * gridSize;
            ctx.moveTo(pos, 0); ctx.lineTo(pos, rect.height);
        }
        for(let y=startGridY; y<=endGridY; y++) {
            const pos = oy + y * gridSize;
            ctx.moveTo(0, pos); ctx.lineTo(rect.width, pos);
        }
        ctx.stroke();

        // 4. Player Marker
        const currSX = Game.state.sector.x; const currSY = Game.state.sector.y;
        const pGlobalX = (currSX * Game.MAP_W) + Game.state.player.x;
        const pGlobalY = (currSY * Game.MAP_H) + Game.state.player.y;
        
        const pDrawX = (pGlobalX * s) + ox + (s/2);
        const pDrawY = (pGlobalY * s) + oy + (s/2);
        
        const pulse = 10 + Math.sin(Date.now() / 200) * 3;
        ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
        ctx.beginPath(); ctx.arc(pDrawX, pDrawY, Math.max(5, pulse * (s/3)), 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#39ff14"; ctx.beginPath(); ctx.arc(pDrawX, pDrawY, Math.max(2, 4 * (s/3)), 0, Math.PI*2); ctx.fill();

        // 5. POIs
        if(Game.state.worldPOIs) {
            Game.state.worldPOIs.forEach(poi => {
                const px = (poi.x * Game.MAP_W + 25) * s + ox; 
                const py = (poi.y * Game.MAP_H + 25) * s + oy;
                
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

        // 6. Compass & Text
        this.drawCompass(ctx, rect.width, rect.height);
        this.updateLocationText();

        if(Game.state.view === 'worldmap') requestAnimationFrame(() => this.renderWorldMap());
    },

    drawBackgroundGrid: function(ctx, w, h) {
        // Leere Funktion, da Grid jetzt dynamisch in renderWorldMap passiert
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

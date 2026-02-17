// [2026-02-17 18:30:00] ui_view_world.js - Zoomable & Scrollable Map

Object.assign(UI, {
    mapState: {
        offsetX: 0, offsetY: 0,
        scale: 3, minScale: 0.5, maxScale: 12, // Zoom Limits
        isDragging: false, isPinching: false,
        lastX: 0, lastY: 0,
        pinchStartDist: 0, pinchStartScale: 3
    },

    // Hilfsfunktion für Touch-Abstand
    getTouchDistance: function(t1, t2) {
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        return Math.sqrt(dx*dx + dy*dy);
    },

    initWorldMapInteraction: function() {
        const cvs = document.getElementById('world-map-canvas');
        if(!cvs) return;

        // Reset Camera to Player on open
        if(Game.state && Game.state.player) {
            this.mapState.scale = 3; // Default Zoom
            const globalX = Game.state.sector.x * Game.MAP_W + Game.state.player.x;
            const globalY = Game.state.sector.y * Game.MAP_H + Game.state.player.y;
            this.mapState.offsetX = (cvs.width / 2) - (globalX * this.mapState.scale);
            this.mapState.offsetY = (cvs.height / 2) - (globalY * this.mapState.scale);
        }

        // --- MOUSE EVENTS (Pan & Zoom) ---
        cvs.onmousedown = (e) => {
            if(e.button !== 0) return; // Nur Linksklick
            this.mapState.isDragging = true;
            this.mapState.lastX = e.clientX;
            this.mapState.lastY = e.clientY;
        };
        
        cvs.onmousemove = (e) => {
            if(this.mapState.isDragging) {
                const dx = e.clientX - this.mapState.lastX;
                const dy = e.clientY - this.mapState.lastY;
                this.mapState.offsetX += dx;
                this.mapState.offsetY += dy;
                this.mapState.lastX = e.clientX;
                this.mapState.lastY = e.clientY;
            }
        };

        cvs.onmouseup = () => { this.mapState.isDragging = false; };
        cvs.onmouseleave = () => { this.mapState.isDragging = false; };

        // Mausrad Zoom (Zentriert auf Mauszeiger)
        cvs.onwheel = (e) => {
            e.preventDefault();
            const zoomFactor = 1.1;
            const dir = e.deltaY < 0 ? 1 : -1;
            let newScale = this.mapState.scale * (dir > 0 ? zoomFactor : (1 / zoomFactor));
            newScale = Math.max(this.mapState.minScale, Math.min(this.mapState.maxScale, newScale));

            // Mathe-Magie für Zoom zum Mauszeiger hin
            const rect = cvs.getBoundingClientRect();
            const mx = e.clientX - rect.left; 
            const my = e.clientY - rect.top;
            
            // Offset anpassen basierend auf der Skalierungsänderung relativ zum Mauspunkt
            this.mapState.offsetX = mx - ((mx - this.mapState.offsetX) / this.mapState.scale) * newScale;
            this.mapState.offsetY = my - ((my - this.mapState.offsetY) / this.mapState.scale) * newScale;
            
            this.mapState.scale = newScale;
        };

        // --- TOUCH EVENTS (Pan & Pinch Zoom) ---
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
            } else if(this.mapState.isPinching && e.touches.length === 2) {
                const newDist = this.getTouchDistance(e.touches[0], e.touches[1]);
                const scaleRatio = newDist / this.mapState.pinchStartDist;
                let newScale = this.mapState.pinchStartScale * scaleRatio;
                newScale = Math.max(this.mapState.minScale, Math.min(this.mapState.maxScale, newScale));

                // Mittelpunkt zwischen den Fingern finden
                const rect = cvs.getBoundingClientRect();
                const mx = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left;
                const my = ((e.touches[0].clientY + e.touches[1].clientY) / 2) - rect.top;

                // Offset anpassen (ähnlich wie Mausrad)
                this.mapState.offsetX = mx - ((mx - this.mapState.offsetX) / this.mapState.scale) * newScale;
                this.mapState.offsetY = my - ((my - this.mapState.offsetY) / this.mapState.scale) * newScale;

                this.mapState.scale = newScale;
            }
        };
        
        cvs.ontouchend = (e) => { 
            this.mapState.isDragging = false;
            if(e.touches.length < 2) this.mapState.isPinching = false;
        };
        cvs.ontouchcancel = (e) => {
            this.mapState.isDragging = false;
            this.mapState.isPinching = false;
        };
    },

    renderWorldMap: function() {
        if (!Game || !Game.state) return;

        const cvs = document.getElementById('world-map-canvas');
        if(!cvs) return;
        const ctx = cvs.getContext('2d');

        // Init Interaction if needed
        if(!cvs.dataset.init) {
            this.initWorldMapInteraction();
            cvs.dataset.init = "true";
        }

        // Background (Unexplored)
        ctx.fillStyle = "#050a05"; 
        ctx.fillRect(0, 0, cvs.width, cvs.height);

        const s = this.mapState.scale;
        const ox = this.mapState.offsetX;
        const oy = this.mapState.offsetY;

        // Pixel-Farben
        const colors = {
            '.': '#4a4036', '_': '#8b5a2b', '"': '#1a3300', ';': '#1e1e11',
            '~': '#2244aa', '^': '#555', '#': '#333', '=': '#666', '+': '#654321',
            't': '#0f2405', 'V': '#ffcc00', 'C': '#ff4400'
        };
        
        // 1. Besuchte Sektoren (Grob - Fog of War)
        if (Game.state.visitedSectors) {
            Game.state.visitedSectors.forEach(secKey => {
                const [sx, sy] = secKey.split(',').map(Number);
                // Wenn es NICHT der aktuelle Sektor ist
                if(sx !== Game.state.sector.x || sy !== Game.state.sector.y) {
                    let color = '#222'; // Default 'erkundet aber alt'
                    if(typeof WorldGen !== 'undefined' && WorldGen.getSectorBiome) {
                        const b = WorldGen.getSectorBiome(sx, sy);
                        if(b==='forest') color='#112200';
                        if(b==='desert') color='#443311';
                        if(b==='swamp') color='#111105';
                        if(b==='mountain') color='#222222';
                    }
                    
                    const drawX = (sx * 50 * s) + ox;
                    const drawY = (sy * 50 * s) + oy;
                    
                    // Culling: Nur zeichnen wenn im Bild
                    if(drawX + 50*s > 0 && drawX < cvs.width && drawY + 50*s > 0 && drawY < cvs.height) {
                        ctx.fillStyle = color;
                        // Leicht transparent damit das Grid durchscheint
                        ctx.globalAlpha = 0.8;
                        ctx.fillRect(drawX, drawY, 50*s, 50*s);
                        ctx.globalAlpha = 1.0;

                        // Grid Lines für Sektoren
                        ctx.strokeStyle = '#444';
                        ctx.lineWidth = Math.max(1, s * 0.1); // Dicke basierend auf Zoom
                        ctx.strokeRect(drawX, drawY, 50*s, 50*s);
                    }
                }
            });
        }

        // 2. Aktueller Sektor & Explored Details (Scharf)
        const currSX = Game.state.sector.x;
        const currSY = Game.state.sector.y;

        if (Game.state.currentMap) {
            const startDrawX = (currSX * 50 * s) + ox;
            const startDrawY = (currSY * 50 * s) + oy;

            // Culling
            if (startDrawX + 50*s > 0 && startDrawX < cvs.width && startDrawY + 50*s > 0 && startDrawY < cvs.height) {
                // Sektor Grid
                ctx.strokeStyle = '#666';
                ctx.lineWidth = Math.max(1, s * 0.2);
                ctx.strokeRect(startDrawX, startDrawY, 50*s, 50*s);

                for(let y=0; y<50; y++) {
                    for(let x=0; x<50; x++) {
                        // Prüfen ob Tile explored ist
                        const key = `${currSX},${currSY}_${x},${y}`;
                        if(Game.state.explored[key]) {
                            const t = Game.state.currentMap[y][x];
                            ctx.fillStyle = colors[t] || '#4a4036';
                            // Um Lücken bei hohem Zoom zu vermeiden, nutzen wir ceil oder +0.5 Hack
                            // Besser:fillRect akzeptiert Floats, Browser macht Anti-Aliasing.
                            ctx.fillRect(startDrawX + x*s, startDrawY + y*s, s, s);
                        }
                    }
                }
            }
        }

        // 3. Player
        const pGlobalX = (currSX * 50) + Game.state.player.x;
        const pGlobalY = (currSY * 50) + Game.state.player.y;
        const pDrawX = (pGlobalX * s) + ox + (s/2);
        const pDrawY = (pGlobalY * s) + oy + (s/2);

        const pulseSize = (10 * (s/3)) + Math.sin(Date.now() / 200) * (3 * (s/3)); // Puls skaliert mit Zoom
        ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
        ctx.beginPath();
        ctx.arc(pDrawX, pDrawY, Math.max(5, pulseSize), 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = "#39ff14";
        ctx.beginPath();
        ctx.arc(pDrawX, pDrawY, Math.max(2, 4 * (s/3)), 0, Math.PI*2); // Kern skaliert auch
        ctx.fill();

        // 4. POIs (Global)
        if(Game.state.worldPOIs) {
            Game.state.worldPOIs.forEach(poi => {
                const px = (poi.x * 50 + 25) * s + ox;
                const py = (poi.y * 50 + 25) * s + oy;
                
                if(px > -50 && px < cvs.width+50 && py > -50 && py < cvs.height+50) {
                    const fontSize = Math.max(12, 20 * (s/3));
                    ctx.font = `bold ${fontSize}px monospace`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    let icon = "❓";
                    if(poi.type === 'V') icon = "⚙️";
                    if(poi.type === 'C') icon = "🏙️";
                    
                    ctx.shadowColor = 'black'; ctx.shadowBlur = 5;
                    ctx.fillText(icon, px, py);
                    ctx.shadowBlur = 0;
                }
            });
        }

        // Loop
        if(Game.state.view === 'worldmap') {
            requestAnimationFrame(() => this.renderWorldMap());
        }
    }
});

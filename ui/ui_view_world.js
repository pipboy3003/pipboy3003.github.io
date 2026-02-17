// [2026-02-17 18:05:00] ui_view_world.js - Scrollable 1:1 Map

Object.assign(UI, {
    mapState: {
        offsetX: 0,
        offsetY: 0,
        scale: 3, // Zoom-Faktor (1 Tile = 3 Pixel)
        isDragging: false,
        lastX: 0,
        lastY: 0
    },

    initWorldMapInteraction: function() {
        const cvs = document.getElementById('world-map-canvas');
        if(!cvs) return;

        // Reset Camera to Player
        if(Game.state && Game.state.player) {
            const globalX = Game.state.sector.x * Game.MAP_W + Game.state.player.x;
            const globalY = Game.state.sector.y * Game.MAP_H + Game.state.player.y;
            this.mapState.offsetX = (cvs.width / 2) - (globalX * this.mapState.scale);
            this.mapState.offsetY = (cvs.height / 2) - (globalY * this.mapState.scale);
        }

        // Mouse Events
        cvs.onmousedown = (e) => {
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

        // Touch Events
        cvs.ontouchstart = (e) => {
            this.mapState.isDragging = true;
            this.mapState.lastX = e.touches[0].clientX;
            this.mapState.lastY = e.touches[0].clientY;
        };

        cvs.ontouchmove = (e) => {
            if(this.mapState.isDragging) {
                e.preventDefault(); // Kein Scrollen der Seite
                const dx = e.touches[0].clientX - this.mapState.lastX;
                const dy = e.touches[0].clientY - this.mapState.lastY;
                this.mapState.offsetX += dx;
                this.mapState.offsetY += dy;
                this.mapState.lastX = e.touches[0].clientX;
                this.mapState.lastY = e.touches[0].clientY;
            }
        };
        
        cvs.ontouchend = () => { this.mapState.isDragging = false; };
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

        // RENDER EXPLORED TILES
        // Wir iterieren über das explored Objekt: "sx,sy_px,py"
        // Das ist effizienter als 500x500 Loops
        
        // Pixel-Farben
        const colors = {
            '.': '#4a4036', '_': '#8b5a2b', '"': '#1a3300', ';': '#1e1e11',
            '~': '#2244aa', '^': '#555', '#': '#333', '=': '#222', '+': '#654321',
            't': '#0f2405', 'V': '#ffcc00', 'C': '#ff4400'
        };

        // Cache für die aktuelle Map (damit wir wissen was an der aktuellen Pos ist)
        // Für besuchte Sektoren haben wir keine gespeicherten Tile-Daten im RAM (nur currentMap),
        // daher können wir für "explored" nur grob schätzen oder wir müssten alles speichern.
        // TRICK: Wir speichern im explored-Key auch den Typ? Nein, zu groß.
        // Workaround: Wir nutzen WorldGen für besuchte Sektoren um die Farbe zu raten,
        // oder wir malen besuchte Sektoren einfach als "Block" in Biom-Farbe, wenn wir die Tiles nicht haben.
        
        // HIER: Wir rendern nur den aktuellen Sektor "scharf", den Rest grob (Fog of War Style)
        
        // 1. Besuchte Sektoren (Grob)
        if (Game.state.visitedSectors) {
            Game.state.visitedSectors.forEach(secKey => {
                const [sx, sy] = secKey.split(',').map(Number);
                let color = '#222';
                if(typeof WorldGen !== 'undefined' && WorldGen.getSectorBiome) {
                    const b = WorldGen.getSectorBiome(sx, sy);
                    if(b==='forest') color='#112200';
                    if(b==='desert') color='#443311';
                    if(b==='swamp') color='#111105';
                    if(b==='mountain') color='#222222';
                }
                
                const drawX = (sx * 50 * s) + ox;
                const drawY = (sy * 50 * s) + oy;
                
                // Nur zeichnen wenn im Bild
                if(drawX + 50*s > 0 && drawX < cvs.width && drawY + 50*s > 0 && drawY < cvs.height) {
                    ctx.fillStyle = color;
                    ctx.fillRect(drawX, drawY, 50*s, 50*s);
                    
                    // Grid Lines
                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(drawX, drawY, 50*s, 50*s);
                }
            });
        }

        // 2. Aktueller Sektor (Scharf) & Explored Details
        // Wir gehen durch die 'explored' Liste. Diese enthält Koordinaten von Tiles die wir GESEHEN haben.
        // Da wir die Map-Daten alter Sektoren nicht speichern (zu viel RAM),
        // können wir nur für den AKTUELLEN Sektor die echten Tiles malen.
        // Für alte Sektoren malen wir einfach "heller", um "erkundet" anzuzeigen.

        const currSX = Game.state.sector.x;
        const currSY = Game.state.sector.y;

        // Current Map Tiles Drawing
        if (Game.state.currentMap) {
            const startDrawX = (currSX * 50 * s) + ox;
            const startDrawY = (currSY * 50 * s) + oy;

            // Nur zeichnen wenn sichtbar
            if (startDrawX + 50*s > 0 && startDrawX < cvs.width && startDrawY + 50*s > 0 && startDrawY < cvs.height) {
                for(let y=0; y<50; y++) {
                    for(let x=0; x<50; x++) {
                        // Prüfen ob Tile explored ist
                        const key = `${currSX},${currSY}_${x},${y}`;
                        if(Game.state.explored[key]) {
                            const t = Game.state.currentMap[y][x];
                            ctx.fillStyle = colors[t] || '#4a4036';
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

        // Pulsierender Marker
        const pulse = 10 + Math.sin(Date.now() / 200) * 3;
        ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
        ctx.beginPath();
        ctx.arc(pDrawX, pDrawY, pulse, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = "#39ff14";
        ctx.beginPath();
        ctx.arc(pDrawX, pDrawY, 4, 0, Math.PI*2);
        ctx.fill();

        // 4. POIs (Global)
        if(Game.state.worldPOIs) {
            Game.state.worldPOIs.forEach(poi => {
                const px = (poi.x * 50 + 25) * s + ox;
                const py = (poi.y * 50 + 25) * s + oy;
                
                // Nur wenn besucht/bekannt? Sagen wir bekannt.
                if(px > 0 && px < cvs.width && py > 0 && py < cvs.height) {
                    ctx.font = "bold 20px monospace";
                    ctx.textAlign = "center";
                    let icon = "❓";
                    if(poi.type === 'V') icon = "⚙️";
                    if(poi.type === 'C') icon = "🏙️";
                    
                    ctx.fillText(icon, px, py);
                }
            });
        }

        // Loop
        if(Game.state.view === 'worldmap') {
            requestAnimationFrame(() => this.renderWorldMap());
        }
    }
});

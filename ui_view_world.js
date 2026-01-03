// [v3.7] - 2026-01-03 07:15am (World & Camp Renderer)
// - Map Logic: Zeigt Sektoren und POIs.
// - Camp Renderer: Zeichnet das Zelt-Menü direkt via JS (ohne HTML-Datei).

Object.assign(UI, {

    renderWorldMap: function() {
        const cvs = document.getElementById('world-map-canvas');
        const details = document.getElementById('sector-details');
        if(!cvs) return;
        const ctx = cvs.getContext('2d');
        const W = 10, H = 10; 
        const TILE_W = cvs.width / W;
        const TILE_H = cvs.height / H;

        // Hintergrund
        ctx.fillStyle = "#050a05"; 
        ctx.fillRect(0, 0, cvs.width, cvs.height);

        const biomeColors = {
            'wasteland': '#4a4036', 'forest': '#1a3300', 'jungle': '#0f2405',
            'desert': '#8b5a2b', 'swamp': '#1e1e11', 'mountain': '#333333',
            'city': '#444455', 'vault': '#002244'
        };

        const pulse = (Date.now() % 1000) / 1000;
        const glowAlpha = 0.3 + (Math.sin(Date.now() / 200) + 1) * 0.2; 
        
        // Camp Coordinate Fix
        if(Game.state.camp && !Game.state.camp.sector && Game.state.camp.sx !== undefined) {
             Game.state.camp.sector = { x: Game.state.camp.sx, y: Game.state.camp.sy };
        }

        // Loop über alle Sektoren
        for(let y=0; y<H; y++) {
            for(let x=0; x<W; x++) {
                const key = `${x},${y}`;
                const isVisited = Game.state.visitedSectors && Game.state.visitedSectors.includes(key);
                const isCurrent = (x === Game.state.sector.x && y === Game.state.sector.y);

                let fixedPOI = null;
                let randomDungeon = null;

                if(Game.state.worldPOIs) {
                    fixedPOI = Game.state.worldPOIs.find(p => p.x === x && p.y === y);
                }

                if(!fixedPOI) {
                    const mapSeed = (x + 1) * 5323 + (y + 1) * 8237 + 9283;
                    if(typeof WorldGen !== 'undefined') {
                        WorldGen.setSeed(mapSeed);
                        const rng = () => WorldGen.rand();
                        if(rng() < 0.35) {
                            const r = rng();
                            if(r < 0.3) randomDungeon = 'S'; 
                            else if(r < 0.6) randomDungeon = 'H'; 
                        }
                    }
                }

                // Zeichne Kachel
                if(isVisited) {
                    const biome = WorldGen.getSectorBiome(x, y);
                    ctx.fillStyle = biomeColors[biome] || '#222';
                    ctx.fillRect(x * TILE_W - 0.5, y * TILE_H - 0.5, TILE_W + 1, TILE_H + 1);
                } else {
                    ctx.fillStyle = "#000";
                    ctx.fillRect(x * TILE_W, y * TILE_H, TILE_W, TILE_H);
                }

                const cx = x * TILE_W + TILE_W/2;
                const cy = y * TILE_H + TILE_H/2;

                ctx.font = "bold 20px monospace";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                // POI Icons
                if (fixedPOI) {
                    let icon = "❓";
                    let color = "#fff";
                    let fontSize = "20px";
                    let label = null;

                    if(fixedPOI.type === 'C') { icon = "🏙️"; color = "#00ffff"; }
                    else if(fixedPOI.type === 'V') { 
                        icon = "⚙️"; color = "#ffff00"; fontSize = "25px"; label = "VAULT 101"; 
                    }
                    else if(fixedPOI.type === 'M') { icon = "🏰"; color = "#ff5555"; }
                    else if(fixedPOI.type === 'R') { icon = "☠️"; color = "#ffaa00"; }
                    else if(fixedPOI.type === 'T') { icon = "📡"; color = "#55ff55"; }
                    
                    if(isVisited) {
                        ctx.font = `bold ${fontSize} monospace`;
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = color;
                        ctx.fillStyle = color;
                        ctx.fillText(icon, cx, cy);
                        ctx.shadowBlur = 0;
                        
                        if(label) {
                            ctx.font = "bold 10px monospace";
                            ctx.fillStyle = "#ffffff";
                            ctx.shadowColor = "#000";
                            ctx.shadowBlur = 4;
                            ctx.fillText(label, cx, cy + TILE_H/2 - 5);
                            ctx.shadowBlur = 0;
                        }
                    } else {
                        ctx.globalAlpha = 0.5;
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = color;
                        ctx.fillStyle = color;
                        ctx.fillText("?", cx, cy);
                        ctx.shadowBlur = 0;
                        ctx.globalAlpha = 1.0;
                    }
                }
                else if (randomDungeon) {
                    let color = "#a020f0"; 
                    let icon = randomDungeon === 'S' ? '🛒' : '🦇'; 
                    
                    if(isVisited) {
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = color;
                        ctx.fillStyle = color;
                        ctx.fillText(icon, cx, cy);
                        ctx.shadowBlur = 0;
                    } else {
                        ctx.fillStyle = `rgba(160, 32, 240, ${glowAlpha})`; 
                        ctx.fillRect(x * TILE_W + 2, y * TILE_H + 2, TILE_W - 4, TILE_H - 4);
                        ctx.fillStyle = "#fff";
                        ctx.font = "10px monospace";
                        ctx.fillText("?", cx, cy);
                    }
                }

                // Zelt-Icon auf Karte
                if(Game.state.camp && Game.state.camp.sector && Game.state.camp.sector.x === x && Game.state.camp.sector.y === y) {
                    ctx.font = "bold 20px monospace";
                    ctx.fillStyle = "#ffffff";
                    ctx.fillText("⛺", x * TILE_W + TILE_W/4, y * TILE_H + TILE_H/4);
                }

                // Detail-Text Update
                if(isCurrent && details) {
                    let info = `SEKTOR [${x},${y}]`;
                    if(randomDungeon) info += " <span class='text-purple-400 animate-pulse'>[SIGNAL]</span>";
                    details.innerHTML = info;
                }
            }
        }

        // Spieler Position (Grüner Punkt)
        const relX = Game.state.player.x / Game.MAP_W; 
        const relY = Game.state.player.y / Game.MAP_H; 
        
        const px = Game.state.sector.x * TILE_W + (relX * TILE_W);
        const py = Game.state.sector.y * TILE_H + (relY * TILE_H);
        
        ctx.beginPath();
        ctx.arc(px, py, 4 + (pulse * 8), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(57, 255, 20, ${0.6 - pulse * 0.6})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#39ff14";
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Loop
        if(Game.state.view === 'worldmap') {
            requestAnimationFrame(() => this.renderWorldMap());
        }
    },

    // --- HIER IST DIE FUNKTION, DIE DIR FEHLT ---
    renderCamp: function() {
        const camp = Game.state.camp;
        
        // Sicherheitscheck: Wenn kein Camp existiert, zurück zur Map
        if(!camp) { 
            console.warn("RenderCamp called but no camp exists.");
            this.switchView('map'); 
            return; 
        }
        
        let statusText = "Basis-Zelt (Lvl 1). Heilung 50%.";
        let upgradeText = "LAGER VERBESSERN";
        let upgradeSub = "Kosten: 10x Schrott";
        let upgradeDisabled = false;
        
        if(camp.level >= 2) {
            statusText = "Komfort-Zelt (Lvl 2). Heilung 100%.";
            upgradeText = "LAGER MAXIMIERT";
            upgradeSub = "Maximum erreicht";
            upgradeDisabled = true;
        }

        // Wir bauen das UI komplett in JS zusammen
        this.els.view.innerHTML = `
            <div class="flex flex-col h-full w-full max-w-lg mx-auto p-4 gap-4">
                
                <div class="border-b-2 border-green-500 pb-2 flex justify-between items-end">
                    <h1 class="text-3xl font-bold text-yellow-400">⛺ LAGER</h1>
                    <span class="text-green-500 font-mono">LEVEL ${camp.level}</span>
                </div>
                
                <div class="bg-green-900/20 border border-green-900 p-4 text-center">
                    <p class="text-green-300">${statusText}</p>
                </div>

                <button class="flex flex-col items-center justify-center border ${upgradeDisabled ? 'border-gray-700 text-gray-500 cursor-not-allowed' : 'border-yellow-500 text-yellow-400 hover:bg-yellow-900/30'} p-3 transition-all w-full"
                    onclick="Game.upgradeCamp()" ${upgradeDisabled ? 'disabled' : ''}>
                    <span class="font-bold text-lg">${upgradeText}</span>
                    <span class="text-xs opacity-70">${upgradeSub}</span>
                </button>

                <div class="grid grid-cols-2 gap-4 flex-grow max-h-[60%]">
                    
                    <button class="flex flex-col items-center justify-center border border-blue-500 text-blue-400 hover:bg-blue-900/30 p-4 transition-all h-full"
                        onclick="Game.restInCamp()">
                        <span class="text-3xl mb-1">💤</span>
                        <span class="font-bold">SCHLAFEN</span>
                        <span class="text-xs opacity-70">HP heilen</span>
                    </button>

                    <button class="flex flex-col items-center justify-center border border-orange-500 text-orange-400 hover:bg-orange-900/30 p-4 transition-all h-full"
                        onclick="UI.renderCampCooking()">
                        <span class="text-3xl mb-1">🍖</span>
                        <span class="font-bold">KOCHEN</span>
                        <span class="text-xs opacity-70">Essen</span>
                    </button>

                    <button class="flex flex-col items-center justify-center border border-red-500 text-red-400 hover:bg-red-900/30 p-4 transition-all h-full"
                        onclick="Game.packCamp()">
                        <span class="text-3xl mb-1">🎒</span>
                        <span class="font-bold">ABBAUEN</span>
                        <span class="text-xs opacity-70">Einpacken</span>
                    </button>

                    <button class="flex flex-col items-center justify-center border border-green-500 text-green-500 hover:bg-green-900/30 p-4 transition-all h-full"
                        onclick="UI.switchView('map')">
                        <span class="text-3xl mb-1">🗺️</span>
                        <span class="font-bold">ZURÜCK</span>
                        <span class="text-xs opacity-70">Karte</span>
                    </button>
                
                </div>
            </div>
        `;
    },

    renderCampCooking: function() {
        const view = this.els.view;
        view.innerHTML = `
            <div class="p-4 w-full max-w-2xl mx-auto flex flex-col h-full">
                <h2 class="text-3xl font-bold text-yellow-500 mb-4 border-b-2 border-yellow-900 pb-2 flex items-center gap-2">
                    <span>🔥</span> LAGERFEUER
                </h2>
                <div id="cooking-list" class="flex-grow overflow-y-auto pr-2 custom-scrollbar"></div>
                <button onclick="UI.renderCamp()" class="mt-4 border border-yellow-500 text-yellow-500 py-3 font-bold hover:bg-yellow-900/40 uppercase tracking-widest">
                    << Zurück zum Zelt
                </button>
            </div>
        `;
        
        const list = document.getElementById('cooking-list');
        const recipes = Game.recipes || [];
        const cookingRecipes = recipes.filter(r => r.type === 'cooking');

        if(cookingRecipes.length === 0) {
            list.innerHTML = '<div class="text-gray-500 italic text-center mt-10">Du kennst noch keine Rezepte.</div>';
            return;
        }

        cookingRecipes.forEach(recipe => {
            const outItem = Game.items[recipe.out];
            const div = document.createElement('div');
            div.className = "border border-yellow-900 bg-yellow-900/10 p-3 mb-2 flex justify-between items-center";
            
            let reqHtml = '';
            let canCraft = true;
            for(let reqId in recipe.req) {
                const countNeeded = recipe.req[reqId];
                const invItem = Game.state.inventory.find(i => i.id === reqId);
                const countHave = invItem ? invItem.count : 0;
                let color = "text-yellow-500";
                if (countHave < countNeeded) { canCraft = false; color = "text-red-500"; }
                const ingredientName = Game.items[reqId] ? Game.items[reqId].name : reqId;
                reqHtml += `<span class="${color} text-xs mr-2">• ${ingredientName}: ${countHave}/${countNeeded}</span>`;
            }

            div.innerHTML = `
                <div class="flex flex-col">
                    <span class="font-bold text-yellow-400 text-lg">${outItem.name}</span>
                    <span class="text-xs text-yellow-600 italic">${outItem.desc}</span>
                    <div class="mt-1">${reqHtml}</div>
                </div>
                <button class="border border-yellow-500 text-yellow-500 px-4 py-2 font-bold hover:bg-yellow-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                    onclick="Game.craftItem('${recipe.id}')" ${canCraft ? '' : 'disabled'}>
                    BRATEN
                </button>
            `;
            list.appendChild(div);
        });
    },

    renderRadio: function() {
        const btnToggle = document.getElementById('btn-radio-toggle');
        const stationName = document.getElementById('radio-station-name');
        const status = document.getElementById('radio-status');
        const hz = document.getElementById('radio-hz');
        const track = document.getElementById('radio-track');
        const waves = document.getElementById('radio-waves');

        if(!btnToggle) return;

        const isOn = Game.state.radio.on;
        
        if(isOn) {
            btnToggle.textContent = "AUSSCHALTEN";
            btnToggle.classList.replace('text-green-500', 'text-red-500');
            btnToggle.classList.replace('border-green-500', 'border-red-500');
            
            const currentStation = Game.radioStations[Game.state.radio.station];
            if(stationName) stationName.textContent = currentStation.name;
            if(status) status.textContent = "SIGNAL STABLE - STEREO";
            if(hz) hz.textContent = currentStation.freq;
            
            const trackList = currentStation.tracks;
            const now = Math.floor(Date.now() / 10000); 
            const tIndex = now % trackList.length;
            if(track) track.textContent = "♪ " + trackList[tIndex] + " ♪";
            
            if(waves && Game.Audio && Game.Audio.analyser) {
                waves.innerHTML = '';
                const data = Game.Audio.getVisualData(); 
                const step = Math.floor(data.length / 20);
                
                for(let i=0; i<20; i++) {
                    const val = data[i * step];
                    const h = Math.max(10, (val / 255) * 100);
                    const bar = document.createElement('div');
                    bar.className = "w-1 bg-green-500 transition-all duration-75";
                    bar.style.height = `${h}%`;
                    bar.style.opacity = 0.5 + (val/500);
                    waves.appendChild(bar);
                }
            }

        } else {
            btnToggle.textContent = "EINSCHALTEN";
            btnToggle.classList.replace('text-red-500', 'text-green-500');
            btnToggle.classList.replace('border-red-500', 'border-green-500');
            
            if(stationName) stationName.textContent = "OFFLINE";
            if(status) status.textContent = "NO SIGNAL";
            if(hz) hz.textContent = "00.0";
            if(track) track.textContent = "...";
            if(waves) waves.innerHTML = '';
        }
        
        if(isOn && Game.state.view === 'radio') {
            requestAnimationFrame(() => this.renderRadio());
        }
    }
});


    // --- GLOBALE EINSTELLUNGEN ---
    const TILE_SIZE = 30; 
    const MAP_WIDTH = 20; 
    const MAP_HEIGHT = 12; 
    
    // --- WELTKARTE EINSTELLUNGEN ---
    const WORLD_SIZE = 10; // 10x10 Raster
    const START_SECTOR_X = 5;
    const START_SECTOR_Y = 5;
    const GOAL_SECTOR = { x: 0, y: 0 }; 

    // Referenzen erst im globalen Scope holen, dann initNewGame() am Ende aufrufen
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d'); 

    // WICHTIG: Die Canvas-Größe muss hier festgelegt werden, bevor sie in draw() skaliert wird
    canvas.width = MAP_WIDTH * TILE_SIZE;
    canvas.height = MAP_HEIGHT * TILE_SIZE;
    
    let mapLayout = []; 
    let worldState = {}; 
    let animationFrameId = null; 

    
    const mapColors = {
        'V': '#39ff14', 
        'C': '#7a661f', 
        'X': '#ff3914', 
        'G': '#00ffff', 
        '.': '#4a3d34', 
        '#': '#8b7d6b', 
        '^': '#5c544d', 
        '~': '#224f80', 
        'fog': '#000000', 
        'player': '#ff3914' 
    };

    const monsters = {
        moleRat: { name: "Maulwurfsratte", hp: 30, damage: 15, loot: 10, key: 'moleRat', exp: 50, minLevel: 1, description: "Eine aggressive Nagerart, die schnell zuschlägt. Häufig im Ödland anzutreffen." }, 
        mutantRose: { name: "Mutanten Rose", hp: 45, damage: 20, loot: 15, key: 'mutantRose', exp: 75, minLevel: 1, description: "Eine durch Strahlung mutierte Pflanze, die mit giftigen Stacheln angreift." },
        deathclaw: { name: "Todesklaue", hp: 120, damage: 45, loot: 50, key: 'deathclaw', exp: 300, minLevel: 5, description: "Eines der furchteinflößendsten Raubtiere des Ödlands. Extrem schnell und tödlich." }
    };

    const BASE_STATS = { STR: 5, PER: 5, END: 5, INT: 5, AGI: 5, LUC: 5 };
    let gameState = {};

    const items = {
        none_head: { name: "Kein Helm", slot: 'head', bonus: {}, requiredLevel: 1 },
        none_feet: { name: "Stiefel", slot: 'feet', bonus: {}, requiredLevel: 1 },
        fists: { name: "Fäuste", slot: 'weapon', bonus: {}, requiredLevel: 1, isRanged: false }, 
        knife: { name: "Messer", slot: 'weapon', bonus: { STR: 1 }, requiredLevel: 1, cost: 15, isRanged: false },
        pistol: { name: "10mm Pistole", slot: 'weapon', bonus: { AGI: 2 }, requiredLevel: 1, cost: 50, isRanged: true },
        armor_vault: { name: "Vault-Anzug", slot: 'body', bonus: { END: 1 }, requiredLevel: 1 },
        armor_leather: { name: "Lederharnisch", slot: 'body', bonus: { END: 2 }, requiredLevel: 1, cost: 30 },
        helmet_metal: { name: "Metallhelm", slot: 'head', bonus: { END: 1, PER: 1 }, requiredLevel: 1, cost: 20 },
        
        rifle_laser: { name: "Laser-Gewehr", slot: 'weapon', bonus: { PER: 3, INT: 1 }, requiredLevel: 5, cost: 300, isRanged: true },
        armor_combat: { name: "Kampf-Harnisch", slot: 'body', bonus: { END: 3, STR: 1 }, requiredLevel: 5, cost: 150 },
        helmet_combat: { name: "Kampfhelm", slot: 'head', bonus: { END: 2, PER: 2 }, requiredLevel: 5, cost: 75 },
        
        rifle_plasma: { name: "Plasma-Gewehr", slot: 'weapon', bonus: { PER: 4, INT: 2, LUC: 1 }, requiredLevel: 10, cost: 600, isRanged: true },
        armor_power: { name: "Power-Rüstung T-60", slot: 'body', bonus: { END: 5, STR: 5, AGI: -2 }, requiredLevel: 10, cost: 1000 },
        helmet_power: { name: "Power-Helm T-60", slot: 'head', bonus: { END: 3, PER: 3 }, requiredLevel: 10, cost: 400 },
    };

    const els = {
        stats: document.getElementById('stat-display'), 
        equip: document.getElementById('equipment-display'),
        hp: document.getElementById('health-display'),
        hpBar: document.getElementById('hp-bar'),
        ammo: document.getElementById('ammo-display'),
        caps: document.getElementById('caps-display'),
        text: document.getElementById('encounter-text'),
        btns: document.getElementById('action-buttons'),
        log: document.getElementById('log-area'),
        restart: document.getElementById('restart-button'),
        moveContainer: document.getElementById('movement-container'),
        gameView: document.getElementById('view-container'),
        pipBoyCase: document.getElementById('pipboy-case'),
        gameScreen: document.getElementById('game-screen'),
        mapView: document.getElementById('map-view'),
        worldMapView: document.getElementById('worldmap-view'), 
        worldMapGrid: document.getElementById('world-map-grid'), 
        cityView: document.getElementById('city-view'),
        charView: document.getElementById('character-view'), 
        charBtn: document.getElementById('char-btn'),
        mapBtn: document.getElementById('map-btn'), 
        wikiBtn: document.getElementById('wiki-btn'),
        wikiView: document.getElementById('wiki-view'),
        wikiContent: document.getElementById('wiki-content'),      
        cityOptions: document.getElementById('city-options'),
        zoneDisplay: document.getElementById('current-zone-display'),
        
        levelDisplay: document.getElementById('level-display'),
        expCurrentDisplay: document.getElementById('exp-current-display'), 
        levelDisplayChar: document.getElementById('level-display-char'),
        expDisplayChar: document.getElementById('exp-display-char'),
        expNeededChar: document.getElementById('exp-needed-char'),
        expBar: document.getElementById('exp-bar'),
        statPointsDisplay: document.getElementById('stat-points-display'),
        applyStatBtn: document.getElementById('apply-stat-btn'),
        
        combatView: document.getElementById('combat-view'),
        enemyName: document.getElementById('enemy-name-center'),
        enemyHpDisplay: document.getElementById('enemy-hp-display-center')
    };

    function calculateMaxHP(endurance) {
        // Basis-HP (100) + 10 TP pro Punkt über 5 END
        return 100 + (endurance - 5) * 10;
    }

    function expToNextLevel(level) {
        return 100 + level * 50; 
    }

    function gainExp(amount) {
        if (gameState.isGameOver) return;
        
        gameState.exp += amount;
        log(`+${amount} EXP erhalten.`, 'text-blue-400');
        
        let expNeeded = expToNextLevel(gameState.level);
        
        while (gameState.exp >= expNeeded) {
            gameState.level++;
            gameState.statPoints++;
            gameState.exp -= expNeeded;
            expNeeded = expToNextLevel(gameState.level);
            
            const maxHp = calculateMaxHP(getStat('END')); 
            gameState.health = Math.min(maxHp, gameState.health + 20); 
            
            log(`LEVEL UP! Du bist jetzt Level ${gameState.level}! +1 Stat-Punkt.`, 'text-red-500 bg-yellow-400/20');
        }
        updateUI();
    }
    
    function commitStatPoint(statKey) {
        if (gameState.statPoints > 0) {
            gameState.stats[statKey]++; 
            gameState.statPoints--; 
            gameState.tempStatIncrease = {}; 
            
            if (statKey === 'END') {
                const newMaxHp = calculateMaxHP(getStat('END'));
                gameState.maxHealth = newMaxHp;
                log(`Max HP auf ${newMaxHp} erhöht (+10)!`, 'text-green-400');
            }
            
            log(`${statKey} permanent auf ${gameState.stats[statKey]} erhöht.`, 'text-yellow-400');
            updateUI();
        }
    }
    
    function increaseTempStat(key, buttonElement) {
        if (gameState.statPoints > 0) {
            if (gameState.tempStatIncrease.key && gameState.tempStatIncrease.key !== key) {
                const prevButton = document.querySelector(`[data-stat-key="${gameState.tempStatIncrease.key}"]`);
                if (prevButton) prevButton.disabled = false;
            }
            
            gameState.tempStatIncrease.key = key;
            gameState.tempStatIncrease.value = (gameState.tempStatIncrease.value || 0) + 1;
            buttonElement.disabled = true;
            updateUI();
        } else {
            log("Keine Stat-Punkte verfügbar.", 'text-gray-500');
        }
    }

    function applyStatPoint() {
        if (gameState.statPoints > 0 && gameState.tempStatIncrease.key) {
            commitStatPoint(gameState.tempStatIncrease.key);
        }
    }
    
    function getStat(key) {
        let val = gameState.stats[key];
        if (gameState.tempStatIncrease.key === key) {
            val += gameState.tempStatIncrease.value;
        }
        for (const slot in gameState.equipment) {
            const item = gameState.equipment[slot];
            if (item && item.bonus[key]) {
                val += item.bonus[key];
            }
        }
        return val;
    }

    function log(msg, colorClass = '') {
        const div = document.createElement('div');
        div.className = `mb-1 ${colorClass} pip-text`;
        div.innerHTML = `> ${msg}`;
        els.log.insertBefore(div, els.log.firstChild); 
    }

    function updateUI() {
        const currentMaxHp = calculateMaxHP(getStat('END'));
        gameState.maxHealth = currentMaxHp; 

        els.levelDisplay.textContent = gameState.level;
        els.expCurrentDisplay.textContent = gameState.exp;
        
        els.levelDisplayChar.textContent = gameState.level;
        els.expDisplayChar.textContent = gameState.exp;
        
        const expNeeded = expToNextLevel(gameState.level);
        els.expNeededChar.textContent = expNeeded;
        
        const progressPercent = (gameState.exp / expNeeded) * 100;
        els.expBar.style.width = `${progressPercent}%`;
        
        els.statPointsDisplay.textContent = gameState.statPoints;
        els.applyStatBtn.disabled = !(gameState.statPoints > 0 && gameState.tempStatIncrease.key);

        els.stats.innerHTML = Object.keys(BASE_STATS).map(k => {
            const baseVal = gameState.stats[k];
            const finalVal = getStat(k);
            const isTempIncreased = gameState.tempStatIncrease.key === k;
            
            let displayVal = finalVal;
            if (finalVal !== baseVal) {
                const diff = finalVal - baseVal;
                displayVal = `${finalVal} (${baseVal}${diff > 0 ? '+' : ''}${diff})`; 
            }
            
            let btn = '';
            if (gameState.statPoints > 0 && !isTempIncreased) {
                 btn = `<button class="action-button p-0 h-6 w-6 text-base leading-none" data-stat-key="${k}" onclick="increaseTempStat('${k}', this)">+</button>`;
            } else if (isTempIncreased) {
                 btn = `<span class="pip-stat-value text-red-500">[+TEMP]</span>`; 
            }
            
            let extraInfo = '';
            if (k === 'END') {
                extraInfo = `<br><span class="text-xs opacity-70">Max TP: ${currentMaxHp}</span>`;
            }

            return `
                <div class="stat-item">
                    <span>${k}: <span class="pip-stat-value">${displayVal}</span>${extraInfo}</span>
                    ${btn}
                </div>
            `;
        }).join('');

        els.equip.innerHTML = `
            <div>Helm: <span class="pip-stat-value">${gameState.equipment.head.name}</span></div>
            <div>Körper: <span class="pip-stat-value">${gameState.equipment.body.name}</span></div>
            <div>Füße: <span class="pip-stat-value">${gameState.equipment.feet.name}</span></div>
            <div>Waffe: <span class="pip-stat-value">${gameState.equipment.weapon.name}</span></div>
        `;

        els.hp.textContent = `${Math.round(gameState.health)}/${currentMaxHp}`; 
        const hpPercent = Math.max(0, (gameState.health / currentMaxHp) * 100); 
        els.hpBar.style.width = `${hpPercent}%`;
        els.hpBar.className = gameState.health < (currentMaxHp * 0.3) ? 'bg-red-500 h-full' : 'bg-[#39ff14] h-full';
        
        els.ammo.textContent = gameState.ammo;
        els.caps.textContent = `${gameState.caps} Kronenkorken`;
        els.zoneDisplay.textContent = `${gameState.currentZone} (${gameState.currentSector.x},${gameState.currentSector.y})`;

        if (gameState.currentEnemy) {
            els.enemyName.textContent = gameState.currentEnemy.name.toUpperCase();
            els.enemyHpDisplay.textContent = `TP: ${gameState.currentEnemy.hp}/${gameState.currentEnemy.maxHp}`;
        }

        const isControlHidden = gameState.inDialog || gameState.isGameOver || (gameState.currentView !== 'map' && gameState.currentView !== 'city');
        els.moveContainer.style.visibility = isControlHidden ? 'hidden' : 'visible';
        
        els.btns.style.display = gameState.inDialog ? 'flex' : 'none'; 

        if (gameState.isGameOver) els.restart.style.display = 'block';
        else els.restart.style.display = 'none';
    }
    
    // --- NEUE FUNKTIONEN FÜR DIE WELTKARTE ---
    
    function getSectorKey(x, y) {
        return `${x},${y}`;
    }

    function generateRandomMap(sectorX, sectorY) {
        const key = getSectorKey(sectorX, sectorY);
        let sectorData = worldState[key];
        
        if (sectorData && sectorData.layout) {
             return { layout: sectorData.layout.map(row => row.split('')), startX: MAP_WIDTH / 2, startY: MAP_HEIGHT / 2 };
        }
        
        let newMap = Array(MAP_HEIGHT).fill(0).map(() => Array(MAP_WIDTH).fill('.'));
        const spots = [];

        // 1. Mauern um die Map ziehen
        for (let y = 0; y < MAP_HEIGHT; y++) {
            newMap[y][0] = '^';
            newMap[y][MAP_WIDTH - 1] = '^';
        }
        for (let x = 0; x < MAP_WIDTH; x++) {
            newMap[0][x] = '^';
            newMap[MAP_HEIGHT - 1][x] = '^';
        }
        
        // 2. Tore ('G') an den Rändern
        
        const placeGate = (x, y, borderIndex) => {
            const range = borderIndex === 0 || borderIndex === 1 ? MAP_WIDTH - 2 : MAP_HEIGHT - 2;
            const pos = Math.floor(Math.random() * range) + 1;
            
            if (borderIndex === 0 && sectorY > 0) newMap[0][pos] = 'G'; // Oben (nach Nord)
            if (borderIndex === 1 && sectorY < WORLD_SIZE - 1) newMap[MAP_HEIGHT - 1][pos] = 'G'; // Unten (nach Süd)
            if (borderIndex === 2 && sectorX > 0) newMap[pos][0] = 'G'; // Links (nach West)
            if (borderIndex === 3 && sectorX < WORLD_SIZE - 1) newMap[pos][MAP_WIDTH - 1] = 'G'; // Rechts (nach Ost)
        };
        
        for (let i = 0; i < 4; i++) {
             placeGate(sectorX, sectorY, i);
        }


        // 3. Besondere Orte: Vault (V), Ziel (X), Stadt (C)
        const minDistance = 5; 
        let hasPOI = false;
        let poiMarkers = [];

        if (sectorX === START_SECTOR_X && sectorY === START_SECTOR_Y) {
            poiMarkers.push('V'); 
        }
        if (sectorX === GOAL_SECTOR.x && sectorY === GOAL_SECTOR.y) {
            poiMarkers.push('X'); 
        }
        
        if (poiMarkers.length === 0 && Math.random() < 0.4) {
            poiMarkers.push('C');
        }

        // Platziere POIs
        function isValidPlacement(x, y) {
            if (!newMap[y] || newMap[y][x] !== '.') return false;
            for (const spot of spots) {
                if (Math.hypot(spot.x - x, spot.y - y) < minDistance) {
                    return false;
                }
            }
            return true;
        }

        for (const marker of poiMarkers) {
            let placed = false;
            let attempts = 100;
            while (!placed && attempts > 0) {
                const x = Math.floor(Math.random() * (MAP_WIDTH - 4)) + 2;
                const y = Math.floor(Math.random() * (MAP_HEIGHT - 4)) + 2;
                if (isValidPlacement(x, y)) {
                    newMap[y][x] = marker;
                    spots.push({ x, y, marker });
                    hasPOI = true;
                    placed = true;
                }
                attempts--;
            }
        }
        
        // 4. Wasser und Pfade (optional)
        if (!hasPOI) { 
            const waterSize = Math.floor(Math.random() * 2) + 2; 
            const waterStart = { x: Math.floor(Math.random() * (MAP_WIDTH - waterSize - 1)) + 1, 
                                 y: Math.floor(Math.random() * (MAP_HEIGHT - waterSize - 1)) + 1 };
            
            for (let y = waterStart.y; y < waterStart.y + waterSize; y++) {
                for (let x = waterStart.x; x < waterStart.x + waterSize; x++) {
                    if (newMap[y] && newMap[y][x] === '.') newMap[y][x] = '~';
                }
            }
        }

        const generatedMap = newMap.map(row => row.join(''));
        
        sectorData = {
            layout: generatedMap,
            explored: false,
            markers: spots.map(s => s.marker)
        };
        worldState[key] = sectorData;

        // Finde einen Startpunkt
        let startX = Math.floor(MAP_WIDTH / 2);
        let startY = Math.floor(MAP_HEIGHT / 2);

        const vaultSpot = spots.find(s => s.marker === 'V');
        if (vaultSpot) { startX = vaultSpot.x; startY = vaultSpot.y + 1; }

        return { layout: generatedMap, startX, startY };
    }
    
    // KORRIGIERTER DRAW-LOOP
    function draw() {
        if (gameState.currentView !== 'map' || gameState.isGameOver) {
             if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            return;
        }
        
        const containerWidth = els.gameView.offsetWidth;
        const containerHeight = els.gameView.offsetHeight;
        
        // Berechnung des Skalierungsfaktors
        let scaleX = containerWidth / canvas.width;
        let scaleY = containerHeight / canvas.height;
        let scale = Math.min(scaleX, scaleY);
        
        let offsetX = (containerWidth - canvas.width * scale) / 2;
        let offsetY = (containerHeight - canvas.height * scale) / 2;
        
        // Anwendung der Transformation und Zentrierung
        ctx.canvas.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for(let y = 0; y < MAP_HEIGHT; y++) {
            for(let x = 0; x < MAP_WIDTH; x++) {
                const tile = mapLayout[y][x];
                const isExplored = gameState.explored[`${x},${y}`];
                
                let color = mapColors.fog;
                if (isExplored) {
                    color = mapColors[tile] || mapColors['.']; 
                }
                
                ctx.fillStyle = color;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

                if (isExplored && (tile === 'V' || tile === 'C' || tile === 'X' || tile === 'G')) {
                    ctx.fillStyle = mapColors.player; 
                    ctx.font = `${TILE_SIZE * 0.4}px 'VT323'`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    let symbol = tile === 'V' ? 'VLT' : tile === 'C' ? 'CITY' : tile === 'X' ? 'GOAL' : 'GATE';
                    ctx.fillText(symbol, x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2);
                }
            }
        }
        
        // Spieler zeichnen
        ctx.fillStyle = mapColors.player;
        ctx.beginPath();
        ctx.arc(
            gameState.player.x * TILE_SIZE + TILE_SIZE / 2, 
            gameState.player.y * TILE_SIZE + TILE_SIZE / 2, 
            TILE_SIZE / 4, 0, Math.PI * 2
        );
        ctx.fill();

        animationFrameId = requestAnimationFrame(draw); 
    }
    
    function showWorldMap() {
        els.worldMapGrid.innerHTML = '';
        
        for (let y = 0; y < WORLD_SIZE; y++) {
            for (let x = 0; x < WORLD_SIZE; x++) {
                const key = getSectorKey(x, y);
                const sector = worldState[key];
                const tile = document.createElement('div');
                tile.className = 'sector-tile';
                
                let isExplored = sector && sector.explored;
                let markers = sector ? sector.markers : [];
                
                if (isExplored) {
                    tile.classList.add('explored');
                }
                
                if (x === gameState.currentSector.x && y === gameState.currentSector.y) {
                    tile.classList.add('current-sector');
                    tile.textContent = 'YOU';
                }

                if (markers.length > 0) {
                    const markerEl = document.createElement('span');
                    markerEl.className = 'marker';
                    if (markers.includes('V')) markerEl.textContent = 'VLT';
                    else if (markers.includes('X')) markerEl.textContent = 'GOAL';
                    else if (markers.includes('C')) markerEl.textContent = 'CITY';
                    tile.appendChild(markerEl);
                }
                
                els.worldMapGrid.appendChild(tile);
            }
        }
    }
    
    function switchView(newView) {
        if (gameState.currentView === newView) {
            if (newView === 'character' || newView === 'wiki' || newView === 'worldmap') {
                switchView('map');
                return;
            }
            return;
        }

        const oldViewEl = document.getElementById(gameState.currentView + '-view');
        const newViewEl = document.getElementById(newView + '-view');
        
        els.charBtn.disabled = true; 
        els.wikiBtn.disabled = true;
        els.mapBtn.disabled = true;
        
        if (oldViewEl) {
            oldViewEl.classList.add('transition-out');
            // Stoppe den Draw-Loop, wenn die Karte verlassen wird
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }

        setTimeout(() => {
            if (oldViewEl) {
                oldViewEl.style.display = 'none';
                oldViewEl.classList.remove('transition-out');
            }
            newViewEl.style.display = 'flex';
            gameState.currentView = newView;
            
            setTimeout(() => {
                els.charBtn.disabled = false; 
                els.wikiBtn.disabled = false;
                els.mapBtn.disabled = false;

                if (newView === 'map') {
                    els.text.textContent = "Zurück im Ödland.";
                    gameState.currentZone = "Ödland";
                    closeCityDialog();
                    if (!animationFrameId) draw(); // Startet den Loop neu, falls er gestoppt war
                } else if (newView === 'worldmap') { 
                    els.text.textContent = "Globalen Sektor-Scan aufgerufen.";
                    gameState.currentZone = "WELTKARTE";
                    showWorldMap();
                    gameState.inDialog = false;
                } else if (newView === 'city') {
                    els.text.textContent = "Willkommen in Rusty Springs.";
                    gameState.currentZone = "Rusty Springs";
                    enterCity();
                } else if (newView === 'character') { 
                    els.text.textContent = "Charakter Status überprüft.";
                    gameState.currentZone = "Status";
                    gameState.inDialog = false; 
                } else if (newView === 'wiki') {
                    els.text.textContent = "Ödland Wiki aufgerufen.";
                    gameState.currentZone = "WIKI";
                    showWiki();
                    gameState.inDialog = false;
                } else if (newView === 'combat') {
                    gameState.currentZone = "Kampf!";
                    gameState.inDialog = true;
                }
                updateUI();
            }, 50); 
        }, 300); 
    }
    
    function showWiki() {
        let html = '<h2 class="section-header mb-3">BEKANNTE MONSTER</h2><ul class="space-y-2">';
        
        Object.keys(monsters).forEach(key => {
            const monster = monsters[key];
            html += `
                <li class="pip-text border-b border-gray-700 pb-1 flex justify-between items-center">
                    <span>${monster.name} (LVL ${monster.minLevel}+)</span>
                    <button class="action-button px-2 py-1 text-xs" onclick="showMonsterDetails('${key}')">DETAILS</button>
                </li>
            `;
        });
        
        html += '</ul>';
        els.wikiContent.innerHTML = html;
    }

    function showMonsterDetails(key) {
        const monster = monsters[key];
        if (!monster) return;

        const html = `
            <h2 class="section-header mb-3">${monster.name.toUpperCase()}</h2>
            <div class="pip-text space-y-2 text-sm md:text-base">
                <div><span class="font-bold">Beschreibung:</span> ${monster.description}</div>
                <div><span class="font-bold">Erscheinung (Min. Level):</span> LVL ${monster.minLevel}</div>
                <div><span class="font-bold">Geschätzte TP:</span> ${monster.hp}</div>
                <div><span class="font-bold">Typ. Schaden:</span> ${monster.damage}</div>
                <div><span class="font-bold">EXP/Loot:</span> ${monster.exp} EXP / ${monster.loot} KK</div>
            </div>
            <button class="action-button mt-4 w-full" onclick="showWiki()">Zurück zur Liste</button>
        `;
        els.wikiContent.innerHTML = html;
    }

    function showCityDialog(options) {
        gameState.inDialog = true;
        els.cityOptions.innerHTML = '';
        
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'action-button w-full text-base';
            btn.innerHTML = opt.text;
            
            let isDisabled = false;
            
            if (opt.isDisabled) {
                isDisabled = true;
            }

            if (opt.cost && gameState.caps < opt.cost) {
                isDisabled = true;
                if (!opt.isDisabled) { 
                    btn.innerHTML += `<br> (Fehlt ${opt.cost-gameState.caps} KK)`;
                }
            }
            
            if (opt.isHeal) {
                opt.action = () => {
                    gameState.health = gameState.maxHealth; 
                    log("Vollständig geheilt.", "text-green-400"); 
                    enterCity();
                }
            }

            btn.disabled = isDisabled;

            btn.onclick = () => {
                if (opt.cost) {
                    gameState.caps -= opt.cost;
                }
                opt.action();
                updateUI(); 
            };
            els.cityOptions.appendChild(btn);
        });
        updateUI();
    }
    
    function closeCityDialog() {
        gameState.inDialog = false;
        els.cityOptions.innerHTML = '';
        const cityHeader = document.getElementById('city-view-content').querySelector('.city-header');
        if (cityHeader) cityHeader.textContent = "RUSTY SPRINGS";
        updateUI();
    }

    function confirmSectorChange(change, dx, dy, playerX, playerY) {
        els.btns.innerHTML = ''; 
        
        if (change) {
            log("Tor durchschritten. Sektorwechsel beginnt...", "text-yellow-400");
            
            const nextX = gameState.currentSector.x + dx;
            const nextY = gameState.currentSector.y + dy;
            
            const currentSectorKey = getSectorKey(gameState.currentSector.x, gameState.currentSector.y);
            worldState[currentSectorKey].explored = true; 
            
            const { layout, startX, startY } = generateRandomMap(nextX, nextY);
            mapLayout = layout.map(row => row.split(''));
            
            let newPlayerX = startX;
            let newPlayerY = startY;
            if (dx === 1) newPlayerX = 1; 
            else if (dx === -1) newPlayerX = MAP_WIDTH - 2; 
            else if (dy === 1) newPlayerY = 1; 
            else if (dy === -1) newPlayerY = MAP_HEIGHT - 2; 

            gameState.currentSector = { x: nextX, y: nextY };
            gameState.player = { x: newPlayerX, y: newPlayerY }; 
            gameState.explored = {}; 

            gameState.maxHealth = calculateMaxHP(getStat('END'));

            els.text.textContent = `Neuer Sektor (${nextX},${nextY})! Die Landschaft ist anders...`;
            revealMap(gameState.player.x, gameState.player.y);
            updateUI();
            log(`Sektorwechsel abgeschlossen. Neue Zone erkunden.`, "text-yellow-400");
            
        } else {
            gameState.inDialog = false;
            els.text.textContent = "Ödland Ebene.";
            gameState.player.x = playerX;
            gameState.player.y = playerY;
            updateUI();
        }
    }
    
    function movePlayer(dx, dy) {
        if(gameState.inDialog || gameState.isGameOver || gameState.currentView !== 'map') return;

        const nx = gameState.player.x + dx;
        const ny = gameState.player.y + dy;

        if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) {
            log("Ende der Kartendaten erreicht (Fehler).", "text-gray-500");
            return; 
        }

        const tile = mapLayout[ny][nx];
        const oldX = gameState.player.x;
        const oldY = gameState.player.y;

        if (tile === '^') { 
            log("Massive Felsen/Mauer. Nicht passierbar.", "text-gray-500");
            return; 
        }

        if (tile === '~') { 
            log("Radioaktives Wasser. Geh weg!", "text-red-500"); 
            return; 
        }

        if (tile === 'G') { 
            let sectorDx = 0;
            let sectorDy = 0;
            if (ny === 0) sectorDy = -1; 
            else if (ny === MAP_HEIGHT - 1) sectorDy = 1; 
            else if (nx === 0) sectorDx = -1; 
            else if (nx === MAP_WIDTH - 1) sectorDx = 1; 

            const nextX = gameState.currentSector.x + sectorDx;
            const nextY = gameState.currentSector.y + sectorDy;
            
            if (nextX < 0 || nextX >= WORLD_SIZE || nextY < 0 || nextY >= WORLD_SIZE) {
                log("Ende der Weltkarte erreicht. Weitergehen nicht möglich.", "text-red-500");
                return;
            }

            gameState.player.x = nx;
            gameState.player.y = ny;
            revealMap(nx, ny);
            
            log("Tor zum nächsten Sektor in Reichweite.", "text-yellow-400");
            els.text.innerHTML = `Möchtest du in Sektor <b>(${nextX},${nextY})</b> wechseln?`;
            gameState.inDialog = true;
            
            els.btns.innerHTML = `
                <button class="action-button w-1/3 text-base" onclick="confirmSectorChange(false, ${sectorDx}, ${sectorDy}, ${oldX}, ${oldY})">Bleiben</button>
                <button class="action-button w-2/3 text-lg font-extrabold bg-green-900 border-green-500" onclick="confirmSectorChange(true, ${sectorDx}, ${sectorDy}, ${oldX}, ${oldY})">SEKTOR WECHSELN</button>
            `;
            updateUI();
            return; 
        }

        if (tile === 'C') {
            gameState.player.x = nx;
            gameState.player.y = ny;
            revealMap(nx, ny);
            
            log("Rusty Springs in Reichweite.", "text-yellow-400");
            els.text.innerHTML = "Möchtest du Rusty Springs betreten? Die Zeit steht still.";
            gameState.inDialog = true;
            
            els.btns.innerHTML = `
                <button class="action-button w-1/3 text-base" onclick="confirmCityEntry(false)">Weiter geht's!</button>
                <button class="action-button w-2/3 text-lg font-extrabold bg-green-900 border-green-500" onclick="confirmCityEntry(true)">Betreten</button>
            `;
            updateUI();
            return;
        }

        gameState.player.x = nx;
        gameState.player.y = ny;
        
        revealMap(nx, ny);
        handleTileEvent(tile, nx, ny);
    }
    
    function confirmCityEntry(enter) {
        els.btns.innerHTML = ''; 
        
        if (enter) {
            log("Rusty Springs betreten.", "text-yellow-400");
            switchView('city'); 
        } else {
            gameState.inDialog = false;
            els.text.textContent = "Ödland Ebene.";
            updateUI();
        }
    }

    function revealMap(px, py) {
        const currentSectorKey = getSectorKey(gameState.currentSector.x, gameState.currentSector.y);
        worldState[currentSectorKey].explored = true;

        for(let y = py-1; y <= py+1; y++) {
            for(let x = px-1; x <= px+1; x++) {
                if (mapLayout[y] && mapLayout[y][x]) {
                     gameState.explored[`${x},${y}`] = true;
                }
            }
        }
    }

    function handleTileEvent(tile, x, y) {
        if (tile === 'C' || tile === 'G' || tile === 'V') { return; } 

        if (tile === 'X') { victory(); return; }

        if (tile === '.' || tile === '#') {
            if (Math.random() < 0.15) triggerRandomEncounter(); 
            else if (tile === '#') els.text.textContent = "Sicherer Handelsweg. Schneller voran.";
            else els.text.textContent = "Karges Ödland. Vorsicht geboten.";
        }
    }

    function enterCity() {
        showCityDialog([
            { text: "Arzt (25 KK) | TP vollst.", cost: 25, isHeal: true, action: () => {} }, 
            { text: "Händler | Munition (+5) 10 KK", cost: 10, action: () => {
                gameState.ammo += 5; log("+5 Munition gekauft.", "text-green-400"); enterCity();
            }},
            { text: "Ausrüstung kaufen/ansehen", action: () => showBuyMenu() },
            { text: "Stat Punkte Zuweisen", action: () => switchView('character') },
            { text: "Stadt verlassen", action: () => switchView('map') }
        ]);
    }
    
    function showBuyMenu() {
        const cityHeader = document.getElementById('city-view-content').querySelector('.city-header');
        if (cityHeader) cityHeader.textContent = "HÄNDLER";
        
        const allPricedItems = Object.values(items).filter(item => item.cost > 0);

        const dialogOptions = allPricedItems.map(opt => {
            const currentItem = gameState.equipment[opt.slot];
            const isEquipped = currentItem.name === opt.name;
            const isLevelTooLow = gameState.level < opt.requiredLevel;

            if (gameState.level < opt.requiredLevel - 5) return null;

            if (isEquipped) return null;

            const statBonus = Object.entries(opt.bonus).map(([k, v]) => `[${k}${v > 0 ? '+' : ''}${v}]`).join(' ');
            
            let text = `${opt.name} (${opt.cost} KK) ${statBonus}`;
            let isDisabled = false;
            
            if (isLevelTooLow) {
                text += `<br> [LVL ${opt.requiredLevel} nötig]`;
                isDisabled = true;
            } 

            return {
                text: text,
                cost: opt.cost,
                item: opt,
                isDisabled: isDisabled,
                action: () => {
                    gameState.equipment[opt.slot] = opt; 
                    
                    const newMaxHp = calculateMaxHP(getStat('END'));
                    gameState.maxHealth = newMaxHp;

                    log(`${opt.name} ausgerüstet und gekauft.`, 'text-yellow-400');
                    showBuyMenu();
                }
            };
        }).filter(Boolean);

        dialogOptions.push({ text: "Zurück zum Markt", action: () => enterCity() });

        showCityDialog(dialogOptions);
    }

    function triggerRandomEncounter() {
        const availableMonsters = Object.values(monsters).filter(m => gameState.level >= m.minLevel);

        if (availableMonsters.length === 0) {
            log("Keine passenden Monster in dieser Region gefunden.", "text-gray-500");
            return; 
        }
        
        const randomMonster = availableMonsters[Math.floor(Math.random() * availableMonsters.length)];
        const enemyTemplate = randomMonster;
        
        gameState.currentEnemy = { ...enemyTemplate, maxHp: enemyTemplate.hp }; 

        switchView('combat'); 

        els.pipBoyCase.classList.add('screen-shake');
        setTimeout(() => els.pipBoyCase.classList.remove('screen-shake'), 200);

        els.text.innerHTML = `<b>GEFAHR!</b> Eine ${gameState.currentEnemy.name} greift an!`;
        
        els.btns.innerHTML = `
            <button class="action-button" onclick="resolveCombat()">Angreifen</button>
            <button class="action-button" onclick="resolveFlee()">Flucht</button>
        `;
        
        updateUI();
    }
    
    function takeDamage(damage) {
        els.gameScreen.classList.add('damage-flash');
        setTimeout(() => els.gameScreen.classList.remove('damage-flash'), 100);
        gameState.health -= damage;
        log(`Schaden erlitten: -${Math.round(damage)} TP`, "text-red-500");
        checkDeath();
    }

    function resolveCombat() {
        if (!gameState.currentEnemy) return;

        let currentWeapon = gameState.equipment.weapon;
        const isRanged = currentWeapon.isRanged;
        
        if (isRanged && gameState.ammo <= 0) {
            if (currentWeapon.name !== 'Fäuste') {
                gameState.originalWeaponDuringCombat = currentWeapon;
                gameState.equipment.weapon = items.fists;
                currentWeapon = items.fists;
                log("Keine Munition! Automatisch auf Fäuste gewechselt.", "text-yellow-500");
            }
        } 
        
        if (isRanged && gameState.ammo > 0 && currentWeapon.name !== 'Fäuste') {
            gameState.ammo--;
        }

        const weaponBonusDamage = currentWeapon.bonus.STR || currentWeapon.bonus.AGI || 0;
        const playerDamage = getStat('AGI') * 3 + Math.floor(Math.random() * getStat('STR')) + weaponBonusDamage * 5;
        
        if (Math.random() > 0.3) { 
            gameState.currentEnemy.hp -= playerDamage;
            
            let attackVerb = currentWeapon.name === 'Fäuste' ? 'Du schlägst' : currentWeapon.name === 'Messer' ? 'Du stichst' : 'Du feuerst';

            log(`${attackVerb} mit ${currentWeapon.name} die ${gameState.currentEnemy.name} für ${playerDamage} Schaden!`, "text-green-400");
        } else {
            log("Du verfehlst das Ziel!", "text-yellow-400");
        }
        
        if (gameState.currentEnemy.hp <= 0) {
            const loot = gameState.currentEnemy.loot + Math.floor(Math.random()*getStat('LUC'));
            const exp = gameState.currentEnemy.exp; 
            
            gameState.caps += loot;
            log(`Sieg! Loot: ${loot} Kronenkorken erhalten.`, "text-green-400");
            gainExp(exp); 
            
            endCombat();
            return;
        }

        const defense = getStat('END') * 2;
        const rawEnemyDamage = gameState.currentEnemy.damage;
        const actualDamage = Math.max(1, rawEnemyDamage - defense); 
        
        if (Math.random() > 0.2) { 
            takeDamage(actualDamage); 
        } else {
            log(`${gameState.currentEnemy.name} verfehlt dich.`, "text-green-600");
        }

        if (!gameState.isGameOver) {
             els.text.innerHTML = `<b>Kampf gegen ${gameState.currentEnemy.name} läuft!</b> Wähle Aktion:`;
        }
        
        updateUI();
    }

    function resolveFlee(forced = false) {
        if (!gameState.currentEnemy) return; 

        if (!forced) log("Fluchtversuch...", "text-yellow-400");
        
        const fleeChance = 0.4 + (getStat('AGI') * 0.05); 
        
        if (Math.random() < fleeChance || forced) { 
            log("Entkommen."); 
            endCombat();
        } else { 
            takeDamage(10); 
            
            if(!gameState.isGameOver) {
                log("Flucht fehlgeschlagen! Der Kampf geht weiter.", "text-red-500"); 
                els.text.innerHTML = `Flucht fehlgeschlagen. <b>Kampf gegen ${gameState.currentEnemy.name} läuft!</b> Wähle Aktion:`;
            } else {
                endCombat();
            }
        }
        
        updateUI();
    }
    
    function endCombat() {
        if (gameState.originalWeaponDuringCombat) {
            gameState.equipment.weapon = gameState.originalWeaponDuringCombat;
            gameState.originalWeaponDuringCombat = null;
            
            const newMaxHp = calculateMaxHP(getStat('END'));
            gameState.maxHealth = newMaxHp;
            
            log(`Zurück zur Waffe: ${gameState.equipment.weapon.name}.`, 'text-green-500');
        }

        gameState.currentEnemy = null;
        gameState.inDialog = false;
        els.btns.innerHTML = '';
        els.text.textContent = "Ödland Ebene.";
        
        if(gameState.currentView === 'combat') {
            switchView('map');
        } else {
            updateUI();
        }
    }

    function checkDeath() {
        if (gameState.health <= 0) {
            quitGame(true);
        }
    }
    
    function quitGame(isDeath = false) {
        if (gameState.isGameOver) return;
        
        gameState.isGameOver = true;
        gameState.health = Math.max(0, gameState.health);
        
        if (isDeath) {
            els.text.innerHTML = "<b>STATUS: KRITISCH</b>";
            log("SYSTEMAUSFALL. Das Ödland hat dich verschluckt.", "text-red-700");
        } else {
            els.text.innerHTML = "<b>SPIEL BEENDET</b>.";
            log("Spiel manuell beendet. Starte neu, um fortzufahren.", "text-gray-500");
        }
        
        endCombat(); 
        updateUI();
    }

    function victory() {
        gameState.isGameOver = true;
        els.text.innerHTML = "<b>ZIEL ERREICHT!</b>";
        log("Die Vault ist gerettet. Du hast überlebt!", "text-green-400");
        updateUI();
    }

    // WICHTIG: Draw-Loop bei Größenänderung neu starten/anpassen
    function handleResize() {
        if (gameState.currentView === 'map') {
             // Einmaliges Zeichnen anfordern, um Skalierung anzupassen
             if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            draw();
        }
        updateUI();
    }

    window.increaseTempStat = increaseTempStat;
    window.applyStatPoint = applyStatPoint;
    window.movePlayer = movePlayer;
    window.confirmCityEntry = confirmCityEntry;
    window.confirmSectorChange = confirmSectorChange; 
    window.resolveCombat = resolveCombat;
    window.resolveFlee = resolveFlee;
    window.switchView = switchView;
    window.initNewGame = initNewGame;
    window.quitGame = quitGame;
    window.showBuyMenu = showBuyMenu; 
    window.showWiki = showWiki;
    window.showMonsterDetails = showMonsterDetails;
    window.showWorldMap = showWorldMap; 

    els.restart.onclick = initNewGame;
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    window.addEventListener('keydown', (e) => {
        if(gameState.currentView !== 'map' || gameState.inDialog || gameState.isGameOver) return;
        
        if(e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') movePlayer(0, -1);
        else if(e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') movePlayer(0, 1);
        else if(e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') movePlayer(-1, 0);
        else if(e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') movePlayer(1, 0);
    });

    function initNewGame() {
        els.log.innerHTML = '';
        worldState = {}; 

        // 1. Ziel-Sektor festlegen
        let goalX, goalY;
        do {
            const edge = Math.floor(Math.random() * 4); 
            if (edge === 0) { 
                goalY = 0;
                goalX = Math.floor(Math.random() * (WORLD_SIZE - 2)) + 1;
            } else if (edge === 1) { 
                goalY = WORLD_SIZE - 1;
                goalX = Math.floor(Math.random() * (WORLD_SIZE - 2)) + 1;
            } else if (edge === 2) { 
                goalX = 0;
                goalY = Math.floor(Math.random() * (WORLD_SIZE - 2)) + 1;
            } else { 
                goalX = WORLD_SIZE - 1;
                goalY = Math.floor(Math.random() * (WORLD_SIZE - 2)) + 1;
            }
        } while (goalX === START_SECTOR_X && goalY === START_SECTOR_Y);
        
        GOAL_SECTOR.x = goalX;
        GOAL_SECTOR.y = goalY;
        
        // 2. Erzeuge die Startkarte (Sektor 5,5)
        const { layout, startX, startY } = generateRandomMap(START_SECTOR_X, START_SECTOR_Y);
        mapLayout = layout.map(row => row.split(''));

        // 3. Initialisiere GameState
        const initialEquipment = { 
            head: items.none_head, 
            body: items.armor_vault, 
            feet: items.none_feet,
            weapon: items.fists
        };

        const initialEndurance = 5 + 1; // Base 5 + Vault Suit 1
        const initialMaxHp = calculateMaxHP(initialEndurance);

        gameState = {
            currentSector: { x: START_SECTOR_X, y: START_SECTOR_Y }, 
            player: { x: startX, y: startY },
            stats: {...BASE_STATS},
            equipment: initialEquipment,
            health: initialMaxHp, 
            maxHealth: initialMaxHp, 
            ammo: 10,
            caps: 50,
            explored: {}, 
            inDialog: false,
            isGameOver: false,
            currentView: 'map', 
            currentZone: "Ödland",
            currentEnemy: null,
            level: 1,
            exp: 0,
            statPoints: 0,
            tempStatIncrease: {},
            originalWeaponDuringCombat: null 
        };
        
        // UI-Views zurücksetzen
        els.cityView.style.display = 'none';
        els.charView.style.display = 'none';
        els.wikiView.style.display = 'none';
        els.combatView.style.display = 'none'; 
        els.worldMapView.style.display = 'none'; 
        els.mapView.style.display = 'flex';
        els.text.textContent = "System initialisiert...";
        els.btns.innerHTML = '';
        
        revealMap(startX, startY);
        
        if (animationFrameId) {
             cancelAnimationFrame(animationFrameId);
        }
        draw(); // Startet den Draw-Loop
        
        handleResize(); 
        updateUI(); 
        log("Neues Spiel gestartet. Du verlässt den Vault.", "text-yellow-400");
    }

    // Beim Laden des Skripts initNewGame aufrufen
    // Wichtig: Auf window.onload warten oder Funktion ans Ende des Skripts verschieben.
    window.onload = initNewGame;

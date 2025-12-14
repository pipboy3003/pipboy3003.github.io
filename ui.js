// ui.js
// Enthält alle DOM-Referenzen, UI-Aktualisierungslogik und View-Management.

const UI = {
    els: {},
    
    init: function() {
        // Initiiere alle DOM-Referenzen einmalig
        this.els = {
            hp: document.getElementById('health-display'),
            hpBar: document.getElementById('hp-bar'),
            ammo: document.getElementById('ammo-display'),
            caps: document.getElementById('caps-display'),
            text: document.getElementById('encounter-text'),
            btns: document.getElementById('action-buttons'),
            log: document.getElementById('log-area'),
            restart: document.getElementById('restart-button'),
            moveContainer: document.getElementById('movement-container'),
            pipBoyCase: document.getElementById('pipboy-case'),
            gameScreen: document.getElementById('game-screen'),
            viewContentArea: document.getElementById('view-content-area'), 
            
            charBtn: document.getElementById('char-btn'),
            mapBtn: document.getElementById('map-btn'), 
            wikiBtn: document.getElementById('wiki-btn'),
            
            zoneDisplay: document.getElementById('current-zone-display'),
            levelDisplay: document.getElementById('level-display'),
            expCurrentDisplay: document.getElementById('exp-current-display'), 
            
            // Referenzen für dynamisch geladene Inhalte müssen später geholt werden:
            // stats, equip, levelDisplayChar, expBar, cityOptions, etc.
        };
        
        window.addEventListener('resize', this.handleResize.bind(this));
        window.addEventListener('orientationchange', this.handleResize.bind(this));

        // Erstelle globale Funktionen für die Views (Stat-Buttons, City-Actions)
        window.increaseTempStat = this.increaseTempStat.bind(this);
        window.applyStatPoint = this.applyStatPoint.bind(this);
        window.enterCity = this.enterCity.bind(this);
        window.showBuyMenu = this.showBuyMenu.bind(this);
        window.showWiki = this.showWiki.bind(this);
        window.showMonsterDetails = this.showMonsterDetails.bind(this);
        window.showWorldMap = this.showWorldMap.bind(this); 
    },
    
    log: function(msg, colorClass = '') {
        const div = document.createElement('div');
        div.className = `mb-1 ${colorClass} pip-text`;
        div.innerHTML = `> ${msg}`;
        this.els.log.insertBefore(div, this.els.log.firstChild); 
    },
    
    updateUI: function() {
        if (!Game.gameState.level) return; // Warten auf Initialisierung

        const currentMaxHp = Game.calculateMaxHP(Game.getStat('END'));
        
        // Header Status Bar
        this.els.levelDisplay.textContent = Game.gameState.level;
        this.els.expCurrentDisplay.textContent = Game.gameState.exp;
        this.els.hp.textContent = `${Math.round(Game.gameState.health)}/${currentMaxHp}`; 
        const hpPercent = Math.max(0, (Game.gameState.health / currentMaxHp) * 100); 
        this.els.hpBar.style.width = `${hpPercent}%`;
        this.els.hpBar.className = Game.gameState.health < (currentMaxHp * 0.3) ? 'bg-red-500 h-full' : 'bg-[#39ff14] h-full';
        
        this.els.ammo.textContent = Game.gameState.ammo;
        this.els.caps.textContent = `${Game.gameState.caps} Kronenkorken`;
        this.els.zoneDisplay.textContent = `${Game.gameState.currentZone} (${Game.gameState.currentSector.x},${Game.gameState.currentSector.y})`;

        // View-spezifische Updates
        const currentView = document.getElementById(Game.gameState.currentView + '-view');
        
        if (currentView) {
            switch (Game.gameState.currentView) {
                case 'character':
                    this.updateCharView(currentMaxHp);
                    break;
                case 'combat':
                    this.updateCombatView();
                    break;
                case 'wiki':
                    // Wiki muss nur bei switchView aktualisiert werden
                    break;
                case 'worldmap':
                    // Worldmap muss nur bei switchView aktualisiert werden
                    break;
            }
        }

        // Steuerung und Game Over
        // Steuerung ist nur sichtbar auf der MAP, wenn kein Dialog läuft und das Spiel nicht vorbei ist.
        const isControlHidden = Game.gameState.inDialog || Game.gameState.isGameOver || Game.gameState.currentView !== 'map';
        
        // Anzeigen/Verstecken der Bewegungssteuerung
        if (this.els.moveContainer) {
            this.els.moveContainer.style.visibility = isControlHidden ? 'hidden' : 'visible';
        }
        
        // Anzeigen/Verstecken der Dialog-Buttons
        this.els.btns.style.display = Game.gameState.inDialog ? 'flex' : 'none'; 
        this.els.restart.style.display = Game.gameState.isGameOver ? 'block' : 'none';

        // Stellt sicher, dass die Stat-Buttons in der Char-Ansicht sichtbar sind
        if (Game.gameState.currentView === 'character' && Game.gameState.statPoints > 0) {
            // Re-render, um die Stat-Buttons zu aktualisieren
            this.updateCharView(currentMaxHp);
        }
    },
    
    // --- VIEW MANAGEMENT ---
    
    // Asynchrones Laden von HTML-Views
    loadView: async function(viewName) {
        // Pfad zur View-Datei im Unterordner 'views'
        const path = `views/${viewName}.html`; 
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`View ${path} not found. Status: ${response.status}`);
            return await response.text();
        } catch (error) {
            this.log(`FEHLER beim Laden der View ${viewName}: ${error.message}`, 'text-red-500');
            // Zeigt eine Fehlermeldung, wenn das Laden fehlschlägt
            return `<div id="${viewName}-view" class="view justify-center items-center text-red-500" style="display: flex;">FEHLER: View ${viewName} konnte nicht geladen werden. Prüfen Sie den views/-Ordner und die Pfade.</div>`;
        }
    },

    switchView: async function(newView, forceReload = false) {
        // Wenn die Ansicht bereits aktiv ist und kein Neuladen erzwungen wird, tue nichts
        if (Game.gameState.currentView === newView && !forceReload) return;

        const oldViewEl = document.getElementById(Game.gameState.currentView + '-view');
        let newViewEl = document.getElementById(newView + '-view');
        
        // Buttons deaktivieren während des Übergangs
        this.els.charBtn.disabled = true; 
        this.els.wikiBtn.disabled = true;
        this.els.mapBtn.disabled = true;
        
        // Fade Out der alten View
        if (oldViewEl && oldViewEl.classList.contains('active')) {
            oldViewEl.classList.add('transition-out');
            oldViewEl.classList.remove('active');
        }

        // Stoppe den Draw-Loop, wenn die Karte verlassen wird
        if (newView !== 'map' && Game.animationFrameId) {
            cancelAnimationFrame(Game.animationFrameId);
            Game.animationFrameId = null;
        }

        // Lade neue View, falls sie noch nicht im DOM ist (oder Neuladen erzwungen)
        if (!newViewEl || forceReload) {
            const htmlContent = await this.loadView(newView);
            
            // Entferne alte Instanz, falls vorhanden
            if (newViewEl) {
                newViewEl.remove();
            }
            
            // Füge neue View in den DOM ein
            this.els.viewContentArea.insertAdjacentHTML('beforeend', htmlContent);
            newViewEl = document.getElementById(newView + '-view');
            
            if (!newViewEl) {
                 // Kritischer Fehler: View konnte nicht geladen/eingefügt werden
                 this.log(`KRITISCH: View ${newView} konnte nicht im DOM gefunden werden.`, 'text-red-700');
                 // Buttons reaktivieren und abbrechen
                 this.els.charBtn.disabled = false; 
                 this.els.wikiBtn.disabled = false;
                 this.els.mapBtn.disabled = false;
                 return Promise.reject(`View ${newView} not found after insert.`);
            }
        }
        
        // Nach der Transition
        return new Promise(resolve => {
            setTimeout(() => {
                if (oldViewEl) {
                    oldViewEl.style.display = 'none';
                    oldViewEl.classList.remove('transition-out');
                }
                
                newViewEl.style.display = 'flex';
                newViewEl.classList.add('active');
                
                Game.gameState.currentView = newView;
                
                // Spezialaktionen nach dem Umschalten
                this.postSwitchActions(newView);
                
                // Buttons reaktivieren
                setTimeout(() => {
                    this.els.charBtn.disabled = false; 
                    this.els.wikiBtn.disabled = false;
                    this.els.mapBtn.disabled = false;
                }, 50);
                
                // Promise auflösen, sobald der Übergang abgeschlossen ist
                resolve(); 
            }, 300);
        });
    },

    postSwitchActions: function(newView) {
        Game.gameState.inDialog = false;
        
        if (newView === 'map') {
            this.els.text.textContent = "Zurück im Ödland.";
            Game.gameState.currentZone = "Ödland";
            this.clearCityDialog();
            Game.draw(); // Startet den Loop neu
        } else if (newView === 'worldmap') { 
            this.els.text.textContent = "Globalen Sektor-Scan aufgerufen.";
            Game.gameState.currentZone = "WELTKARTE";
            this.showWorldMap();
        } else if (newView === 'city') {
            this.els.text.textContent = "Willkommen in Rusty Springs.";
            Game.gameState.currentZone = "Rusty Springs";
            this.enterCity();
            Game.gameState.inDialog = true;
        } else if (newView === 'character') { 
            this.els.text.textContent = "Charakter Status überprüft.";
            Game.gameState.currentZone = "Status";
            this.updateCharView(Game.calculateMaxHP(Game.getStat('END')));
        } else if (newView === 'wiki') {
            this.els.text.textContent = "Ödland Wiki aufgerufen.";
            Game.gameState.currentZone = "WIKI";
            this.showWiki();
        } else if (newView === 'combat') {
            Game.gameState.currentZone = "Kampf!";
            Game.gameState.inDialog = true;
        }
        this.updateUI();
    },
    
    // --- Dialog/Button Management ---
    setDialogButtons: function(html) {
        this.els.btns.innerHTML = html;
        this.els.btns.style.display = 'flex';
        Game.gameState.inDialog = true;
    },

    clearDialogButtons: function() {
        this.els.btns.innerHTML = '';
        this.els.btns.style.display = 'none';
        Game.gameState.inDialog = false;
    },
    
    handleResize: function() {
        if (Game.gameState.currentView === 'map') {
             // Neustarten des Draw-Loops, um die Skalierung anzupassen
             if (Game.animationFrameId) {
                cancelAnimationFrame(Game.animationFrameId);
                Game.animationFrameId = null;
            }
            Game.draw();
        }
        this.updateUI();
    },
    
    // --- View-Spezifische Update Funktionen ---
    updateCombatView: function() {
        const enemyNameEl = document.getElementById('enemy-name-center');
        const enemyHpEl = document.getElementById('enemy-hp-display-center');
        if (enemyNameEl && Game.gameState.currentEnemy) {
             enemyNameEl.textContent = Game.gameState.currentEnemy.name.toUpperCase();
             enemyHpEl.textContent = `TP: ${Math.max(0, Game.gameState.currentEnemy.hp)}/${Game.gameState.currentEnemy.maxHp}`;
        }
    },

    updateCharView: function(currentMaxHp) {
        const charEls = {
            levelDisplayChar: document.getElementById('level-display-char'),
            expDisplayChar: document.getElementById('exp-display-char'),
            expNeededChar: document.getElementById('exp-needed-char'),
            expBar: document.getElementById('exp-bar'),
            statPointsDisplay: document.getElementById('stat-points-display'),
            applyStatBtn: document.getElementById('apply-stat-btn'),
            stats: document.getElementById('stat-display'), 
            equip: document.getElementById('equipment-display')
        };
        
        if (!charEls.stats) return; 

        charEls.levelDisplayChar.textContent = Game.gameState.level;
        charEls.expDisplayChar.textContent = Game.gameState.exp;
        
        const expNeeded = Game.expToNextLevel(Game.gameState.level);
        charEls.expNeededChar.textContent = expNeeded;
        
        const progressPercent = (Game.gameState.exp / expNeeded) * 100;
        charEls.expBar.style.width = `${progressPercent}%`;
        
        charEls.statPointsDisplay.textContent = Game.gameState.statPoints;
        charEls.applyStatBtn.disabled = !(Game.gameState.statPoints > 0 && Game.gameState.tempStatIncrease.key);

        charEls.stats.innerHTML = Object.keys(BASE_STATS).map(k => {
            const baseVal = Game.gameState.stats[k];
            const finalVal = Game.getStat(k);
            const isTempIncreased = Game.gameState.tempStatIncrease.key === k;
            
            let displayVal = finalVal;
            if (finalVal !== baseVal) {
                const diff = finalVal - baseVal;
                displayVal = `${finalVal} (${baseVal}${diff > 0 ? '+' : ''}${diff})`; 
            }
            
            let btn = '';
            if (Game.gameState.statPoints > 0 && !isTempIncreased) {
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

        charEls.equip.innerHTML = `
            <div>Helm: <span class="pip-stat-value">${Game.gameState.equipment.head.name}</span></div>
            <div>Körper: <span class="pip-stat-value">${Game.gameState.equipment.body.name}</span></div>
            <div>Füße: <span class="pip-stat-value">${Game.gameState.equipment.feet.name}</span></div>
            <div>Waffe: <span class="pip-stat-value">${Game.gameState.equipment.weapon.name}</span></div>
        `;
    },
    
    // --- Stat Logic (muss hier sein wegen DOM-Manipulation) ---
    increaseTempStat: function(key, buttonElement) {
        if (Game.gameState.statPoints > 0) {
            // Wenn bereits ein Temp-Stat gesetzt ist, deaktiviere den alten Button
            if (Game.gameState.tempStatIncrease.key && Game.gameState.tempStatIncrease.key !== key) {
                // Finde den alten Button über das DOM
                const prevButton = document.querySelector(`[data-stat-key="${Game.gameState.tempStatIncrease.key}"]`);
                if (prevButton) prevButton.disabled = false;
            }
            
            Game.gameState.tempStatIncrease.key = key;
            Game.gameState.tempStatIncrease.value = 1; // Wir erlauben nur +1 pro Punkt
            buttonElement.disabled = true;
            this.updateUI();
        } else {
            this.log("Keine Stat-Punkte verfügbar.", 'text-gray-500');
        }
    },

    applyStatPoint: function() {
        if (Game.gameState.statPoints > 0 && Game.gameState.tempStatIncrease.key) {
            const statKey = Game.gameState.tempStatIncrease.key;
            Game.gameState.stats[statKey]++; 
            Game.gameState.statPoints--; 
            
            if (statKey === 'END') {
                const newMaxHp = Game.calculateMaxHP(Game.getStat('END'));
                Game.gameState.maxHealth = newMaxHp;
                this.log(`Max HP auf ${newMaxHp} erhöht (+10)!`, 'text-green-400');
            }
            
            this.log(`${statKey} permanent auf ${Game.gameState.stats[statKey]} erhöht.`, 'text-yellow-400');
            Game.gameState.tempStatIncrease = {}; 
            this.updateUI();
        }
    },
    
    // --- City/Shop Logic ---
    showCityDialog: function(options) {
        const cityOptionsEl = document.getElementById('city-options');
        if (!cityOptionsEl) return;
        
        Game.gameState.inDialog = true;
        cityOptionsEl.innerHTML = '';
        
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'action-button w-full text-base';
            btn.innerHTML = opt.text;
            
            let isDisabled = opt.isDisabled || false;
            
            if (opt.cost && Game.gameState.caps < opt.cost) {
                isDisabled = true;
                if (!opt.isDisabled) { 
                    btn.innerHTML += `<br> (Fehlt ${opt.cost-Game.gameState.caps} KK)`;
                }
            }

            btn.disabled = isDisabled;

            btn.onclick = () => {
                if (opt.cost) {
                    Game.gameState.caps -= opt.cost;
                }
                opt.action();
                this.updateUI(); 
            };
            cityOptionsEl.appendChild(btn);
        });
        this.updateUI();
    },

    clearCityDialog: function() {
        const cityOptionsEl = document.getElementById('city-options');
        const cityHeader = document.getElementById('city-view-content').querySelector('.city-header');
        if (cityOptionsEl) cityOptionsEl.innerHTML = '';
        if (cityHeader) cityHeader.textContent = "RUSTY SPRINGS";
        Game.gameState.inDialog = false;
    },

    enterCity: function() {
        const cityHeader = document.getElementById('city-view-content').querySelector('.city-header');
        if (cityHeader) cityHeader.textContent = "RUSTY SPRINGS";

        this.showCityDialog([
            { text: "Arzt (25 KK) | TP vollst.", cost: 25, action: () => {
                Game.gameState.health = Game.gameState.maxHealth; 
                this.log("Vollständig geheilt.", "text-green-400"); 
                this.enterCity();
            }, isDisabled: Game.gameState.health === Game.gameState.maxHealth }, 
            { text: "Händler | Munition (+5) 10 KK", cost: 10, action: () => {
                Game.gameState.ammo += 5; this.log("+5 Munition gekauft.", "text-green-400"); this.enterCity();
            }},
            { text: "Ausrüstung kaufen/ansehen", action: () => this.showBuyMenu() },
            { text: "Stat Punkte Zuweisen", action: () => this.switchView('character') },
            { text: "Stadt verlassen", action: () => this.switchView('map') }
        ]);
    },
    
    showBuyMenu: function() {
        const cityHeader = document.getElementById('city-view-content').querySelector('.city-header');
        if (cityHeader) cityHeader.textContent = "HÄNDLER";
        
        const allPricedItems = Object.values(Game.items).filter(item => item.cost > 0);

        const dialogOptions = allPricedItems.map(opt => {
            const currentItem = Game.gameState.equipment[opt.slot];
            const isEquipped = currentItem && currentItem.name === opt.name;
            const isLevelTooLow = Game.gameState.level < opt.requiredLevel;

            if (Game.gameState.level < opt.requiredLevel - 5) return null;
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
                isDisabled: isDisabled,
                action: () => {
                    Game.gameState.equipment[opt.slot] = opt; 
                    const newMaxHp = Game.calculateMaxHP(Game.getStat('END'));
                    Game.gameState.maxHealth = newMaxHp;

                    this.log(`${opt.name} ausgerüstet und gekauft.`, 'text-yellow-400');
                    this.showBuyMenu();
                }
            };
        }).filter(Boolean);

        dialogOptions.push({ text: "Zurück zum Markt", action: () => this.enterCity() });

        this.showCityDialog(dialogOptions);
    },
    
    // --- World Map Logic ---
    showWorldMap: function() {
        const gridEl = document.getElementById('world-map-grid');
        if (!gridEl) return;
        
        gridEl.innerHTML = '';
        
        for (let y = 0; y < WORLD_SIZE; y++) {
            for (let x = 0; x < WORLD_SIZE; x++) {
                const key = Game.getSectorKey(x, y);
                const sector = Game.worldState[key];
                const tile = document.createElement('div');
                tile.className = 'sector-tile';
                
                let isExplored = sector && sector.explored;
                let markers = sector ? sector.markers : [];
                
                if (isExplored) {
                    tile.classList.add('explored');
                }
                
                if (x === Game.gameState.currentSector.x && y === Game.gameState.currentSector.y) {
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
                
                gridEl.appendChild(tile);
            }
        }
    },

    // --- Wiki Logic ---
    showWiki: function() {
        const wikiContentEl = document.getElementById('wiki-content');
        if (!wikiContentEl) return;
        
        let html = '<h2 class="section-header mb-3">BEKANNTE MONSTER</h2><ul class="space-y-2">';
        
        Object.keys(Game.monsters).forEach(key => {
            const monster = Game.monsters[key];
            html += `
                <li class="pip-text border-b border-gray-700 pb-1 flex justify-between items-center">
                    <span>${monster.name} (LVL ${monster.minLevel}+)</span>
                    <button class="action-button px-2 py-1 text-xs" onclick="showMonsterDetails('${key}')">DETAILS</button>
                </li>
            `;
        });
        
        html += '</ul>';
        wikiContentEl.innerHTML = html;
    },

    showMonsterDetails: function(key) {
        const monster = Game.monsters[key];
        const wikiContentEl = document.getElementById('wiki-content');
        if (!monster || !wikiContentEl) return;

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
        wikiContentEl.innerHTML = html;
    }
};

window.UI = UI;

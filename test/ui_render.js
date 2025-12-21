// Extending UI object with Render methods
Object.assign(UI, {
    
    update: function() {
        if (!Game.state) return;
        if(this.els.name && typeof Network !== 'undefined') this.els.name.textContent = (Network.myDisplayName || "SURVIVOR") + (Game.state.sector ? ` [${Game.state.sector.x},${Game.state.sector.y}]` : "");
        if(this.els.lvl) this.els.lvl.innerHTML = Game.state.statPoints > 0 ? `${Game.state.lvl} <span class="text-yellow-400 animate-pulse text-xs">LVL UP!</span>` : Game.state.lvl;
        const nextXp = Game.expToNextLevel(Game.state.lvl);
        const expPct = Math.min(100, Math.floor((Game.state.xp / nextXp) * 100));
        if(this.els.xpTxt) this.els.xpTxt.textContent = expPct;
        if(this.els.expBarTop) this.els.expBarTop.style.width = `${expPct}%`;
        const maxHp = Game.state.maxHp;
        if(this.els.hp) this.els.hp.textContent = `${Math.round(Game.state.hp)}/${maxHp}`;
        if(this.els.hpBar) this.els.hpBar.style.width = `${Math.max(0, (Game.state.hp / maxHp) * 100)}%`;
        if(this.els.caps) this.els.caps.textContent = `${Game.state.caps}`;
        
        const inCombat = Game.state.view === 'combat';
        [this.els.btnWiki, this.els.btnMap, this.els.btnChar, this.els.btnQuests, this.els.btnSave, this.els.btnLogout, this.els.btnInv].forEach(btn => { if(btn) btn.disabled = inCombat; });
    },

    shakeView: function() {
        if(this.els.view) {
            this.els.view.classList.remove('shake');
            void this.els.view.offsetWidth;
            this.els.view.classList.add('shake');
            setTimeout(() => { if(this.els.view) this.els.view.classList.remove('shake'); }, 300);
        }
    },

    toggleView: function(name) { Game.state.view === name ? this.switchView('map') : this.switchView(name); },

    switchView: async function(name) {
        this.stopJoystick();
        this.focusIndex = -1;
        if(this.els.navMenu) this.els.navMenu.classList.add('hidden');
        if(this.els.playerList) this.els.playerList.style.display = 'none';

        if (name === 'map') {
            this.els.view.innerHTML = `<div id="map-view" class="w-full h-full flex justify-center items-center bg-black relative"><canvas id="game-canvas" class="w-full h-full object-contain" style="image-rendering: pixelated;"></canvas><button onclick="UI.switchView('worldmap')" class="absolute top-4 right-4 bg-black/80 border-2 border-green-500 text-green-500 p-2 rounded-full hover:bg-green-900 animate-pulse text-2xl">🌍</button></div>`;
            Game.state.view = name;
            Game.initCanvas();
            this.restoreOverlay();
            this.toggleControls(true);
            this.updateButtonStates(name);
            this.update();
            return;
        }

        if(name === 'hacking') { this.renderHacking(); Game.state.view = name; return; }
        if(name === 'lockpicking') { this.renderLockpicking(true); Game.state.view = name; return; }

        try {
            const ver = document.getElementById('version-display').textContent.trim();
            const res = await fetch(`views/${name}.html?v=${ver}`);
            if (!res.ok) throw new Error(`View '${name}' not found`);
            this.els.view.innerHTML = await res.text();
            Game.state.view = name;
            this.restoreOverlay();
            this.toggleControls(false);
            
            if(name === 'worldmap') this.renderWorldMap();
            if(name === 'char') this.renderChar();
            if(name === 'inventory') this.renderInventory();
            if(name === 'wiki') this.renderWiki();
            if(name === 'city') this.renderCity();
            if(name === 'quests') this.renderQuests();
            if(name === 'crafting') this.renderCrafting();
            
            this.updateButtonStates(name);
            this.update();
            setTimeout(() => this.refreshFocusables(), 100);
        } catch (e) { this.error(`Ladefehler: ${e.message}`); }
    },

    updateButtonStates: function(activeName) {
        if(this.els.btnWiki) this.els.btnWiki.classList.toggle('active', activeName === 'wiki');
        if(this.els.btnMap) this.els.btnMap.classList.toggle('active', activeName === 'worldmap');
        if(this.els.btnChar) this.els.btnChar.classList.toggle('active', activeName === 'char');
        if(this.els.btnInv) this.els.btnInv.classList.toggle('active', activeName === 'inventory');
        if(this.els.btnQuests) this.els.btnQuests.classList.toggle('active', activeName === 'quests');
    },

    restoreOverlay: function() {
        if(document.getElementById('joystick-base')) return;
        this.els.view.insertAdjacentHTML('beforeend', `<div id="joystick-base" style="position: absolute; width: 100px; height: 100px; border-radius: 50%; border: 2px solid rgba(57, 255, 20, 0.5); background: rgba(0, 0, 0, 0.2); display: none; pointer-events: none; z-index: 9999;"></div><div id="joystick-stick" style="position: absolute; width: 50px; height: 50px; border-radius: 50%; background: rgba(57, 255, 20, 0.8); display: none; pointer-events: none; z-index: 10000; box-shadow: 0 0 10px #39ff14;"></div><div id="dialog-overlay" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 50; display: none; flex-direction: column; align-items: center; justify-content: center; gap: 5px; width: auto; max-width: 90%;"></div>`);
        this.els.joyBase = document.getElementById('joystick-base');
        this.els.joyStick = document.getElementById('joystick-stick');
        this.els.dialog = document.getElementById('dialog-overlay');
    },
    
    toggleControls: function(show) { if (!show && this.els.dialog) this.els.dialog.innerHTML = ''; },

    // --- RENDERERS (FIXED: window.GameData) ---

    renderHacking: function() { /* ... Code wie v0.3.8 ... */ },
    renderLockpicking: function(init) { /* ... Code wie v0.3.8 ... */ },

    renderCharacterSelection: function(saves) {
        this.charSelectMode = true;
        this.currentSaves = saves;
        this.els.loginScreen.style.display = 'none';
        this.els.charSelectScreen.style.display = 'flex';
        this.els.charSlotsList.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const slot = document.createElement('div');
            slot.className = "char-slot";
            const save = saves[i];
            if (save) {
                slot.innerHTML = `<div class="flex flex-col"><span class="text-xl text-yellow-400 font-bold">${save.playerName}</span><span class="text-xs text-green-300">Level ${save.lvl} | Sektor ${save.sector ? save.sector.x+','+save.sector.y : '?,?'}</span></div><div class="text-xs text-gray-500">SLOT ${i+1}</div>`;
            } else {
                slot.classList.add('empty-slot');
                slot.innerHTML = `<div class="flex flex-col"><span class="text-xl text-gray-400">[ LEER ]</span></div><div class="text-xs text-gray-700">SLOT ${i+1}</div>`;
            }
            slot.onclick = () => this.selectSlot(i);
            this.els.charSlotsList.appendChild(slot);
        }
        this.selectSlot(0);
    },

    renderInventory: function() {
        const list = document.getElementById('inventory-list');
        const countDisplay = document.getElementById('inv-count');
        const capsDisplay = document.getElementById('inv-caps');
        if(!list || !Game.state.inventory) return;
        
        list.innerHTML = '';
        capsDisplay.textContent = Game.state.caps;
        let totalItems = 0;
        
        Game.state.inventory.forEach((entry) => {
            if(entry.count <= 0) return;
            totalItems += entry.count;
            const item = window.GameData.items[entry.id]; // FIX
            
            const btn = document.createElement('div');
            btn.className = "relative border border-green-500 bg-green-900/30 w-full h-16 flex flex-col items-center justify-center cursor-pointer hover:bg-green-500 hover:text-black transition-colors group";
            btn.innerHTML = `<div class="text-[10px] truncate max-w-full px-1 font-bold">${item ? item.name : entry.id}</div><div class="absolute top-0 right-0 bg-green-900 text-white text-[10px] px-1 font-mono">${entry.count}</div>`;
            btn.onclick = () => { if(item && item.type !== 'junk') this.showItemConfirm(entry.id); };
            list.appendChild(btn);
        });
        countDisplay.textContent = totalItems;
    },

    renderChar: function() {
        const grid = document.getElementById('stat-grid');
        if(!grid) return;
        const statOrder = ['STR', 'PER', 'END', 'INT', 'AGI', 'LUC'];
        grid.innerHTML = statOrder.map(k => {
            const val = Game.getStat(k);
            const btn = Game.state.statPoints > 0 ? `<button class="w-12 h-12 border-2 border-green-500 bg-green-900/50" onclick="Game.upgradeStat('${k}')">+</button>` : '';
            return `<div class="flex justify-between items-center border-b border-green-900/30 py-1 h-14"><span>${k}</span> <div class="flex items-center"><span class="text-yellow-400 font-bold mr-4 text-xl">${val}</span>${btn}</div></div>`;
        }).join('');
        document.getElementById('char-exp').textContent = Game.state.xp;
        document.getElementById('char-next').textContent = Game.expToNextLevel(Game.state.lvl);
        document.getElementById('char-points').textContent = Game.state.statPoints;
    },
    
    renderWorldMap: function() {
        const grid = document.getElementById('world-grid');
        const info = document.getElementById('sector-info');
        if(!grid) return;
        
        grid.innerHTML = '';
        
        const colors = window.GameData.colors || {}; // Use safe colors
        const currentBiome = WorldGen.getSectorBiome(Game.state.sector.x, Game.state.sector.y);
        if(info) info.textContent = `${currentBiome.toUpperCase()} [${Game.state.sector.x}, ${Game.state.sector.y}]`;

        for(let y=0; y<8; y++) {
            for(let x=0; x<8; x++) {
                const cell = document.createElement('div');
                cell.className = "w-full h-full border text-[10px] flex flex-col items-center justify-center relative transition-all duration-300";
                
                const key = `${x},${y}`;
                const isCurrent = (Game.state.sector.x === x && Game.state.sector.y === y);
                const visited = Game.state.visitedSectors && Game.state.visitedSectors.includes(key);
                const biome = WorldGen.getSectorBiome(x, y);
                
                let iconHtml = '';
                if (biome === 'city') iconHtml = '<span class="text-3xl">🏙️</span>'; 
                if (biome === 'vault') iconHtml = '<span class="text-3xl">⚙️</span>'; 

                if (isCurrent) {
                    cell.className += " bg-[#1aff1a] text-black font-bold border-white z-20 shadow-[0_0_15px_#1aff1a] leading-none overflow-visible";
                    cell.innerHTML = `${iconHtml}<span class="font-bold text-xs" style="margin-top:-5px">YOU</span>`;
                } else if (visited) {
                    // Falls Farbcodes fehlen, fallback
                    const bgClass = biome === 'forest' ? 'bg-green-800' : (biome === 'desert' ? 'bg-yellow-600' : 'bg-gray-600');
                    cell.className += ` ${bgClass} text-white/90`;
                    cell.innerHTML = iconHtml;
                } else {
                    cell.className += " bg-black border-[#1aff1a] border-opacity-20";
                    cell.style.backgroundImage = "radial-gradient(circle, rgba(0,50,0,0.5) 1px, transparent 1px)";
                    cell.style.backgroundSize = "4px 4px";
                }
                grid.appendChild(cell);
            }
        }
    },

    renderWiki: function(category = 'monsters') {
        const content = document.getElementById('wiki-content');
        if(!content) return;
        // Fix for undefined
        const monsters = window.GameData.monsters || {};
        const items = window.GameData.items || {};
        const recipes = window.GameData.recipes || [];

        let htmlBuffer = '';
        if(category === 'monsters') {
            Object.keys(monsters).forEach(k => {
                const m = monsters[k];
                htmlBuffer += `<div class="border border-green-900 bg-green-900/10 p-3 mb-2"><div class="font-bold text-yellow-400">${m.name}</div><div class="text-xs">HP: ${m.hp} | XP: ${m.xp}</div></div>`;
            });
        } else if (category === 'items') {
            Object.keys(items).forEach(k => {
                const i = items[k];
                htmlBuffer += `<div class="border-b border-green-900 py-1"><span class="font-bold">${i.name}</span> <span class="text-xs text-gray-400">${i.cost} KK</span></div>`;
            });
        } else if (category === 'locs') {
             htmlBuffer += `
                <div class="mb-3 border-l-2 border-green-500 pl-2"><div class="font-bold text-cyan-400 text-lg">VAULT 1337</div><div class="text-sm text-green-200">Dein Zuhause.</div></div>
                <div class="mb-3 border-l-2 border-green-500 pl-2"><div class="font-bold text-cyan-400 text-lg">RUSTY SPRINGS</div><div class="text-sm text-green-200">Handelsstadt.</div></div>
            `;
        }
        content.innerHTML = htmlBuffer;
    },

    renderQuests: function() { /* ... */ },
    renderCity: function() { /* ... */ },
    renderShop: function(container) { /* ... */ },
    renderCombat: function() { /* ... */ },
    renderSpawnList: function(players) { /* ... */ },
    renderCrafting: function() { /* ... */ },
    showItemConfirm: function(itemId) { /* ... */ },
    showDungeonWarning: function(callback) { /* ... */ },
    showDungeonLocked: function(minutesLeft) { /* ... */ },
    showDungeonVictory: function(caps, lvl) { /* ... */ },
    showPermadeathWarning: function() { /* ... */ },
    showGameOver: function() { /* ... */ },
    showManualOverlay: async function() { /* ... */ },
    showChangelogOverlay: async function() { /* ... */ },
    showMobileControlsHint: function() { /* ... */ },
    enterVault: function() { /* ... */ },
    leaveDialog: function() { Game.state.inDialog = false; this.els.dialog.style.display = 'none'; this.update(); },
    updatePlayerList: function() { /* ... */ },
    togglePlayerList: function() { /* ... */ }
});

// [TIMESTAMP] 2026-01-15 22:45:00 - ui_render_core.js - Fixed View Switching & Tab Logic

Object.assign(UI, {
    
    update: function() {
        // --- AFK LOGIC ---
        const loginScreen = document.getElementById('login-screen');
        const isLoginHidden = loginScreen && (loginScreen.style.display === 'none' || loginScreen.classList.contains('hidden'));
        const isAuth = (typeof Network !== 'undefined' && Network.myId);

        if (isLoginHidden && isAuth) {
            if (Date.now() - (this.lastInputTime || Date.now()) > 300000) { 
                console.log("AFK Trigger: Zeitüberschreitung im UI Render Loop");
                if(typeof this.logout === 'function') {
                    this.logout("AFK: ZEITÜBERSCHREITUNG");
                }
                return;
            }
        }

        if (!Game.state) return;
        
        // Element-Caching
        if(!this.els.ammo) this.els.ammo = document.getElementById('val-ammo');
        if(!this.els.caps) this.els.caps = document.getElementById('val-caps');
        if(!this.els.hp) this.els.hp = document.getElementById('bar-hp');
        if(!this.els.headerCharInfo) this.els.headerCharInfo = document.getElementById('header-char-info');

        const sectorDisplay = document.getElementById('val-sector-display');
        const hasPoints = (Game.state.statPoints > 0) || (Game.state.perkPoints > 0);

        const displayName = Game.state.playerName || (typeof Network !== 'undefined' ? Network.myDisplayName : "SURVIVOR");
        if(this.els.name) this.els.name.textContent = displayName;
        
        if(this.els.headerCharInfo) {
            if(hasPoints) this.els.headerCharInfo.classList.add('lvl-ready-glow');
            else this.els.headerCharInfo.classList.remove('lvl-ready-glow');
        }

        if(sectorDisplay) {
            const sx = Game.state.sector ? Game.state.sector.x : 0;
            const sy = Game.state.sector ? Game.state.sector.y : 0;
            sectorDisplay.innerHTML = `🌍 SEKTOR [${sx},${sy}]`;
        }

        if(this.els.lvl) this.els.lvl.textContent = Game.state.lvl;

        // HP & RADS
        const maxHp = Game.state.maxHp;
        const hp = Game.state.hp;
        const rads = Game.state.rads || 0;
        const effectiveMax = Math.max(1, maxHp - rads);
        const hpPct = Math.min(100, Math.max(0, (hp / maxHp) * 100));
        const radPct = Math.min(100, (rads / maxHp) * 100);
        
        const valHpEl = document.getElementById('val-hp');
        if(valHpEl) valHpEl.textContent = `TP ${Math.round(hp)}/${Math.round(effectiveMax)}`;

        if(this.els.hp) this.els.hp.style.width = `${hpPct}%`;
        const radBar = document.getElementById('bar-rads');
        if(radBar) radBar.style.width = `${radPct}%`;

        // XP
        const nextXp = Game.expToNextLevel(Game.state.lvl);
        const expPct = Math.min(100, Math.floor((Game.state.xp / nextXp) * 100));
        if(this.els.xpTxt) this.els.xpTxt.textContent = expPct;
        if(this.els.expBarTop) this.els.expBarTop.style.width = `${expPct}%`;
        
        if(this.els.caps) this.els.caps.textContent = `${Game.state.caps}`;
        const ammoItem = Game.state.inventory ? Game.state.inventory.find(i => i.id === 'ammo') : null;
        if(this.els.ammo) this.els.ammo.textContent = ammoItem ? ammoItem.count : 0;
        
        // Menu Alerts
        let hasAlert = hasPoints;
        const questsList = Game.state.quests || [];
        const unreadQuests = questsList.some(q => !q.read);
        
        if(this.els.btnChar) this.els.btnChar.classList.toggle('alert-glow-yellow', hasPoints);
        if(this.els.btnQuests) this.els.btnQuests.classList.toggle('alert-glow-cyan', unreadQuests);
        if(this.els.btnMenu) this.els.btnMenu.classList.toggle('alert-glow-yellow', hasAlert || unreadQuests);
    },

    switchView: async function(name) {
        this.stopJoystick();
        this.focusIndex = -1;

        if(this.els.navMenu) {
            this.els.navMenu.classList.add('hidden');
            this.els.navMenu.style.display = 'none';
        }
        if(this.els.playerList) this.els.playerList.style.display = 'none';

        const verDisplay = document.getElementById('version-display');
        const ver = verDisplay ? verDisplay.textContent.trim() : Date.now();
        
        if (name === 'map') {
            this.els.view.innerHTML = `
                <div id="map-view" class="w-full h-full flex justify-center items-center bg-black relative">
                    <canvas id="game-canvas" class="w-full h-full object-contain" style="image-rendering: pixelated;"></canvas>
                    <div id="val-sector-display" onclick="UI.switchView('worldmap')" class="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 border border-green-500 text-green-500 px-3 py-1 text-sm font-bold tracking-widest z-20 shadow-[0_0_10px_#39ff14] cursor-pointer rounded">🌍 SEKTOR [?,?]</div>
                    <button id="btn-camp-overlay" class="hidden absolute top-4 left-4 bg-black/80 border-2 border-green-500 text-green-500 p-2 rounded-lg z-20 shadow-[0_0_15px_#39ff14] cursor-pointer flex flex-col items-center">
                        <span class="text-2xl">⛺</span>
                        <span class="text-xs font-bold">Lager</span>
                    </button>
                </div>`;
            Game.state.view = name;
            Game.initCanvas();
            this.restoreOverlay();
            this.toggleControls(true);
            this.updateButtonStates(name);
            return;
        }

        if(name === 'hacking') { this.renderHacking(); return; }
        if(name === 'lockpicking') { this.renderLockpicking(true); return; }

        const path = `views/${name}.html?v=${ver}`;
        try {
            const res = await fetch(path);
            if (!res.ok) throw new Error(`View '${name}' not found`);
            const html = await res.text();
            this.els.view.innerHTML = html;
            Game.state.view = name;
            
            this.restoreOverlay();

            // WICHTIG: Verknüpfung der dynamischen Render-Funktionen
            if (name === 'char') {
                // Wir erzwingen hier den Aufruf unserer neuen renderStats Logik
                this.renderStats('stats'); 
            } else if (name === 'inventory') {
                this.renderInventory();
            } else if (name === 'wiki') {
                this.renderWiki();
            } else if (name === 'worldmap') {
                this.renderWorldMap();
            } else if (name === 'city') {
                this.renderCity();
            } else if (name === 'quests') {
                this.renderQuests();
            } else if (name === 'crafting') {
                this.renderCrafting();
            } else if (name === 'shop') {
                this.renderShop(document.getElementById('shop-list'));
            } else if (name === 'clinic') {
                this.renderClinic();
            } else if (name === 'camp') {
                if(typeof this.renderCamp === 'function') this.renderCamp();
            }
            
            this.updateButtonStates(name);
            this.update();

        } catch (e) { console.error(`Ladefehler: ${e.message}`); }
    },

    updateButtonStates: function(activeName) {
        if(this.els.btnWiki) this.els.btnWiki.classList.toggle('active', activeName === 'wiki');
        if(this.els.btnMap) this.els.btnMap.classList.toggle('active', activeName === 'worldmap');
        if(this.els.btnChar) this.els.btnChar.classList.toggle('active', (activeName === 'char' || activeName === 'stats'));
        if(this.els.btnInv) this.els.btnInv.classList.toggle('active', activeName === 'inventory');
        if(this.els.btnQuests) this.els.btnQuests.classList.toggle('active', activeName === 'quests');
    },

    restoreOverlay: function() {
        if(document.getElementById('joystick-base')) return;
        const joystickHTML = `
            <div id="joystick-base" style="position: absolute; width: 100px; height: 100px; border-radius: 50%; border: 2px solid rgba(57, 255, 20, 0.5); display: none; pointer-events: none; z-index: 9999;"></div>
            <div id="joystick-stick" style="position: absolute; width: 50px; height: 50px; border-radius: 50%; background: rgba(57, 255, 20, 0.8); display: none; pointer-events: none; z-index: 10000;"></div>
            <div id="dialog-overlay" style="position: fixed; inset: 0; z-index: 10001; display: none; background: rgba(0,0,0,0.6); backdrop-filter: blur(2px);"></div>
        `;
        document.body.insertAdjacentHTML('beforeend', joystickHTML);
        this.els.dialog = document.getElementById('dialog-overlay');
    },
    
    toggleControls: function(show) { if (!show && this.els.dialog) this.els.dialog.innerHTML = ''; }
});

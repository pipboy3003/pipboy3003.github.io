// [2026-02-22 02:15:00] ui_render_overlays.js - Permadeath Wipe & Clean Dialogs

Object.assign(UI, {
    
    restoreOverlay: function() {
        let overlay = document.getElementById('ui-dialog-overlay');
        if(!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'ui-dialog-overlay';
            overlay.className = "absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm hidden pointer-events-auto";
            document.body.appendChild(overlay);
            this.els.dialog = overlay;
        }
        
        overlay.onclick = (e) => {
            if(e.target === overlay) {
                e.preventDefault();
                e.stopPropagation();
                UI.leaveDialog();
            }
        };
        
        return overlay;
    },

    leaveDialog: function() {
        if(Game.state) Game.state.inDialog = false;
        
        if(this._activeEscHandler) {
            document.removeEventListener('keydown', this._activeEscHandler);
            this._activeEscHandler = null;
        }
        
        const overlay = this.els.dialog || document.getElementById('ui-dialog-overlay');
        if(overlay) {
            overlay.style.display = 'none';
            overlay.innerHTML = ''; 
        }
        
        if(typeof this.update === 'function') this.update();
        
        if(document.getElementById('inventory-list')) {
            if(typeof UI.renderInventory === 'function') UI.renderInventory();
        }
    },

    _trapEscKey: function() {
        if(this._activeEscHandler) document.removeEventListener('keydown', this._activeEscHandler);
        
        this._activeEscHandler = (e) => {
            if(e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                UI.leaveDialog();
            }
        };
        document.addEventListener('keydown', this._activeEscHandler);
    },

    // WICHTIG: Leerer Dummy, da der Tracker jetzt sicher auf dem Game-Canvas gezeichnet wird!
    updateQuestTracker: function() { 
        return; 
    },

    showConfirm: function(title, htmlContent, onConfirm) {
        if(Game.state) Game.state.inDialog = true;

        const overlay = this.restoreOverlay();
        overlay.style.display = 'flex';
        overlay.innerHTML = '';
        this._trapEscKey();

        const box = document.createElement('div');
        box.className = "bg-black border-2 border-yellow-400 p-4 shadow-[0_0_20px_#aa0] max-w-md w-full relative animate-float-in pointer-events-auto mx-4";
        box.onclick = (e) => e.stopPropagation();

        box.innerHTML = `
            <h2 class="text-2xl font-bold text-yellow-400 mb-4 border-b border-yellow-500 pb-2 tracking-widest">${title}</h2>
            <div class="text-green-300 mb-6 font-mono text-sm leading-relaxed">${htmlContent}</div>
            <div class="flex gap-4">
                <button id="btn-confirm-yes" class="action-button flex-1 border-green-500 text-green-500 hover:bg-green-900 font-bold py-2">BESTÄTIGEN</button>
                <button id="btn-confirm-no" class="action-button flex-1 border-red-500 text-red-500 hover:bg-red-900 font-bold py-2">ABBRUCH</button>
            </div>
        `;

        overlay.appendChild(box);

        document.getElementById('btn-confirm-yes').onclick = () => {
            UI.leaveDialog();
            if (onConfirm) onConfirm();
        };

        document.getElementById('btn-confirm-no').onclick = () => {
            UI.leaveDialog();
        };
    },

    showInfoDialog: function(title, htmlContent) {
        if(Game.state) Game.state.inDialog = true;

        const infoOverlay = document.createElement('div');
        infoOverlay.className = "fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn pointer-events-auto";
        
        const box = document.createElement('div');
        box.className = "bg-black border-2 border-yellow-400 p-4 shadow-[0_0_20px_#aa0] max-w-md w-full relative animate-float-in pointer-events-auto mx-4";
        box.onclick = (e) => e.stopPropagation();

        box.innerHTML = `
            <h2 class="text-2xl font-bold text-yellow-400 mb-4 border-b border-yellow-500 pb-2">${title}</h2>
            <div class="text-green-300 mb-6 font-mono text-sm max-h-[60vh] overflow-y-auto custom-scroll">${htmlContent}</div>
        `;

        const btn = document.createElement('button');
        btn.className = "action-button w-full border-green-500 text-green-500 hover:bg-green-900";
        btn.textContent = "VERSTANDEN";
        
        const closeLayer2 = (e) => {
            if(e) { e.preventDefault(); e.stopPropagation(); }
            infoOverlay.remove();
            
            const baseOverlay = document.getElementById('ui-dialog-overlay');
            const isBaseOpen = baseOverlay && baseOverlay.style.display !== 'none';
            
            if(!isBaseOpen) {
                if(Game.state) Game.state.inDialog = false;
            }
        };

        btn.onclick = closeLayer2;
        infoOverlay.onclick = (e) => { if(e.target === infoOverlay) closeLayer2(e); };

        box.appendChild(btn);
        infoOverlay.appendChild(box);
        document.body.appendChild(infoOverlay);
    },

    showItemConfirm: function(invIndex) {
        const overlay = this.restoreOverlay();
        overlay.style.display = 'flex';
        overlay.innerHTML = '';
        this._trapEscKey();
        
        if(!Game.state.inventory || !Game.state.inventory[invIndex]) return;
        const invItem = Game.state.inventory[invIndex];
        const item = Game.items[invItem.id];
        
        if(!item) return;
        if(Game.state) Game.state.inDialog = true;
        
        const box = document.createElement('div');
        box.className = "bg-black border-2 border-green-500 p-4 shadow-[0_0_15px_green] max-w-sm text-center mb-4 w-full pointer-events-auto";
        box.onclick = (e) => e.stopPropagation();

        const isStimpack = (invItem.id && invItem.id.toLowerCase().includes('stimpack')) || (item.name && item.name.toLowerCase().includes('stimpack'));

        if (isStimpack) {
             box.innerHTML = `
                <h2 class="text-xl font-bold text-green-400 mb-2 border-b border-green-500 pb-2">${item.name}</h2>
                <div class="text-xs text-green-200 mb-4 bg-green-900/20 p-2">
                    <div class="flex justify-between"><span>TP Aktuell:</span> <span class="text-white font-bold">${Math.floor(Game.state.hp)} / ${Game.state.maxHp}</span></div>
                    <div class="flex justify-between"><span>Verfügbar:</span> <span class="text-yellow-400 font-bold">${invItem.count} Stück</span></div>
                </div>
                
                <div class="flex flex-col gap-3 w-full">
                    <button id="btn-use-one" class="action-button border-green-500 text-green-500 hover:bg-green-900 py-3 font-bold flex justify-between px-4">
                        <span>1x BENUTZEN</span>
                        <span class="text-xs mt-1 text-green-300">+${item.val} HP</span>
                    </button>
                    <button id="btn-use-max" class="action-button border-blue-500 text-blue-400 hover:bg-blue-900 py-3 font-bold flex justify-between px-4">
                        <span>AUTO-HEAL (MAX)</span>
                        <span class="text-xs mt-1 text-blue-200">Bis voll</span>
                    </button>
                    <button id="btn-cancel" class="action-button border-red-500 text-red-500 hover:bg-red-900 py-2 font-bold mt-2">
                        ABBRUCH
                    </button>
                </div>
            `;
            overlay.appendChild(box);
            
            document.getElementById('btn-use-one').onclick = () => { Game.useItem(invIndex, 1); setTimeout(() => UI.leaveDialog(), 50); };
            document.getElementById('btn-use-max').onclick = () => { Game.useItem(invIndex, 'max'); setTimeout(() => UI.leaveDialog(), 50); };
            document.getElementById('btn-cancel').onclick = () => { UI.leaveDialog(); };
            return;
        }

        let statsText = "";
        let displayName = item.name;
        
        if(invItem.props) {
            displayName = invItem.props.name;
            if(invItem.props.dmgMult) statsText = `Schaden: ${Math.floor(item.baseDmg * invItem.props.dmgMult)} (Mod)`;
        } else {
            if(item.type === 'consumable') statsText = `Effekt: ${item.effect} (${item.val})`;
            else if(item.type === 'weapon') statsText = `Schaden: ${item.baseDmg}`;
            else if(item.type === 'body') statsText = `Rüstung: +${item.bonus ? item.bonus.END : 0} END`;
            else if(item.type === 'junk' || item.type === 'component') statsText = "Material / Schrott";
            else statsText = item.desc || "Item";
        }

        const isUsable = !['junk', 'component', 'misc', 'rare', 'ammo'].includes(item.type);

        box.innerHTML = `
            <h2 class="text-xl font-bold text-green-400 mb-2">${displayName}</h2>
            <div class="text-xs text-green-200 mb-4 border-t border-b border-green-900 py-2">Typ: ${item.type.toUpperCase()}<br>Wert: ${item.cost} KK<br><span class="text-yellow-400">${statsText}</span></div>
            <p class="text-green-200 mb-4 text-sm">${isUsable ? "Gegenstand benutzen oder wegwerfen?" : "Dieses Item kann nur verkauft oder zum Craften verwendet werden."}</p>
        `;
        
        const btnContainer = document.createElement('div');
        btnContainer.className = "flex flex-col gap-2 w-full mt-2";
        
        if (isUsable) {
            const btnYes = document.createElement('button');
            btnYes.className = "border border-green-500 text-green-500 hover:bg-green-900 px-4 py-3 font-bold w-full text-lg";
            btnYes.textContent = "BENUTZEN / AUSRÜSTEN";
            btnYes.onclick = () => { Game.useItem(invIndex); setTimeout(() => UI.leaveDialog(), 50); };
            btnContainer.appendChild(btnYes);
        }
        
        const row = document.createElement('div');
        row.className = "flex gap-2 w-full";
        
        const btnTrash = document.createElement('button');
        btnTrash.className = "border border-red-500 text-red-500 hover:bg-red-900 px-4 py-2 font-bold flex-1";
        btnTrash.innerHTML = "WEGWERFEN 🗑️";
        btnTrash.onclick = () => { Game.destroyItem(invIndex); setTimeout(() => UI.leaveDialog(), 50); };
        
        const btnNo = document.createElement('button');
        btnNo.className = "border border-gray-600 text-gray-500 hover:bg-gray-800 px-4 py-2 font-bold flex-1";
        btnNo.textContent = "ABBRUCH";
        btnNo.onclick = () => { UI.leaveDialog(); };
        
        row.appendChild(btnTrash);
        row.appendChild(btnNo);
        btnContainer.appendChild(row);
        
        box.appendChild(btnContainer); 
        overlay.appendChild(box);
    },

    showEquippedDialog: function(slot) {
        const overlay = this.restoreOverlay();
        overlay.style.display = 'flex';
        overlay.innerHTML = '';
        this._trapEscKey();
        
        if(Game.state) Game.state.inDialog = true;

        const item = Game.state.equip[slot];
        const name = item.props ? item.props.name : item.name;

        const box = document.createElement('div');
        box.className = "bg-black border-2 border-yellow-500 p-4 shadow-[0_0_15px_#aa0] max-w-sm text-center mb-4 w-full pointer-events-auto";
        box.onclick = (e) => e.stopPropagation();

        box.innerHTML = `
            <div class="text-xs text-yellow-600 font-bold tracking-widest mb-1">SLOT: ${slot.toUpperCase()}</div>
            <h2 class="text-xl font-bold text-yellow-400 mb-4 border-b border-yellow-500 pb-2">${name}</h2>
            <div class="flex flex-col gap-2 w-full">
                <button id="btn-unequip" class="action-button w-full border-yellow-500 text-yellow-500 hover:bg-yellow-900 py-3 font-bold">
                    ABLEGEN (INS INVENTAR)
                </button>
                <button id="btn-cancel-eq" class="action-button border-gray-600 text-gray-500 hover:bg-gray-800 py-2 font-bold mt-2">
                    ABBRUCH
                </button>
            </div>
        `;
        overlay.appendChild(box);

        document.getElementById('btn-unequip').onclick = () => { Game.unequipItem(slot); setTimeout(() => UI.leaveDialog(), 50); };
        document.getElementById('btn-cancel-eq').onclick = () => { UI.leaveDialog(); };
    },

    showQuestComplete: function(questDef) {
        let container = document.getElementById('hud-quest-overlay');
        if(!container) {
             const view = document.getElementById('game-screen'); 
             if(!view) return;
             container = document.createElement('div');
             container.id = 'hud-quest-overlay';
             container.className = "fixed top-24 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-[100] w-full max-w-sm";
             view.appendChild(container);
        }

        const msg = document.createElement('div');
        msg.className = "w-full bg-black/95 border-2 border-yellow-400 p-4 shadow-[0_0_30px_rgba(255,215,0,0.6)] mb-4 text-center transform transition-all duration-700 scale-0 opacity-0";
        
        let rewardItems = "";
        if(questDef.reward?.items) {
            rewardItems = questDef.reward.items.map(it => `<div>📦 ${it.c || 1}x ${Game.items[it.id]?.name || it.id}</div>`).join("");
        }

        msg.innerHTML = `
            <div class="text-yellow-500 font-bold tracking-[0.2em] text-[10px] mb-1 animate-pulse">QUEST ERFÜLLT</div>
            <div class="text-2xl font-bold text-white mb-3 uppercase tracking-tighter shadow-black text-shadow-lg">${questDef.title}</div>
            <div class="flex flex-col gap-1 py-2 border-t border-yellow-900/50 bg-yellow-900/10 font-mono text-xs">
                ${questDef.reward?.xp ? `<div class="text-cyan-400">⚡ +${questDef.reward.xp} XP</div>` : ""}
                ${questDef.reward?.caps ? `<div class="text-yellow-400">💰 +${questDef.reward.caps} KK</div>` : ""}
                ${rewardItems}
            </div>
            <div class="absolute -inset-1 bg-yellow-400/5 animate-ping rounded-lg pointer-events-none"></div>
        `;

        container.appendChild(msg);

        requestAnimationFrame(() => {
            msg.classList.remove('scale-0', 'opacity-0');
            msg.classList.add('scale-100', 'opacity-100');
        });

        setTimeout(() => {
            msg.classList.add('translate-y-[-20px]', 'opacity-0', 'scale-90');
            setTimeout(() => msg.remove(), 700);
        }, 4500);
    },

    showMapLegend: function() {
        const overlay = this.restoreOverlay();
        overlay.style.display = 'flex';
        overlay.innerHTML = '';
        this._trapEscKey();
        
        const box = document.createElement('div');
        box.className = "bg-black border-4 border-green-500 p-6 shadow-[0_0_30px_green] max-w-sm w-full relative pointer-events-auto";
        box.onclick = (e) => e.stopPropagation();

        const item = (icon, text, color) => `
            <div class="flex items-center gap-4 mb-3 border-b border-green-900/30 pb-1 last:border-0">
                <span class="text-2xl w-10 text-center filter drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]" style="color: ${color}">${icon}</span>
                <span class="text-green-300 font-mono text-sm tracking-wide uppercase">${text}</span>
            </div>`;

        box.innerHTML = `
            <h2 class="text-2xl font-bold text-green-500 mb-6 border-b-2 border-green-500 pb-2 tracking-widest text-center">KARTEN LEGENDE</h2>
            <div class="flex flex-col space-y-1">
                ${item('🟢', 'DEINE POSITION', '#39ff14')}
                ${item('⚙️', 'VAULT 101 (SICHER)', '#ffff00')}
                ${item('🏙️', 'RUSTY SPRINGS (STADT)', '#00ffff')}
                ${item('👻', 'GHOST TOWN (VERLASSEN)', '#cccccc')}
                ${item('🏰', 'MILITÄRBASIS (LVL 10+)', '#ff5555')}
                ${item('☠️', 'RAIDER FESTUNG (LVL 5+)', '#ffaa00')}
                ${item('📡', 'FUNKTURM (THE PITT)', '#55ff55')}
            </div>
            <button class="action-button w-full mt-6 border-green-500 text-green-500 font-bold hover:bg-green-900" onclick="UI.leaveDialog()">SCHLIESSEN</button>
        `;
        overlay.appendChild(box);
    },

    showShopConfirm: function(itemKey) {
        const overlay = this.restoreOverlay();
        overlay.style.display = 'flex';
        overlay.innerHTML = '';
        this._trapEscKey();
        
        const item = Game.items[itemKey];
        if(!item) return;

        if(Game.state) Game.state.inDialog = true;
        
        let statsText = "";
        let typeLabel = item.type.toUpperCase();
        if(item.type === 'consumable') { statsText = `Effekt: ${item.effect} (${item.val})`; typeLabel = "VERBRAUCHSGEGENSTAND"; } 
        else if(item.type === 'weapon') { statsText = `Schaden: ${item.baseDmg}`; typeLabel = "WAFFE"; } 
        else if(item.type === 'body') { const bonus = item.bonus ? Object.entries(item.bonus).map(([k,v]) => `+${v} ${k}`).join(', ') : 'Keine'; statsText = `Rüstung: ${bonus}`; typeLabel = "KLEIDUNG / RÜSTUNG"; } 
        else if(item.type === 'junk' || item.type === 'component') { statsText = "Material für Handwerk"; typeLabel = "SCHROTT / MATERIAL"; } 
        else if(item.type === 'tool' || item.type === 'blueprint') { statsText = "Bauplan / Werkzeug"; typeLabel = "AUSRÜSTUNG"; }

        const canAfford = Game.state.caps >= item.cost;
        const costColor = canAfford ? "text-yellow-400" : "text-red-500";

        const box = document.createElement('div');
        box.className = "bg-black border-2 border-green-500 p-4 shadow-[0_0_15px_green] max-w-sm text-center mb-4 w-full pointer-events-auto";
        box.onclick = (e) => e.stopPropagation();

        box.innerHTML = `
            <div class="border-b border-green-500 pb-2 mb-2">
                <h2 class="text-xl font-bold text-green-400">${item.name}</h2>
                <div class="text-[10px] text-green-600 tracking-widest">${typeLabel}</div>
            </div>
            <div class="text-sm text-green-200 mb-4 bg-green-900/20 p-3 text-left">
                <div class="mb-1 text-xs italic text-green-400">${item.desc || "Standard Ausrüstung."}</div>
                <div class="w-full h-px bg-green-900/50 my-2"></div>
                <div class="font-bold text-yellow-200">${statsText}</div>
            </div>
            <div class="flex justify-between items-center bg-black border border-green-900 p-2 mb-4">
                <span class="text-xs text-gray-400">PREIS:</span>
                <span class="font-mono font-bold text-xl ${costColor}">${item.cost} KK</span>
            </div>
            <div class="flex flex-col gap-2 w-full">
                <button id="btn-buy" class="action-button border-green-500 text-green-500 hover:bg-green-900 py-3 font-bold" ${!canAfford ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                    ${canAfford ? 'KAUFEN' : 'ZU TEUER'}
                </button>
                <button id="btn-cancel" class="action-button border-red-500 text-red-500 hover:bg-red-900 py-2 font-bold">
                    ABBRUCH
                </button>
            </div>
        `;
        
        overlay.appendChild(box);
        
        const btnBuy = document.getElementById('btn-buy');
        if(canAfford && btnBuy) {
            btnBuy.onclick = () => { 
                Game.buyItem(itemKey); 
                UI.leaveDialog(); 
            };
        }
        
        document.getElementById('btn-cancel').onclick = () => UI.leaveDialog();
    },

    showDungeonWarning: function(callback) {
        const overlay = this.restoreOverlay();
        overlay.style.display = 'flex';
        overlay.innerHTML = '';
        this._trapEscKey();

        if(Game.state) Game.state.inDialog = true;
        
        const box = document.createElement('div');
        box.className = "bg-black border-2 border-red-600 p-4 shadow-[0_0_20px_red] max-w-sm text-center animate-pulse mb-4 pointer-events-auto";
        box.onclick = (e) => e.stopPropagation();

        box.innerHTML = `
            <h2 class="text-3xl font-bold text-red-600 mb-2 tracking-widest">⚠️ WARNING ⚠️</h2>
            <p class="text-red-400 mb-4 font-bold">HOHE GEFAHR!<br>Sicher, dass du eintreten willst?</p>
        `;
        const btnContainer = document.createElement('div');
        btnContainer.className = "flex gap-2 justify-center w-full";
        const btnYes = document.createElement('button');
        btnYes.className = "border border-red-500 text-red-500 hover:bg-red-900 px-4 py-2 font-bold w-full";
        btnYes.textContent = "BETRETEN";
        btnYes.onclick = () => { UI.leaveDialog(); if(callback) callback(); };
        const btnNo = document.createElement('button');
        btnNo.className = "border border-green-500 text-green-500 hover:bg-green-900 px-4 py-2 font-bold w-full";
        btnNo.textContent = "FLUCHT";
        btnNo.onclick = () => { UI.leaveDialog(); };
        btnContainer.appendChild(btnYes); btnContainer.appendChild(btnNo);
        box.appendChild(btnContainer); overlay.appendChild(box);
    },

    showDungeonVictory: function(caps, lvl) {
        const overlay = document.createElement('div');
        overlay.id = "victory-overlay";
        overlay.className = "fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 animate-fadeIn pointer-events-auto";
        
        overlay.innerHTML = `
            <div class="bg-black border-4 border-yellow-400 p-6 shadow-[0_0_30px_gold] max-w-md text-center mb-4 relative" onclick="event.stopPropagation()">
                <div class="text-6xl mb-2">👑⚔️</div>
                <h2 class="text-4xl font-bold text-yellow-400 mb-2 tracking-widest text-shadow-gold">VICTORY!</h2>
                <p class="text-yellow-200 mb-4 font-bold text-lg">DUNGEON (LVL ${lvl}) GECLEARED!</p>
                <div class="text-2xl text-white font-bold border-t border-b border-yellow-500 py-2 mb-4 bg-yellow-900/30">+${caps} KRONKORKEN</div>
                <p class="text-xs text-yellow-600 mb-4">Komme in 10 Minuten wieder!</p>
                <button id="btn-victory-close" class="action-button w-full border-yellow-500 text-yellow-500 font-bold hover:bg-yellow-900">ZURÜCK ZUR KARTE</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        if(Game.state) Game.state.inDialog = true;
        
        const btn = document.getElementById('btn-victory-close');
        if(btn) {
            btn.onclick = () => {
                const el = document.getElementById('victory-overlay');
                if(el) el.remove();
                if(Game.state) Game.state.inDialog = false;
                UI.leaveDialog(); 
            };
            btn.focus();
        }
    },

    // --- NEU: ABSOLUTER PERMADEATH WIPE ---
    showGameOver: function() {
        if(this.els.gameOver) this.els.gameOver.classList.remove('hidden');
        
        // Todes-Eintrag ans Netzwerk senden (damit der Charakter in den Vault Legends landet)
        if(typeof Network !== 'undefined' && Game.state) {
            Network.registerDeath(Game.state);
        }
        
        this.toggleControls(false);

        // Wir erzwingen den Tod im State und löschen den Spielstand gnadenlos
        if (Game && Game.state) {
            Game.state.hp = 0;
            Game.state.isGameOver = true;
            
            // 1. Offizielle Engine-Löschung versuchen
            if (typeof Game.deleteSave === 'function') {
                Game.deleteSave(UI.selectedSlot || 0);
            } 
            // 2. Brutale LocalStorage Zerstörung als Fallback
            else if (window.localStorage) {
                const slot = UI.selectedSlot !== undefined ? UI.selectedSlot : 0;
                localStorage.removeItem('save_' + slot);
                localStorage.removeItem('slot_' + slot);
                localStorage.removeItem('wasteland_save_' + slot);
                localStorage.removeItem('vault_save_' + slot);
            }
            
            // Warnung ins Log schreiben
            if(typeof UI.log === 'function') {
                UI.log("☠️ PERMADEATH: Dein Spielstand wurde ausgelöscht.", "text-red-500 font-bold text-xl");
            }
        }
    },
    
    showManualOverlay: async function() {
        const overlay = document.getElementById('manual-overlay');
        const content = document.getElementById('manual-content');
        if(this.els.navMenu) { this.els.navMenu.classList.add('hidden'); this.els.navMenu.style.display = 'none'; }
        if(overlay && content) {
            content.innerHTML = '<div class="text-center animate-pulse">Lade Handbuch...</div>';
            overlay.style.display = 'flex'; overlay.classList.remove('hidden');
            const verDisplay = document.getElementById('version-display'); 
            const ver = verDisplay ? verDisplay.textContent.trim() : Date.now();
            try { 
                const res = await fetch(`readme.md?v=${ver}`); 
                if (!res.ok) throw new Error("Manual not found"); 
                let text = await res.text(); 
                text = text.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-yellow-400 mb-2 border-b border-yellow-500">$1</h1>');
                text = text.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-green-400 mt-4 mb-2">$1</h2>');
                text = text.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-green-300 mt-2 mb-1">$1</h3>');
                text = text.replace(/\*\*(.*)\*\*/gim, '<b>$1</b>');
                text = text.replace(/\n/gim, '<br>');
                text += '<br><button class="action-button w-full mt-4 border-red-500 text-red-500" onclick="document.getElementById(\'manual-overlay\').classList.add(\'hidden\'); document.getElementById(\'manual-overlay\').style.display=\'none\';">SCHLIESSEN (ESC)</button>';
                content.innerHTML = text; 
            } catch(e) { content.innerHTML = `<div class="text-red-500">Fehler beim Laden: ${e.message}</div>`; }
        }
    },

    enterVault: function() { 
        if(Game.state) Game.state.inDialog = true; 
        if(typeof UI !== 'undefined' && UI.log) UI.log("Das schwere Vault-Tor knirscht...", "text-blue-400 font-bold");

        const animLayer = document.createElement('div');
        animLayer.id = 'vault-anim-layer';
        animLayer.className = "fixed inset-0 z-[3000] bg-black flex items-center justify-center overflow-hidden transition-opacity duration-1000 pointer-events-auto";
        
        animLayer.innerHTML = `
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_#2d3748_0%,_#000_100%)] opacity-80"></div>
            <div id="vault-door-container" class="relative flex items-center justify-center transition-transform duration-[2500ms] ease-in-out">
                <div id="vault-gear" class="relative w-64 h-64 md:w-96 md:h-96 bg-[#4a5568] rounded-full border-[12px] border-[#2d3748] flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.9)] transition-transform duration-[2500ms] ease-in-out">
                    <div class="absolute w-full h-12 bg-[#2d3748]" style="transform: rotate(0deg);"></div>
                    <div class="absolute w-full h-12 bg-[#2d3748]" style="transform: rotate(45deg);"></div>
                    <div class="absolute w-full h-12 bg-[#2d3748]" style="transform: rotate(90deg);"></div>
                    <div class="absolute w-full h-12 bg-[#2d3748]" style="transform: rotate(135deg);"></div>
                    <div class="absolute w-52 h-52 md:w-80 md:h-80 bg-[#1a202c] rounded-full z-10 border-4 border-[#111] flex items-center justify-center shadow-inner">
                        <span class="text-6xl md:text-8xl font-bold text-yellow-500 tracking-widest font-mono drop-shadow-[0_0_20px_rgba(234,179,8,0.8)]">101</span>
                    </div>
                </div>
            </div>
            <div id="vault-flash" class="absolute inset-0 bg-white opacity-0 transition-opacity duration-300 pointer-events-none z-50"></div>
        `;
        document.body.appendChild(animLayer);

        setTimeout(() => {
            const container = document.getElementById('vault-door-container');
            const gear = document.getElementById('vault-gear');
            const flash = document.getElementById('vault-flash');

            if(container) container.style.transform = "translateX(120vw)"; 
            if(gear) gear.style.transform = "rotate(270deg)"; 

            setTimeout(() => {
                if(flash) flash.style.opacity = "1";
                
                setTimeout(() => {
                    this._showVaultMenuInternal(); 
                    if(flash) flash.style.opacity = "0";
                    animLayer.style.opacity = "0";
                    
                    setTimeout(() => {
                        animLayer.remove();
                    }, 1000);
                }, 300);
            }, 2000);
        }, 100);
    },

    _showVaultMenuInternal: function() {
        const overlay = this.restoreOverlay(); 
        overlay.style.display = 'flex';
        overlay.innerHTML = ''; 

        if(Game.state) Game.state.inDialog = true; 
        
        const box = document.createElement('div');
        box.className = "flex flex-col gap-3 w-full max-w-sm p-6 bg-black border-4 border-blue-600 shadow-[0_0_30px_blue] pointer-events-auto animate-float-in";
        box.onclick = (e) => e.stopPropagation();

        const msg = document.createElement('div');
        msg.innerHTML = `
            <h2 class='text-blue-400 font-bold mb-2 text-3xl tracking-widest border-b-2 border-blue-900 pb-2 text-center'>VAULT 101</h2>
            <p class='text-sm text-blue-200 mb-4 text-center'>Willkommen zuhause, Bewohner.<br>Hier bist du sicher vor dem Ödland.</p>
        `;
        
        const restBtn = document.createElement('button'); 
        restBtn.className = "action-button w-full border-blue-500 text-blue-400 hover:bg-blue-900 py-4 font-bold text-xl"; 
        restBtn.innerHTML = "🛏️ AUSRUHEN (GRATIS)"; 
        restBtn.onclick = () => { 
            if(Game.state) {
                Game.state.hp = Game.state.maxHp || 20; 
                if(Game.state.rad !== undefined) Game.state.rad = 0; 
                if(Game.state.rads !== undefined) Game.state.rads = 0; 
                if(typeof Game.saveGame === 'function') Game.saveGame();
                if(typeof UI.update === 'function') UI.update();
            }
            this.showInfoDialog("DEKONTAMINIERT & AUSGERUHT", "Du hast sicher in der Vault geschlafen. Deine TP sind vollständig regeneriert und die Dekontaminationsduschen haben jegliche Verstrahlung abgewaschen!");
        }; 
        
        const leaveBtn = document.createElement('button'); 
        leaveBtn.className = "action-button w-full border-gray-600 text-gray-400 hover:bg-gray-800 py-2 mt-2"; 
        leaveBtn.innerHTML = "🚪 ZURÜCK INS ÖDLAND"; 
        leaveBtn.onclick = () => UI.leaveDialog(); 
        
        box.appendChild(msg);
        box.appendChild(restBtn); 
        box.appendChild(leaveBtn);
        overlay.appendChild(box);
    }
});

// [2026-01-13 14:00:00] ui_render_core.js - CLEANUP: HUD Rendering Only

Object.assign(UI, {
    
    // RENAMED from update() to render() to avoid conflict!
    render: function() {
        if (!Game.state) return;
        
        // Element Caching on-the-fly
        if(!this.els.ammo) this.els.ammo = document.getElementById('val-ammo');
        if(!this.els.caps) this.els.caps = document.getElementById('val-caps');
        if(!this.els.hp) this.els.hp = document.getElementById('bar-hp');
        if(!this.els.headerCharInfo) this.els.headerCharInfo = document.getElementById('header-char-info');

        // 1. Header Info
        const displayName = Game.state.playerName || (typeof Network !== 'undefined' ? Network.myDisplayName : "SURVIVOR");
        if(this.els.name) this.els.name.textContent = displayName;
        
        const hasPoints = (Game.state.statPoints > 0) || (Game.state.perkPoints > 0);
        if(this.els.headerCharInfo) {
            if(hasPoints) this.els.headerCharInfo.classList.add('lvl-ready-glow');
            else this.els.headerCharInfo.classList.remove('lvl-ready-glow');
        }

        if(this.els.lvl) this.els.lvl.textContent = Game.state.lvl;
        
        // Desktop View Sync
        const dtName = document.querySelector('.desktop-name-target');
        if(dtName) dtName.textContent = displayName;
        const dtLvl = document.querySelector('.desktop-lvl-target');
        if(dtLvl) dtLvl.textContent = Game.state.lvl;

        // 2. Sektor Display
        const sectorDisplay = document.getElementById('val-sector-display');
        if(sectorDisplay) {
            const sx = Game.state.sector ? Game.state.sector.x : 0;
            const sy = Game.state.sector ? Game.state.sector.y : 0;
            sectorDisplay.innerHTML = `🌍 SEKTOR [${sx},${sy}]`;
            sectorDisplay.classList.remove('border-yellow-500');
        }

        // 3. HP & Rads Logic
        const maxHp = Game.state.maxHp;
        const hp = Game.state.hp;
        const rads = Game.state.rads || 0;
        const effectiveMax = Math.max(1, maxHp - rads);
        
        const hpPct = Math.min(100, Math.max(0, (hp / maxHp) * 100));
        const radPct = Math.min(100, (rads / maxHp) * 100);
        
        const hpText = `TP ${Math.round(hp)}/${Math.round(effectiveMax)}`;
        
        const valHpEl = document.getElementById('val-hp');
        if(valHpEl) valHpEl.textContent = hpText;

        let barColor = "bg-green-500";
        if(hpPct < 25) barColor = "bg-red-500 animate-pulse";
        else if(hpPct < 50) barColor = "bg-yellow-500";

        if(this.els.hp) {
             this.els.hp.className = `absolute top-0 left-0 h-full transition-all duration-300 ${barColor}`;
             this.els.hp.style.width = `${hpPct}%`;
             
             // Dynamic Bar Styling
             if(this.els.hp.parentElement) {
                 const p = this.els.hp.parentElement;
                 p.classList.remove('bg-green-900', 'bg-green-800', 'bg-green-700', 'bg-opacity-50');
                 p.style.backgroundColor = 'rgba(10, 10, 10, 0.9)'; 
                 p.style.borderColor = '#14532d'; 
             }
        }
        
        const radBar = document.getElementById('bar-rads');
        if(radBar) {
            radBar.style.width = `${radPct}%`;
            radBar.className = "absolute top-0 right-0 h-full bg-red-600 transition-all duration-300 opacity-90";
        }

        // 4. XP
        const nextXp = Game.expToNextLevel(Game.state.lvl);
        const expPct = Math.min(100, Math.floor((Game.state.xp / nextXp) * 100));
        if(this.els.xpTxt) this.els.xpTxt.textContent = expPct;
        if(this.els.expBarTop) this.els.expBarTop.style.width = `${expPct}%`;
        
        // 5. Caps & Ammo
        if(this.els.caps) this.els.caps.textContent = `${Game.state.caps}`;
        const ammoItem = Game.state.inventory ? Game.state.inventory.find(i => i.id === 'ammo') : null;
        if(this.els.ammo) this.els.ammo.textContent = ammoItem ? ammoItem.count : 0;

        // 6. Camp Button Logic
        const campBtn = document.getElementById('btn-camp-overlay');
        if(campBtn) {
            const hasKit = Game.state.inventory && Game.state.inventory.some(i => i.id === 'camp_kit');
            const campDeployed = !!Game.state.camp;
            const inCampSector = campDeployed && 
                                 Game.state.camp.sector.x === Game.state.sector.x && 
                                 Game.state.camp.sector.y === Game.state.sector.y;

            if (campDeployed) {
                if (inCampSector) {
                    campBtn.classList.remove('hidden');
                    campBtn.className = "absolute top-4 left-4 flex flex-col items-center justify-center p-2 rounded-lg border-2 z-20 shadow-[0_0_15px_#ffd700] cursor-pointer bg-black/80 animate-pulse border-yellow-400 text-yellow-400";
                    campBtn.innerHTML = '<span class="text-2xl">⛺</span><span class="text-xs font-bold">LAGER</span>';
                    campBtn.onclick = () => UI.switchView('camp');
                } else {
                    campBtn.classList.add('hidden');
                }
            } else {
                if (hasKit) {
                    campBtn.classList.remove('hidden');
                    campBtn.className = "absolute top-4 left-4 flex flex-col items-center justify-center p-2 rounded-lg border-2 z-20 shadow-[0_0_10px_#39ff14] cursor-pointer bg-black/80 border-green-500 text-green-500 hover:bg-green-900 transition-colors";
                    campBtn.innerHTML = '<span class="text-2xl">⛺</span><span class="text-xs font-bold">BAUEN</span>';
                    campBtn.onclick = () => Game.deployCamp();
                } else {
                    campBtn.classList.add('hidden');
                }
            }
        }
        
        // 7. Menu Alerts
        let hasAlert = false;
        if(this.els.btnChar) {
            if(hasPoints) { this.els.btnChar.classList.add('alert-glow-yellow'); hasAlert = true; } 
            else { this.els.btnChar.classList.remove('alert-glow-yellow'); }
        } 
        const questsList = Game.state.quests || [];
        const unreadQuests = questsList.some(q => !q.read);
        if(this.els.btnQuests) {
            if(unreadQuests) { this.els.btnQuests.classList.add('alert-glow-cyan'); hasAlert = true; } 
            else { this.els.btnQuests.classList.remove('alert-glow-cyan'); }
        }
        if(this.els.btnMenu) {
            if(hasAlert) this.els.btnMenu.classList.add('alert-glow-yellow');
            else this.els.btnMenu.classList.remove('alert-glow-yellow');
        }

        // 8. Buttons disable in Combat
        const inCombat = Game.state.view === 'combat';
        [this.els.btnWiki, this.els.btnMap, this.els.btnChar, this.els.btnQuests, this.els.btnLogout, this.els.btnInv].forEach(btn => { if(btn) btn.disabled = inCombat; });
        
        // 9. Level Up Blink
        if(this.els.lvl) {
            if(Game.state.buffEndTime && Date.now() < Game.state.buffEndTime) this.els.lvl.classList.add('blink-red');
            else this.els.lvl.classList.remove('blink-red');
        }
        
        // 10. Online Player Badge
        if(typeof Network !== 'undefined' && Network.active) {
            const count = Object.keys(Network.otherPlayers).length + 1;
            const onlineBadge = document.getElementById('online-badge');
            if(onlineBadge) {
                onlineBadge.innerHTML = `● ${count} ONLINE`;
                onlineBadge.className = "absolute top-2 right-2 text-[10px] font-mono border border-green-900 bg-black/80 px-1 rounded " + (count > 1 ? "text-green-400" : "text-gray-600");
            }
        }
    }
});

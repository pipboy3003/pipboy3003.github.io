// [TIMESTAMP] 2026-01-10 16:15:00 - ui_render_views.js - Vault, Combat & Simulation Buttons

Object.assign(UI, {

    // ==========================================
    // === VAULT VIEW (mit TEST BUTTONS) ===
    // ==========================================
    renderVault: function() {
        Game.state.view = 'vault';
        const view = document.getElementById('view-container');
        if(!view) return;
        view.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.className = "w-full h-full flex flex-col bg-black/95 relative overflow-hidden";

        // Header
        wrapper.innerHTML = `
            <div class="flex-shrink-0 p-4 border-b-2 border-green-500 bg-green-900/20 text-center relative shadow-[0_0_20px_rgba(0,255,0,0.2)]">
                <div class="absolute top-2 left-2 text-[10px] text-green-600 animate-pulse">SYS.STATUS: OK</div>
                <h2 class="text-4xl text-green-400 font-bold tracking-widest font-vt323 drop-shadow-md">VAULT 3003</h2>
                <div class="text-xs text-green-300 tracking-[0.2em] mt-1">HOME SWEET HOME</div>
            </div>
            
            <div class="flex-grow flex flex-col items-center justify-start p-6 gap-6 text-center overflow-y-auto custom-scrollbar">
                
                <div class="relative w-32 h-32 flex items-center justify-center">
                    <div class="absolute inset-0 border-4 border-green-900 rounded-full animate-spin-slow opacity-50"></div>
                    <div class="text-6xl filter drop-shadow-[0_0_10px_rgba(0,255,0,0.5)]">☢️</div>
                </div>

                <div class="border-2 border-green-800 p-4 bg-black/80 w-full max-w-md shadow-inner shadow-green-900/30">
                    <div class="text-green-500 mb-2 font-bold border-b border-green-900 pb-1 tracking-widest text-sm">STATUS BERICHT</div>
                    <div class="flex justify-between text-lg font-mono mb-1">
                        <span>GESUNDHEIT:</span> 
                        <span class="${Game.state.hp < Game.state.maxHp ? 'text-yellow-400' : 'text-green-400'}">${Math.floor(Game.state.hp)} / ${Game.state.maxHp}</span>
                    </div>
                    <div class="flex justify-between text-lg font-mono mb-1">
                        <span>STRAHLUNG:</span> 
                        <span class="${Game.state.rads > 0 ? 'text-red-500 animate-pulse' : 'text-green-500'}">${Math.floor(Game.state.rads)} RADS</span>
                    </div>
                    <div class="flex justify-between text-lg font-mono">
                        <span>KRONKORKEN:</span> 
                        <span class="text-yellow-400">${Game.state.caps} KK</span>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3 w-full max-w-md">
                    <button onclick="Game.rest()" class="py-3 border border-blue-500 text-blue-400 hover:bg-blue-900/30 font-bold transition-all uppercase tracking-wider flex items-center justify-center gap-2">
                        <span>💤</span> SCHLAFEN
                    </button>
                    <button onclick="UI.renderCity('rusty_springs')" class="py-3 border border-yellow-500 text-yellow-400 hover:bg-yellow-900/30 font-bold transition-all uppercase tracking-wider flex items-center justify-center gap-2">
                        <span>🏙️</span> STADT
                    </button>
                </div>

                <div class="w-full max-w-md border-t-2 border-dashed border-green-900 pt-4 mt-2">
                    <div class="text-[10px] text-green-600 uppercase tracking-widest mb-2 font-bold">--- SIMULATION MODE (TEST GAMES) ---</div>
                    <div class="grid grid-cols-2 gap-2">
                        <button class="border border-green-600 text-green-600 text-xs py-2 hover:bg-green-900 hover:text-white transition-colors" onclick="UI.startMinigame('hacking')">
                            💻 HACKING
                        </button>
                        <button class="border border-green-600 text-green-600 text-xs py-2 hover:bg-green-900 hover:text-white transition-colors" onclick="UI.startMinigame('lockpicking')">
                            🔒 LOCKPICK
                        </button>
                        <button class="border border-yellow-600 text-yellow-500 text-xs py-2 hover:bg-yellow-900 hover:text-white transition-colors" onclick="UI.startMinigame('dice')">
                            🎲 DICE (LUCK)
                        </button>
                        <button class="border border-red-600 text-red-500 text-xs py-2 hover:bg-red-900 hover:text-white transition-colors" onclick="UI.startMinigame('defusal')">
                            💣 DEFUSAL (AGI)
                        </button>
                    </div>
                </div>

            </div>

            <div class="flex-shrink-0 p-3 border-t border-green-900 bg-[#001100]">
                <button class="action-button w-full border-gray-600 text-gray-500 hover:text-white hover:border-white transition-colors uppercase tracking-[0.2em]" onclick="UI.switchView('map')">
                    GEHE INS ÖDLAND
                </button>
            </div>
        `;
        view.appendChild(wrapper);
    },

    // ==========================================
    // === COMBAT RENDER ===
    // ==========================================
    renderCombat: function() {
        Game.state.view = 'combat';
        const view = document.getElementById('view-container');
        if(!view) return;
        view.innerHTML = '';

        if(!Combat.enemy) return;

        const wrapper = document.createElement('div');
        wrapper.className = "w-full h-full flex flex-col bg-black relative overflow-hidden select-none";

        // Feedback Layer
        const feedbackLayer = document.createElement('div');
        feedbackLayer.id = "combat-feedback-layer";
        feedbackLayer.className = "absolute inset-0 pointer-events-none z-50 overflow-hidden";
        wrapper.appendChild(feedbackLayer);

        // Flash Effect Layer
        const flashLayer = document.createElement('div');
        flashLayer.id = "damage-flash";
        flashLayer.className = "absolute inset-0 bg-red-500 pointer-events-none z-40 hidden transition-opacity duration-300 opacity-0";
        wrapper.appendChild(flashLayer);

        // --- ENEMY VISUAL ---
        const enemyContainer = document.createElement('div');
        enemyContainer.className = "flex-grow flex flex-col items-center justify-center relative p-4 bg-gradient-to-b from-black to-[#051005]";
        
        // Gegner Infos
        const infoBar = document.createElement('div');
        infoBar.className = "absolute top-2 w-full px-4 flex justify-between items-start z-10";
        
        let hpPercent = (Combat.enemy.hp / Combat.enemy.maxHp) * 100;
        let hpColor = "bg-red-600";
        if (Combat.enemy.isLegendary) hpColor = "bg-yellow-500"; 

        infoBar.innerHTML = `
            <div class="w-full">
                <div class="flex justify-between items-end mb-1">
                    <span class="text-xl font-bold ${Combat.enemy.isLegendary ? 'text-yellow-400 drop-shadow-[0_0_5px_gold]' : 'text-red-500'} font-vt323 tracking-wider uppercase">
                        ${Combat.enemy.name} ${Combat.enemy.isLegendary ? '⭐' : ''}
                    </span>
                    <span class="text-xs text-red-300 font-mono">${Math.ceil(Combat.enemy.hp)}/${Combat.enemy.maxHp} HP</span>
                </div>
                <div class="w-full h-4 bg-red-900/30 border border-red-700 relative skew-x-[-10deg]">
                    <div class="h-full ${hpColor} transition-all duration-300" style="width: ${hpPercent}%"></div>
                </div>
            </div>
        `;
        enemyContainer.appendChild(infoBar);

        // Gegner Bild
        const visual = document.createElement('div');
        visual.id = "enemy-img";
        visual.className = "text-9xl filter drop-shadow-[0_0_15px_rgba(255,0,0,0.3)] transition-transform duration-100";
        visual.textContent = Combat.enemy.symbol || "💀";
        enemyContainer.appendChild(visual);

        // VATS OVERLAY
        if(Combat.turn === 'player') {
            const vats = document.createElement('div');
            vats.className = "absolute bottom-4 flex gap-2 w-full justify-center px-2 z-20";
            
            Combat.bodyParts.forEach((part, idx) => {
                const hitChance = Combat.calculateHitChance(idx);
                const isSelected = (idx === Combat.selectedPart);
                
                let btnClass = "flex-1 border-2 py-2 px-1 flex flex-col items-center justify-center transition-all bg-black/80 ";
                if(isSelected) btnClass += "border-yellow-400 text-yellow-400 bg-yellow-900/40 shadow-[0_0_10px_#ccaa00]";
                else btnClass += "border-green-700 text-green-700 hover:border-green-500 hover:text-green-500";

                const btn = document.createElement('button');
                btn.id = `btn-vats-${idx}`;
                btn.className = btnClass;
                btn.onclick = () => { Combat.selectPart(idx); Combat.confirmSelection(); };
                
                btn.innerHTML = `
                    <span class="text-[10px] font-bold tracking-widest uppercase mb-1">${part.name}</span>
                    <span class="text-xl font-bold font-vt323">${hitChance}%</span>
                `;
                vats.appendChild(btn);
            });
            enemyContainer.appendChild(vats);
        } else {
            // Enemy Turn
            const wait = document.createElement('div');
            wait.className = "absolute bottom-10 text-red-500 font-bold text-xl animate-pulse tracking-widest border-2 border-red-500 px-4 py-2 bg-black";
            wait.textContent = "GEGNER GREIFT AN...";
            enemyContainer.appendChild(wait);
        }

        wrapper.appendChild(enemyContainer);

        // LOG AREA
        const logArea = document.createElement('div');
        logArea.id = "combat-log";
        logArea.className = "h-32 bg-black border-t-4 border-green-900 p-2 font-mono text-xs overflow-hidden flex flex-col justify-end text-gray-400 leading-tight opacity-80";
        wrapper.appendChild(logArea);

        // CONTROLS
        const footer = document.createElement('div');
        footer.className = "flex p-2 gap-2 bg-[#051005] border-t border-green-500";
        
        if(Combat.turn === 'player') {
            footer.innerHTML = `
                <button onclick="Combat.confirmSelection()" class="flex-grow action-button py-4 text-xl font-bold border-yellow-500 text-yellow-500 hover:bg-yellow-900/50">ANGRIFF (SPACE)</button>
                <button onclick="Combat.flee()" class="w-1/3 action-button py-4 text-gray-500 border-gray-600 hover:text-white">FLUCHT</button>
            `;
        } else {
            footer.innerHTML = `<button disabled class="w-full action-button py-4 text-gray-600 border-gray-800 cursor-wait">WARTEN...</button>`;
        }
        wrapper.appendChild(footer);

        view.appendChild(wrapper);
    }
});

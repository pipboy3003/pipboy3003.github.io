// [TIMESTAMP] 2026-01-11 02:00:00 - ui_combat.js - Holographic VATS Redesign

(function() {
    function initCombatUI() {
        if (typeof window.UI === 'undefined' || typeof window.Combat === 'undefined') {
            setTimeout(initCombatUI, 100);
            return;
        }

        Object.assign(window.UI, {

            renderCombat: function() {
                try {
                    Game.state.view = 'combat';
                    const view = document.getElementById('view-container');
                    if(!view) return;
                    
                    if(!Combat.enemy) { UI.switchView('map'); return; }

                    view.innerHTML = ''; 

                    // --- FULLSCREEN CONTAINER ---
                    const wrapper = document.createElement('div');
                    wrapper.className = "w-full h-full flex flex-col relative overflow-hidden select-none bg-black";

                    // 1. CINEMATIC BACKGROUND (Vignette & Scanlines)
                    wrapper.innerHTML += `
                        <div class="absolute inset-0 bg-[radial-gradient(circle,rgba(0,50,0,0.2)_0%,rgba(0,0,0,1)_90%)] z-0 pointer-events-none"></div>
                        <div class="absolute inset-0 z-0 opacity-10 pointer-events-none" style="background: repeating-linear-gradient(0deg, transparent, transparent 2px, #39ff14 3px);"></div>
                    `;

                    // Feedback Layer
                    const feedbackLayer = document.createElement('div');
                    feedbackLayer.id = "combat-feedback-layer";
                    feedbackLayer.className = "absolute inset-0 pointer-events-none z-50 overflow-hidden";
                    wrapper.appendChild(feedbackLayer);

                    // --- HUD LAYER ---
                    const hud = document.createElement('div');
                    hud.className = "absolute inset-0 z-10 flex flex-col p-4";
                    
                    // --- HEADER: ENEMY INFO (Minimalistisch) ---
                    let eMax = Combat.enemy.maxHp || 100;
                    let eHp = Combat.enemy.hp !== undefined ? Combat.enemy.hp : eMax;
                    let hpPercent = (eHp / eMax) * 100;
                    let isLegendary = Combat.enemy.isLegendary;
                    let colorClass = isLegendary ? "text-yellow-400 border-yellow-400" : "text-red-500 border-red-500";
                    let barColor = isLegendary ? "bg-yellow-500" : "bg-red-600";

                    const header = document.createElement('div');
                    header.className = "w-full flex justify-between items-end border-b border-green-900/50 pb-2 mb-4";
                    header.innerHTML = `
                        <div class="flex flex-col">
                            <span class="text-xs text-green-600 font-bold tracking-[0.2em] uppercase">TARGET_ID_90210</span>
                            <span class="text-3xl font-vt323 ${colorClass} drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]">
                                ${Combat.enemy.name} ${isLegendary ? '★ LEGENDARY' : ''}
                            </span>
                        </div>
                        <div class="flex flex-col items-end w-1/3">
                            <span class="text-xs text-green-600 font-bold mb-1">INTEGRITY ${Math.ceil(eHp)}/${eMax}</span>
                            <div class="w-full h-2 bg-gray-900">
                                <div class="h-full ${barColor} shadow-[0_0_10px_red]" style="width: ${hpPercent}%"></div>
                            </div>
                        </div>
                    `;
                    hud.appendChild(header);

                    // --- CENTER: HOLOGRAPHIC ENEMY ---
                    const centerStage = document.createElement('div');
                    centerStage.className = "flex-grow relative flex items-center justify-center";
                    
                    // Der Gegner (Groß & Leuchtend)
                    const enemyVis = document.createElement('div');
                    enemyVis.className = "text-[12rem] filter drop-shadow-[0_0_30px_rgba(0,255,0,0.2)] transition-transform duration-300";
                    enemyVis.innerHTML = Combat.enemy.symbol || "💀";
                    
                    // Animation bei Treffer
                    if(Combat.lastHit) { enemyVis.classList.add('animate-pulse', 'text-red-500'); }
                    
                    centerStage.appendChild(enemyVis);

                    // TREFFERZONEN (Floating Style)
                    if(Combat.turn === 'player') {
                        const zones = [
                            { id: 0, label: "HEAD", chance: 0, pos: "top-0 left-1/2 -translate-x-1/2 -mt-4" }, 
                            { id: 1, label: "TORSO", chance: 0, pos: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" },
                            { id: 2, label: "LEGS", chance: 0, pos: "bottom-0 left-1/2 -translate-x-1/2 mb-8" }
                        ];

                        // Container für Klick-Zonen über dem Gegner
                        const zoneOverlay = document.createElement('div');
                        zoneOverlay.className = "absolute inset-0 flex flex-col";
                        
                        // Unsichtbare Klickbereiche (Drittelung des Bildschirms vertikal für einfache Bedienung)
                        [0, 1, 2].forEach(id => {
                            let hitChance = 0;
                            try { hitChance = Combat.calculateHitChance(id); } catch(e) {}
                            
                            const isSelected = (Combat.selectedPart === id);
                            
                            // Die Klick-Zone (füllt den Bereich)
                            const clickArea = document.createElement('div');
                            clickArea.className = "flex-1 flex items-center justify-between px-4 cursor-pointer group hover:bg-green-500/5 transition-colors border-l-2 border-r-2 border-transparent";
                            
                            if(isSelected) {
                                clickArea.className += " border-green-400 bg-green-500/10 shadow-[inset_0_0_20px_rgba(0,255,0,0.2)]";
                                enemyVis.style.opacity = id === 1 ? "1" : "0.5"; // Fokus Effekt
                            }

                            clickArea.onclick = (e) => { e.stopPropagation(); Combat.selectPart(id); };

                            // Floating Stats links und rechts
                            clickArea.innerHTML = `
                                <div class="flex flex-col items-start ${isSelected ? 'opacity-100 scale-110' : 'opacity-40 group-hover:opacity-80'} transition-all duration-200">
                                    <span class="text-[10px] text-green-400 tracking-widest border-b border-green-600 mb-1">${zones[id].label}</span>
                                    <span class="text-3xl font-vt323 text-green-200">${hitChance}<span class="text-sm">%</span></span>
                                </div>
                                
                                <div class="flex flex-col items-end ${isSelected ? 'opacity-100 scale-110' : 'opacity-40 group-hover:opacity-80'} transition-all duration-200">
                                     ${isSelected ? '<span class="text-xs text-yellow-400 font-bold blink-red">TARGETING</span>' : ''}
                                     <div class="h-1 w-12 bg-green-900 mt-2 overflow-hidden">
                                        <div class="h-full bg-green-400" style="width: ${hitChance}%"></div>
                                     </div>
                                </div>
                            `;
                            zoneOverlay.appendChild(clickArea);
                        });
                        
                        centerStage.appendChild(zoneOverlay);
                    } else {
                        // Gegner Zug Overlay
                         centerStage.innerHTML += `
                            <div class="absolute inset-0 flex items-center justify-center z-50">
                                <div class="bg-red-500/10 border-t-2 border-b-2 border-red-500 w-full text-center py-4 backdrop-blur-sm">
                                    <div class="text-red-500 font-bold text-2xl animate-pulse tracking-[0.5em]">WARNING</div>
                                    <div class="text-red-300 text-xs mt-1">INCOMING ATTACK</div>
                                </div>
                            </div>
                        `;
                    }

                    hud.appendChild(centerStage);

                    // --- FOOTER: CONTROLS ---
                    const controls = document.createElement('div');
                    controls.className = "mt-4 flex flex-col gap-2";

                    // Log Line (Wie ein Ticker)
                    const logLine = document.createElement('div');
                    logLine.className = "w-full text-green-400 font-mono text-xs text-center border-t border-b border-green-900/50 py-1 opacity-80";
                    const lastLog = Combat.logData.length > 0 ? Combat.logData[0].t : "SYSTEM READY...";
                    logLine.innerHTML = `<span class="animate-pulse">></span> ${lastLog}`;
                    controls.appendChild(logLine);

                    // Action Bar
                    const actionBar = document.createElement('div');
                    actionBar.className = "flex w-full h-16 gap-4";

                    if(Combat.turn === 'player') {
                        actionBar.innerHTML = `
                             <button onclick="Combat.flee()" class="w-1/4 bg-gray-900/50 border border-gray-600 text-gray-400 font-bold text-sm hover:bg-gray-800 hover:text-white transition-all clip-corner">
                                ESCAPE
                            </button>
                            <button onclick="Combat.confirmSelection()" class="flex-grow bg-[#1aff1a]/10 border-2 border-[#1aff1a] text-[#1aff1a] text-3xl font-vt323 font-bold tracking-[0.2em] hover:bg-[#1aff1a] hover:text-black hover:shadow-[0_0_30px_#1aff1a] transition-all active:scale-95">
                                EXECUTE
                            </button>
                        `;
                    } else {
                         actionBar.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center border border-red-900 bg-red-900/10 text-red-500 font-mono text-sm animate-pulse">
                                CALCULATING ENEMY MOVEMENT...
                            </div>
                        `;
                    }
                    controls.appendChild(actionBar);
                    hud.appendChild(controls);

                    // --- CRITICAL METER (Optional Visual) ---
                    const critChance = Game.state.critChance || 5;
                    const critMeter = document.createElement('div');
                    critMeter.className = "absolute top-1/2 right-2 transform -translate-y-1/2 w-2 h-32 bg-gray-900 border border-green-900 flex flex-col justify-end p-0.5 opacity-50";
                    critMeter.innerHTML = `<div class="w-full bg-yellow-400 animate-pulse" style="height: ${Math.min(100, critChance * 2)}%"></div>`;
                    hud.appendChild(critMeter);

                    wrapper.appendChild(hud);
                    view.appendChild(wrapper);

                } catch(err) {
                    console.error("HOLO-VATS ERROR:", err);
                    const view = document.getElementById('view-container');
                    if(view) view.innerHTML = `<div class="text-red-500">CRITICAL UI FAILURE</div>`;
                }
            }
        });
    }

    initCombatUI();
})();

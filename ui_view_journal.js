// [2026-01-28 14:00:00] ui_view_journal.js - Questlines Overhaul
/* Features:
   - Komplett neue Quest-Ansicht
   - Automatische Erkennung von Quest-Ketten (Storylines)
   - Timeline-Visualisierung
   - Dynamisches Wiki (beibehalten)
*/

Object.assign(UI, {

    // [v3.2] DYNAMISCHES WIKI (Beibehalten aus vorherigem Update)
    renderWiki: function(category = 'monsters') {
        const content = document.getElementById('wiki-content');
        if(!content) return;

        // --- HELPER: Navigation Buttons prüfen/erstellen ---
        const btnContainer = document.querySelector('#wiki-btn-monsters')?.parentElement;
        const ensureButton = (id, label, catName) => {
            if(btnContainer && !document.getElementById(id)) {
                const btn = document.createElement('button');
                btn.id = id;
                btn.className = "border border-green-500 px-3 py-1 text-sm font-bold whitespace-nowrap hover:bg-green-500 hover:text-black transition-colors text-green-500";
                btn.textContent = label;
                btn.onclick = () => UI.renderWiki(catName);
                btnContainer.appendChild(btn);
            }
        };
        
        ensureButton('wiki-btn-perks', 'PERKS', 'perks');
        ensureButton('wiki-btn-quests', 'QUESTS', 'quests');

        const getIcon = (type) => {
            const map = {
                'weapon': '🔫', 'body': '🛡️', 'head': '🪖', 'legs': '👖', 'feet': '🥾', 'arms': '🦾',
                'back': '🎒', 'consumable': '💉', 'junk': '⚙️', 'component': '🔩', 'ammo': '🧨',
                'blueprint': '📜', 'tool': '⛺', 'misc': '📦'
            };
            return map[type] || '❓';
        };

        const categories = ['monsters', 'items', 'crafting', 'locs', 'perks', 'quests'];
        categories.forEach(cat => {
            const btn = document.getElementById(`wiki-btn-${cat}`);
            if(btn) {
                if(cat === category) {
                    btn.classList.add('bg-green-500', 'text-black');
                    btn.classList.remove('text-green-500');
                } else {
                    btn.classList.remove('bg-green-500', 'text-black');
                    btn.classList.add('text-green-500');
                }
            }
        });

        let html = '';

        if(category === 'monsters') {
            const list = Object.values(Game.monsters || {}).sort((a,b) => a.minLvl - b.minLvl);
            if(list.length === 0) html = '<div class="text-gray-500 text-center mt-10">Keine Daten verfügbar.</div>';
            list.forEach(m => {
                const xpText = Array.isArray(m.xp) ? `${m.xp[0]}-${m.xp[1]}` : m.xp;
                let dropsText = "Nichts";
                if(m.drops && m.drops.length > 0) {
                    dropsText = m.drops.map(d => {
                        const item = Game.items[d.id];
                        return `<span class="text-green-200">${item ? item.name : d.id}</span> <span class="text-gray-500 text-[10px]">(${Math.round(d.c*100)}%)</span>`;
                    }).join(', ');
                }
                html += `
                    <div class="border border-green-900 bg-green-900/10 p-3 mb-2 flex flex-col gap-2 relative overflow-hidden group hover:border-green-500 transition-colors">
                        <div class="flex justify-between items-start border-b border-green-900/50 pb-1">
                            <div class="font-bold text-yellow-400 text-lg flex items-center gap-2"><span>👾</span> ${m.name} ${m.isLegendary ? '★' : ''}</div>
                            <div class="text-xs font-mono bg-green-900 text-green-300 px-2 rounded">LVL ${m.minLvl}</div>
                        </div>
                        <div class="grid grid-cols-4 gap-2 text-xs font-mono text-center bg-black/30 p-2 rounded">
                            <div class="flex flex-col"><span class="text-gray-500">HP</span><span class="text-white font-bold">${m.hp}</span></div>
                            <div class="flex flex-col"><span class="text-gray-500">DMG</span><span class="text-red-400 font-bold">${m.dmg}</span></div>
                            <div class="flex flex-col"><span class="text-gray-500">XP</span><span class="text-cyan-400 font-bold">${xpText}</span></div>
                            <div class="flex flex-col"><span class="text-gray-500">LOOT</span><span class="text-yellow-400 font-bold">~${m.loot}</span></div>
                        </div>
                        <div class="text-xs text-gray-400 flex gap-2 items-start mt-1">
                            <span class="font-bold shrink-0 text-green-600">DROPS:</span>
                            <div class="flex flex-wrap gap-2 leading-none">${dropsText}</div>
                        </div>
                    </div>`;
            });
        } 
        else if (category === 'items') {
            const groups = {};
            if (Game.items) {
                Object.keys(Game.items).forEach(k => {
                    const i = Game.items[k];
                    if(!groups[i.type]) groups[i.type] = [];
                    groups[i.type].push(i);
                });
                const order = ['weapon', 'body', 'head', 'arms', 'legs', 'feet', 'back', 'consumable', 'ammo', 'tool', 'blueprint', 'component', 'junk', 'quest', 'valuable'];
                const sortedKeys = Object.keys(groups).sort((a,b) => {
                    let ia = order.indexOf(a), ib = order.indexOf(b);
                    if(ia === -1) ia = 99; if(ib === -1) ib = 99;
                    return ia - ib;
                });
                sortedKeys.forEach(type => {
                    html += `<h3 class="text-md font-bold bg-green-900 text-green-100 px-2 py-1 mt-4 mb-2 uppercase tracking-widest flex items-center gap-2 border-l-4 border-green-500">${getIcon(type)} ${type}</h3>`;
                    groups[type].sort((a,b) => a.name.localeCompare(b.name)).forEach(item => {
                        let stats = [];
                        if(item.cost) stats.push(`<span class="text-yellow-500">${item.cost} KK</span>`);
                        if(item.baseDmg) stats.push(`<span class="text-red-400">DMG ${item.baseDmg}</span>`);
                        if(item.val && item.effect) stats.push(`<span class="text-blue-300">${item.effect.toUpperCase()} ${item.val > 0 ? '+' : ''}${item.val}</span>`);
                        if(item.bonus) stats.push(`<span class="text-cyan-400">${JSON.stringify(item.bonus).replace(/["{}]/g, '').replace(/:/g, '+')}</span>`);
                        html += `
                            <div class="flex flex-col border-b border-green-900/30 py-2 hover:bg-green-900/10 px-2">
                                <div class="flex justify-between items-center">
                                    <span class="font-bold text-green-300 text-sm">${item.name}</span>
                                    <div class="text-[10px] font-mono flex gap-2 opacity-80">${stats.join(' | ')}</div>
                                </div>
                                <div class="text-xs text-gray-500 italic pl-2 border-l-2 border-green-900/50 mt-1">${item.desc || "Keine Daten."}</div>
                            </div>`;
                    });
                });
            }
        } 
        else if (category === 'crafting') {
            if (Game.recipes && Game.recipes.length > 0) {
                const list = [...Game.recipes].sort((a,b) => a.lvl - b.lvl);
                list.forEach(r => {
                    const isKnown = (Game.state.knownRecipes && Game.state.knownRecipes.includes(r.id)) || r.lvl <= 1;
                    const item = Game.items[r.out];
                    const outName = r.out === "AMMO" ? "Munition x10" : (item ? item.name : r.out);
                    let reqs = Object.entries(r.req).map(([id, count]) => {
                        const iName = Game.items[id] ? Game.items[id].name : id;
                        return `${count}x ${iName}`;
                    }).join(', ');
                    html += `
                        <div class="border border-green-900 p-2 mb-2 bg-black flex justify-between items-center ${isKnown ? '' : 'opacity-40 grayscale'}">
                            <div>
                                <div class="font-bold ${isKnown ? 'text-yellow-400' : 'text-gray-500'}">${outName}</div>
                                <div class="text-[10px] text-green-600 font-mono italic">Benötigt: ${reqs}</div>
                            </div>
                            <div class="flex flex-col items-end">
                                <span class="text-xs border border-green-800 px-1 text-green-800">LVL ${r.lvl}</span>
                                ${!isKnown ? '<span class="text-[9px] text-red-500 font-bold">LOCKED</span>' : ''}
                            </div>
                        </div>`;
                });
            } else {
                html = '<div class="text-center text-gray-500 mt-10">Keine Baupläne in Datenbank.</div>';
            }
        } 
        else if (category === 'perks') {
            if(Game.perkDefs) {
                Game.perkDefs.forEach(p => {
                    const lvl = Game.getPerkLevel(p.id);
                    const has = lvl > 0;
                    html += `
                        <div class="flex gap-3 border ${has ? 'border-yellow-500 bg-yellow-900/10' : 'border-green-900/50 bg-green-900/5'} p-3 mb-2 items-center">
                            <div class="text-3xl filter drop-shadow-[0_0_5px_rgba(0,255,0,0.5)]">${p.icon || '🌟'}</div>
                            <div>
                                <div class="font-bold ${has ? 'text-yellow-400' : 'text-green-400'} text-lg flex items-center gap-2">
                                    ${p.name} ${has ? `<span class="text-[10px] bg-yellow-500 text-black px-1 rounded">STUFE ${lvl}</span>` : ''}
                                </div>
                                <div class="text-sm text-green-200">${p.desc}</div>
                            </div>
                        </div>`;
                });
            } else {
                html = '<div class="text-center text-gray-500 p-4">Keine Perks gefunden.</div>';
            }
        } 
        else if (category === 'locs') {
             const locs = Game.locations || window.GameData.locations || [];
             if(locs.length === 0) {
                 html = '<div class="text-center text-gray-500 mt-10">Keine Ortsdaten gefunden.</div>';
             } else {
                locs.forEach(l => {
                    html += `
                        <div class="mb-4 border-l-4 border-green-600 pl-3 py-1 bg-gradient-to-r from-green-900/20 to-transparent">
                            <div class="flex justify-between">
                                <span class="font-bold text-cyan-400 text-lg tracking-wider">${l.name}</span>
                                <span class="font-mono text-xs text-yellow-600 bg-black px-1 border border-yellow-900 flex items-center">${l.coord}</span>
                            </div>
                            <div class="text-sm text-green-300 mt-1 leading-relaxed">${l.desc}</div>
                        </div>`;
                });
             }
        }
        else if (category === 'quests') {
            if(Game.questDefs) {
                Game.questDefs.forEach(q => {
                    html += `
                        <div class="border border-green-900/50 p-3 mb-2 bg-black/40">
                            <div class="flex justify-between items-center mb-1">
                                <span class="font-bold text-yellow-400">${q.title}</span>
                                <span class="text-[10px] bg-green-900 text-green-200 px-1 rounded">Min-Lvl: ${q.minLvl}</span>
                            </div>
                            <div class="text-xs text-green-200 italic mb-2">${q.desc}</div>
                            <div class="text-[10px] text-gray-500 font-mono">
                                Typ: ${q.type.toUpperCase()} | Ziel: ${q.target}
                            </div>
                        </div>
                    `;
                });
            } else {
                html = '<div class="text-center text-gray-500 p-4">Keine Quests in Datenbank.</div>';
            }
        }

        content.innerHTML = html;
    },

    // [v4.0] QUEST SYSTEM REWORK - Story Lines & Timeline
    renderQuests: function() {
        const list = document.getElementById('quest-list');
        if(!list) return;
        list.innerHTML = '';

        // --- SCHRITT 1: Quest-Ketten (Chains) aufbauen ---
        const chains = []; // Array von Arrays (QuestLines)
        const sideQuests = [];
        const processedIds = new Set();
        const allDefs = Game.questDefs || [];

        // Helper: Finde Nachfolger
        const findNext = (currentId) => allDefs.find(q => q.preReq === currentId);

        // Suche Start-Quests (Root nodes)
        const roots = allDefs.filter(q => !q.preReq);

        roots.forEach(root => {
            const chain = [root];
            processedIds.add(root.id);
            
            let current = root;
            let next = findNext(current.id);
            
            // Kette verfolgen
            while(next) {
                chain.push(next);
                processedIds.add(next.id);
                current = next;
                next = findNext(current.id);
            }

            // Wenn Kette > 1 Element hat, ist es eine Story Line
            if(chain.length > 1) {
                chains.push(chain);
            } else {
                // Einzelne Quest -> Side Quest
                sideQuests.push(root);
            }
        });

        // Alle Quests, die nicht Teil einer Root-Kette waren (Sicherheitsnetz)
        allDefs.forEach(q => {
            if(!processedIds.has(q.id)) sideQuests.push(q);
        });

        // --- SCHRITT 2: Rendering Helper ---
        
        const renderQuestCard = (def, status, isCompact = false) => {
            // Status: 'done', 'active', 'locked'
            const activeData = Game.state.activeQuests.find(q => q.id === def.id);
            const isDone = status === 'done';
            const isLocked = status === 'locked';
            
            let colorClass = isDone ? "text-gray-500" : (isLocked ? "text-gray-600" : "text-yellow-400");
            let borderClass = isDone ? "border-gray-800 opacity-60" : (isLocked ? "border-gray-800 opacity-40" : "border-green-500 bg-green-900/10");
            let icon = isDone ? "✔" : (isLocked ? "🔒" : "◉");

            // Prozentberechnung für Aktive
            let pct = 0;
            let detailHtml = "";
            if(activeData) {
                pct = Math.min(100, Math.floor((activeData.progress / activeData.max) * 100));
                
                if(def.type === 'collect_multi') {
                     const details = Object.entries(def.reqItems).map(([id, amt]) => {
                        const inInv = Game.state.inventory.filter(i => i.id === id).reduce((s, i) => s + i.count, 0);
                        const iName = Game.items[id]?.name || id;
                        const done = inInv >= amt;
                        return `<span class="${done ? 'text-green-500 line-through' : 'text-yellow-200'}">${inInv}/${amt} ${iName}</span>`;
                    }).join(', ');
                    detailHtml = `<div class="text-[10px] mt-1 border-t border-green-900/30 pt-1">${details}</div>`;
                }
            }

            if(isLocked) return `
                <div class="flex items-center gap-3 p-2 border-l-2 border-gray-700 ml-2">
                    <div class="text-gray-600 font-mono">???</div>
                    <div class="text-xs text-gray-700 italic">Noch nicht verfügbar</div>
                </div>`;

            if(isCompact && isDone) return `
                <div class="flex items-center gap-2 mb-1 opacity-50 ml-1">
                    <span class="text-green-600 text-xs">✔</span>
                    <span class="text-xs text-green-800 line-through decoration-green-900">${def.title}</span>
                </div>`;

            return `
                <div class="border-l-2 ${isDone ? 'border-green-800' : 'border-yellow-400'} pl-3 py-2 mb-2 ml-1 relative group transition-all">
                    <div class="flex justify-between items-start">
                        <div class="font-bold ${colorClass} text-sm flex items-center gap-2">
                            ${icon} ${def.title}
                        </div>
                        ${!isLocked && !isDone ? `<span class="text-[9px] border border-green-900 text-green-400 px-1 rounded">LVL ${def.minLvl}</span>` : ''}
                    </div>
                    
                    ${!isDone && !isLocked ? `<div class="text-xs text-green-200 mt-1 mb-2 leading-relaxed">${def.desc}</div>` : ''}
                    
                    ${activeData ? `
                        <div class="w-full bg-black border border-green-900 h-1.5 mt-1 mb-1">
                            <div class="bg-yellow-500 h-full transition-all duration-500" style="width: ${pct}%"></div>
                        </div>
                        <div class="flex justify-between text-[9px] font-mono text-green-400">
                            <span>${activeData.progress} / ${activeData.max}</span>
                            <span>${pct}%</span>
                        </div>
                        ${detailHtml}
                        <div class="mt-2 text-[10px] text-yellow-600 font-bold border-t border-dashed border-green-900/50 pt-1">
                            BELOHNUNG: ${def.reward?.caps ? def.reward.caps + ' KK ' : ''}${def.reward?.xp ? def.reward.xp + ' XP' : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        };

        // --- SCHRITT 3: Rendering der Story Lines ---

        if(chains.length > 0) {
            list.innerHTML += `<h3 class="text-yellow-500 font-bold text-xs tracking-[0.2em] border-b border-yellow-900/50 mb-3 pb-1">HAUPTGESCHICHTEN</h3>`;
            
            chains.forEach((chain, idx) => {
                const chainContainer = document.createElement('div');
                chainContainer.className = "mb-6 bg-black/20 p-2 rounded border border-green-900/30";
                
                // Titel der Storyline (basierend auf der ersten Quest)
                const isComplete = chain.every(q => Game.state.completedQuests.includes(q.id));
                const isActive = chain.some(q => Game.state.activeQuests.find(aq => aq.id === q.id));
                
                let headerColor = isComplete ? "text-green-700" : (isActive ? "text-green-300" : "text-gray-500");
                chainContainer.innerHTML = `<div class="font-bold ${headerColor} mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                    <span class="text-xl">${isActive ? '📖' : (isComplete ? '✅' : '🔒')}</span> GESCHICHTE: ${chain[0].title}
                </div>`;

                let lineHtml = `<div class="flex flex-col gap-0 border-l border-green-900/30 ml-2 pl-2">`;
                
                let lockedFound = false; // Damit wir nur die *nächste* gesperrte Quest anzeigen, nicht alle

                chain.forEach(q => {
                    const isDone = Game.state.completedQuests.includes(q.id);
                    const isActiveQ = Game.state.activeQuests.find(aq => aq.id === q.id);
                    
                    if(isDone) {
                        lineHtml += renderQuestCard(q, 'done', true); // Compact view für erledigte
                    } else if (isActiveQ) {
                        lineHtml += renderQuestCard(q, 'active');
                    } else {
                        if(!lockedFound) {
                            lineHtml += renderQuestCard(q, 'locked');
                            lockedFound = true; // Nur eine locked Quest anzeigen
                        }
                    }
                });

                lineHtml += `</div>`;
                chainContainer.innerHTML += lineHtml;
                list.appendChild(chainContainer);
            });
        }

        // --- SCHRITT 4: Rendering der Side Quests ---

        if(sideQuests.length > 0) {
            // Filtere Sidequests: Zeige nur Aktive oder Erledigte an (keine gesperrten Spoilers)
            const visibleSide = sideQuests.filter(q => 
                Game.state.activeQuests.find(aq => aq.id === q.id) || 
                Game.state.completedQuests.includes(q.id)
            );

            if(visibleSide.length > 0) {
                const sideContainer = document.createElement('div');
                sideContainer.innerHTML = `<h3 class="text-green-500 font-bold text-xs tracking-[0.2em] border-b border-green-900/50 mb-3 pb-1 mt-6">NEBENMISSIONEN</h3>`;
                
                visibleSide.forEach(q => {
                    const isDone = Game.state.completedQuests.includes(q.id);
                    sideContainer.innerHTML += renderQuestCard(q, isDone ? 'done' : 'active', isDone);
                });
                
                list.appendChild(sideContainer);
            }
        }

        if(chains.length === 0 && sideQuests.length === 0) {
             list.innerHTML = '<div class="text-center text-gray-500 italic mt-10">Keine Aufzeichnungen vorhanden.</div>';
        }
    }
});

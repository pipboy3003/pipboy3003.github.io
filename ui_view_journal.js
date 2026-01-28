// [2026-01-28 12:15:00] ui_view_journal.js - Fully Dynamic Wiki & Quests

Object.assign(UI, {

    // [v3.2] DYNAMISCHES WIKI
    // Liest ALLES aus GameData. Keine Hardcoded Listen mehr!
    renderWiki: function(category = 'monsters') {
        const content = document.getElementById('wiki-content');
        if(!content) return;

        // --- HELPER: Navigation Buttons prüfen/erstellen ---
        const btnContainer = document.querySelector('#wiki-btn-monsters')?.parentElement;
        // Wir fügen Buttons hinzu, falls sie fehlen (z.B. Perks oder Quests)
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
        ensureButton('wiki-btn-quests', 'QUESTS', 'quests'); // NEUER BUTTON FÜR QUESTS

        const getIcon = (type) => {
            const map = {
                'weapon': '🔫', 'body': '🛡️', 'head': '🪖', 'legs': '👖', 'feet': '🥾', 'arms': '🦾',
                'back': '🎒', 'consumable': '💉', 'junk': '⚙️', 'component': '🔩', 'ammo': '🧨',
                'blueprint': '📜', 'tool': '⛺', 'misc': '📦'
            };
            return map[type] || '❓';
        };

        // Button Styles update
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

        // --- 👾 MONSTER (Dynamisch) ---
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
        // --- 📦 ITEMS (Dynamisch) ---
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
        // --- 🔧 CRAFTING (Dynamisch) ---
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
        // --- 🌟 PERKS (Dynamisch) ---
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
        // --- 🌍 LOCATIONS (NEU: Dynamisch aus GameData.locations) ---
        else if (category === 'locs') {
             // FALLBACK: Falls noch keine Locations in data_core stehen, nutzen wir Dummy-Daten
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
        // --- 📜 QUESTS (NEU: Quest-Übersicht für Wiki) ---
        else if (category === 'quests') {
            if(Game.questDefs) {
                Game.questDefs.forEach(q => {
                    // Zeige Quest an (ggf. als ??? wenn Voraussetzung fehlt, hier erstmal alles sichtbar als "Datenbank")
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

    // [v3.1] Quest Render Logic mit Prozentanzeige (Bleibt unverändert wie oben, muss aber in der Datei bleiben)
    renderQuests: function() {
        const list = document.getElementById('quest-list');
        if(!list) return;
        list.innerHTML = '';
        
        if(!this.questTab) this.questTab = 'active';

        const tabsContainer = document.createElement('div');
        tabsContainer.className = "flex w-full border-b border-green-900 mb-4";
        
        const btnActive = document.createElement('button');
        btnActive.className = `flex-1 py-2 font-bold text-center transition-colors ${this.questTab === 'active' ? 'bg-green-900/40 text-green-400 border-b-2 border-green-500' : 'bg-black text-gray-600 hover:text-green-500'}`;
        btnActive.textContent = "AKTIV";
        btnActive.onclick = (e) => { e.stopPropagation(); this.questTab = 'active'; this.renderQuests(); };
        
        const btnCompleted = document.createElement('button');
        btnCompleted.className = `flex-1 py-2 font-bold text-center transition-colors ${this.questTab === 'completed' ? 'bg-green-900/40 text-green-400 border-b-2 border-green-500' : 'bg-black text-gray-600 hover:text-green-500'}`;
        btnCompleted.textContent = "ERLEDIGT";
        btnCompleted.onclick = (e) => { e.stopPropagation(); this.questTab = 'completed'; this.renderQuests(); };
        
        tabsContainer.appendChild(btnActive);
        tabsContainer.appendChild(btnCompleted);
        list.appendChild(tabsContainer);

        if(this.questTab === 'active') {
            const quests = Game.state.activeQuests || [];
            if(quests.length === 0) {
                list.innerHTML += '<div class="text-gray-500 italic text-center mt-10">Keine aktiven Aufgaben.</div>';
                return;
            }
            quests.forEach(q => {
                const def = Game.questDefs ? Game.questDefs.find(d => d.id === q.id) : null;
                const title = def ? def.title : "Unbekannte Quest";
                const desc = def ? def.desc : "???";
                const pct = Math.min(100, Math.floor((q.progress / q.max) * 100));
                
                let detailHtml = "";
                if(def && def.type === 'collect_multi') {
                    detailHtml = `<div class='text-[10px] text-green-500 font-mono mb-2'>STATUS: `;
                    detailHtml += Object.entries(def.reqItems).map(([id, amt]) => {
                        const inInv = Game.state.inventory.filter(i => i.id === id).reduce((s, i) => s + i.count, 0);
                        return `${inInv}/${amt} ${Game.items[id]?.name || id}`;
                    }).join(' | ') + `</div>`;
                }

                const div = document.createElement('div');
                div.className = "border border-green-900 bg-green-900/10 p-3 mb-2 relative";
                div.innerHTML = `
                    <div class="font-bold text-yellow-400 text-lg mb-1 flex justify-between">
                        <span>${title}</span>
                        <span class="text-xs text-gray-400 border border-gray-600 px-1 rounded">LVL ${def?.minLvl || 1}</span>
                    </div>
                    <div class="text-green-200 text-sm mb-3">${desc}</div>
                    ${detailHtml}
                    <div class="w-full bg-black border border-green-700 h-5 relative mb-2">
                        <div class="bg-green-600 h-full transition-all duration-700" style="width: ${pct}%"></div>
                        <div class="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white shadow-black">
                            ${pct}% ABGESCHLOSSEN
                        </div>
                    </div>
                    <div class="mt-2 text-right text-[10px] text-yellow-600 font-bold">
                        BELOHNUNG: ${def?.reward?.caps ? def.reward.caps + ' KK, ' : ''}${def?.reward?.xp || 0} XP
                    </div>`;
                list.appendChild(div);
            });
        } else {
            const completedIds = Game.state.completedQuests || [];
            if(completedIds.length === 0) {
                list.innerHTML += '<div class="text-gray-500 italic text-center mt-10">Noch nichts erledigt.</div>';
                return;
            }
            completedIds.forEach(qId => {
                const def = Game.questDefs?.find(d => d.id === qId);
                if(!def) return;
                const div = document.createElement('div');
                div.className = "border border-gray-800 bg-black p-3 mb-2 opacity-60";
                div.innerHTML = `
                    <div class="flex justify-between items-center mb-1">
                        <span class="font-bold text-gray-400 line-through">${def.title}</span>
                        <span class="text-[9px] bg-green-900 text-green-300 px-2 rounded">ERLEDIGT</span>
                    </div>`;
                list.appendChild(div);
            });
        }
    }
});

Object.assign(UI, {
    
    shopQty: 1,

    // --- KLINIK (Dr. Zimmermann) ---
    renderClinic: function() {
        // [v0.9.1] Set State explicitly
        Game.state.view = 'clinic';

        const view = document.getElementById('view-container');
        if(!view) return;
        
        view.innerHTML = `
            <div class="flex flex-col h-full bg-black/90">
                <div class="p-4 border-b border-red-500 bg-red-900/20 text-center">
                    <h2 class="text-3xl text-red-500 font-bold tracking-widest">DR. ZIMMERMANN</h2>
                    <div class="text-xs text-red-300">ZERTIFIZIERTER* MEDIZINER (*Zertifikat verloren)</div>
                </div>
                
                <div class="flex-grow flex flex-col items-center justify-center p-6 gap-6 text-center">
                    <div class="text-6xl animate-pulse filter drop-shadow-[0_0_10px_red]">⚕️</div>
                    
                    <div class="border border-red-900 p-4 bg-black w-full max-w-md">
                        <div class="text-green-400 mb-2 font-bold border-b border-green-900 pb-1">PATIENTEN STATUS</div>
                        <div class="flex justify-between text-lg font-mono">
                            <span>GESUNDHEIT:</span> 
                            <span class="${Game.state.hp < Game.state.maxHp ? 'text-red-500 blink-red' : 'text-green-500'}">${Math.floor(Game.state.hp)} / ${Game.state.maxHp}</span>
                        </div>
                        <div class="flex justify-between text-lg font-mono">
                            <span>STRAHLUNG:</span> 
                            <span class="${Game.state.rads > 0 ? 'text-red-500 animate-pulse' : 'text-green-500'}">${Math.floor(Game.state.rads)} RADS</span>
                        </div>
                    </div>

                    <div class="text-gray-400 italic text-sm max-w-md leading-relaxed">
                        "Ich kann Sie wieder zusammenflicken. Entfernt Strahlung und heilt alle Verletzungen. Kostet aber ein bisschen was für die... Materialien."
                    </div>

                    <button onclick="Game.heal()" class="action-button w-full max-w-md py-4 text-xl border-red-500 text-red-500 hover:bg-red-900 font-bold" ${Game.state.caps < 25 ? 'disabled' : ''}>
                        KOMPLETTBEHANDLUNG (25 KK)
                    </button>
                </div>

                <div class="p-4 border-t border-red-900">
                    <button class="action-button w-full border-gray-500 text-gray-500 hover:bg-gray-900" onclick="UI.renderCity()">ZURÜCK ZUM ZENTRUM</button>
                </div>
            </div>
        `;
    },

    // --- WERKBANK (Crafting & Scrapping) ---
    renderCrafting: function(tab = 'create') {
        // [v0.9.1] Set State explicitly (WICHTIG für scrapItem!)
        Game.state.view = 'crafting';

        const view = document.getElementById('view-container');
        if(!view) return;
        view.innerHTML = '';

        // UI Aufbau
        view.innerHTML = `
            <div id="crafting-view" class="w-full h-full p-4 flex flex-col gap-4 text-green-500 font-mono bg-black/95">
                <div class="border-b-2 border-orange-500 pb-2 mb-2 flex justify-between items-end">
                    <h2 class="text-2xl font-bold text-orange-400">🛠️ WERKBANK</h2>
                    <div class="text-xs text-orange-300">Zustand: Rostig</div>
                </div>
                
                <div class="flex w-full border-b border-green-900 mb-2">
                    <button class="flex-1 py-2 font-bold transition-colors ${tab==='create' ? 'bg-green-900/40 text-green-400 border-b-2 border-green-400' : 'text-gray-500 hover:text-green-300'}" onclick="UI.renderCrafting('create')">HERSTELLEN</button>
                    <button class="flex-1 py-2 font-bold transition-colors ${tab==='scrap' ? 'bg-orange-900/40 text-orange-400 border-b-2 border-orange-400' : 'text-gray-500 hover:text-orange-300'}" onclick="UI.renderCrafting('scrap')">ZERLEGEN</button>
                </div>

                <div id="crafting-list" class="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-2"></div>
                
                <button onclick="UI.renderCity()" class="p-3 border border-gray-600 text-gray-500 hover:bg-gray-900/50 mt-2 font-bold w-full uppercase tracking-widest">Zurück zum Zentrum</button>
            </div>
        `;

        const container = document.getElementById('crafting-list');
        
        if (tab === 'create') {
            const recipes = Game.recipes || [];
            const known = Game.state.knownRecipes || [];
            let knownCount = 0; 

            recipes.forEach(recipe => {
                if(recipe.type === 'cooking') return; // Cooking gehört ans Campfire
                if(!known.includes(recipe.id) && recipe.lvl > 1) return; // Nur bekannte oder Level 1 Rezepte zeigen
                knownCount++;

                const outItem = (recipe.out === 'AMMO' ? {name: "15x Munition"} : Game.items[recipe.out]) || {name: "Unbekanntes Item"};
                
                let reqHtml = '';
                let canCraft = true;
                
                for(let reqId in recipe.req) {
                    const countNeeded = recipe.req[reqId];
                    const invItem = Game.state.inventory.find(i => i.id === reqId);
                    const countHave = invItem ? invItem.count : 0;
                    
                    const reqDef = Game.items[reqId];
                    const reqName = reqDef ? reqDef.name : reqId;

                    let color = "text-green-500";
                    if (countHave < countNeeded) { canCraft = false; color = "text-red-500 font-bold"; }
                    reqHtml += `<div class="${color} text-xs">• ${reqName}: ${countHave}/${countNeeded}</div>`;
                }
                
                if(Game.state.lvl < recipe.lvl) { 
                    canCraft = false; 
                    reqHtml += `<div class="text-red-500 text-xs mt-1 font-bold">Benötigt Level ${recipe.lvl}</div>`; 
                }

                const div = document.createElement('div');
                div.className = `border ${canCraft ? 'border-green-500 bg-green-900/10' : 'border-gray-800 bg-black opacity-60'} p-3 mb-2 transition-colors`;
                
                div.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <div class="font-bold text-yellow-400 text-lg">${outItem.name}</div>
                        <button class="action-button text-sm px-4 py-1 ${canCraft ? 'border-green-500 text-green-500 hover:bg-green-500 hover:text-black' : 'border-gray-600 text-gray-600 cursor-not-allowed'}" onclick="Game.craftItem('${recipe.id}')" ${canCraft ? '' : 'disabled'}>BAUEN</button>
                    </div>
                    <div class="pl-2 border-l-2 border-green-900 grid grid-cols-2 gap-2">${reqHtml}</div>
                `;
                container.appendChild(div);
            });
            
            if(knownCount === 0) {
                container.innerHTML = '<div class="text-gray-500 italic mt-10 text-center border-t border-gray-800 pt-4">Du hast noch keine Baupläne gelernt.<br><span class="text-xs text-green-700">Suche in Dungeons oder der Wildnis nach Blueprints!</span></div>';
            }
        } 
        else {
            // SCRAP TAB
            let scrappables = [];
            Game.state.inventory.forEach((item, idx) => {
                const def = Game.items[item.id];
                if(!def) return;

                if (['weapon','body','head','legs','feet','arms','junk'].includes(def.type)) {
                    scrappables.push({idx, item, def});
                }
            });

            if(scrappables.length === 0) {
                container.innerHTML = '<div class="text-center text-gray-500 mt-10 p-4 border border-gray-800 bg-black">Keine zerlegbaren Gegenstände (Waffen/Rüstung/Schrott) im Inventar.</div>';
            } else {
                container.innerHTML = '<div class="text-xs text-orange-400 mb-4 text-center bg-orange-900/20 p-2 border border-orange-900">WÄHLE EIN ITEM ZUM ZERLEGEN (GIBT SCHROTT)</div>';
                
                scrappables.forEach(entry => {
                    const name = entry.item.props && entry.item.props.name ? entry.item.props.name : entry.def.name;
                    const div = document.createElement('div');
                    div.className = "flex justify-between items-center p-3 mb-2 border border-orange-700 bg-orange-900/10 hover:bg-orange-900/20 transition-colors";
                    div.innerHTML = `
                        <div class="font-bold text-orange-200">${name} <span class="text-xs text-gray-500">(${entry.item.count}x)</span></div>
                        <button class="border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black px-4 py-1 text-xs font-bold transition-colors uppercase" onclick="Game.scrapItem(${entry.idx})">ZERLEGEN</button>
                    `;
                    container.appendChild(div);
                });
            }
        }
    },

// ==========================================
    // --- SHOP REDESIGN (Handelsposten) [v0.9.2] ---
    // ==========================================
    renderShop: function(mode = 'buy') {
        Game.state.view = 'shop';
        Game.checkShopRestock(); 

        const view = document.getElementById('view-container');
        if(!view) return;
        view.innerHTML = '';

        // 1. HEADER (Cash Register Style)
        const header = document.createElement('div');
        header.className = "flex justify-between items-end p-4 border-b-4 border-yellow-600 bg-[#1a1500] relative shadow-md";
        header.innerHTML = `
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-transparent opacity-50"></div>
            <div>
                <h2 class="text-3xl text-yellow-400 font-bold font-vt323 tracking-wider">HANDELSPOSTEN</h2>
                <div class="text-sm text-yellow-700 font-mono">HÄNDLER KAPITAL: <span class="font-bold">${Game.state.shop.merchantCaps} KK</span></div>
            </div>
            <div class="flex flex-col items-end p-2 bg-black/50 border-2 border-yellow-500 rounded shadow-[inset_0_0_10px_rgba(255,200,0,0.2)]">
                <span class="text-[10px] text-yellow-600 uppercase tracking-widest">DEIN VERMÖGEN</span>
                <span class="text-2xl text-yellow-300 font-bold font-vt323">${Game.state.caps} 📜</span>
            </div>
        `;
        view.appendChild(header);

        // 2. CONTROL PANEL (Tabs & Qty)
        const controls = document.createElement('div');
        controls.className = "bg-[#110d00] border-b-2 border-yellow-900 p-3 flex flex-col gap-3 shadow-inner";
        
        // TABS as sturdy switches
        controls.innerHTML = `
            <div class="flex w-full gap-2">
                <button class="flex-1 py-3 font-bold text-lg uppercase tracking-wider border-2 transition-all ${mode==='buy' ? 'bg-yellow-500 text-black border-yellow-500 shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)]' : 'bg-black text-yellow-600 border-yellow-800 hover:border-yellow-500 hover:text-yellow-400'}" onclick="UI.renderShop('buy')">KAUFEN</button>
                <button class="flex-1 py-3 font-bold text-lg uppercase tracking-wider border-2 transition-all ${mode==='sell' ? 'bg-green-500 text-black border-green-500 shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)]' : 'bg-black text-green-600 border-green-800 hover:border-green-500 hover:text-green-400'}" onclick="UI.renderShop('sell')">VERKAUFEN</button>
            </div>
        `;
        
        // QTY BUTTONS as smaller mechanical buttons
        const qtyRow = document.createElement('div');
        qtyRow.className = "flex justify-center gap-2 px-2 pt-2 border-t border-yellow-900/30";
        const makeQtyBtn = (label, val) => {
            const isActive = (this.shopQty === val);
            return `<button class="px-4 py-1 text-xs font-bold border-2 uppercase tracking-widest transition-all ${isActive ? 'bg-yellow-500 text-black border-yellow-500 shadow-inner' : 'bg-[#2a2510] text-yellow-500 border-yellow-700 hover:border-yellow-400 hover:bg-[#3a3520]'}" onclick="UI.shopQty = '${val}'; UI.renderShop('${mode}')">${label}</button>`;
        };
        qtyRow.innerHTML = `<span class="text-xs text-yellow-800 self-center mr-2 font-bold">MENGE:</span>` + makeQtyBtn("1x", 1) + makeQtyBtn("5x", 5) + makeQtyBtn("MAX", 'max');
        controls.appendChild(qtyRow);
        view.appendChild(controls);

        // 3. CONTENT LIST
        const content = document.createElement('div');
        content.id = "shop-list";
        content.className = "flex-grow overflow-y-auto p-3 custom-scrollbar bg-[#0a0800]";
        view.appendChild(content);

        if(mode === 'buy') this.renderShopBuy(content);
        else this.renderShopSell(content);

        // 4. FOOTER
        const footer = document.createElement('div');
        footer.className = "p-3 border-t-4 border-yellow-900 bg-[#1a1500]";
        footer.innerHTML = `<button class="action-button w-full border-2 border-yellow-700 text-yellow-600 hover:bg-yellow-900/50 hover:text-yellow-300 py-3 font-bold tracking-widest uppercase" onclick="UI.renderCity()"><< ZURÜCK ZUM ZENTRUM</button>`;
        view.appendChild(footer);
    },

    renderShopBuy: function(container) {
        if(!container) container = document.getElementById('shop-list');
        if(!container) return;
        container.innerHTML = '';

        const stock = Game.state.shop.stock || {};
        const ammoStock = Game.state.shop.ammoStock || 0;

        // HELPER: Create Item Slot (Buy)
        const createBuySlot = (icon, name, stockCount, price, onClick, isSpecial=false) => {
            const canBuy = Game.state.caps >= price;
            const borderColor = isSpecial ? 'border-blue-500' : (canBuy ? 'border-yellow-600' : 'border-red-900');
            const bgColor = isSpecial ? 'bg-blue-900/10' : (canBuy ? 'bg-yellow-900/10' : 'bg-red-900/10');
            const textColor = isSpecial ? 'text-blue-300' : (canBuy ? 'text-yellow-300' : 'text-gray-600');
            const priceColor = canBuy ? 'text-yellow-400' : 'text-red-500';

            const div = document.createElement('div');
            div.className = `flex justify-between items-stretch mb-2 border-2 ${borderColor} ${bgColor} ${canBuy ? 'hover:bg-opacity-30 cursor-pointer group' : 'opacity-60 grayscale'} transition-all h-18 shadow-sm`;
            
            div.innerHTML = `
                <div class="flex items-center gap-3 p-2 flex-grow overflow-hidden">
                    <div class="text-3xl w-12 h-12 flex items-center justify-center bg-black/30 border border-${isSpecial?'blue':'yellow'}-800 rounded group-hover:scale-110 transition-transform">${icon}</div>
                    <div class="flex flex-col truncate">
                        <span class="font-bold ${textColor} text-lg truncate leading-tight font-vt323">${name}</span>
                        <span class="text-xs ${isSpecial?'text-blue-500':'text-yellow-700'} font-mono">Vorrat: ${stockCount}</span>
                    </div>
                </div>
                <div class="flex flex-col items-end justify-center border-l-2 ${borderColor} bg-black/20 min-w-[90px]">
                     <div class="font-bold ${priceColor} text-lg p-1 text-center w-full border-b ${borderColor} font-vt323">${price} KK</div>
                     <button class="flex-grow w-full text-xs font-bold uppercase tracking-wider hover:bg-${isSpecial?'blue':'yellow'}-500 hover:text-black transition-colors ${textColor}" ${canBuy ? '' : 'disabled'}>
                        KAUFEN
                     </button>
                </div>
            `;
            if(canBuy) {
                div.querySelector('button').onclick = (e) => { e.stopPropagation(); onClick(); };
                div.onclick = onClick;
            }
            return div;
        };

        // Special Ammo Offer
        if(ammoStock > 0) {
            container.appendChild(createBuySlot("🧨", "10x MUNITION PAKET", ammoStock, 10, () => Game.buyAmmo(UI.shopQty), true));
            // Separator
             container.innerHTML += `<div class="h-px bg-yellow-900/50 my-4 relative"><span class="absolute left-1/2 -top-2 -translate-x-1/2 bg-[#0a0800] px-2 text-xs text-yellow-800 font-mono lowercase">reguläres angebot</span></div>`;
        }

        // Categories
        const categories = {
            'consumable': { title: '💊 HILFSMITTEL', items: [] },
            'weapon': { title: '🔫 WAFFEN', items: [] },
            'body': { title: '🛡️ RÜSTUNG', items: [] },
            'misc': { title: '📦 SONSTIGES', items: [] } 
        };

        const sortedKeys = Object.keys(stock).sort((a,b) => (Game.items[a]?.cost || 0) - (Game.items[b]?.cost || 0));
        sortedKeys.forEach(key => {
            if(stock[key] <= 0) return;
            const item = Game.items[key];
            if(!item) return;
            const cat = categories[item.type] || categories['misc'];
            cat.items.push({key, ...item});
        });

        let hasItems = false;
        for(let catKey in categories) {
            const cat = categories[catKey];
            if(cat.items.length > 0) {
                hasItems = true;
                const header = document.createElement('h3');
                header.className = "text-yellow-600 font-bold border-b-2 border-yellow-800 mt-6 mb-3 pb-1 pl-2 text-sm uppercase tracking-[0.2em] bg-yellow-900/20 font-mono";
                header.textContent = cat.title;
                container.appendChild(header);

                cat.items.forEach(data => {
                    let icon = "📦";
                    if(data.type === 'weapon') icon = "🔫"; if(data.type === 'body') icon = "🛡️"; if(data.type === 'consumable') icon = "💉";
                    container.appendChild(createBuySlot(icon, data.name, stock[data.key], data.cost, () => Game.buyItem(data.key, UI.shopQty)));
                });
            }
        }

        if(ammoStock <= 0 && !hasItems) {
            container.innerHTML = '<div class="text-center text-yellow-800 mt-10 font-mono border-2 border-yellow-900 p-4 border-dashed">ALLES AUSVERKAUFT.<br>Komm später wieder.</div>';
        }
    },

    renderShopSell: function(container) {
        if(!container) container = document.getElementById('shop-list');
        if(!container) return;
        container.innerHTML = '';

        if(Game.state.inventory.length === 0) {
            container.innerHTML = '<div class="text-center text-green-800 mt-10 font-mono border-2 border-green-900 p-4 border-dashed">DEIN INVENTAR IST LEER.</div>';
            return;
        }

        container.innerHTML = `<div class="text-xs text-green-700 mb-4 text-center bg-green-900/20 p-2 border border-green-900 font-mono uppercase tracking-widest">Wähle Items zum Verkauf</div>`;

        Game.state.inventory.forEach((item, idx) => {
            const def = Game.items[item.id];
            if(!def) return;
            
            let valMult = item.props && item.props.valMult ? item.props.valMult : 1;
            let sellPrice = Math.floor((def.cost * 0.25) * valMult);
            if(sellPrice < 1) sellPrice = 1;

            const name = item.props && item.props.name ? item.props.name : def.name;
            const canSell = Game.state.shop.merchantCaps >= sellPrice;
            
            const borderColor = canSell ? 'border-green-600' : 'border-red-900';
            const bgColor = canSell ? 'bg-green-900/10' : 'bg-red-900/10';
            const textColor = canSell ? 'text-green-300' : 'text-gray-600';

            const div = document.createElement('div');
            div.className = `flex justify-between items-stretch mb-2 border-2 ${borderColor} ${bgColor} ${canSell ? 'hover:bg-opacity-30 cursor-pointer group' : 'opacity-60 grayscale'} transition-all h-16 shadow-sm`;
            
            let icon = "📦";
            if(def.type === 'weapon') icon = "🔫"; if(def.type === 'body') icon = "🛡️"; if(def.type === 'consumable') icon = "💉"; if(def.type === 'junk') icon = "⚙️";

            div.innerHTML = `
                <div class="flex items-center gap-3 p-2 flex-grow overflow-hidden">
                     <div class="text-2xl w-10 h-10 flex items-center justify-center bg-black/30 border border-green-800 rounded group-hover:scale-110 transition-transform">${icon}</div>
                    <div class="flex flex-col truncate">
                        <span class="font-bold ${textColor} text-lg truncate leading-tight font-vt323">${name}</span>
                        <span class="text-xs text-green-700 font-mono">Im Besitz: ${item.count}x</span>
                    </div>
                </div>
                <div class="flex flex-col items-end justify-center border-l-2 ${borderColor} bg-black/20 min-w-[90px]">
                     <div class="font-bold text-green-400 text-lg p-1 text-center w-full border-b ${borderColor} font-vt323">${sellPrice} KK</div>
                     <button class="flex-grow w-full text-xs font-bold uppercase tracking-wider hover:bg-green-500 hover:text-black transition-colors ${textColor}" ${canSell ? '' : 'disabled'}>
                        VERKAUFEN
                     </button>
                </div>
            `;
             if(canSell) {
                div.querySelector('button').onclick = (e) => { e.stopPropagation(); Game.sellItem(idx, UI.shopQty); };
                div.onclick = () => Game.sellItem(idx, UI.shopQty);
            }
            container.appendChild(div);
        });
    }
});

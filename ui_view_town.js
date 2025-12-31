// [v2.2] - Modularized Town Views (City, Shop, Clinic, Crafting)
Object.assign(UI, {

    renderCity: function() {
        const con = document.getElementById('city-options');
        if(!con) return;
        con.innerHTML = '';
        const addBtn = (icon, title, subtitle, cb, disabled=false) => {
            const b = document.createElement('button');
            b.className = "action-button w-full mb-3 p-3 flex items-center justify-between group bg-black/40 hover:bg-green-900/50 border-l-4 border-transparent hover:border-green-500 transition-all";
            
            b.innerHTML = `
                <div class="flex items-center gap-4">
                    <span class="text-3xl filter grayscale group-hover:grayscale-0 transition-all">${icon}</span>
                    <div class="flex flex-col items-start text-left">
                        <span class="text-lg sm:text-xl font-bold text-green-400 group-hover:text-yellow-400 tracking-wider">${title}</span>
                        <span class="text-xs text-green-600 group-hover:text-green-200 font-mono">${subtitle}</span>
                    </div>
                </div>
                <div class="text-xl text-green-800 group-hover:text-green-400 transition-transform group-hover:translate-x-1">▶</div>
            `;
            
            b.onclick = cb;
            
            if(disabled) { 
                b.disabled = true; 
                b.classList.add('opacity-40', 'cursor-not-allowed', 'filter', 'grayscale');
                b.classList.remove('hover:bg-green-900/50', 'hover:border-green-500');
                b.innerHTML = b.innerHTML.replace('group-hover:text-yellow-400', '').replace('group-hover:translate-x-1', '');
            }
            con.appendChild(b);
        };
        
        const healCost = 25;
        const canHeal = Game.state.caps >= healCost && Game.state.hp < Game.state.maxHp;
        let healSub = `HP wiederherstellen (${healCost} KK)`;
        if(Game.state.hp >= Game.state.maxHp) healSub = "Gesundheit ist voll";
        else if(Game.state.caps < healCost) healSub = "Zu wenig Kronkorken";
        
        addBtn("🏥", "KLINIK", healSub, () => UI.switchView('clinic'), !canHeal);
        addBtn("🛒", "MARKTPLATZ", "Waffen, Rüstung & Munition", () => UI.switchView('shop').then(() => UI.renderShop()));
        addBtn("🛠️", "WERKBANK", "Gegenstände herstellen", () => this.toggleView('crafting'));
        
        addBtn("🎯", "TRAININGSGELÄNDE", "Hacking & Schlossknacken üben", () => {
             con.innerHTML = '';
             const backBtn = document.createElement('button');
             backBtn.className = "w-full py-2 mb-4 border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-bold tracking-widest";
             backBtn.textContent = "<< ZURÜCK ZUR STADT";
             backBtn.onclick = () => this.renderCity();
             con.appendChild(backBtn);
             
             addBtn("💻", "HACKING SIM", "Schwierigkeit: Einfach", () => MiniGames.hacking.start('easy'));
             addBtn("🔐", "SCHLOSSKNACKEN", "Schwierigkeit: Einfach", () => MiniGames.lockpicking.start('easy'));
        });
        
        addBtn("🚪", "STADT VERLASSEN", "Zurück in das Ödland", () => this.switchView('map'));
    },
    
    renderShop: function(container) {
        if(!container) container = document.getElementById('shop-list');
        if(!container) return;
        
        Game.checkShopRestock();

        container.innerHTML = '';
        const backBtn = document.createElement('button');
        backBtn.className = "w-full py-3 mb-4 border border-yellow-400 text-yellow-400 font-bold hover:bg-yellow-400 hover:text-black transition-colors uppercase tracking-widest";
        backBtn.textContent = "<< Speichern & Zurück";
        backBtn.onclick = () => { Game.saveGame(); this.switchView('city'); };
        container.appendChild(backBtn);

        const capsDisplay = document.createElement('div');
        capsDisplay.className = "sticky top-0 bg-black/90 border-b border-yellow-500 text-yellow-400 font-bold text-right p-2 mb-4 z-10 font-mono";
        capsDisplay.innerHTML = `VERMÖGEN: ${Game.state.caps} KK`;
        container.appendChild(capsDisplay);

        const categories = {
            'consumable': { title: 'HILFSMITTEL', items: [] },
            'weapon': { title: 'WAFFEN', items: [] },
            'body': { title: 'KLEIDUNG & RÜSTUNG', items: [] },
            'misc': { title: 'SONSTIGES', items: [] } 
        };

        const sortedKeys = Object.keys(Game.items).sort((a,b) => Game.items[a].cost - Game.items[b].cost);
        sortedKeys.forEach(key => {
            const item = Game.items[key];
            if(item.cost > 0 && !key.startsWith('rusty_') && item.type !== 'blueprint') { 
                if(Game.state.shop.stock && Game.state.shop.stock[key] > 0) {
                     if(categories[item.type]) { categories[item.type].items.push({key, ...item}); } 
                     else { categories['misc'].items.push({key, ...item}); }
                }
            }
        });

        const renderCategory = (catKey) => {
            const cat = categories[catKey];
            if(cat.items.length === 0) return;
            const header = document.createElement('h3');
            header.className = "text-green-500 font-bold border-b border-green-700 mt-4 mb-2 pb-1 pl-2 text-sm uppercase tracking-widest bg-green-900/20";
            header.textContent = cat.title;
            container.appendChild(header);

            cat.items.forEach(data => {
                const canAfford = Game.state.caps >= data.cost;
                const stock = Game.state.shop.stock[data.key];
                
                let isOwned = false;
                if(Game.state.equip[data.slot] && Game.state.equip[data.slot].name === data.name) isOwned = true;
                if(data.type === 'tool' || data.type === 'blueprint') { if(Game.state.inventory.some(i => i.id === data.key)) isOwned = true; }
                
                const div = document.createElement('div');
                div.className = `flex justify-between items-center p-2 mb-2 border h-16 w-full ${canAfford ? 'border-green-500 bg-green-900/20 hover:bg-green-900/40' : 'border-red-900 bg-black/40 opacity-70'} transition-all cursor-pointer group`;
                let icon = "📦";
                if(data.type === 'weapon') icon = "🔫"; if(data.type === 'body') icon = "🛡️"; if(data.type === 'consumable') icon = "💊"; if(data.type === 'junk') icon = "⚙️";

                div.innerHTML = `
                    <div class="flex items-center gap-3 overflow-hidden flex-1">
                        <span class="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">${icon}</span>
                        <div class="flex flex-col overflow-hidden">
                            <span class="font-bold truncate ${canAfford ? 'text-green-400 group-hover:text-yellow-400' : 'text-gray-500'} text-sm">${data.name}</span>
                            <span class="text-[10px] text-green-600 truncate">Vorrat: ${stock} Stk</span>
                        </div>
                    </div>
                    <div class="flex flex-col items-end flex-shrink-0 ml-2 min-w-[60px]">
                        <span class="font-mono ${canAfford ? 'text-yellow-400' : 'text-red-500'} font-bold text-sm">${data.cost} KK</span>
                    </div>
                `;
                
                if(isOwned) {
                    div.innerHTML += `<div class="absolute inset-0 flex justify-center items-center bg-black/60 text-green-500 font-bold border border-green-500 pointer-events-none text-xs tracking-widest">IM BESITZ</div>`;
                    div.style.position = 'relative';
                } 
                div.onclick = () => UI.showShopConfirm(data.key);
                container.appendChild(div);
            });
        };

        renderCategory('consumable');
        renderCategory('weapon');
        renderCategory('body');
        renderCategory('misc');

        const header = document.createElement('h3');
        header.className = "text-blue-400 font-bold border-b border-blue-700 mt-4 mb-2 pb-1 pl-2 text-sm uppercase tracking-widest bg-blue-900/20";
        header.textContent = "MUNITION & SPECIALS";
        container.appendChild(header);

        const ammoStock = Game.state.shop.ammoStock || 0;
        const ammoDiv = document.createElement('div');
        ammoDiv.className = "flex justify-between items-center p-2 mb-4 border border-blue-500 bg-blue-900/20 cursor-pointer hover:bg-blue-900/40 h-16 w-full";
        const canBuyAmmo = Game.state.caps >= 10 && ammoStock > 0;
        ammoDiv.innerHTML = `
             <div class="flex items-center gap-3 overflow-hidden flex-1">
                <span class="text-2xl flex-shrink-0">🧨</span>
                <div class="flex flex-col overflow-hidden">
                    <span class="font-bold text-blue-300 text-sm">10x Munition</span>
                    <span class="text-[10px] text-blue-500 truncate">Vorrat: ${ammoStock} Pakete</span>
                </div>
            </div>
            <span class="font-mono text-yellow-400 font-bold text-sm ml-2">10 KK</span>
        `;
        if(!canBuyAmmo) { ammoDiv.style.opacity = 0.5; if(ammoStock<=0) ammoDiv.innerHTML += `<div class="absolute inset-0 flex justify-center items-center bg-black/60 text-red-500 font-bold text-xs">AUSVERKAUFT</div>`; ammoDiv.style.position='relative'; }
        else { ammoDiv.onclick = () => Game.buyAmmo(); }
        container.appendChild(ammoDiv);
    },

    renderClinic: function() {
        let container = document.getElementById('clinic-list');
        if(!container) {
             this.els.view.innerHTML = `<div class="p-4 flex flex-col items-center"><h2 class="text-2xl text-green-500 mb-4">DR. ZIMMERMANN</h2><div id="clinic-list" class="w-full max-w-md"></div></div>`;
             container = document.getElementById('clinic-list');
        }
        
        container.innerHTML = '';
        const backBtn = document.createElement('button');
        backBtn.className = "action-button w-full mb-4 text-center border-yellow-400 text-yellow-400";
        backBtn.textContent = "SPEICHERN & ZURÜCK";
        backBtn.onclick = () => { Game.saveGame(); this.switchView('map'); };
        container.appendChild(backBtn);

        const healBtn = document.createElement('button');
        healBtn.className = "action-button w-full mb-4 py-4 flex flex-col items-center border-red-500 text-red-500";
        healBtn.innerHTML = `<span class="text-2xl mb-2">💊</span><span class="font-bold">VOLLSTÄNDIGE HEILUNG</span><span class="text-sm">25 Kronkorken</span>`;
        if(Game.state.caps < 25 || Game.state.hp >= Game.state.maxHp) { 
            healBtn.disabled = true; healBtn.style.opacity = 0.5; 
            if(Game.state.hp >= Game.state.maxHp) healBtn.innerHTML += `<br><span class="text-xs text-green-500">(HP VOLL)</span>`;
        }
        else { healBtn.onclick = () => Game.heal(); }
        container.appendChild(healBtn);
    },

    renderCrafting: function() {
        const container = document.getElementById('crafting-list');
        if(!container) return;
        container.innerHTML = '';
        
        const recipes = Game.recipes || [];
        const known = Game.state.knownRecipes || [];
        let knownCount = 0; 

        recipes.forEach(recipe => {
            if(recipe.type === 'cooking') return;

            if(!known.includes(recipe.id)) return; 
            knownCount++;

            const outItem = recipe.out === 'AMMO' ? {name: "15x Munition"} : Game.items[recipe.out];
            const div = document.createElement('div');
            div.className = "border border-green-900 bg-green-900/10 p-3 mb-2";
            let reqHtml = '';
            let canCraft = true;
            for(let reqId in recipe.req) {
                const countNeeded = recipe.req[reqId];
                const invItem = Game.state.inventory.find(i => i.id === reqId);
                const countHave = invItem ? invItem.count : 0;
                let color = "text-green-500";
                if (countHave < countNeeded) { canCraft = false; color = "text-red-500"; }
                reqHtml += `<div class="${color} text-xs">• ${Game.items[reqId].name}: ${countHave}/${countNeeded}</div>`;
            }
            if(Game.state.lvl < recipe.lvl) { canCraft = false; reqHtml += `<div class="text-red-500 text-xs mt-1">Benötigt Level ${recipe.lvl}</div>`; }
            div.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div class="font-bold text-yellow-400 text-lg">${outItem.name}</div>
                    <button class="action-button text-sm px-3" onclick="Game.craftItem('${recipe.id}')" ${canCraft ? '' : 'disabled'}>FERTIGEN</button>
                </div>
                <div class="pl-2 border-l-2 border-green-900">${reqHtml}</div>
            `;
            container.appendChild(div);
        });
        
        if(knownCount === 0) {
            container.innerHTML += '<div class="text-gray-500 italic mt-10 text-center border-t border-gray-800 pt-4">Du hast noch keine Baupläne gelernt.<br><span class="text-xs text-green-700">Suche in Dungeons oder der Wildnis nach Blueprints!</span></div>';
        }
    }
});

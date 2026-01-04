// [v1.1.2] - 2026-01-04 09:30pm (Camp View Fix)
// Logik für das Camping Menü (benötigt views/camp.html)

Object.assign(UI, {

    renderCamp: function() {
        const cookingView = document.getElementById('camp-cooking-view');
        const mainActions = document.getElementById('camp-main-actions');
        
        // Reset View NUR wenn wir NICHT gerade im Kochen-Modus sind
        // (Verhindert Flackern, falls diese Funktion mal anderswo aufgerufen wird)
        if(cookingView && mainActions && !cookingView.classList.contains('hidden')) {
             // Wir sind im Kochen Modus, also machen wir hier NICHTS am Layout,
             // es sei denn, wir wollen explizit zurücksetzen.
             // Standard: Beim Betreten via switchView ist cookingView meist hidden.
        } else if(cookingView && mainActions) {
            // Sicherstellen, dass Main Actions sichtbar sind beim ersten Laden
            cookingView.classList.add('hidden');
            mainActions.classList.remove('hidden');
        }

        const camp = Game.state.camp;
        if(!camp) { 
            console.warn("Kein Camp gefunden!"); 
            UI.switchView('map'); 
            return; 
        }

        const lvl = camp.level || 1;

        // --- 1. Level Anzeige Update ---
        const lvlDisplay = document.getElementById('camp-level-display');
        if(lvlDisplay) lvlDisplay.textContent = `LEVEL ${lvl}`;

        // --- 2. Status Text Update (Dynamisch) ---
        // Berechnung analog zu game_actions.js
        let healPct = 30 + ((lvl - 1) * 8); 
        if(lvl >= 10) healPct = 100;
        if(healPct > 100) healPct = 100;

        const statusBox = document.getElementById('camp-status-box');
        if(statusBox) {
            // Text behält den Stil bei, passt aber die Werte an
            let comfort = (lvl === 1) ? "Basis-Zelt" : (lvl >= 10 ? "Luxus-Bunker" : "Komfort-Zelt");
            statusBox.textContent = `${comfort} (Lvl ${lvl}). Heilung ${Math.floor(healPct)}%.`;
        }

        // --- 3. Upgrade Button Logic (Dynamisch) ---
        const upgradeCont = document.getElementById('camp-upgrade-container');
        if(upgradeCont) {
            let upgradeText = "LAGER VERBESSERN";
            let upgradeSub = "Lädt...";
            let upgradeDisabled = false;
            let btnClass = "border-yellow-500 text-yellow-400 hover:bg-yellow-900/30";
            
            // Maximale Stufe prüfen
            if(lvl >= 10) {
                upgradeText = "LAGER MAXIMIERT";
                upgradeSub = "Maximum erreicht (Level 10)";
                upgradeDisabled = true;
                btnClass = "border-green-500 text-green-500 cursor-default bg-green-900/20";
            } else {
                // Kosten für nächstes Level holen
                const cost = Game.getCampUpgradeCost(lvl);
                if(cost) {
                    const hasItem = Game.state.inventory.find(i => i.id === cost.id);
                    const count = hasItem ? hasItem.count : 0;
                    
                    if(count >= cost.count) {
                        upgradeSub = `Kosten: ${cost.count}x ${cost.name}`;
                        // Stil behalten (Gelb, aktiv)
                    } else {
                        upgradeSub = `Fehlt: ${cost.count}x ${cost.name} (Besitz: ${count})`;
                        upgradeDisabled = true;
                        btnClass = "border-red-500 text-red-500 cursor-not-allowed opacity-70";
                    }
                } else {
                    upgradeSub = "Keine Daten";
                    upgradeDisabled = true;
                }
            }

            // HTML injizieren (Optik vom User beibehalten)
            upgradeCont.innerHTML = `
                <button class="flex flex-col items-center justify-center border ${btnClass} p-3 transition-all w-full mb-4"
                    onclick="Game.upgradeCamp()" ${upgradeDisabled ? 'disabled' : ''}>
                    <span class="font-bold text-lg">${upgradeText}</span>
                    <span class="text-xs opacity-70">${upgradeSub}</span>
                </button>
            `;
        }
    },

    renderCampCooking: function() {
        // Umschalten auf Kochen-Ansicht innerhalb der HTML Datei
        const cookingView = document.getElementById('camp-cooking-view');
        const mainActions = document.getElementById('camp-main-actions'); // Die Grid Buttons
        
        if(!cookingView) return;

        // Grid ausblenden, Kochen einblenden (Status beibehalten)
        if(mainActions) mainActions.classList.add('hidden');
        cookingView.classList.remove('hidden');

        const list = document.getElementById('cooking-list');
        if(!list) return;
        list.innerHTML = '';

        const recipes = Game.recipes || [];
        const cookingRecipes = recipes.filter(r => r.type === 'cooking');

        if(cookingRecipes.length === 0) {
            list.innerHTML = '<div class="text-gray-500 italic text-center mt-10">Du kennst noch keine Rezepte.</div>';
            return;
        }

        cookingRecipes.forEach(recipe => {
            const outItem = Game.items[recipe.out];
            const div = document.createElement('div');
            // Optik vom User unverändert
            div.className = "border border-yellow-900 bg-yellow-900/10 p-3 mb-2 flex justify-between items-center";
            
            let reqHtml = '';
            let canCraft = true;
            
            // Zutaten Check
            for(let reqId in recipe.req) {
                const countNeeded = recipe.req[reqId];
                const invItem = Game.state.inventory.find(i => i.id === reqId);
                const countHave = invItem ? invItem.count : 0;
                
                let color = "text-yellow-500";
                if (countHave < countNeeded) { 
                    canCraft = false; 
                    color = "text-red-500"; 
                }
                
                const ingredientName = Game.items[reqId] ? Game.items[reqId].name : reqId;
                reqHtml += `<span class="${color} text-xs mr-2 block">• ${ingredientName}: ${countHave}/${countNeeded}</span>`;
            }

            div.innerHTML = `
                <div class="flex flex-col">
                    <span class="font-bold text-yellow-400 text-lg">${outItem.name}</span>
                    <span class="text-xs text-yellow-600 italic">${outItem.desc}</span>
                    <div class="mt-1 bg-black/50 p-1 rounded">${reqHtml}</div>
                </div>
                <button class="border border-yellow-500 text-yellow-500 px-4 py-2 font-bold hover:bg-yellow-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-full ml-2" 
                    onclick="Game.craftItem('${recipe.id}')" ${canCraft ? '' : 'disabled'}>
                    BRATEN
                </button>
            `;
            list.appendChild(div);
        });
    }
});

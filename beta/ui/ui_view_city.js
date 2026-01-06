Object.assign(UI, {

    // [v0.9.3] CITY DASHBOARD - LAYOUT FIX
    renderCity: function(cityId = 'rusty_springs') {
        const view = document.getElementById('view-container');
        if(!view) return;
        view.innerHTML = ''; 
        
        Game.state.view = 'city';

        const cityData = {
            'rusty_springs': {
                name: "RUSTY SPRINGS",
                pop: 142, sec: "HOCH", rad: "NIEDRIG",
                flairs: [
                    "Die Luft riecht nach Rost und Ozon.",
                    "Ein Generator brummt in der Ferne.",
                    "Händler schreien ihre Preise aus.",
                    "Der sicherste Ort im Sektor."
                ]
            }
        };

        const data = cityData[cityId] || cityData['rusty_springs'];
        const flair = data.flairs[Math.floor(Math.random() * data.flairs.length)];

        // --- WRAPPER (DAS LÖST DAS LAYOUT PROBLEM) ---
        const wrapper = document.createElement('div');
        wrapper.className = "w-full h-full flex flex-col bg-black relative overflow-hidden";

        // 1. HEADER
        const header = document.createElement('div');
        header.className = "flex-shrink-0 flex flex-col border-b-4 border-green-900 bg-[#001100] p-4 relative shadow-lg z-10";
        
        header.innerHTML = `
            <div class="flex justify-between items-start z-10 relative">
                <div>
                    <h1 class="text-5xl md:text-6xl font-bold text-green-400 tracking-widest text-shadow-glow font-vt323 leading-none">${data.name}</h1>
                    <div class="text-green-600 text-sm italic mt-1 font-mono">"${flair}"</div>
                </div>
                <div class="bg-black/60 border-2 border-yellow-600 p-2 flex flex-col items-end shadow-[0_0_15px_rgba(200,150,0,0.3)] min-w-[120px]">
                    <span class="text-[10px] text-yellow-700 font-bold tracking-widest">VERMÖGEN</span>
                    <span class="text-2xl text-yellow-400 font-bold font-vt323 tracking-wider">${Game.state.caps} 📜</span>
                </div>
            </div>

            <div class="flex gap-4 mt-2 pt-2 border-t border-green-900/50 text-xs font-mono z-10 uppercase tracking-widest">
                <div class="bg-green-900/30 px-2 py-1 border-l-2 border-green-500">POP: <span class="text-green-300 font-bold">${data.pop}</span></div>
                <div class="bg-cyan-900/30 px-2 py-1 border-l-2 border-cyan-500">SEC: <span class="text-cyan-300 font-bold">${data.sec}</span></div>
                <div class="bg-yellow-900/30 px-2 py-1 border-l-2 border-yellow-500">RAD: <span class="text-yellow-300 font-bold">${data.rad}</span></div>
            </div>
        `;
        wrapper.appendChild(header);

        // 2. GRID DASHBOARD
        const grid = document.createElement('div');
        grid.className = "flex-grow overflow-y-auto custom-scrollbar p-4 grid grid-cols-1 md:grid-cols-2 gap-4 content-start bg-[#050a05]";

        const createCard = (conf) => {
            const card = document.createElement('div');
            let baseClass = "relative overflow-hidden group cursor-pointer p-4 flex items-center gap-4 border-2 transition-all duration-200 bg-black/80 hover:bg-[#0a1a0a] shadow-md min-h-[100px]";
            
            let themeColor = "green";
            if(conf.type === 'trader') {
                themeColor = "yellow";
                baseClass += " md:col-span-2 border-yellow-600 hover:border-yellow-400 shadow-yellow-900/20 h-32";
            } else if (conf.type === 'clinic') {
                themeColor = "red";
                baseClass += " border-red-600 hover:border-red-400 shadow-red-900/20";
            } else if (conf.type === 'craft') {
                themeColor = "blue";
                baseClass += " border-blue-600 hover:border-blue-400 shadow-blue-900/20";
            } else {
                baseClass += " border-green-600 hover:border-green-400 shadow-green-900/20";
            }

            card.className = baseClass;
            card.onclick = conf.onClick;

            const iconSize = conf.type === 'trader' ? 'text-6xl' : 'text-5xl';
            
            // Tailwind safe colors
            let titleClass = `text-${themeColor}-500 group-hover:text-${themeColor}-300`;
            let subClass = `text-${themeColor}-700 group-hover:text-${themeColor}-500`;
            
            // Manuelle Korrektur für Trader Yellow, da Tailwind manchmal dynamische Klassen purgt
            if(conf.type === 'trader') { titleClass = "text-yellow-500 group-hover:text-yellow-300"; subClass = "text-yellow-700 group-hover:text-yellow-500"; }

            card.innerHTML = `
                <div class="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-${themeColor}-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-0"></div>
                
                <div class="icon flex-shrink-0 ${iconSize} z-10 relative filter drop-shadow-md">${conf.icon}</div>
                <div class="flex flex-col z-10 relative">
                    <span class="text-2xl font-bold ${titleClass} tracking-wider font-vt323 uppercase">${conf.label}</span>
                    <span class="text-xs ${subClass} font-mono uppercase tracking-widest mt-1">${conf.sub}</span>
                </div>
                <div class="absolute right-4 text-2xl opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all ${titleClass}">▶</div>
            `;
            return card;
        };

        // A. HÄNDLER
        grid.appendChild(createCard({
            type: 'trader', icon: "🛒", label: "HANDELSPOSTEN", sub: "Waffen • Munition • An- & Verkauf",
            onClick: () => { if(UI.renderShop) UI.renderShop(); }
        }));

        // B. KLINIK
        grid.appendChild(createCard({
            type: 'clinic', icon: "⚕️", label: "KLINIK", sub: "Dr. Zimmermann",
            onClick: () => { if(UI.renderClinic) UI.renderClinic(); }
        }));

        // C. WERKBANK
        grid.appendChild(createCard({
            type: 'craft', icon: "🛠️", label: "WERKBANK", sub: "Zerlegen & Bauen",
            onClick: () => { if(UI.renderCrafting) UI.renderCrafting(); }
        }));

        // D. RASTEN
        grid.appendChild(createCard({
            type: 'rest', icon: "💤", label: "BARACKE", sub: "Rasten (Gratis)",
            onClick: () => { 
                Game.rest(); 
                UI.log("Du ruhst dich in der Baracke aus...", "text-blue-300");
            }
        }));

        wrapper.appendChild(grid);

        // 3. FOOTER
        const footer = document.createElement('div');
        footer.className = "flex-shrink-0 p-3 border-t-4 border-green-900 bg-[#001100]";
        footer.innerHTML = `
            <button class="action-button w-full border-2 border-green-600 text-green-500 py-3 font-bold text-xl hover:bg-green-900/50 hover:text-green-200 transition-all uppercase tracking-[0.15em]" onclick="Game.leaveCity()">
                <span class="mr-2">🚪</span> ZURÜCK INS ÖDLAND (ESC)
            </button>
        `;
        wrapper.appendChild(footer);

        view.appendChild(wrapper);
    },

    // Helper (falls nicht genutzt, kann er weg, aber createCard ist oben inline)
    createCityCard: function(container, conf) { /* ... */ }
});

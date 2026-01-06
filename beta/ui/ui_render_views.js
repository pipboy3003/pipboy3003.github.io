Object.assign(UI, {
    
    renderCharacterSelection: function(saves) {
        this.charSelectMode = true;
        this.currentSaves = saves;
        
        // Screens umschalten
        if(this.els.loginScreen) this.els.loginScreen.style.display = 'none';
        if(this.els.charSelectScreen) this.els.charSelectScreen.style.display = 'flex';
        
        // Slots leeren
        if(this.els.charSlotsList) this.els.charSlotsList.innerHTML = '';

        // [FIX] ZURÜCK-BUTTON LOGIK
        // Wir suchen den Button explizit und überschreiben onclick, um sicherzugehen
        const btnBack = document.getElementById('btn-char-back');
        if (btnBack) {
            btnBack.onclick = () => {
                // Modus beenden
                this.charSelectMode = false;
                // UI umschalten
                if(this.els.charSelectScreen) this.els.charSelectScreen.style.display = 'none';
                if(this.els.loginScreen) {
                    this.els.loginScreen.style.display = 'flex'; 
                    // Optional: Login-Screen wieder "hübsch" machen (z.B. Input leeren oder so)
                }
            };
        } else {
            console.warn("ACHTUNG: 'btn-char-back' nicht im HTML gefunden!");
        }

        // Slots rendern
        for (let i = 0; i < 5; i++) {
            const slot = document.createElement('div');
            slot.className = "char-slot border-2 border-green-900 bg-black/80 p-4 mb-2 cursor-pointer hover:border-yellow-400 hover:bg-green-900/30 transition-all flex justify-between items-center";
            slot.dataset.index = i;
            
            const save = saves[i];
            
            if (save) {
                const name = save.playerName || "UNBEKANNT";
                const lvl = save.lvl || 1;
                const loc = save.sector ? `[${save.sector.x},${save.sector.y}]` : "[?,?]";
                
                // Lebendig oder Tot Check
                const isDead = (save.hp !== undefined && save.hp <= 0);
                const statusIcon = isDead ? "💀" : "👤";
                const statusClass = isDead ? "text-red-500" : "text-yellow-400";

                slot.innerHTML = `
                    <div class="flex flex-col">
                        <span class="text-xl ${statusClass} font-bold tracking-wider">${statusIcon} ${name}</span>
                        <span class="text-xs text-green-300 font-mono">Level ${lvl} | Sektor ${loc}</span>
                    </div>
                    <div class="text-xs text-gray-500 font-bold">SLOT ${i+1}</div>
                `;
            } else {
                slot.classList.add('opacity-50');
                slot.innerHTML = `
                    <div class="flex flex-col">
                        <span class="text-xl text-gray-400 font-bold">[ LEER ]</span>
                        <span class="text-xs text-gray-600">Neuen Charakter erstellen</span>
                    </div>
                    <div class="text-xs text-gray-700">SLOT ${i+1}</div>
                `;
            }
            
            // Klick auf Slot wählt ihn aus (für Start oder Löschen)
            // Die eigentliche "Start Game" Logik passiert dann über den "Charakter Erstellen/Laden" Button, 
            // den UI Core steuert (via selectSlot).
            slot.onclick = () => {
                if(typeof this.selectSlot === 'function') {
                    this.selectSlot(i);
                }
            };
            
            if(this.els.charSlotsList) this.els.charSlotsList.appendChild(slot);
        }
        
        // Standardmäßig ersten Slot wählen
        if(typeof this.selectSlot === 'function') {
            this.selectSlot(0);
        }
    },

    renderSpawnList: function(players) {
        if(!this.els.spawnList) return;
        this.els.spawnList.innerHTML = '';
        
        if(!players || Object.keys(players).length === 0) {
            this.els.spawnList.innerHTML = '<div class="text-gray-500 italic p-2">Keine Signale gefunden...</div>';
            return;
        }
        
        for(let pid in players) {
            const p = players[pid];
            const btn = document.createElement('button');
            btn.className = "action-button w-full mb-2 text-left text-xs border-green-800 hover:border-green-500 text-green-400 p-2";
            
            const sectorStr = p.sector ? `[${p.sector.x},${p.sector.y}]` : "[?,?]";
            
            btn.innerHTML = `
                <div class="font-bold">SIGNAL: ${p.name}</div>
                <div class="text-[10px] text-gray-400 float-right mt-[-1rem]">${sectorStr}</div>
            `;
            
            btn.onclick = () => {
                if(this.els.spawnScreen) this.els.spawnScreen.style.display = 'none';
                
                // Spiel starten an Position des anderen Spielers
                this.startGame(null, this.selectedSlot, null); // null save, slot index, null load
                
                if(Game.state && Game.state.player) {
                    Game.state.player.x = p.x;
                    Game.state.player.y = p.y;
                    if(p.sector) {
                        Game.state.sector = p.sector;
                        Game.changeSector(p.sector.x, p.sector.y);
                    }
                }
            };
            this.els.spawnList.appendChild(btn);
        }
    },

    renderCombat: function() {
        const enemy = Game.state.enemy;
        if(!enemy) return;
        
        const nameEl = document.getElementById('enemy-name');
        if(nameEl) nameEl.textContent = enemy.name;
        
        const hpText = document.getElementById('enemy-hp-text');
        const hpBar = document.getElementById('enemy-hp-bar');
        
        if(hpText) hpText.textContent = `${Math.max(0, enemy.hp)}/${enemy.maxHp} TP`;
        if(hpBar) hpBar.style.width = `${Math.max(0, (enemy.hp/enemy.maxHp)*100)}%`;
        
        if(typeof Combat !== 'undefined' && typeof Combat.calculateHitChance === 'function') {
             const cHead = Combat.calculateHitChance(0);
             const cTorso = Combat.calculateHitChance(1);
             const cLegs = Combat.calculateHitChance(2);
             
             const elHead = document.getElementById('chance-vats-0');
             const elTorso = document.getElementById('chance-vats-1');
             const elLegs = document.getElementById('chance-vats-2');
             
             if(elHead) elHead.textContent = cHead + "%";
             if(elTorso) elTorso.textContent = cTorso + "%";
             if(elLegs) elLegs.textContent = cLegs + "%";
        }
        
        // V.A.T.S. Selection Visuals (optional, falls CSS Klassen existieren)
        if(typeof Combat !== 'undefined' && Combat.selectedPart !== undefined) {
            for(let i=0; i<3; i++) {
                const btn = document.getElementById(`btn-vats-${i}`);
                if(btn) {
                    if(i === Combat.selectedPart) {
                        btn.classList.add('bg-green-500', 'text-black');
                        btn.classList.remove('bg-green-900/20');
                    } else {
                        btn.classList.remove('bg-green-500', 'text-black');
                        btn.classList.add('bg-green-900/20');
                    }
                }
            }
        }
    }
});

// [2026-02-22 12:15:00] game_chests.js - Dynamisches Truhen-Scaling & Minigames

Object.assign(Game, {
    
    // Hauptfunktion: Wird aufgerufen, wenn der Spieler eine Truhe (Tile 'X') öffnet
    interactWithChest: function(x, y) {
        if(this.state.inDialog) return;
        this.state.inDialog = true; // Bewegung blockieren
        
        // 70% Chance auf Lockpicking, 30% Chance auf eine Bomben-Falle
        const isBomb = Math.random() < 0.3;
        
        // Die Schwierigkeit des Minigames skaliert mit dem Level des Spielers (1 bis 10)
        const diff = Math.max(1, Math.min(10, Math.floor(this.state.lvl / 5) + 1));
        
        const onSuccess = () => {
            this.state.inDialog = false;
            this.state.currentMap[y][x] = '.'; // Truhe von der Karte entfernen (geplündert)
            
            // Skalierten Loot generieren
            const loot = this.generateScaledLoot(this.state.lvl);
            let lootMsg = "Du hast die Truhe erfolgreich geöffnet!<br><br><div class='text-left inline-block mt-2'>";
            
            loot.forEach(item => {
                this.safeGiveItem(item.id, item.count); 
                const itemName = this.items[item.id] ? this.items[item.id].name : item.id.toUpperCase();
                lootMsg += `<span class="text-yellow-400 font-bold font-mono">> + ${item.count}x ${itemName}</span><br>`;
            });
            lootMsg += "</div>";
            
            if(typeof UI !== 'undefined' && UI.showInfoDialog) {
                UI.showInfoDialog("TRUHE GEPLÜNDERT", lootMsg);
            }
            
            if(this.saveGame) this.saveGame();
            if(this.draw) this.draw();
        };
        
        const onFail = () => {
            this.state.inDialog = false;
            this.state.currentMap[y][x] = '.'; // Truhe ist kaputt/zerstört
            
            if(isBomb) {
                // Skalierter Explosionsschaden
                const dmg = 15 + (this.state.lvl * 3);
                this.state.hp -= dmg;
                
                if(typeof UI !== 'undefined' && UI.showInfoDialog) {
                    UI.showInfoDialog("💥 BOOOM! 💥", `Du hast den Zünder ausgelöst! Die Kiste ist explodiert und der Loot vernichtet.<br><br>Du verlierst <span class="text-red-500 font-bold">${dmg} TP</span>.`);
                }
                
                if(this.state.hp <= 0 && UI.showGameOver) UI.showGameOver();
            } else {
                if(typeof UI !== 'undefined' && UI.showInfoDialog) {
                    UI.showInfoDialog("FEHLSCHLAG", "Dein Dietrich ist abgebrochen und das Schloss hat sich für immer verklemmt. Die Truhe lässt sich nicht mehr öffnen.");
                }
            }
            
            if(this.saveGame) this.saveGame();
            if(this.draw) this.draw();
        };

        // Rufe die Minigames auf (mit Failsafe, falls die Namen bei dir leicht anders sind)
        if(isBomb) {
            if(typeof Minigames !== 'undefined' && Minigames.startBombDefuse) {
                Minigames.startBombDefuse(diff, onSuccess, onFail);
            } else if(typeof UI !== 'undefined' && UI.showBombDefuse) {
                UI.showBombDefuse(diff, onSuccess, onFail);
            } else {
                console.warn("Bomb Defuse Minigame nicht gefunden, Kiste öffnet sich automatisch.");
                onSuccess(); 
            }
        } else {
            if(typeof Minigames !== 'undefined' && Minigames.startLockpicking) {
                Minigames.startLockpicking(diff, onSuccess, onFail);
            } else if(typeof UI !== 'undefined' && UI.showLockpicking) {
                UI.showLockpicking(diff, onSuccess, onFail);
            } else {
                console.warn("Lockpicking Minigame nicht gefunden, Kiste öffnet sich automatisch.");
                onSuccess(); 
            }
        }
    },

    // Generiert Loot basierend auf dem Level des Spielers
    generateScaledLoot: function(playerLevel) {
        const loot = [];
        
        // 1. Kronkorken (Immer dabei, skaliert stark mit Level)
        const capsAmount = Math.floor(Math.random() * 20 * playerLevel) + 15;
        loot.push({ id: 'caps', count: capsAmount });
        
        // 2. Munition (80% Chance, Menge skaliert)
        if(Math.random() > 0.2) {
            const ammoAmount = Math.floor(Math.random() * 5 * playerLevel) + 5;
            loot.push({ id: 'ammo', count: ammoAmount });
        }
        
        // 3. Heilung (50% Chance auf Stimpacks)
        if(Math.random() > 0.5) {
            loot.push({ id: 'stimpack', count: Math.random() > 0.8 ? 2 : 1 });
        }
        
        // 4. Waffen & Rüstungen (Selten, aber exakt ans Level angepasst!)
        if(this.items) {
            // Filtere alle Items, die Equipment sind und maximal 5 Level unter dem Spieler liegen
            const possibleEquip = Object.values(this.items).filter(item => 
                (item.type === 'weapon' || item.type === 'body' || item.type === 'head' || item.type === 'legs') && 
                (item.lvlReq || 1) <= playerLevel && 
                (item.lvlReq || 1) >= Math.max(1, playerLevel - 5)
            );
            
            // 40% Chance auf ein level-passendes Ausrüstungsteil
            if(possibleEquip.length > 0 && Math.random() > 0.6) {
                const randomEquip = possibleEquip[Math.floor(Math.random() * possibleEquip.length)];
                loot.push({ id: randomEquip.id, count: 1 });
            } else if (Math.random() > 0.2) {
                // Wenn kein Equip droppt, gib als Trostpreis Schrott zum Craften
                loot.push({ id: 'junk', count: Math.floor(Math.random() * 4) + 1 });
            }
        }
        
        return loot;
    },

    // Failsafe-Funktion zum Geben von Items
    safeGiveItem: function(id, count) {
        if(id === 'caps') {
            this.state.caps = (this.state.caps || 0) + count;
            return;
        }
        
        if (typeof this.giveItem === 'function') {
            this.giveItem(id, count);
        } else {
            // Hardcode Fallback ins Inventar
            if(!this.state.inventory) this.state.inventory = [];
            let item = this.state.inventory.find(i => i.id === id);
            if(item) item.count += count;
            else this.state.inventory.push({id: id, count: count});
        }
    }
});

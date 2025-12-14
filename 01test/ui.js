const UI = {
    init: function() {
        // Event Listeners für Header Buttons
        document.getElementById('new-game-btn').onclick = () => Game.init();
        document.getElementById('quit-btn').onclick = () => alert("Bitte Tab schließen");
        
        document.getElementById('wiki-btn').onclick = () => this.switchView('wiki');
        document.getElementById('map-btn').onclick = () => this.switchView('worldmap');
        document.getElementById('char-btn').onclick = () => this.switchView('char'); // WICHTIG: 'char' passend zum Dateinamen
        
        // Globale Funktionen für HTML-Buttons verfügbar machen
        window.gameAction = (action) => {
            if(action === 'attack') Game.combatAction('attack');
            if(action === 'flee') Game.combatAction('flee');
        };
    },

    switchView: async function(viewName) {
        const container = document.getElementById('view-container');
        // Pfad zusammenbauen
        const path = `views/${viewName}.html`;
        
        try {
            const res = await fetch(path);
            if(!res.ok) throw new Error("404");
            const html = await res.text();
            
            container.innerHTML = html;
            Game.state.view = viewName;
            Game.state.inDialog = (viewName === 'combat'); // Dialog-Modus im Kampf an
            
            // Wenn Map geladen wird, sofort zeichnen
            if(viewName === 'map') {
                setTimeout(() => Game.update(), 50); // Kurz warten für DOM
            }
            
            this.updateStats();
            
        } catch(e) {
            console.error(e);
            this.log(`Fehler: ${viewName} konnte nicht geladen werden.`, "text-red-500");
        }
    },

    updateStats: function() {
        if(!Game.state.player) return;
        
        document.getElementById('health-display').textContent = `${Game.state.hp}/${Game.getMaxHp()}`;
        document.getElementById('level-display').textContent = Game.state.lvl;
        document.getElementById('exp-current-display').textContent = Game.state.xp;
        document.getElementById('ammo-display').textContent = Game.state.ammo;
        document.getElementById('caps-display').textContent = `${Game.state.caps} KK`;
        document.getElementById('current-zone-display').textContent = Game.state.zone;

        // D-Pad Sichtbarkeit
        const dpad = document.getElementById('movement-container');
        if(dpad) dpad.style.visibility = (Game.state.view === 'map' && !Game.state.inDialog) ? 'visible' : 'hidden';

        // Combat Update
        if(Game.state.view === 'combat' && Game.state.enemy) {
            const nameEl = document.getElementById('enemy-name');
            const hpEl = document.getElementById('enemy-hp');
            if(nameEl) nameEl.textContent = Game.state.enemy.name;
            if(hpEl) hpEl.textContent = `${Game.state.enemy.hp} TP`;
        }
    },

    log: function(txt, color) {
        const area = document.getElementById('log-area');
        const line = document.createElement('div');
        line.className = color || 'text-green-500';
        line.textContent = `> ${txt}`;
        area.prepend(line);
    },
    
    enterCity: function() {
        // Einfacher Stadt-Dialog (Platzhalter für komplexeres System)
        this.log("Stadt betreten (Platzhalter).", "text-yellow-400");
    }
};

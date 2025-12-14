const UI = {
    els: {},

    init: function() {
        this.els = {
            view: document.getElementById('view-container'),
            log: document.getElementById('log-area'),
            hp: document.getElementById('val-hp'),
            hpBar: document.getElementById('bar-hp'),
            lvl: document.getElementById('val-lvl'),
            exp: document.getElementById('val-exp'),
            ammo: document.getElementById('val-ammo'),
            caps: document.getElementById('val-caps'),
            zone: document.getElementById('current-zone-display'),
            dpad: document.getElementById('dpad'),
            dialog: document.getElementById('dialog-buttons'),
            text: document.getElementById('encounter-text')
        };

        // Header Buttons
        document.getElementById('btn-new').onclick = () => Game.init();
        document.getElementById('btn-wiki').onclick = () => this.switchView('wiki');
        document.getElementById('btn-map').onclick = () => this.switchView('worldmap');
        document.getElementById('btn-char').onclick = () => this.switchView('char');

        // Movement Buttons
        document.getElementById('btn-up').onclick = () => Game.move(0, -1);
        document.getElementById('btn-down').onclick = () => Game.move(0, 1);
        document.getElementById('btn-left').onclick = () => Game.move(-1, 0);
        document.getElementById('btn-right').onclick = () => Game.move(1, 0);

        // Globale Keys
        window.addEventListener('keydown', (e) => {
            if (Game.state.view === 'map' && !Game.state.inDialog) {
                if(e.key === 'w' || e.key === 'ArrowUp') Game.move(0, -1);
                if(e.key === 's' || e.key === 'ArrowDown') Game.move(0, 1);
                if(e.key === 'a' || e.key === 'ArrowLeft') Game.move(-1, 0);
                if(e.key === 'd' || e.key === 'ArrowRight') Game.move(1, 0);
            }
        });
        
        // Globale Hilfsfunktionen für HTML-Onclick
        window.Game = Game; 
        window.UI = this;
    },

    switchView: async function(name) {
        const path = `views/${name}.html?v=${Date.now()}`;
        try {
            const res = await fetch(path);
            if (!res.ok) throw new Error("404");
            const html = await res.text();
            
            this.els.view.innerHTML = html;
            Game.state.view = name;

            // Logik je nach View
            if (name === 'map') {
                Game.initCanvas();
                this.toggleControls(true);
            } else {
                this.toggleControls(false);
            }

            if (name === 'char') this.renderChar();
            if (name === 'wiki') this.renderWiki();
            if (name === 'worldmap') this.renderWorldMap();
            if (name === 'city') this.renderCity();
            if (name === 'combat') this.renderCombat();

            this.update();

        } catch (e) {
            this.log(`Fehler: ${name} nicht gefunden (404).`, "text-red-500");
        }
    },

    update: function() {
        if (!Game.state) return;
        
        this.els.lvl.textContent = Game.state.lvl;
        this.els.exp.textContent = Game.state.exp;
        this.els.ammo.textContent = Game.state.ammo;
        this.els.caps.textContent = `${Game.state.caps} KK`;
        this.els.zone.textContent = Game.state.zone;
        
        const maxHp = 100 + (Game.state.stats.END - 5) * 10;
        this.els.hp.textContent = `${Math.round(Game.state.hp)}/${maxHp}`;
        this.els.hpBar.style.width = `${Math.max(0, (Game.state.hp / maxHp) * 100)}%`;
        
        if(Game.state.view === 'map') {
            const show = !Game.state.inDialog;
            this.els.dpad.style.visibility = show ? 'visible' : 'hidden';
            this.els.dialog.style.display = Game.state.inDialog ? 'flex' : 'none';
        }
    },

    log: function(msg, color="text-green-500") {
        const line = document.createElement('div');
        line.className = color;
        line.textContent = `> ${msg}`;
        this.els.log.prepend(line);
    },

    toggleControls: function(show) {
        this.els.dpad.style.visibility = show ? 'visible' : 'hidden';
        if (!show) this.els.dialog.innerHTML = '';
    },

    // --- RENDER FUNKTIONEN ---

    renderChar: function() {
        const grid = document.getElementById('stat-grid');
        if(!grid) return;
        grid.innerHTML = Object.keys(Game.state.stats).map(k => {
            const val = Game.state.stats[k];
            const btn = Game.state.statPoints > 0 ? `<button class="border border-green-500 px-1 ml-2" onclick="Game.upgradeStat('${k}')">+</button>` : '';
            return `<div class="flex justify-between"><span>${k}: ${val}</span>${btn}</div>`;
        }).join('');
        
        document.getElementById('char-exp').textContent = Game.state.exp;
        document.getElementById('char-points').textContent = Game.state.statPoints;
        const btn = document.getElementById('btn-assign');
        if(btn) btn.disabled = Game.state.statPoints <= 0;
        
        document.getElementById('char-equip').innerHTML = `Waffe: ${Game.state.equip.weapon.name}<br>Rüstung: ${Game.state.equip.body.name}`;
    },

    renderWiki: function() {
        const content = document.getElementById('wiki-content');
        if(!content) return;
        content.innerHTML = Object.keys(Game.monsters).map(k => {
            const m = Game.monsters[k];
            return `<div class="border-b border-green-900 pb-1">
                <div class="font-bold text-yellow-400">${m.name}</div>
                <div class="text-xs opacity-70">${m.desc} (HP: ~${m.hp})</div>
            </div>`;
        }).join('');
    },

    renderWorldMap: function() {
        const grid = document.getElementById('world-grid');
        if(!grid) return;
        grid.innerHTML = '';
        for(let y=0; y<10; y++) {
            for(let x=0; x<10; x++) {
                const d = document.createElement('div');
                d.className = "border border-green-900/50 flex justify-center items-center text-xs";
                if(x===Game.state.sector.x && y===Game.state.sector.y) {
                    d.style.backgroundColor = "#39ff14"; d.style.color = "black"; d.textContent = "YOU";
                } else if(Game.worldData[`${x},${y}`]) {
                    d.style.backgroundColor = "#4a3d34";
                }
                grid.appendChild(d);
            }
        }
    },

    renderCity: function() {
        const con = document.getElementById('city-options');
        if(!con) return;
        con.innerHTML = '';
        const addBtn = (txt, cb) => {
            const b = document.createElement('button');
            b.className = "action-button w-full mb-2 text-left p-3";
            b.textContent = txt;
            b.onclick = cb;
            con.appendChild(b);
        };
        addBtn("Heilen (25 KK)", () => Game.heal());
        addBtn("Handeln (WIP)", () => this.log("Händler schläft noch.", "text-yellow-500"));
        addBtn("Verlassen", () => this.switchView('map'));
    },

    renderCombat: function() {
        const enemy = Game.state.enemy;
        if(!enemy) return;
        document.getElementById('enemy-name').textContent = enemy.name;
        document.getElementById('enemy-hp-text').textContent = `${enemy.hp}/${enemy.maxHp} TP`;
        document.getElementById('enemy-hp-bar').style.width = `${(enemy.hp/enemy.maxHp)*100}%`;
    }
};

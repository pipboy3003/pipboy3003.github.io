// [v3.9d] - 2026-01-03 11:30am (Admin Savegame Access)
// - FIX: Reads from 'saves' instead of 'players' to show ALL characters (offline included).
// - LOGIC: Flattens the UID -> Slot structure for the list.

const Admin = {
    selectedPath: null, // Stores path like 'saves/USER_ID/0'
    allSaves: [], // Flat list for display

    init: function() {
        console.log("[Admin v3.9d] Initializing...");

        // 1. Force Network Init
        if (typeof Network !== 'undefined') {
            if (!Network.db) {
                try {
                    if (typeof Network.init === 'function') Network.init();
                } catch (e) {
                    console.warn("[Admin] Network init fallback:", e);
                }
            }
        }

        // 2. Auto Login Check
        if(localStorage.getItem('admin_session') === 'active') {
            this.showDashboard();
        }
    },

    login: async function() {
        const u = document.getElementById('adm-user').value;
        const p = document.getElementById('adm-pass').value;
        const msg = document.getElementById('login-msg');

        msg.textContent = "VERBINDE...";
        msg.className = "mt-4 text-yellow-400 animate-pulse";

        try {
            await Network.login(u, p);
            localStorage.setItem('admin_session', 'active');
            
            msg.textContent = "ZUGRIFF ERLAUBT.";
            msg.className = "mt-4 text-green-500 font-bold";
            setTimeout(() => this.showDashboard(), 500);

        } catch (e) {
            console.error("Admin Login Error:", e);
            msg.textContent = "LOGIN FEHLGESCHLAGEN: " + e.code;
            msg.className = "mt-4 text-red-500 font-bold blink-red";
        }
    },

    logout: function() {
        localStorage.removeItem('admin_session');
        if(Network.auth) Network.auth.signOut();
        location.reload();
    },

    showDashboard: function() {
        document.getElementById('login-overlay').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('flex');
        
        this.populateItems();
        this.checkDbConnection();
    },

    checkDbConnection: function() {
        if(Network.db) {
            console.log("[Admin] DB Connected. Reading Saves...");
            this.startListener();
        } else {
            setTimeout(() => this.checkDbConnection(), 500);
        }
    },

    startListener: function() {
        // [WICHTIG] Wir hören jetzt auf 'saves', nicht mehr auf 'players'
        Network.db.ref('saves').on('value', snap => {
            const rawData = snap.val() || {};
            this.processData(rawData);
        });
    },

    processData: function(data) {
        this.allSaves = [];
        
        // Iteriere über User-IDs
        for (let uid in data) {
            const userSlots = data[uid];
            // Iteriere über Slots (0, 1, 2...)
            for (let slotIndex in userSlots) {
                const charData = userSlots[slotIndex];
                
                if(charData) {
                    this.allSaves.push({
                        uid: uid,
                        slot: slotIndex,
                        path: `saves/${uid}/${slotIndex}`, // Pfad für Updates
                        name: charData.playerName || "Unbenannt",
                        lvl: charData.lvl || 1,
                        hp: charData.hp || 0,
                        maxHp: charData.maxHp || 10,
                        sector: charData.sector || {x:0, y:0},
                        email: charData._userEmail || "Unbekannt", // E-Mail aus v2.7 Update
                        isDead: (charData.hp <= 0)
                    });
                }
            }
        }
        
        this.renderList();
        
        // Update Detailansicht falls offen
        if(this.selectedPath) {
            const current = this.allSaves.find(s => s.path === this.selectedPath);
            if(current) this.updateDetailView(current);
        }
    },

    renderList: function() {
        const list = document.getElementById('player-list');
        list.innerHTML = '';

        if(this.allSaves.length === 0) {
            list.innerHTML = `<div class="p-4 text-gray-500 text-center">Datenbank leer.<br>Keine Spielstände gefunden.</div>`;
            return;
        }

        this.allSaves.forEach(char => {
            const div = document.createElement('div');
            const isActive = (this.selectedPath === char.path);
            
            div.className = `player-item flex justify-between items-center ${isActive ? 'active' : ''}`;
            div.onclick = () => this.selectPlayer(char.path);
            
            const statusIcon = char.isDead ? '💀' : '💾';
            const location = `[${char.sector.x},${char.sector.y}]`;

            div.innerHTML = `
                <div class="flex flex-col overflow-hidden">
                    <span class="font-bold text-lg truncate ${char.isDead ? 'text-red-500 line-through' : 'text-green-300'}">
                        ${statusIcon} ${char.name}
                    </span>
                    <span class="text-xs opacity-50 font-mono truncate">${char.email}</span>
                </div>
                <div class="text-right flex-shrink-0 ml-2">
                    <div class="font-bold text-yellow-500">Lvl ${char.lvl}</div>
                    <div class="text-xs opacity-70 text-blue-300">${location}</div>
                </div>
            `;
            list.appendChild(div);
        });
    },

    selectPlayer: function(path) {
        this.selectedPath = path;
        this.renderList(); // Refresh Highlight
        
        const panel = document.getElementById('control-panel');
        const overlay = document.getElementById('no-selection-msg');
        
        panel.classList.remove('opacity-50', 'pointer-events-none');
        overlay.classList.add('hidden');

        const char = this.allSaves.find(s => s.path === path);
        if(char) this.updateDetailView(char);
    },

    updateDetailView: function(char) {
        document.getElementById('target-name').textContent = char.name;
        document.getElementById('target-id').textContent = char.email; // ID Feld zeigt jetzt Email
        document.getElementById('target-lvl').textContent = char.lvl;
        document.getElementById('target-hp').textContent = `${Math.round(char.hp)}/${char.maxHp}`;
        
        const hpEl = document.getElementById('target-hp');
        hpEl.className = char.isDead ? 'text-red-500 font-bold blink-red' : 'text-green-400';
    },

    populateItems: function() {
        const sel = document.getElementById('item-select');
        if(!Game || !Game.items) return;

        while(sel.options.length > 1) sel.remove(1);

        const keys = Object.keys(Game.items).sort();
        keys.forEach(k => {
            const item = Game.items[k];
            const opt = document.createElement('option');
            opt.value = k;
            opt.textContent = `${item.name} (${k})`;
            sel.appendChild(opt);
        });
    },

    // --- ACTIONS (Direct Database Writes) ---

    // Hilfsfunktion: Liest aktuellen Wert, addiert und schreibt zurück
    modStat: function(stat, val) {
        if(!this.selectedPath) return;
        
        Network.db.ref(this.selectedPath + '/' + stat).once('value', snap => {
            let current = snap.val() || 0;
            let next = current + val;
            if(next < 0) next = 0;
            Network.db.ref(this.selectedPath + '/' + stat).set(next);
        });
    },

    fullHeal: function() {
        if(!this.selectedPath) return;
        // Wir müssen MaxHP lesen um zu heilen
        Network.db.ref(this.selectedPath).once('value', snap => {
            const data = snap.val();
            if(!data) return;
            
            const updates = {};
            updates['hp'] = data.maxHp || 10;
            updates['rads'] = 0;
            updates['isGameOver'] = false; // Wiederbeleben falls tot
            
            Network.db.ref(this.selectedPath).update(updates);
        });
    },

    killTarget: function() {
        if(!this.selectedPath) return;
        if(confirm("Diesen Charakter (Savegame) auf 0 HP setzen?")) {
            Network.db.ref(this.selectedPath + '/hp').set(0);
        }
    },

    giveItem: function() {
        if(!this.selectedPath) return;
        const item = document.getElementById('item-select').value;
        const count = parseInt(document.getElementById('item-count').value) || 1;
        if(!item) { alert("Bitte Item wählen!"); return; }

        this.sendToInv([{id: item, count: count}]);
    },

    giveKit: function(type) {
        if(!this.selectedPath) return;
        const kits = {
            'starter': [{id:'knife',count:1}, {id:'stimpack',count:3}, {id:'water',count:2}],
            'camp': [{id:'camp_kit',count:1}, {id:'wood',count:10}, {id:'meat',count:5}],
            'god': [{id:'plasma_rifle',count:1}, {id:'power_armor',count:1}, {id:'ammo',count:500}, {id:'stimpack',count:50}]
        };
        if(kits[type]) this.sendToInv(kits[type]);
    },

    sendToInv: function(itemsToAdd) {
        const invPath = this.selectedPath + '/inventory';
        
        Network.db.ref(invPath).once('value', snap => {
            let inv = snap.val() || [];
            
            itemsToAdd.forEach(newItem => {
                let added = false;
                for(let i of inv) {
                    if(i.id === newItem.id && !i.props) {
                        i.count += newItem.count;
                        added = true;
                        break;
                    }
                }
                if(!added) inv.push({ id: newItem.id, count: newItem.count, isNew: true });
            });

            Network.db.ref(invPath).set(inv);
            
            // UI Feedback
            const btn = document.activeElement;
            if(btn && btn.tagName === 'BUTTON') {
                const old = btn.innerText;
                btn.innerText = "✓";
                setTimeout(() => btn.innerText = old, 500);
            }
        });
    }
};

window.onload = function() { Admin.init(); };

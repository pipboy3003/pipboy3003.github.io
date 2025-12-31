// [v2.2] - ADMIN DASHBOARD LOGIC
const Admin = {
    // Gleiche Config wie im Spiel (Network.js)
    config: {
        apiKey: "AIzaSyCgSK4nJ3QOVMBd7m9RSmURflSRWN4ejBY",
        authDomain: "pipboy-rpg.firebaseapp.com",
        databaseURL: "https://pipboy-rpg-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "pipboy-rpg",
        storageBucket: "pipboy-rpg.firebasestorage.app",
        messagingSenderId: "1023458799306",
        appId: "1:1023458799306:web:2d8c1abc23b02beac14e33"
    },
    
    db: null,
    currentUid: null,
    currentSlot: null,
    currentData: null,

    init: function() {
        if (!firebase.apps.length) firebase.initializeApp(this.config);
        this.db = firebase.database();
        this.populateItems();
    },

    login: function() {
        const pass = document.getElementById('admin-pass').value;
        const msg = document.getElementById('login-msg');
        
        // ⚠️ EINFACHER CLIENT-SIDE CHECK (Für Hobby-Projekt okay)
        if(pass === 'zintel1992') {
            document.getElementById('login-overlay').style.display = 'none';
            document.getElementById('dashboard').classList.remove('hidden');
            this.init();
            this.fetchUsers();
        } else {
            msg.textContent = "ACCESS DENIED. TURRETS ACTIVATED.";
            document.getElementById('admin-pass').value = '';
        }
    },

    fetchUsers: function() {
        const list = document.getElementById('user-list');
        list.innerHTML = '<div class="animate-pulse">Scanning Vault Database...</div>';

        // Wir laden ALLE Saves. Das kann bei vielen Usern dauern.
        this.db.ref('saves').once('value').then(snap => {
            const data = snap.val() || {};
            list.innerHTML = '';

            let count = 0;
            // Iterate UIDs
            for(let uid in data) {
                const userSaves = data[uid]; // Array or Object of slots
                
                // Iterate Slots (0, 1, 2...)
                for(let slotIdx in userSaves) {
                    const save = userSaves[slotIdx];
                    if(!save) continue;

                    count++;
                    const btn = document.createElement('div');
                    btn.className = "border border-green-900 p-2 cursor-pointer hover:bg-green-900 transition-colors mb-1";
                    
                    const name = save.playerName || "Unbekannt";
                    const lvl = save.lvl || 1;
                    const date = new Date(save.lastSave || Date.now()).toLocaleDateString();

                    btn.innerHTML = `
                        <div class="font-bold text-yellow-400">UID: ${uid.substr(0,5)}... [Slot ${slotIdx}]</div>
                        <div class="text-white">${name} (Lvl ${lvl})</div>
                        <div class="text-xs text-gray-500">${date} | HP: ${save.hp}</div>
                    `;
                    
                    btn.onclick = () => this.selectUser(uid, slotIdx, save);
                    list.appendChild(btn);
                }
            }
            if(count === 0) list.innerHTML = "Keine Bewohner gefunden.";
        }).catch(err => {
            list.innerHTML = `<span class="text-red-500">DB Error: ${err.message}</span>`;
        });
    },

    selectUser: function(uid, slot, data) {
        this.currentUid = uid;
        this.currentSlot = slot;
        this.currentData = data;

        document.getElementById('editor-placeholder').classList.add('hidden');
        document.getElementById('editor-area').classList.remove('hidden');
        
        document.getElementById('edit-title').textContent = `EDIT: ${data.playerName} (Slot ${slot})`;

        // Fill Inputs
        document.getElementById('inp-name').value = data.playerName || "";
        document.getElementById('inp-lvl').value = data.lvl || 1;
        document.getElementById('inp-xp').value = data.xp || 0;
        document.getElementById('inp-caps').value = data.caps || 0;
        document.getElementById('inp-hp').value = data.hp || 100;
        document.getElementById('inp-maxhp').value = data.maxHp || 100;
        document.getElementById('inp-ammo').value = data.ammo || 0;
        document.getElementById('inp-rads').value = data.rads || 0;

        this.renderInvPreview();
    },

    renderInvPreview: function() {
        const div = document.getElementById('inv-preview');
        if(!this.currentData.inventory) {
            div.textContent = "Inventar leer.";
            return;
        }
        div.innerHTML = this.currentData.inventory.map(i => {
            let n = i.id;
            // Versuch Name aufzulösen via Global GameData (falls geladen)
            if(window.GameData && window.GameData.items[i.id]) n = window.GameData.items[i.id].name;
            if(i.props && i.props.name) n = i.props.name;
            return `[${i.count}x] ${n}`;
        }).join('<br>');
    },

    populateItems: function() {
        const sel = document.getElementById('item-select');
        if(typeof window.GameData === 'undefined' || !window.GameData.items) {
            sel.innerHTML = '<option>Fehler: items.js nicht geladen</option>';
            return;
        }
        
        const sorted = Object.keys(window.GameData.items).sort();
        sorted.forEach(key => {
            const item = window.GameData.items[key];
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = `${item.name} (${key})`;
            sel.appendChild(opt);
        });
    },

    addItem: function() {
        if(!this.currentData) return;
        const itemId = document.getElementById('item-select').value;
        const count = parseInt(document.getElementById('item-count').value) || 1;

        if(!this.currentData.inventory) this.currentData.inventory = [];
        
        // Simples Add (ohne Stacking Logik für diesen Editor, einfach push)
        // Oder wir prüfen kurz:
        const existing = this.currentData.inventory.find(i => i.id === itemId && !i.props);
        if(existing) {
            existing.count += count;
        } else {
            this.currentData.inventory.push({ id: itemId, count: count, isNew: true });
        }
        
        alert(`${count}x ${itemId} hinzugefügt (wird erst beim Speichern permanent).`);
        this.renderInvPreview();
    },

    saveChanges: function() {
        if(!this.currentUid || !this.currentData) return;

        // Werte aus Inputs lesen
        this.currentData.playerName = document.getElementById('inp-name').value;
        this.currentData.lvl = parseInt(document.getElementById('inp-lvl').value);
        this.currentData.xp = parseInt(document.getElementById('inp-xp').value);
        this.currentData.caps = parseInt(document.getElementById('inp-caps').value);
        this.currentData.hp = parseInt(document.getElementById('inp-hp').value);
        this.currentData.maxHp = parseInt(document.getElementById('inp-maxhp').value);
        this.currentData.ammo = parseInt(document.getElementById('inp-ammo').value);
        this.currentData.rads = parseInt(document.getElementById('inp-rads').value);

        // Upload zu Firebase
        const path = `saves/${this.currentUid}/${this.currentSlot}`;
        
        this.db.ref(path).update(this.currentData)
            .then(() => {
                alert("DATENBANK AKTUALISIERT.");
                this.fetchUsers(); // Refresh Liste
            })
            .catch(e => alert("FEHLER: " + e.message));
    },

    deleteSave: function() {
        if(!confirm("Diesen Spielstand wirklich LÖSCHEN? Das kann nicht rückgängig gemacht werden!")) return;
        
        const path = `saves/${this.currentUid}/${this.currentSlot}`;
        this.db.ref(path).remove()
            .then(() => {
                alert("Eintrag gelöscht.");
                this.currentData = null;
                document.getElementById('editor-area').classList.add('hidden');
                document.getElementById('editor-placeholder').classList.remove('hidden');
                this.fetchUsers();
            });
    }
};

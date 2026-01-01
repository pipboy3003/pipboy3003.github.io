// [v2.5] - ADMIN DASHBOARD (Secure Auth)
const Admin = {
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
    auth: null,
    currentUid: null,
    currentSlot: null,
    currentData: null,

    // System-Email für den User "Admin"
    adminEmail: "admin@pipboy-system.com",

    init: function() {
        if (!firebase.apps.length) firebase.initializeApp(this.config);
        this.db = firebase.database();
        this.auth = firebase.auth();
        this.populateItems();

        // Auth Listener: Wenn eingeloggt, zeige Dashboard
        this.auth.onAuthStateChanged(user => {
            if (user && user.email === this.adminEmail) {
                document.getElementById('login-overlay').style.display = 'none';
                document.getElementById('dashboard').classList.remove('hidden');
                this.fetchUsers();
            } else if (user) {
                // Eingeloggt, aber kein Admin? Rauswerfen.
                document.getElementById('login-msg').textContent = "ERROR: NOT AN ADMIN ACCOUNT.";
                this.auth.signOut();
            }
        });
    },

    login: function() {
        let userVal = document.getElementById('admin-user') ? document.getElementById('admin-user').value : 'Admin'; // Fallback falls Input fehlt
        // Wenn Input nicht existiert (altes HTML), nehmen wir an es ist "Admin"
        // Aber hier prüfen wir das Passwort Feld
        
        // Da wir nur ein Passwort Feld im HTML hatten, nutzen wir das
        const passVal = document.getElementById('admin-pass').value;
        const msg = document.getElementById('login-msg');

        // Mapping: "Admin" -> echte E-Mail
        // Wir nehmen an, der User ist immer "Admin", da wir nur nach Passwort gefragt haben.
        // Falls du ein User-Feld im HTML ergänzt hast, lies es aus.
        // Hier hardcoden wir den User "Admin" -> E-Mail Mapping:
        
        msg.textContent = "AUTHENTICATING WITH VAULT-TEC...";
        msg.className = "text-yellow-400 mt-2 animate-pulse";

        if (!firebase.apps.length) this.init(); // Sicherstellen, dass Init lief

        this.auth.signInWithEmailAndPassword(this.adminEmail, passVal)
            .catch((error) => {
                let errTxt = "ACCESS DENIED.";
                if(error.code === 'auth/wrong-password') errTxt = "INVALID PASSPHRASE.";
                if(error.code === 'auth/user-not-found') errTxt = "ADMIN ACCOUNT NOT FOUND (Create in Console!).";
                if(error.code === 'auth/too-many-requests') errTxt = "SYSTEM LOCKOUT. WAIT.";
                
                msg.textContent = errTxt;
                msg.className = "text-red-500 mt-2 font-bold blink-red";
                console.error(error);
            });
    },

    logout: function() {
        if(this.auth) this.auth.signOut();
        location.reload();
    },

    fetchUsers: function() {
        const list = document.getElementById('user-list');
        list.innerHTML = '<div class="animate-pulse text-yellow-400">>> DECRYPTING DATABASE...</div>';

        // Jetzt greifen wir 'secure' zu. Nur weil wir eingeloggt sind, erlaubt die Rule den Zugriff.
        this.db.ref('saves').once('value').then(snap => {
            const data = snap.val();
            list.innerHTML = '';

            if(!data) {
                list.innerHTML = '<div class="text-gray-500">Datenbank leer oder Zugriff verweigert.</div>';
                return;
            }

            let count = 0;
            for(let uid in data) {
                const userSaves = data[uid]; 
                for(let slotIdx in userSaves) {
                    const save = userSaves[slotIdx];
                    if(!save) continue;

                    count++;
                    const btn = document.createElement('div');
                    btn.className = "border border-green-900 p-2 cursor-pointer hover:bg-green-900 transition-colors mb-1 bg-[#001100]";
                    
                    const name = save.playerName || "Unbekannt";
                    const lvl = save.lvl || 1;
                    const date = save.lastSave ? new Date(save.lastSave).toLocaleString() : "Unbekannt";

                    btn.innerHTML = `
                        <div class="flex justify-between">
                            <span class="font-bold text-yellow-400">${name}</span>
                            <span class="text-xs text-gray-400">Slot ${parseInt(slotIdx)+1}</span>
                        </div>
                        <div class="text-xs text-green-300">LVL ${lvl} | ${save.caps || 0} KK</div>
                        <div class="text-[10px] text-gray-500 font-mono mt-1">${uid}</div>
                        <div class="text-[10px] text-gray-600 text-right">${date}</div>
                    `;
                    
                    btn.onclick = () => this.selectUser(uid, slotIdx, save);
                    list.appendChild(btn);
                }
            }
            if(count === 0) list.innerHTML = "Keine Savegames gefunden.";
        }).catch(err => {
            console.error(err);
            list.innerHTML = `<div class="text-red-500">DB Error: ${err.message}<br>(Rules blocked access?)</div>`;
        });
    },

    selectUser: function(uid, slot, data) {
        this.currentUid = uid;
        this.currentSlot = slot;
        this.currentData = data;

        document.getElementById('editor-placeholder').classList.add('hidden');
        document.getElementById('editor-area').classList.remove('hidden');
        
        document.getElementById('edit-title').innerHTML = `EDIT: <span class="text-white">${data.playerName}</span> <span class="text-sm text-gray-400">(Slot ${parseInt(slot)+1})</span>`;

        // Fill Inputs safe
        const setVal = (id, val) => document.getElementById(id).value = val !== undefined ? val : 0;
        
        setVal('inp-name', data.playerName || "Survivor");
        setVal('inp-lvl', data.lvl);
        setVal('inp-xp', data.xp);
        setVal('inp-caps', data.caps);
        setVal('inp-hp', data.hp);
        setVal('inp-maxhp', data.maxHp);
        setVal('inp-ammo', data.ammo);
        setVal('inp-rads', data.rads);

        this.renderInvPreview();
    },

    renderInvPreview: function() {
        const div = document.getElementById('inv-preview');
        if(!this.currentData.inventory || this.currentData.inventory.length === 0) {
            div.innerHTML = '<span class="text-gray-600 italic">Rucksack leer.</span>';
            return;
        }
        div.innerHTML = this.currentData.inventory.map((i, idx) => {
            let n = i.id;
            if(window.GameData && window.GameData.items[i.id]) n = window.GameData.items[i.id].name;
            if(i.props && i.props.name) n = i.props.name;
            
            return `
                <div class="flex justify-between border-b border-gray-800 py-1">
                    <span>${n}</span>
                    <span class="text-yellow-500 font-bold">x${i.count}</span>
                </div>`;
        }).join('');
    },

    populateItems: function() {
        const sel = document.getElementById('item-select');
        if(typeof window.GameData === 'undefined' || !window.GameData.items) {
            sel.innerHTML = '<option>Lade Items...</option>';
            setTimeout(() => this.populateItems(), 500);
            return;
        }
        
        sel.innerHTML = '';
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
        
        const existing = this.currentData.inventory.find(i => i.id === itemId && !i.props);
        if(existing) {
            existing.count += count;
        } else {
            this.currentData.inventory.push({ id: itemId, count: count, isNew: true });
        }
        
        const btn = document.querySelector('button[onclick="Admin.addItem()"]');
        const originalText = btn.textContent;
        btn.textContent = "OK!";
        btn.classList.add('bg-green-500', 'text-black');
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('bg-green-500', 'text-black');
        }, 1000);

        this.renderInvPreview();
    },

    saveChanges: function() {
        if(!this.currentUid || !this.currentData) return;

        this.currentData.playerName = document.getElementById('inp-name').value;
        this.currentData.lvl = parseInt(document.getElementById('inp-lvl').value);
        this.currentData.xp = parseInt(document.getElementById('inp-xp').value);
        this.currentData.caps = parseInt(document.getElementById('inp-caps').value);
        this.currentData.hp = parseInt(document.getElementById('inp-hp').value);
        this.currentData.maxHp = parseInt(document.getElementById('inp-maxhp').value);
        this.currentData.ammo = parseInt(document.getElementById('inp-ammo').value);
        this.currentData.rads = parseInt(document.getElementById('inp-rads').value);

        const path = `saves/${this.currentUid}/${this.currentSlot}`;
        const saveBtn = document.querySelector('button[onclick="Admin.saveChanges()"]');
        saveBtn.textContent = "SPEICHERE...";
        
        this.db.ref(path).update(this.currentData)
            .then(() => {
                saveBtn.textContent = "GESPEICHERT ✅";
                setTimeout(() => saveBtn.textContent = "ÄNDERUNGEN SPEICHERN", 2000);
                this.fetchUsers(); 
            })
            .catch(e => alert("FEHLER: " + e.message));
    },

    deleteSave: function() {
        if(!confirm("⚠️ ACHTUNG ⚠️\n\nDiesen Spielstand wirklich UNWIDERRUFLICH LÖSCHEN?")) return;
        
        const path = `saves/${this.currentUid}/${this.currentSlot}`;
        this.db.ref(path).remove()
            .then(() => {
                alert("Spielstand wurde gelöscht.");
                this.currentData = null;
                document.getElementById('editor-area').classList.add('hidden');
                document.getElementById('editor-placeholder').classList.remove('hidden');
                this.fetchUsers();
            })
            .catch(e => alert("Fehler beim Löschen: " + e.message));
    }
};

// Auto-Init bei Load
document.addEventListener("DOMContentLoaded", () => {
    Admin.init();
});

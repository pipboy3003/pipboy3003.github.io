// [v2.8] - ADMIN DASHBOARD (With Ghost Protocol / Bulk Delete)
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
    adminEmail: "admin@pipboy-system.com",
    
    // Speicher für gefundene Geister-Pfade
    ghostPaths: [],

    init: function() {
        if (!firebase.apps.length) firebase.initializeApp(this.config);
        this.db = firebase.database();
        this.auth = firebase.auth();
        this.populateItems();

        this.auth.onAuthStateChanged(user => {
            if (user && user.email === this.adminEmail) {
                document.getElementById('login-overlay').style.display = 'none';
                document.getElementById('dashboard').classList.remove('hidden');
                this.fetchUsers();
            } else if (user) {
                document.getElementById('login-msg').textContent = "ERROR: NOT AN ADMIN ACCOUNT.";
                this.auth.signOut();
            }
        });
    },

    login: function() {
        const passVal = document.getElementById('admin-pass').value;
        const msg = document.getElementById('login-msg');
        msg.textContent = "AUTHENTICATING...";
        msg.className = "text-yellow-400 mt-2 animate-pulse";

        if (!firebase.apps.length) this.init(); 

        this.auth.signInWithEmailAndPassword(this.adminEmail, passVal)
            .catch((error) => {
                msg.textContent = "ACCESS DENIED.";
                msg.className = "text-red-500 mt-2 font-bold blink-red";
            });
    },

    logout: function() {
        if(this.auth) this.auth.signOut();
        location.reload();
    },

    fetchUsers: function() {
        const list = document.getElementById('user-list');
        list.innerHTML = '<div class="animate-pulse text-yellow-400">>> SCANNING DATABASE...</div>';

        this.db.ref('saves').once('value').then(snap => {
            const data = snap.val();
            list.innerHTML = '';

            if(!data) {
                list.innerHTML = '<div class="text-gray-500">Datenbank leer.</div>';
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
                    btn.className = "border border-green-900 p-2 cursor-pointer hover:bg-green-900 transition-colors mb-1 bg-[#001100] group relative";
                    
                    const name = save.playerName || "Unbekannt";
                    const lvl = save.lvl || 1;
                    const email = save._userEmail ? `<span class="text-blue-300">${save._userEmail}</span>` : '<span class="text-red-500 italic">GHOST (No Email)</span>';
                    const lastSeen = save._lastSeen ? new Date(save._lastSeen).toLocaleDateString() : "Unbekannt";

                    btn.innerHTML = `
                        <div class="flex justify-between items-center">
                            <span class="font-bold text-yellow-400">${name}</span>
                            <span class="text-xs text-gray-500 font-mono">${uid.substr(0,4)}...</span>
                        </div>
                        <div class="text-xs mb-1">${email}</div>
                        <div class="text-xs text-green-300">Lvl ${lvl} | Slot ${parseInt(slotIdx)+1} | ${lastSeen}</div>
                    `;
                    
                    btn.onclick = () => this.selectUser(uid, slotIdx, save);
                    list.appendChild(btn);
                }
            }
            if(count === 0) list.innerHTML = "Keine Savegames gefunden.";
        });
    },

    // --- NEU: GHOST PROTOCOL ---
    scanGhosts: function() {
        const status = document.getElementById('ghost-status');
        const btnPurge = document.getElementById('btn-purge');
        
        status.textContent = "SCANNING...";
        this.ghostPaths = [];

        this.db.ref('saves').once('value').then(snap => {
            const data = snap.val();
            if(!data) { status.textContent = "DB EMPTY."; return; }

            for(let uid in data) {
                const userSaves = data[uid];
                for(let slotIdx in userSaves) {
                    const save = userSaves[slotIdx];
                    // Das Kriterium: Hat KEINE E-Mail gespeichert
                    if (!save._userEmail) {
                        this.ghostPaths.push(`saves/${uid}/${slotIdx}`);
                    }
                }
            }

            if (this.ghostPaths.length > 0) {
                status.innerHTML = `<span class="text-red-500 font-bold">${this.ghostPaths.length} GHOSTS FOUND.</span>`;
                btnPurge.disabled = false;
                btnPurge.classList.remove('opacity-50', 'cursor-not-allowed');
                btnPurge.textContent = `PURGE ${this.ghostPaths.length} GHOSTS`;
            } else {
                status.innerHTML = `<span class="text-green-500">CLEAN. NO GHOSTS.</span>`;
                btnPurge.disabled = true;
            }
        });
    },

    purgeGhosts: function() {
        if(this.ghostPaths.length === 0) return;
        
        const confirmMsg = `ACHTUNG: Du bist dabei ${this.ghostPaths.length} Spielstände zu löschen, die keine E-Mail-Adresse hinterlegt haben.\n\nBist du sicher? (Tipp: Warte ein paar Tage nach dem Update, damit aktive Spieler speichern können!)`;
        
        if(!confirm(confirmMsg)) return;
        if(!confirm("Wirklich sicher? Dies ist unwiderruflich!")) return;

        const updates = {};
        this.ghostPaths.forEach(path => {
            updates[path] = null; // null löscht den Eintrag in Firebase
        });

        this.db.ref().update(updates)
            .then(() => {
                alert("SYSTEM PURGE COMPLETE. GHOSTS ELIMINATED.");
                this.ghostPaths = [];
                document.getElementById('btn-purge').disabled = true;
                document.getElementById('ghost-status').textContent = "CLEANUP DONE.";
                this.fetchUsers(); // Liste aktualisieren
            })
            .catch(e => alert("Purge Error: " + e.message));
    },
    // ---------------------------

    selectUser: function(uid, slot, data) {
        this.currentUid = uid;
        this.currentSlot = slot;
        this.currentData = data;

        document.getElementById('editor-placeholder').classList.add('hidden');
        document.getElementById('editor-area').classList.remove('hidden');
        
        const emailInfo = data._userEmail ? `[${data._userEmail}]` : '[GHOST DATA]';
        document.getElementById('edit-title').innerHTML = `EDIT: <span class="text-white">${data.playerName}</span> <br><span class="text-xs text-blue-400">${emailInfo}</span>`;

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
        div.innerHTML = this.currentData.inventory.map((i) => {
            let n = i.id;
            if(window.GameData && window.GameData.items[i.id]) n = window.GameData.items[i.id].name;
            if(i.props && i.props.name) n = i.props.name;
            return `<div class="flex justify-between border-b border-gray-800 py-1"><span>${n}</span><span class="text-yellow-500 font-bold">x${i.count}</span></div>`;
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
        if(existing) { existing.count += count; } 
        else { this.currentData.inventory.push({ id: itemId, count: count, isNew: true }); }
        const btn = document.querySelector('button[onclick="Admin.addItem()"]');
        const originalText = btn.textContent;
        btn.textContent = "OK!";
        btn.classList.add('bg-green-500', 'text-black');
        setTimeout(() => { btn.textContent = originalText; btn.classList.remove('bg-green-500', 'text-black'); }, 1000);
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
                alert("Gelöscht.");
                this.currentData = null;
                document.getElementById('editor-area').classList.add('hidden');
                document.getElementById('editor-placeholder').classList.remove('hidden');
                this.fetchUsers();
            })
            .catch(e => alert("Fehler: " + e.message));
    }
};

document.addEventListener("DOMContentLoaded", () => { Admin.init(); });

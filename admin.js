// [v2.8] - ADMIN DASHBOARD (With Ghost Protocol / Bulk Delete)
// [v2.9.7] - Added Logout Function
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
    
    ghostPaths: [],

    init: function() {
        if (!firebase.apps.length) firebase.initializeApp(this.config);
        this.db = firebase.database();
        this.auth = firebase.auth();
        this.populateItems();

        this.auth.onAuthStateChanged(user => {
            if (user && user.email === this.adminEmail) {
                document.getElementById('login-overlay').style.display = 'none';
                document.getElementById('admin-panel').classList.remove('hidden');
                document.getElementById('admin-panel').style.display = 'flex';
                this.fetchUsers();
            } else {
                document.getElementById('login-overlay').style.display = 'flex';
                document.getElementById('admin-panel').classList.add('hidden');
                if(user) {
                    document.getElementById('login-msg').textContent = "ACCESS DENIED. ADMINS ONLY.";
                    this.auth.signOut();
                }
            }
        });
    },

    login: function() {
        const email = document.getElementById('admin-email').value;
        const pass = document.getElementById('admin-pass').value;
        const msg = document.getElementById('login-msg');
        
        msg.textContent = "AUTHENTICATING...";
        
        this.auth.signInWithEmailAndPassword(email, pass)
            .catch(error => {
                msg.textContent = "ERROR: " + error.message;
            });
    },

    // [NEW] Logout Function
    logout: function() {
        this.auth.signOut().then(() => {
            // UI reset wird durch onAuthStateChanged erledigt
            document.getElementById('login-msg').textContent = "";
            document.getElementById('admin-email').value = "";
            document.getElementById('admin-pass').value = "";
        });
    },

    fetchUsers: function() {
        const list = document.getElementById('user-list');
        list.innerHTML = '<div class="text-center animate-pulse">SCANNING DATABASE...</div>';
        
        this.db.ref('saves').once('value').then(snapshot => {
            list.innerHTML = '';
            const data = snapshot.val();
            if(!data) { list.innerHTML = "NO DATA FOUND."; return; }

            // Iterate UIDs
            Object.keys(data).forEach(uid => {
                const userSaves = data[uid];
                // Iterate Slots (0-4)
                Object.keys(userSaves).forEach(slot => {
                    const save = userSaves[slot];
                    // Basic validation
                    if(save && save.playerName) {
                        this.renderUserItem(uid, slot, save, list);
                    }
                });
            });
        });
    },

    renderUserItem: function(uid, slot, save, container) {
        const div = document.createElement('div');
        div.className = "border border-green-900 p-2 hover:bg-green-900/30 cursor-pointer transition-colors";
        div.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="font-bold text-yellow-400">${save.playerName}</span>
                <span class="text-xs text-gray-500">Lvl ${save.lvl}</span>
            </div>
            <div class="text-xs font-mono text-green-700 truncate">${uid} [Slot ${slot}]</div>
            <div class="text-[10px] text-gray-600">Last Seen: ${save.lastSeen ? new Date(save.lastSeen).toLocaleString() : 'N/A'}</div>
            <div class="text-[10px] text-blue-400">Email: ${save.email || 'GHOST (No Email)'}</div>
        `;
        div.onclick = () => this.loadEditor(uid, slot, save);
        container.appendChild(div);
    },

    loadEditor: function(uid, slot, save) {
        this.currentUid = uid;
        this.currentSlot = slot;
        this.currentData = save;

        document.getElementById('editor-placeholder').classList.add('hidden');
        document.getElementById('editor-area').classList.remove('hidden');

        document.getElementById('inp-name').value = save.playerName;
        document.getElementById('inp-lvl').value = save.lvl;
        document.getElementById('inp-caps').value = save.caps;
        document.getElementById('inp-xp').value = save.xp;
        document.getElementById('inp-hp').value = save.hp;
        document.getElementById('inp-maxhp').value = save.maxHp;
        document.getElementById('inp-ammo').value = save.ammo || 0;
        document.getElementById('inp-rads').value = save.rads || 0;
    },

    populateItems: function() {
        const sel = document.getElementById('item-select');
        if(!sel || typeof window.GameData === 'undefined') return;
        
        const sorted = Object.keys(window.GameData.items).sort();
        sorted.forEach(key => {
            const item = window.GameData.items[key];
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = item.name;
            sel.appendChild(opt);
        });
    },

    addItem: function() {
        if(!this.currentData) return;
        const key = document.getElementById('item-select').value;
        const count = parseInt(document.getElementById('item-count').value) || 1;
        if(!key) return;

        if(!this.currentData.inventory) this.currentData.inventory = [];
        
        // Simple Add (no stack logic for admin simplicity, just push)
        this.currentData.inventory.push({ id: key, count: count });
        alert(`${count}x ${key} hinzugefügt. (Speichern nicht vergessen!)`);
    },

    saveChanges: function() {
        if(!this.currentUid || !this.currentSlot) return;
        
        // Read values back
        this.currentData.playerName = document.getElementById('inp-name').value;
        this.currentData.lvl = parseInt(document.getElementById('inp-lvl').value);
        this.currentData.caps = parseInt(document.getElementById('inp-caps').value);
        this.currentData.xp = parseInt(document.getElementById('inp-xp').value);
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
    },

    // --- GHOST PROTOCOL ---
    scanGhosts: function() {
        const status = document.getElementById('ghost-status');
        status.textContent = "SCANNING...";
        this.ghostPaths = [];

        this.db.ref('saves').once('value').then(snapshot => {
            const data = snapshot.val();
            let ghostCount = 0;
            let totalCount = 0;

            if(data) {
                Object.keys(data).forEach(uid => {
                    const userSlots = data[uid];
                    Object.keys(userSlots).forEach(slot => {
                        totalCount++;
                        const save = userSlots[slot];
                        // CRITERIA: No Email attached to save object
                        if (!save.email) {
                            ghostCount++;
                            this.ghostPaths.push(`saves/${uid}/${slot}`);
                        }
                    });
                });
            }

            status.textContent = `FOUND: ${ghostCount} / ${totalCount}`;
            const btnPurge = document.getElementById('btn-purge');
            if(ghostCount > 0) {
                btnPurge.disabled = false;
                btnPurge.classList.remove('opacity-50', 'cursor-not-allowed');
                btnPurge.textContent = `2. PURGE (${ghostCount})`;
            } else {
                btnPurge.disabled = true;
                btnPurge.textContent = "NO GHOSTS";
            }
        });
    },

    purgeGhosts: function() {
        if(this.ghostPaths.length === 0) return;
        if(!confirm(`⚠️ WARNING ⚠️\n\nDeleting ${this.ghostPaths.length} ghost records.\nThis cannot be undone.`)) return;

        const updates = {};
        this.ghostPaths.forEach(path => {
            updates[path] = null; // Setting to null removes it in Firebase
        });

        this.db.ref().update(updates)
            .then(() => {
                alert("PURGE COMPLETE. DATABASE CLEAN.");
                this.scanGhosts(); // Refresh
                this.fetchUsers(); // Refresh list
            })
            .catch(e => alert("PURGE FAILED: " + e.message));
    }
};

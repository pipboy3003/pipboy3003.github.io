const Network = {
    db: null,
    auth: null,
    myId: null,
    myDisplayName: null,
    otherPlayers: {},
    active: false,
    heartbeatInterval: null,

    config: {
        apiKey: "AIzaSyCgSK4nJ3QOVMBd7m9RSmURflSRWN4ejBY",
        authDomain: "pipboy-rpg.firebaseapp.com",
        databaseURL: "https://pipboy-rpg-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "pipboy-rpg",
        storageBucket: "pipboy-rpg.firebasestorage.app",
        messagingSenderId: "1023458799306",
        appId: "1:1023458799306:web:2d8c1abc23b02beac14e33",
        measurementId: "G-DYGLZTMWWT"
    },

    init: function() {
        if (typeof firebase !== 'undefined' && !this.db) {
            try {
                if (!firebase.apps.length) firebase.initializeApp(this.config);
                this.db = firebase.database();
                this.auth = firebase.auth();
                this.active = true;
            } catch (e) {
                console.error("Firebase Init Error:", e);
                this.active = false;
            }
        }
    },

    register: async function(email, password, name) {
        if(!this.active) throw new Error("Netzwerkfehler");
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            await user.updateProfile({ displayName: name });
            this.myId = user.uid;
            this.myDisplayName = name;
            // No saves yet, return empty object
            return {}; 
        } catch(e) {
            throw e;
        }
    },

    login: async function(email, password) {
        if (!this.active) throw new Error("Netzwerkfehler");
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            this.myId = user.uid;
            this.myDisplayName = user.displayName || "Unknown";

            // Load all saves (slots 0-4)
            const snapshot = await this.db.ref('saves/' + this.myId).once('value');
            return snapshot.val() || {}; // Return object with slots
        } catch(e) {
            console.error("Auth Error:", e);
            throw e;
        }
    },
    
    // NEW: Save specific slot
    saveToSlot: function(slotIndex, gameState) {
        if(!this.active || !this.myId) return;
        
        // Metadata for Character Selection Screen
        const meta = {
            name: gameState.playerName || "Unknown",
            lvl: gameState.lvl,
            sector: gameState.sector,
            caps: gameState.caps
        };
        
        const saveObj = JSON.parse(JSON.stringify(gameState));
        
        const updates = {};
        updates[`saves/${this.myId}/${slotIndex}`] = saveObj;
        // Optionally store metadata separately for fast loading? 
        // For now, loading full save is fine for 5 slots.
        
        this.db.ref().update(updates)
            .then(() => { if(typeof UI !== 'undefined') UI.log("SLOT " + (slotIndex+1) + " GESPEICHERT.", "text-cyan-400"); })
            .catch(e => console.error("Save Error:", e));
    },
    
    deleteSlot: async function(slotIndex) {
        if(!this.active || !this.myId) return;
        await this.db.ref(`saves/${this.myId}/${slotIndex}`).remove();
    },

    startPresence: function() {
        this.db.ref('players/' + this.myId).onDisconnect().remove();
        
        this.db.ref('players').on('value', (snapshot) => {
            const rawData = snapshot.val() || {};
            const now = Date.now();
            const cleanData = {};
            for (let pid in rawData) {
                if (pid === this.myId) continue;
                const p = rawData[pid];
                if (p.lastSeen && (now - p.lastSeen > 120000)) continue; 
                cleanData[p.name || pid] = p;
            }
            this.otherPlayers = cleanData;
            if(typeof UI !== 'undefined') {
                const el = document.getElementById('val-players');
                if(el) el.textContent = `${Object.keys(this.otherPlayers).length + 1}`; 
                if(UI.els.spawnScreen && UI.els.spawnScreen.style.display !== 'none') {
                    UI.renderSpawnList(this.otherPlayers);
                }
                UI.updatePlayerList();
            }
            if(typeof Game !== 'undefined' && Game.draw) Game.draw();
        });
        
        if(typeof UI !== 'undefined') {
            UI.setConnectionState('online');
            UI.log(`TERMINAL LINK: ${this.myDisplayName}`, "text-green-400 font-bold");
        }
        
        if(this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat();
        }, 5000);
        this.sendHeartbeat();
    },

    save: function(gameState) {
        // Fallback for old calls: Save to current slot from Game State
        if (typeof Game !== 'undefined' && Game.state && Game.state.saveSlot !== undefined) {
            this.saveToSlot(Game.state.saveSlot, gameState);
        } else {
            console.error("No Save Slot defined!");
        }
    },
    
    // Alte deleteSave Funktion für HardReset (löscht alles!)
    deleteSave: function() {
        if(!this.active || !this.myId) return;
        // In Slot Logic: Delete active slot? Or delete all?
        // Let's assume hard reset deletes current active slot.
        if (typeof Game !== 'undefined' && Game.state && Game.state.saveSlot !== undefined) {
            this.deleteSlot(Game.state.saveSlot);
        }
    },

    disconnect: function() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        if (this.auth) this.auth.signOut();
        this.active = false;
        this.myId = null;
    },

    sendHeartbeat: function() {
        if (!this.active || !this.myId) return;
        // Only update if in-game
        if(typeof Game !== 'undefined' && Game.state && Game.state.view === 'map') {
             this.db.ref('players/' + this.myId).update({
                lastSeen: Date.now(),
                name: Game.state.playerName || this.myDisplayName,
                x: Game.state.player.x,
                y: Game.state.player.y,
                sector: Game.state.sector,
                lvl: Game.state.lvl
            });
        }
    },
    
    sendMove: function(x, y, level, sector) {
        this.sendHeartbeat();
    }
};

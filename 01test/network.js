// network.js - v0.0.8c
const Network = {
    db: null,
    myId: null,
    otherPlayers: {},
    active: false,

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
        if (typeof firebase !== 'undefined') {
            try {
                if (!firebase.apps.length) {
                    firebase.initializeApp(this.config);
                }
                
                this.db = firebase.database();
                this.active = true;
                
                this.myId = 'survivor_' + Math.floor(Math.random() * 9999);
                
                // VISUELLES FEEDBACK (UI)
                if(typeof UI !== 'undefined') {
                    UI.setConnectionState('online');
                    UI.log(`TERMINAL LINK ESTABLISHED: ID ${this.myId}`, "text-green-400 font-bold");
                }

                this.db.ref('players/' + this.myId).onDisconnect().remove();
                
                this.db.ref('players').on('value', (snapshot) => {
                    const data = snapshot.val() || {};
                    delete data[this.myId]; 
                    this.otherPlayers = data;
                    if(Game && Game.draw) Game.draw(); 
                });
                
            } catch (e) {
                console.error("Firebase Error:", e);
                if(typeof UI !== 'undefined') {
                    UI.log("NETZWERK ERROR: Verbindung fehlgeschlagen.", "text-red-500");
                    UI.setConnectionState('offline');
                }
            }
        } else {
            if(typeof UI !== 'undefined') {
                UI.log("NETZWERK: Bibliotheken nicht geladen.", "text-gray-500");
                UI.setConnectionState('offline');
            }
        }
    },

    sendMove: function(x, y, level, sector) {
        if (!this.active) return;
        this.db.ref('players/' + this.myId).set({
            x: x,
            y: y,
            lvl: level,
            sector: sector,
            lastSeen: Date.now()
        });
    }
};

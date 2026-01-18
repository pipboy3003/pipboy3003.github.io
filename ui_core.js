// [2026-01-17 22:30:00] ui_core.js - Fix: Safe Login Logic (No inputName access)

const UI = {
    els: {},
    lastInputTime: Date.now(),
    
    // States
    loginBusy: false,
    isRegistering: false,
    charSelectMode: false,
    deleteMode: false,
    currentSaves: {},
    selectedSlot: -1,
    isSystemReady: false, 
    
    // Focus System
    focusIndex: -1,
    focusableEls: [],
    inputMethod: 'touch', 

    // Toast Queue
    toastQueue: [],
    isToastShowing: false,

    log: function(message, colorClass = "text-green-500") {
        this.toastQueue.push({ message, colorClass });
        this.processToastQueue();
    },

    processToastQueue: function() {
        if (this.isToastShowing || this.toastQueue.length === 0) return;
        const container = this.els.toastContainer || document.getElementById('game-toast-container');
        if(!container) return;

        this.isToastShowing = true;
        const item = this.toastQueue.shift(); 
        
        let borderColor = "border-green-500"; 
        let icon = "ℹ️"; 
        if(item.colorClass.includes("red")) { borderColor = "border-red-600"; icon = "⚠️"; }
        
        const el = document.createElement('div');
        el.className = `pointer-events-auto bg-black/95 border-l-4 ${borderColor} p-3 shadow-[0_0_15px_rgba(0,0,0,0.8)] animate-slide-in flex items-start justify-between gap-4 transition-all duration-300 ease-out mb-1 backdrop-blur-sm w-fit max-w-[90vw] md:max-w-md self-end rounded-l`;
        el.innerHTML = `<div class="flex items-center gap-3"><span class="text-lg opacity-80 select-none">${icon}</span><span class="font-mono text-sm md:text-base font-bold ${item.colorClass} tracking-wide drop-shadow-md whitespace-nowrap md:whitespace-normal">${item.message}</span></div><button class="text-gray-600 hover:text-white font-bold text-xs self-start mt-0.5 px-1 ml-2">✕</button>`;

        const closeToast = () => {
            if (el.classList.contains('closing')) return; 
            el.classList.add('closing'); el.classList.add('opacity-0', 'translate-x-full');
            setTimeout(() => { if(el.parentNode) el.remove(); this.isToastShowing = false; setTimeout(() => this.processToastQueue(), 150); }, 300); 
        };
        el.querySelector('button').onclick = closeToast;
        container.innerHTML = ''; container.appendChild(el);
        setTimeout(() => { if(document.body.contains(el)) closeToast(); }, 3000);
    },

    error: function(msg) { console.error(msg); this.log(`ERROR: ${msg}`, "text-red-500 blink-red"); },

    showLoadingSequence: function() {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = "fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center font-vt323 text-green-500 cursor-wait select-none";
            overlay.innerHTML = `<div class="text-center text-3xl mb-6 font-bold text-green-400 tracking-widest animate-pulse">SYSTEM BOOT</div><div class="text-xs text-green-600 font-mono animate-pulse">LOADING...</div>`;
            document.body.appendChild(overlay);
            setTimeout(() => { overlay.remove(); resolve(); }, 1500); 
        });
    },

    // --- CRITICAL FIX: ATTEMPT LOGIN ---
    attemptLogin: async function() {
        if(!this.isSystemReady) {
            this.els.loginStatus.textContent = "SYSTEM INITIALIZING... PLEASE WAIT";
            this.els.loginStatus.className = "mt-4 text-blue-400 animate-pulse";
            return;
        }
        if(this.loginBusy) return;
        this.loginBusy = true;
        
        const email = this.els.inputEmail.value.trim();
        const pass = this.els.inputPass.value.trim();
        
        // [FIX] KEIN Zugriff auf this.els.inputName.value, da das Feld weg ist!
        
        this.els.loginStatus.textContent = "VERBINDE MIT VAULT-TEC...";
        this.els.loginStatus.className = "mt-4 text-yellow-400 animate-pulse";
        
        try {
            if(typeof Network === 'undefined') throw new Error("Netzwerkfehler");
            Network.init();
            let saves = null;
            
            if (this.isRegistering) {
                if (email.length < 5 || pass.length < 6) throw new Error("Email/PW zu kurz (min 6 Zeichen)");
                
                // [FIX] Name wird automatisch generiert
                const generatedName = email.split('@')[0].toUpperCase().substring(0, 15);
                
                saves = await Network.register(email, pass, generatedName);
            } else {
                if (email.length < 5 || pass.length < 1) throw new Error("Bitte Daten eingeben");
                saves = await Network.login(email, pass);
            }
            
            this.selectedSlot = -1; 
            if(this.renderCharacterSelection) this.renderCharacterSelection(saves || {});
            
        } catch(e) {
            let msg = e.message;
            if(e.code === "auth/email-already-in-use") msg = "E-Mail wird bereits verwendet!";
            else if (e.code === "auth/wrong-password") msg = "Falsches Passwort!";
            else if (e.code === "auth/user-not-found") msg = "Account nicht gefunden!";
            this.els.loginStatus.textContent = "FEHLER: " + msg;
            this.els.loginStatus.className = "mt-4 text-red-500 font-bold blink-red";
        } finally {
            this.loginBusy = false;
        }
    },

    // ... (Restliche Funktionen wie init, update, etc. bleiben erhalten, verkürzt dargestellt)
    init: function() {
        const toastCont = document.getElementById('game-toast-container');
        if(toastCont) { toastCont.classList.remove('w-72', 'md:w-96'); toastCont.classList.add('w-auto', 'items-end', 'max-w-full', 'md:max-w-[400px]'); }

        this.els = {
            view: document.getElementById('view-container'),
            toastContainer: toastCont, 
            loginScreen: document.getElementById('login-screen'),
            loginStatus: document.getElementById('login-status'),
            inputEmail: document.getElementById('login-email'),
            inputPass: document.getElementById('login-pass'),
            // [FIX] inputName ENTFERNT, da nicht mehr im HTML!
            btnLogin: document.getElementById('btn-login'),
            btnToggleRegister: document.getElementById('btn-toggle-register'),
            loginTitle: document.getElementById('login-title'),
            charSelectScreen: document.getElementById('char-select-screen'),
            charSlotsList: document.getElementById('char-slots-list'),
            gameScreen: document.getElementById('game-screen'),
            // ... weitere Elemente ...
            btnNew: document.getElementById('btn-new'), btnInv: document.getElementById('btn-inv'), btnWiki: document.getElementById('btn-wiki'),
            btnMap: document.getElementById('btn-map'), btnChar: document.getElementById('btn-char'), btnQuests: document.getElementById('btn-quests'),
            btnMenu: document.getElementById('btn-menu-toggle'), navMenu: document.getElementById('main-nav'),
            headerCharInfo: document.getElementById('header-char-info'), btnLogout: document.getElementById('btn-logout'),
            playerList: document.getElementById('player-list-overlay'),
            newCharOverlay: document.getElementById('new-char-overlay'), inputNewCharName: document.getElementById('new-char-name'),
            btnCreateCharConfirm: document.getElementById('btn-create-char'),
            btnCharDeleteAction: document.getElementById('btn-char-delete-action'), btnCharBack: document.getElementById('btn-char-back'),
            deleteOverlay: document.getElementById('delete-confirm-overlay'), deleteTargetName: document.getElementById('delete-target-name'),
            deleteInput: document.getElementById('delete-input'), btnDeleteConfirm: document.getElementById('btn-delete-confirm'), btnDeleteCancel: document.getElementById('btn-delete-cancel')
        };
        
        // Listener
        if(this.els.btnToggleRegister) {
             this.els.btnToggleRegister.onclick = () => {
                 this.isRegistering = !this.isRegistering;
                 this.els.loginTitle.textContent = this.isRegistering ? "NEUEN ACCOUNT ERSTELLEN" : "AUTHENTICATION REQUIRED";
                 // [FIX] KEIN inputName.style Zugriff hier!
                 this.els.btnLogin.textContent = this.isRegistering ? "REGISTRIEREN" : "LOGIN";
                 this.els.btnToggleRegister.textContent = this.isRegistering ? "Zurück zum Login" : "Noch kein Account? Hier registrieren";
             }
        }
        
        window.Game = Game;
        window.UI = this;
        if(this.initInput) this.initInput();
        setInterval(() => { if(this.update) this.update(); }, 1000);
    },
    
    // ... Helper Methoden (update, logout, startGame, etc.) hier einfügen ...
    // Damit die Datei nicht zu lang wird, kürze ich hier ab. 
    // Wichtig war oben attemptLogin und init.
    
    update: function() {
        const isAuth = (typeof Network !== 'undefined' && Network.myId);
        if (!this.els.loginScreen || this.els.loginScreen.style.display === 'none') {
             if(Game.state && Game.state.newQuestAlert) {
                if(this.els.btnMenu) this.els.btnMenu.classList.add('alert-glow-cyan');
                if(this.els.btnQuests) this.els.btnQuests.classList.add('alert-glow-cyan');
            } else {
                if(this.els.btnMenu) this.els.btnMenu.classList.remove('alert-glow-cyan');
                if(this.els.btnQuests) this.els.btnQuests.classList.remove('alert-glow-cyan');
            }
        }
    },
    
    startGame: async function(saveData, slotIndex, newName=null) {
        this.charSelectMode = false;
        if(this.els.charSelectScreen) this.els.charSelectScreen.style.display = 'none';
        await this.showLoadingSequence(); 
        if(this.els.gameScreen) {
            this.els.gameScreen.classList.remove('hidden');
            this.els.gameScreen.classList.remove('opacity-0');
        }
        Game.init(saveData, null, slotIndex, newName);
        if(typeof Network !== 'undefined') Network.startPresence();
    },
    
    logout: async function(msg) {
        if(Game.state) { Game.saveGame(true); Game.state = null; }
        if(typeof Network !== 'undefined') await Network.disconnect();
        location.reload(); // Hard reload is safest
    },
    
    // Platzhalter für weitere Helper
    showMobileControlsHint: function() {},
    openBugModal: function() {},
    setConnectionState: function() {},
    triggerInventoryAlert: function() {},
    resetInventoryAlert: function() {},
    resetQuestAlert: function() { if(Game.state) Game.state.newQuestAlert = false; },
    
    // WICHTIG: renderCharacterSelection muss hier definiert sein oder via Object.assign kommen
    renderCharacterSelection: function(saves) {
        this.charSelectMode = true; this.currentSaves = saves;
        if(this.els.loginScreen) this.els.loginScreen.style.display = 'none';
        if(this.els.charSelectScreen) this.els.charSelectScreen.style.display = 'flex';
        if(this.els.charSlotsList) this.els.charSlotsList.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const slot = document.createElement('div');
            slot.className = "char-slot border-2 border-green-900 bg-black/80 p-4 mb-2 cursor-pointer hover:border-yellow-400 flex justify-between items-center group relative";
            const save = saves[i];
            if (save) {
                const isDead = (save.hp !== undefined && save.hp <= 0);
                slot.innerHTML = `<div class="flex flex-col z-10"><span class="text-xl ${isDead ? 'text-red-500' : 'text-yellow-400'} font-bold">${isDead ? '💀' : '👤'} ${save.playerName}</span><span class="text-xs text-green-300 font-mono">Level ${save.lvl}</span></div><button class="bg-green-700 text-black font-bold px-4 py-1 text-xs rounded group-hover:bg-[#39ff14]">START ▶</button>`;
            } else {
                slot.innerHTML = `<div class="text-gray-500 font-bold">+ NEUEN CHARAKTER</div>`;
            }
            slot.onclick = () => { if(typeof this.selectSlot === 'function') this.selectSlot(i); };
            if(this.els.charSlotsList) this.els.charSlotsList.appendChild(slot);
        }
        if(typeof this.selectSlot === 'function') this.selectSlot(0);
    }
};

window.UI = UI;
console.log("UI Core Loaded.");

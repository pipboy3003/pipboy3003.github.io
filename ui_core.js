// [v2.9.10] - 2026-01-02 23:50pm (Critical Fix) - Robust DOM Mapping
const UI = {
    els: {},
    timerInterval: null,
    lastInputTime: Date.now(),
    biomeColors: (typeof window.GameData !== 'undefined') ? window.GameData.colors : {},

    // States
    loginBusy: false,
    isRegistering: false,
    charSelectMode: false,
    deleteMode: false,
    currentSaves: {},
    selectedSlot: -1,
    
    // Focus System
    focusIndex: -1,
    focusableEls: [],
    inputMethod: 'touch', 

    // Utils
    log: function(msg, color="text-green-500") {
        // Fallback log if element missing
        if(!this.els.log) {
            console.log(`[LOG] ${msg}`);
            return;
        }
        
        const line = document.createElement('div');
        line.className = color;
        line.textContent = `> ${msg}`;
        this.els.log.prepend(line);
        
        // Cleanup old logs
        if(this.els.log.children.length > 50) {
            this.els.log.lastElementChild.remove();
        }
    },

    error: function(msg) {
        const errText = `> ERROR: ${msg}`;
        console.error(errText);
        if(this.els.log) {
            const line = document.createElement('div');
            line.className = "text-red-500 font-bold blink-red";
            line.textContent = errText;
            this.els.log.prepend(line);
        }
    },
    
    setConnectionState: function(status) {
        const v = this.els.version;
        if(!v) return;
        if(status === 'online') {
            v.className = "text-[#39ff14] text-shadow";
            v.textContent = "ONLINE";
        } else {
            v.className = "text-red-500 blink-red";
            v.textContent = "OFFLINE";
        }
    },

    // INIT
    init: function() {
        console.log("UI Core Initializing...");
        
        // 1. Map Elements (Robust Check)
        this.els.view = document.getElementById('view-container');
        
        // [FIX] Priority mapping for Log: Try 'game-log' (Overlay) first, then 'log-area' (Panel)
        this.els.log = document.getElementById('game-log') || document.getElementById('log-area');
        
        this.els.loginScreen = document.getElementById('login-screen');
        this.els.gameScreen = document.getElementById('game-screen');
        
        this.els.loginEmail = document.getElementById('login-email');
        this.els.loginPass = document.getElementById('login-pass');
        this.els.loginName = document.getElementById('login-name');
        this.els.btnLogin = document.getElementById('btn-login');
        this.els.btnToggleRegister = document.getElementById('btn-toggle-register');
        this.els.loginStatus = document.getElementById('login-status');
        this.els.loginTitle = document.getElementById('login-title');
        this.els.inputName = document.getElementById('login-name'); // Alias
        
        this.els.charSelectScreen = document.getElementById('char-select-screen');
        this.els.charSlotsList = document.getElementById('char-slots-list');
        this.els.newCharOverlay = document.getElementById('new-char-overlay');
        this.els.inputNewCharName = document.getElementById('new-char-name');
        this.els.btnCreateChar = document.getElementById('btn-create-char');
        this.els.btnCharSelectAction = document.getElementById('btn-char-select-action');
        this.els.btnCharDeleteAction = document.getElementById('btn-char-delete-action');
        this.els.btnCharBack = document.getElementById('btn-char-back');
        
        this.els.deleteOverlay = document.getElementById('delete-confirm-overlay');
        this.els.deleteTargetName = document.getElementById('delete-target-name');
        this.els.deleteInput = document.getElementById('delete-input');
        this.els.btnDeleteConfirm = document.getElementById('btn-delete-confirm');
        this.els.btnDeleteCancel = document.getElementById('btn-delete-cancel');
        
        this.els.spawnScreen = document.getElementById('spawn-screen');
        this.els.spawnList = document.getElementById('spawn-list');
        this.els.btnSpawnRandom = document.getElementById('btn-spawn-random');
        this.els.gameOver = document.getElementById('game-over-screen');
        
        this.els.playerList = document.getElementById('player-list-overlay');
        this.els.playerListContent = document.getElementById('player-list-content');
        
        this.els.navMenu = document.getElementById('main-nav');
        this.els.btnMenu = document.getElementById('btn-menu'); // Mobile Menu Btn
        
        // HUD Elements
        this.els.name = document.getElementById('val-name');
        this.els.lvl = document.getElementById('val-lvl') || document.getElementById('char-lvl'); // Support both IDs
        this.els.hp = document.getElementById('val-hp') || document.getElementById('val-hp-text');
        this.els.hpBar = document.getElementById('bar-hp');
        this.els.xpTxt = document.getElementById('val-xp-txt');
        this.els.expBarTop = document.getElementById('bar-exp-top');
        this.els.expBarMobile = document.getElementById('bar-exp-mobile');
        this.els.caps = document.getElementById('val-caps');
        this.els.ammo = document.getElementById('val-ammo');
        
        // Buttons
        this.els.btnWiki = document.getElementById('btn-wiki');
        this.els.btnMap = document.getElementById('btn-map');
        this.els.btnChar = document.getElementById('btn-char');
        this.els.btnInv = document.getElementById('btn-inv');
        this.els.btnQuests = document.getElementById('btn-quests');
        this.els.btnSave = document.getElementById('btn-save');
        this.els.btnLogout = document.getElementById('btn-logout');
        
        // 2. Initialize Sub-Modules
        if(this.initInput) this.initInput();
        if(typeof Network !== 'undefined' && Network.init) Network.init();
        
        // 3. Start Timer
        this.timerInterval = setInterval(() => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString();
            const el = document.getElementById('game-timer');
            if(el) el.textContent = timeStr;
        }, 1000);

        console.log("UI Core Loaded.");
    },

    toggleNav: function() {
        if(!this.els.navMenu) {
            this.els.navMenu = document.getElementById('main-nav'); // Re-try fetch
            if(!this.els.navMenu) return;
        }
        
        const isHidden = this.els.navMenu.classList.contains('hidden') || this.els.navMenu.style.display === 'none';
        
        if (isHidden) {
            this.els.navMenu.classList.remove('hidden');
            this.els.navMenu.style.display = 'flex';
            if(this.els.btnMenu) this.els.btnMenu.classList.add('border-yellow-400', 'text-yellow-400');
        } else {
            this.els.navMenu.classList.add('hidden');
            this.els.navMenu.style.display = 'none';
            if(this.els.btnMenu) this.els.btnMenu.classList.remove('border-yellow-400', 'text-yellow-400');
        }
    },

    showGameOver: function() {
        if(this.els.gameOver) this.els.gameOver.classList.remove('hidden');
    },

    showPermadeathWarning: function() {
        if(Game.state.lvl === 1 && Game.state.xp === 0) {
            this.log("WARNUNG: PERMADEATH SYSTEM AKTIV.", "text-red-500 font-bold");
            this.log("Wenn deine HP 0 erreichen, wird der Spielstand gelöscht.", "text-red-400");
        }
    },

    selectSlot: function(index) {
        this.selectedSlot = index;
        document.querySelectorAll('.char-slot').forEach(el => {
            el.classList.remove('selected');
            if(parseInt(el.dataset.index) === index) el.classList.add('selected');
        });

        const save = this.currentSaves[index];
        if (save) {
            this.els.btnCharSelectAction.textContent = "SPIEL LADEN";
            this.els.btnCharSelectAction.onclick = () => this.startGame(save, index);
            this.els.btnCharSelectAction.className = "action-button w-full font-bold border-green-500 text-green-500 py-3";
            
            this.els.btnCharDeleteAction.disabled = false;
            this.els.btnCharDeleteAction.classList.remove('opacity-50', 'cursor-not-allowed');
            this.els.btnCharDeleteAction.onclick = () => this.triggerDeleteSlot();
        } else {
            this.els.btnCharSelectAction.textContent = "NEUEN CHARAKTER ERSTELLEN";
            this.els.btnCharSelectAction.onclick = () => this.triggerCharSlot();
            this.els.btnCharSelectAction.className = "action-button w-full font-bold border-yellow-400 text-yellow-400 py-3";
            
            this.els.btnCharDeleteAction.disabled = true;
            this.els.btnCharDeleteAction.classList.add('opacity-50', 'cursor-not-allowed');
        }
    },

    navigateCharSlot: function(delta) {
        let newIndex = this.selectedSlot + delta;
        if(newIndex < 0) newIndex = 4;
        if(newIndex > 4) newIndex = 0;
        this.selectSlot(newIndex);
    },

    triggerCharSlot: function() {
        if(this.selectedSlot === -1) return;
        const save = this.currentSaves[this.selectedSlot];
        if(save) {
            this.startGame(save, this.selectedSlot);
        } else {
            this.els.newCharOverlay.classList.remove('hidden');
            this.els.inputNewCharName.value = "";
            this.els.inputNewCharName.focus();
        }
    },

    triggerDeleteSlot: function() {
        if(this.selectedSlot === -1) return;
        const save = this.currentSaves[this.selectedSlot];
        if(!save) return;
        this.deleteMode = true;
        this.els.deleteOverlay.style.display = 'flex';
        this.els.deleteTargetName.textContent = save.playerName || "UNBEKANNT";
        this.els.deleteInput.value = "";
        this.els.btnDeleteConfirm.disabled = true;
        this.els.btnDeleteConfirm.classList.add('border-red-500', 'text-red-500');
        this.els.btnDeleteConfirm.classList.remove('border-green-500', 'text-green-500', 'animate-pulse');
        this.els.deleteInput.focus();
    },

    startGame: function(saveData, slotIndex, newName=null) {
        // Check Version Compatibility
        const currentVer = document.getElementById('version-display') ? document.getElementById('version-display').textContent : "0.0.0";
        // Optional: Reset if version mismatch logic here
        
        Game.init(saveData, null, slotIndex, newName);
        
        this.els.charSelectScreen.style.display = 'none';
        this.els.gameScreen.classList.remove('hidden');
        
        // Fade In
        requestAnimationFrame(() => {
            this.els.gameScreen.style.opacity = 1;
        });
    }
};

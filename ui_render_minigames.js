// [TIMESTAMP] 2026-01-10 10:00:00 - ui_render_minigames.js - Visuals for Minigames

Object.assign(UI, {
    
    // UI Bridge Funktionen
    startMinigame: function(type) {
        if (!MiniGames[type]) return;
        MiniGames.active = type;
        MiniGames[type].init();
    },

    stopMinigame: function() {
        MiniGames.active = null;
        
        // Overlay verstecken (für Dice)
        const dice = document.getElementById('dice-overlay');
        if(dice) dice.classList.add('hidden');
        
        // Zurück zur Map
        if(Game.state) Game.state.view = 'map';
        if(typeof UI.renderWorld === 'function') UI.renderWorld();
    },

    // --- HACKING RENDERER ---
    renderHacking: function() {
        const h = MiniGames.hacking;
        // ... (Dein existierender Hacking Code, sieht gut aus) ...
        let html = `
            <div class="w-full h-full flex flex-col p-2 font-mono text-green-500 bg-black overflow-hidden relative">
                <div class="flex justify-between border-b border-green-500 mb-2 pb-1">
                    <span class="font-bold">ROBCO INDUSTRIES (TM) TERM-LINK</span>
                    <div class="flex gap-2">
                        <button class="border border-green-500 px-2 text-xs hover:bg-green-900" onclick="UI.showMiniGameHelp('hacking')">?</button>
                        <span class="animate-pulse">ATTEMPTS: ${'█ '.repeat(h.attempts)}</span>
                    </div>
                </div>
                <div class="flex-grow flex gap-4 overflow-hidden relative">
                    <div id="hack-words" class="flex flex-col flex-wrap h-full content-start gap-x-8 text-sm"></div>
                    <div class="w-1/3 border-l border-green-900 pl-2 text-xs overflow-y-auto flex flex-col-reverse" id="hack-log">
                        ${h.logs.map(l => `<div>${l}</div>`).join('')}
                    </div>
                </div>
                <button class="absolute bottom-2 right-2 border border-red-500 text-red-500 px-2 text-xs hover:bg-red-900" onclick="MiniGames.hacking.end()">ABORT</button>
            </div>
        `;
        
        if(!this.els.view.innerHTML.includes('ROBCO')) {
            this.els.view.innerHTML = html;
        } else {
             const log = document.getElementById('hack-log');
             if(log) log.innerHTML = h.logs.map(l => `<div>${l}</div>`).join('');
             const attempts = document.querySelector('.animate-pulse');
             if(attempts) attempts.textContent = `ATTEMPTS: ${'█ '.repeat(h.attempts)}`;
        }

        const wordContainer = document.getElementById('hack-words');
        if(wordContainer && wordContainer.innerHTML === '') {
            h.words.forEach(word => {
                const hex = `0x${Math.floor(Math.random()*65535).toString(16).toUpperCase()}`;
                const btn = document.createElement('div');
                btn.className = "hack-row";
                btn.innerHTML = `<span class="hack-hex">${hex}</span> ${word}`;
                btn.onclick = () => MiniGames.hacking.checkWord(word);
                wordContainer.appendChild(btn);
            });
        }
    },

    // --- LOCKPICKING RENDERER ---
    renderLockpicking: function(init=false) {
        if(init) {
            this.els.view.innerHTML = `
                <div class="w-full h-full flex flex-col items-center justify-center bg-black relative select-none">
                    <div class="absolute top-2 left-2 text-xs text-gray-500">LEVEL: ${MiniGames.lockpicking.difficulty.toUpperCase()}</div>
                    <button class="absolute top-2 right-2 border border-green-500 text-green-500 px-2 font-bold hover:bg-green-900 z-50" onclick="UI.showMiniGameHelp('lockpicking')">?</button>
                    
                    <div class="lock-container">
                        <div class="lock-inner" id="lock-rotator"></div>
                        <div class="lock-center"></div>
                        <div class="bobby-pin" id="bobby-pin"></div>
                        <div class="screwdriver"></div>
                    </div>
                    <div class="mt-8 text-center text-sm text-green-300 font-mono">
                        <p>MAUS/TOUCH: Dietrich bewegen</p>
                        <p>LEERTASTE / KNOPF: Schloss drehen</p>
                    </div>
                    <button id="btn-turn-lock" class="mt-4 action-button w-40 h-16 md:hidden">DREHEN</button>
                    <button class="absolute bottom-4 right-4 border border-red-500 text-red-500 px-3 py-1 hover:bg-red-900" onclick="MiniGames.lockpicking.end()">ABBRECHEN</button>
                </div>
            `;
            const btn = document.getElementById('btn-turn-lock');
            if(btn) {
                btn.addEventListener('touchstart', (e) => { e.preventDefault(); MiniGames.lockpicking.rotateLock(); });
                btn.addEventListener('touchend', (e) => { e.preventDefault(); MiniGames.lockpicking.releaseLock(); });
                btn.addEventListener('mousedown', () => MiniGames.lockpicking.rotateLock());
                btn.addEventListener('mouseup', () => MiniGames.lockpicking.releaseLock());
            }
        }
        
        const pin = document.getElementById('bobby-pin');
        const lock = document.getElementById('lock-rotator');
        
        if(pin) pin.style.transform = `rotate(${MiniGames.lockpicking.currentAngle - 90}deg)`; 
        if(lock) lock.style.transform = `rotate(${MiniGames.lockpicking.lockAngle}deg)`;
    },

    // --- [NEU] DICE RENDERER ---
    renderDice: function() {
        const container = document.getElementById('dice-overlay');
        if(!container) return;
        
        const game = MiniGames.dice;
        container.classList.remove('hidden');
        
        container.innerHTML = `
            <div class="fixed inset-0 z-[2000] bg-black/90 flex flex-col items-center justify-center p-6">
                <div class="border-4 border-yellow-500 p-8 bg-[#1a1100] shadow-[0_0_50px_#ffd700] text-center w-full max-w-md relative">
                    <h2 class="text-4xl font-bold text-yellow-400 mb-6 font-vt323 tracking-widest animate-pulse">WASTELAND GAMBLE</h2>
                    
                    <div class="flex justify-center gap-8 mb-8">
                        <div class="w-24 h-24 bg-black border-2 border-yellow-600 flex items-center justify-center text-6xl text-yellow-500 font-bold shadow-inner">
                            ${game.d1}
                        </div>
                        <div class="w-24 h-24 bg-black border-2 border-yellow-600 flex items-center justify-center text-6xl text-yellow-500 font-bold shadow-inner">
                            ${game.d2}
                        </div>
                    </div>

                    <div class="text-yellow-200 font-mono text-sm mb-6">
                        Glück (LUC): <span class="text-white font-bold">${Game.getStat('LUC')}</span> 
                        (Bonus: +${Math.floor(Game.getStat('LUC')/2)})
                    </div>

                    ${!game.rolling ? 
                        `<button onclick="MiniGames.dice.roll()" class="w-full py-4 text-2xl font-bold bg-yellow-600 text-black hover:bg-yellow-400 transition-all border-2 border-yellow-400 uppercase tracking-widest shadow-lg">
                            🎲 WÜRFELN
                        </button>` : 
                        `<div class="text-yellow-500 text-xl font-bold animate-bounce">ROLLING...</div>`
                    }
                </div>
            </div>
        `;
    },

    showMiniGameHelp: function(type) {
        let title = "", text = "";
        if(type === 'hacking') {
            title = "TERMINAL HACKING";
            text = `Passwort suchen. Likeness = Korrekte Buchstaben an korrekter Position.`;
        } else {
            title = "SCHLOSS KNACKEN";
            text = `Dietrich bewegen, Schloss drehen. Bei Wackeln sofort stoppen!`;
        }
        if (typeof this.showInfoDialog === 'function') {
            this.showInfoDialog(title, text);
        } else {
            alert(title + ": " + text);
        }
    }
});

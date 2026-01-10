// [TIMESTAMP] 2026-01-10 21:25:00 - ui_render_minigames.js - Auto-Create Overlays Fix

Object.assign(UI, {
    
    startMinigame: function(type) {
        if (!MiniGames[type]) return;
        MiniGames.active = type;
        MiniGames[type].init();
    },

    stopMinigame: function() {
        // Aufräumen Defusal Loop
        if(MiniGames.defusal && MiniGames.defusal.gameLoop) {
            clearInterval(MiniGames.defusal.gameLoop);
        }
        
        MiniGames.active = null;
        
        // Overlays verstecken
        const dice = document.getElementById('dice-overlay');
        if(dice) dice.classList.add('hidden');
        
        // Views clearen
        if(this.els && this.els.view) {
            if(!Game.state || Game.state.view !== 'map') this.els.view.innerHTML = '';
        }

        if(Game.state) Game.state.view = 'map';
        if(typeof UI.renderWorld === 'function') UI.renderWorld();
    },

    renderMinigame: function() {
       if (MiniGames.active === 'hacking') UI.renderHacking();
       if (MiniGames.active === 'lockpicking') UI.renderLockpicking();
       if (MiniGames.active === 'defusal') UI.renderDefusal();
    },

    // --- HACKING ---
    renderHacking: function() {
        const h = MiniGames.hacking;
        
        let html = `
            <div class="w-full h-full flex flex-col p-2 font-mono text-green-500 bg-black overflow-hidden relative">
                <div class="flex justify-between border-b border-green-500 mb-2 pb-1">
                    <span class="font-bold">ROBCO TERM-LINK</span>
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

    // --- LOCKPICKING ---
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

    // --- DICE (FIX: Auto-Create Overlay) ---
    renderDice: function(game, finalResult = null) {
        // [FIX] Suche Overlay, wenn nicht da -> Erstellen!
        let container = document.getElementById('dice-overlay');
        
        if(!container) {
            console.log("[UI] Dice overlay missing, creating new one.");
            container = document.createElement('div');
            container.id = 'dice-overlay';
            // Wir hängen es an den BODY, damit es view-unabhängig ist (Z-Index hoch)
            container.className = 'hidden fixed inset-0 z-[2000] pointer-events-auto'; 
            document.body.appendChild(container);
        }
        
        container.classList.remove('hidden');
        
        const luck = Game.getStat('LUC') || 1;
        const bonus = Math.floor(luck / 2);
        
        let resultHtml = '';
        if (finalResult !== null) {
            resultHtml = `<div class="mt-4 text-3xl font-bold text-green-400 animate-pulse border-2 border-green-500 bg-black/80 p-2">ERGEBNIS: ${finalResult}</div>`;
        }

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
                    <div class="text-yellow-200 font-mono text-sm mb-6 bg-black/40 p-2 rounded">
                        Glück (LUC): <span class="text-white font-bold">${luck}</span> 
                        <span class="text-gray-400">|</span> Bonus: <span class="text-[#39ff14] font-bold">+${bonus}</span>
                    </div>
                    ${!game.rolling && finalResult === null ? 
                        `<button onclick="MiniGames.dice.roll()" class="w-full py-4 text-2xl font-bold bg-yellow-600 text-black hover:bg-yellow-400 transition-all border-2 border-yellow-400 uppercase tracking-widest shadow-lg cursor-pointer">🎲 WÜRFELN</button>` : 
                        `<div class="text-yellow-500 text-xl font-bold h-16 flex items-center justify-center">${finalResult !== null ? 'Loot wird berechnet...' : 'ROLLING...'}</div>`
                    }
                    ${resultHtml}
                </div>
            </div>
        `;
    },

    // --- DEFUSAL (Optimiert) ---
    renderDefusal: function() {
        const game = MiniGames.defusal;
        
        if(!document.getElementById('defusal-game-root')) {
             this.els.view.innerHTML = `
                <div id="defusal-game-root" class="w-full h-full flex flex-col items-center justify-center bg-black p-4 select-none relative font-mono text-green-500">
                    <div class="border-2 border-green-500 bg-[#001100] p-6 w-full max-w-lg shadow-[0_0_20px_#0f0] relative">
                        <div class="flex justify-between items-center border-b border-green-700 pb-2 mb-4">
                            <h2 class="text-2xl font-bold tracking-widest animate-pulse text-red-500">BOMB DEFUSAL</h2>
                            <button class="border border-green-500 px-2 text-xs hover:bg-green-900" onclick="UI.showMiniGameHelp('defusal')">?</button>
                        </div>

                        <div id="defusal-lights" class="flex justify-center gap-4 mb-6"></div>

                        <div class="w-full h-12 border-2 border-green-500 relative bg-black overflow-hidden mb-6">
                            <div id="defusal-zone" class="absolute top-0 bottom-0 bg-green-500/30 border-x border-green-500"></div>
                            <div id="defusal-cursor" class="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white]"></div>
                        </div>

                        <button onmousedown="MiniGames.defusal.cutWire()" ontouchstart="event.preventDefault(); MiniGames.defusal.cutWire()"
                            class="w-full py-4 text-xl font-bold bg-red-900/30 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-black transition-all uppercase tracking-widest active:scale-95">
                            ✂️ CUT WIRE
                        </button>
                    </div>
                    
                    <div class="absolute bottom-4 text-xs text-gray-500 text-center">
                        PER erhöht Breite • AGI senkt Tempo
                    </div>
                </div>
            `;
        }

        const cursor = document.getElementById('defusal-cursor');
        if(cursor) cursor.style.left = game.cursor + '%';

        const zone = document.getElementById('defusal-zone');
        if(zone) {
            zone.style.left = game.zoneStart + '%';
            zone.style.width = game.zoneWidth + '%';
        }

        const lightsContainer = document.getElementById('defusal-lights');
        if(lightsContainer) {
            const lightsHtml = [1, 2, 3].map(i => {
                let color = "bg-gray-800"; 
                if (i < game.round) color = "bg-green-500 shadow-[0_0_10px_#0f0]"; 
                if (i === game.round) color = "bg-red-500 animate-ping"; 
                return `<div class="w-4 h-4 rounded-full ${color} border border-green-900"></div>`;
            }).join('');
            
            if(lightsContainer.innerHTML !== lightsHtml) {
                lightsContainer.innerHTML = lightsHtml;
            }
        }
    },

    showMiniGameHelp: function(type) {
        let title = "", text = "";
        
        if(type === 'hacking') {
            title = "TERMINAL HACKING";
            text = "Finde das korrekte Passwort. Likeness = Korrekte Buchstaben an richtiger Position.";
        } else if (type === 'lockpicking') {
            title = "SCHLOSS KNACKEN";
            text = "Dietrich bewegen, Schloss drehen. Bei Wackeln sofort stoppen!";
        } else if (type === 'dice') {
            title = "WASTELAND GAMBLE";
            text = "Würfle hoch! Dein Glück (LUC) addiert sich zum Ergebnis.";
        } else if (type === 'defusal') {
            title = "BOMBE ENTSCHÄRFEN";
            text = "Drücke 'CUT WIRE', wenn der weiße Balken im grünen Bereich ist.<br>3 Kabel müssen durchtrennt werden.";
        }

        if (typeof this.showInfoDialog === 'function') {
            this.showInfoDialog(title, text);
        } else {
            alert(title + ": " + text.replace(/<[^>]*>?/gm, ''));
        }
    }
});

const Input = {
    init: function() {
        // PREVENT BROWSER SCROLLING on Arrow Keys
        window.addEventListener('keydown', (e) => {
            if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].indexOf(e.code) > -1) {
                // Nur verhindern, wenn wir im Spiel sind (nicht in Textfeldern)
                if(e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                }
            }
        }, false);

        document.addEventListener('keydown', (e) => {
            if (!Game.state || Game.state.isGameOver) return;
            
            // ESC Menu
            if (e.key === 'Escape') {
                if(document.getElementById('manual-overlay').style.display !== 'none') {
                    document.getElementById('manual-overlay').style.display = 'none';
                    document.getElementById('manual-overlay').classList.add('hidden');
                } else if(document.getElementById('changelog-overlay').style.display !== 'none') {
                     document.getElementById('changelog-overlay').style.display = 'none';
                     document.getElementById('changelog-overlay').classList.add('hidden');
                } else {
                    UI.toggleView('menu');
                }
                return;
            }

            // Dialog handling
            if (Game.state.inDialog) {
                if(e.key === 'Enter' || e.key === ' ') {
                    // Confirm logic if needed
                }
                return;
            }

            // Movement (WASD / Arrows)
            if (Game.state.view === 'map') {
                if (e.key === 'w' || e.key === 'ArrowUp') Game.move(0, -1);
                if (e.key === 's' || e.key === 'ArrowDown') Game.move(0, 1);
                if (e.key === 'a' || e.key === 'ArrowLeft') Game.move(-1, 0);
                if (e.key === 'd' || e.key === 'ArrowRight') Game.move(1, 0);
                if (e.key === 'Enter' || e.key === ' ') {
                     // Action Key (könnte man für Interaktion nutzen)
                }
            } else if (Game.state.view === 'lockpicking') {
                if(e.key === ' ') MiniGames.lockpicking.rotateLock();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (Game.state && Game.state.view === 'lockpicking') {
                if(e.key === ' ') MiniGames.lockpicking.releaseLock();
            }
        });

        // Joystick Logic
        const joyBase = document.getElementById('joystick-base');
        const joyStick = document.getElementById('joystick-stick');
        let startX, startY, joyId = null;

        const handleStart = (x, y) => {
            if (Game.state.view !== 'map') return;
            const container = document.getElementById('game-canvas').getBoundingClientRect();
            // Nur aktivieren wenn innerhalb des Canvas Bereichs
            if(x < container.left || x > container.right || y < container.top || y > container.bottom) return;

            joyBase.style.display = 'block';
            joyBase.style.left = (x - 50) + 'px';
            joyBase.style.top = (y - 50) + 'px';
            joyStick.style.display = 'block';
            joyStick.style.left = (x - 25) + 'px';
            joyStick.style.top = (y - 25) + 'px';
            startX = x;
            startY = y;
            
            if(joyId) clearInterval(joyId);
            joyId = setInterval(() => {
                const dx = parseFloat(joyStick.style.left) + 25 - startX;
                const dy = parseFloat(joyStick.style.top) + 25 - startY;
                if (Math.abs(dx) > 20) Game.move(Math.sign(dx), 0);
                else if (Math.abs(dy) > 20) Game.move(0, Math.sign(dy));
            }, 200);
        };

        const handleMove = (x, y) => {
            if (joyBase.style.display === 'none') return;
            let dx = x - startX;
            let dy = y - startY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > 50) {
                const angle = Math.atan2(dy, dx);
                dx = Math.cos(angle) * 50;
                dy = Math.sin(angle) * 50;
            }
            joyStick.style.left = (startX + dx - 25) + 'px';
            joyStick.style.top = (startY + dy - 25) + 'px';
            
            // Lockpicking Control via Touch Move
            if(Game.state.view === 'lockpicking') {
                 // Simple mapping: x movement rotates pick
                 const rect = document.body.getBoundingClientRect();
                 const relX = (x - rect.left) / rect.width;
                 MiniGames.lockpicking.mouseMove(relX * 2 - 1); // -1 to 1
            }
        };

        const handleEnd = () => {
            if(joyBase) joyBase.style.display = 'none';
            if(joyStick) joyStick.style.display = 'none';
            if(joyId) clearInterval(joyId);
        };

        // Mouse Events
        document.addEventListener('mousedown', e => { if(e.button === 0) handleStart(e.clientX, e.clientY); });
        document.addEventListener('mousemove', e => handleMove(e.clientX, e.clientY));
        document.addEventListener('mouseup', handleEnd);

        // Touch Events
        document.addEventListener('touchstart', e => { if(e.touches.length === 1) handleStart(e.touches[0].clientX, e.touches[0].clientY); }, {passive: false});
        document.addEventListener('touchmove', e => { if(e.touches.length === 1) { e.preventDefault(); handleMove(e.touches[0].clientX, e.touches[0].clientY); }}, {passive: false});
        document.addEventListener('touchend', handleEnd);
        
        // Lockpicking Mouse Helper
        document.addEventListener('mousemove', (e) => {
             if(Game.state && Game.state.view === 'lockpicking') {
                 const rect = document.body.getBoundingClientRect();
                 const x = (e.clientX - rect.left) / rect.width; // 0 to 1
                 // Map to -180 to 180 logic or similar inside minigame, here just pass raw 
                 // Actually minigame expects movement. Let's pass normalized X (-1 to 1)
                 MiniGames.lockpicking.mouseMove((x * 2) - 1);
             }
        });
    }
};

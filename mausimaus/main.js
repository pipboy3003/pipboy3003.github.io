// Timestamp: 2026-03-01 10:05:00 CET

GAME.setupGraphics();
GAME.updateLimits();

// --- Event Listeners ---
document.addEventListener('keydown', (e) => {
    if(GAME.state !== GAME.STATE_PLAYING) return;
    GAME.useTargetControl = false; // Tastatur überschreibt Touch-Verhalten
    const key = e.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') GAME.moveLeft = true;
    if (key === 'arrowright' || key === 'd') GAME.moveRight = true;
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') GAME.moveLeft = false;
    if (key === 'arrowright' || key === 'd') GAME.moveRight = false;
});

// NEU: 1:1 Mapping (Maus/Finger-Position wird exakt auf die 3D-Welt übertragen)
function updateMovementDirection(clientX) {
    if(GAME.state !== GAME.STATE_PLAYING) return;
    GAME.useTargetControl = true;
    
    // Berechnet die exakte Position im 3D Raum basierend auf der Bildschirmbreite
    const percentageX = clientX / window.innerWidth;
    GAME.targetX = (percentageX * (GAME.horizontalLimit * 2)) - GAME.horizontalLimit;
}

document.getElementById('startOverlay').addEventListener('click', () => {
    if (GAME.state === GAME.STATE_START) {
        GAME.state = GAME.STATE_TRANSITION;
        document.getElementById('startOverlay').style.display = 'none';
        GAME.updateWeightUI(); 
    }
});

document.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.id === 'startOverlay') return; 
    GAME.isPointerDown = true;
    if(GAME.state === GAME.STATE_PLAYING) document.getElementById('touch-hint').style.display = 'none';
    updateMovementDirection(e.clientX);
});

document.addEventListener('mousemove', (e) => { if (GAME.isPointerDown) updateMovementDirection(e.clientX); });
document.addEventListener('mouseup', () => { GAME.isPointerDown = false; });

document.addEventListener('touchstart', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.id === 'startOverlay') return;
    GAME.isPointerDown = true;
    if(GAME.state === GAME.STATE_PLAYING) document.getElementById('touch-hint').style.display = 'none'; 
    updateMovementDirection(e.touches[0].clientX);
}, { passive: false });

document.addEventListener('touchmove', (e) => { if (GAME.isPointerDown) updateMovementDirection(e.touches[0].clientX); }, { passive: false });
document.addEventListener('touchend', (e) => {
    if (e.touches.length === 0) { GAME.isPointerDown = false; } 
    else { updateMovementDirection(e.touches[0].clientX); }
});

window.addEventListener('resize', () => {
    GAME.renderer.setSize(window.innerWidth, window.innerHeight);
    GAME.camera.aspect = window.innerWidth / window.innerHeight;
    GAME.camera.updateProjectionMatrix();
    GAME.updateLimits(); 
});

// --- Der Haupt-Loop ---
function animate() {
    requestAnimationFrame(animate);
    const time = Date.now() * 0.005;

    for (let i = GAME.particles.length - 1; i >= 0; i--) {
        let p = GAME.particles[i];
        p.position.add(p.velocity);
        p.velocity.y -= 0.015; 
        p.life -= 0.03;
        p.scale.multiplyScalar(0.92); 
        if (p.life <= 0 || p.position.y < 0) {
            GAME.scene.remove(p);
            GAME.particles.splice(i, 1);
        }
    }

    if (GAME.state === GAME.STATE_START) {
        GAME.startAngle += 0.05;
        GAME.mouseGroup.position.x = Math.cos(GAME.startAngle) * 3;
        GAME.mouseGroup.position.z = Math.sin(GAME.startAngle) * 3;
        GAME.mouseGroup.rotation.y = -GAME.startAngle + Math.PI; 
        GAME.mouseGroup.position.y = Math.abs(Math.sin(time * 2)) * 0.2 + 0.5;
        GAME.tailMesh.rotation.x = Math.PI / 2 + Math.sin(time * 2) * 0.3;
        GAME.camera.lookAt(0, 0, 0);

    } else if (GAME.state === GAME.STATE_TRANSITION) {
        GAME.mouseGroup.position.lerp(new THREE.Vector3(0, 0.5, 0), 0.1);
        const currentQuat = new THREE.Quaternion().setFromEuler(GAME.mouseGroup.rotation);
        const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
        currentQuat.slerp(targetQuat, 0.1);
        GAME.mouseGroup.rotation.setFromQuaternion(currentQuat);
        GAME.camera.position.lerp(GAME.defaultCameraPos, 0.05);
        GAME.camera.lookAt(0, 1, 0);

        if (GAME.mouseGroup.position.length() < 0.6 && GAME.camera.position.distanceTo(GAME.defaultCameraPos) < 0.2) {
            GAME.mouseGroup.position.set(0, 0.5, 0);
            GAME.mouseGroup.rotation.set(0, 0, 0);
            GAME.camera.position.copy(GAME.defaultCameraPos);
            GAME.state = GAME.STATE_PLAYING;
            document.getElementById('ui-container').style.display = 'block';
            if ('ontouchstart' in window || navigator.maxTouchPoints > 0) document.getElementById('touch-hint').style.display = 'block';
        }

    } else if (GAME.state === GAME.STATE_PLAYING) {
        const weightPenalty = (GAME.fatness - 1) * 0.05;
        const currentPlayerSpeed = Math.max(0.15, (0.35 + (GAME.score * 0.002)) - weightPenalty);
        let isMoving = false;

        // NEU: Fließende Logik für die 1:1 Steuerung
        if (GAME.useTargetControl && GAME.isPointerDown) {
            const diff = GAME.targetX - GAME.mouseGroup.position.x;
            if (Math.abs(diff) > 0.1) {
                // Bewegt sich exakt so schnell wie erlaubt zum Ziel
                GAME.mouseGroup.position.x += Math.sign(diff) * Math.min(currentPlayerSpeed, Math.abs(diff));
                isMoving = true;
            }
        } else {
            // Klassische Tastatur-Logik (Fallback)
            if (GAME.moveLeft && GAME.mouseGroup.position.x > -GAME.horizontalLimit) { 
                GAME.mouseGroup.position.x -= currentPlayerSpeed; isMoving = true; GAME.targetX = GAME.mouseGroup.position.x; 
            }
            if (GAME.moveRight && GAME.mouseGroup.position.x < GAME.horizontalLimit) { 
                GAME.mouseGroup.position.x += currentPlayerSpeed; isMoving = true; GAME.targetX = GAME.mouseGroup.position.x; 
            }
        }

        if (GAME.mouseGroup.position.x > GAME.horizontalLimit) GAME.mouseGroup.position.x = GAME.horizontalLimit;
        if (GAME.mouseGroup.position.x < -GAME.horizontalLimit) GAME.mouseGroup.position.x = -GAME.horizontalLimit;

        const currentSpeed = 0.25 + (GAME.score * 0.008);
        GAME.grassBlades.forEach(blade => {
            blade.position.z += currentSpeed;
            if (blade.position.z > 15) {
                blade.position.z -= 200; 
            }
        });

        if (isMoving || GAME.entities.length > 0) {
            GAME.mouseGroup.position.y = Math.abs(Math.sin(time * 3)) * 0.2 + 0.5; 
            GAME.tailMesh.rotation.x = Math.PI / 2 + Math.sin(time * 3) * 0.4; 
            GAME.leftEar.rotation.x = Math.sin(time * 3) * 0.1; 
            GAME.rightEar.rotation.x = Math.sin(time * 3) * 0.1;
            
            if (Math.random() < 0.2) GAME.spawnParticles(new THREE.Vector3(GAME.mouseGroup.position.x, 0.1, GAME.mouseGroup.position.z + 1), 0xcccccc, 1, true);
        }

        GAME.spawnTimer++;
        const currentSpawnRate = Math.max(15, 70 - (GAME.score * 1.5));
        if (GAME.spawnTimer > currentSpawnRate) { GAME.spawnEntity(); GAME.spawnTimer = 0; }

        const playerBox = new THREE.Box3().setFromObject(GAME.mouseGroup);

        for (let i = GAME.entities.length - 1; i >= 0; i--) {
            const entity = GAME.entities[i];
            entity.position.z += currentSpeed; 

            if(entity.userData.type === 'cheese' || entity.userData.type === 'chili') {
                entity.position.y += Math.sin(time * 4 + entity.position.x) * 0.01;
                entity.rotation.y += 0.02;
            }

            const entityBox = new THREE.Box3().setFromObject(entity);

            if (playerBox.intersectsBox(entityBox)) {
                if (entity.userData.type === 'cheese') {
                    GAME.spawnParticles(entity.position.clone(), entity.userData.color, 12, false);
                    GAME.scene.remove(entity); GAME.entities.splice(i, 1); 
                    
                    GAME.score++; 
                    document.getElementById('score').innerText = GAME.score;
                    GAME.level = Math.floor(GAME.score / 5) + 1;
                    document.getElementById('level').innerText = GAME.level;

                    GAME.fatness = Math.min(GAME.fatness + 0.1, GAME.MAX_FATNESS);
                    GAME.bodyMesh.scale.set(GAME.fatness, 1 + (GAME.fatness - 1) * 0.25, 2);
                    GAME.updateWeightUI();
                } 
                else if (entity.userData.type === 'chili') {
                    GAME.spawnParticles(entity.position.clone(), entity.userData.color, 25, false);
                    GAME.scene.remove(entity); GAME.entities.splice(i, 1); 
                    
                    GAME.fatness = 1;
                    GAME.bodyMesh.scale.set(GAME.fatness, 1, 2);
                    GAME.updateWeightUI();
                }
                else if (entity.userData.type === 'trap') {
                    GAME.state = GAME.STATE_CUTSCENE;
                    GAME.hitTrap = entity;
                    GAME.hitTrap.position.x = GAME.mouseGroup.position.x;
                    GAME.hitTrap.position.z = GAME.mouseGroup.position.z;
                    GAME.moveLeft = false; GAME.moveRight = false; GAME.isPointerDown = false;
                    document.getElementById('touch-hint').style.display = 'none';
                }
                continue; 
            }
            if (entity.position.z > 15) { GAME.scene.remove(entity); GAME.entities.splice(i, 1); }
        }

        if (GAME.score >= 5) {
            if (GAME.catState === 0 && Math.random() < 0.002 + (GAME.score * 0.0001)) {
                GAME.catState = 1; GAME.catSide = Math.random() > 0.5 ? 1 : -1; GAME.catTimer = 0;
                const catDropX = GAME.catSide * (GAME.horizontalLimit / 2 + 1.5);
                GAME.catShadow.position.x = catDropX; 
                GAME.catGroup.position.set(catDropX, 30, 0); 
            } else if (GAME.catState === 1) {
                GAME.catTimer++;
                GAME.catShadow.material.opacity = Math.min(0.6, GAME.catTimer / 50); 
                if (GAME.catTimer > Math.max(40, 100 - (GAME.score * 1.5))) GAME.catState = 2; 
            } else if (GAME.catState === 2) {
                GAME.catGroup.position.y -= 2.5; 
                if (GAME.catGroup.position.y <= 0) {
                    GAME.catGroup.position.y = 0; GAME.catState = 3; GAME.catTimer = 0; GAME.shakeTimer = 15; 
                    if ((GAME.catSide === -1 && GAME.mouseGroup.position.x < 0) || (GAME.catSide === 1 && GAME.mouseGroup.position.x > 0)) {
                        GAME.state = GAME.STATE_GAMEOVER;
                        document.getElementById('finalScore').innerText = GAME.score;
                        document.getElementById('gameOverOverlay').style.display = 'flex';
                        GAME.mouseGroup.scale.set(1.5, 0.1, 1.5);
                    }
                }
            } else if (GAME.catState === 3) {
                GAME.catTimer++;
                if (GAME.catTimer > 30) GAME.catState = 4;
            } else if (GAME.catState === 4) {
                GAME.catGroup.position.y += 0.8;
                GAME.catShadow.material.opacity -= 0.03;
                if (GAME.catGroup.position.y > 30) { GAME.catState = 0; GAME.catShadow.material.opacity = 0; }
            }
        }

    } else if (GAME.state === GAME.STATE_CUTSCENE) {
        GAME.camera.position.lerp(new THREE.Vector3(GAME.mouseGroup.position.x, 3, GAME.mouseGroup.position.z + 5), 0.05);
        GAME.camera.lookAt(GAME.mouseGroup.position);

        if (GAME.hitTrap.userData.snapper.rotation.x < 0) {
            GAME.hitTrap.userData.snapper.rotation.x += 0.3; 
        } else {
            GAME.state = GAME.STATE_GAMEOVER;
            document.getElementById('finalScore').innerText = GAME.score;
            document.getElementById('gameOverOverlay').style.display = 'flex';
        }
    }

    if (GAME.shakeTimer > 0) {
        GAME.camera.position.x = GAME.defaultCameraPos.x + (Math.random() - 0.5) * 1.5;
        GAME.camera.position.y = GAME.defaultCameraPos.y + (Math.random() - 0.5) * 1.5;
        GAME.shakeTimer--;
    } else if (GAME.state === GAME.STATE_PLAYING && GAME.shakeTimer === 0) {
        GAME.camera.position.lerp(GAME.defaultCameraPos, 0.1);
    }

    GAME.renderer.render(GAME.scene, GAME.camera);
}

document.getElementById('restartBtn').addEventListener('click', () => {
    GAME.state = GAME.STATE_PLAYING; GAME.hitTrap = null; GAME.score = 0; GAME.level = 1; GAME.spawnTimer = 0;
    GAME.fatness = 1; GAME.updateWeightUI();
    GAME.catState = 0; GAME.catTimer = 0; GAME.shakeTimer = 0; GAME.catGroup.position.y = 30; GAME.catShadow.material.opacity = 0;
    
    document.getElementById('score').innerText = GAME.score;
    document.getElementById('level').innerText = GAME.level;
    document.getElementById('gameOverOverlay').style.display = 'none'; 
    
    GAME.mouseGroup.position.set(0, 0.5, 0);
    GAME.mouseGroup.scale.set(1, 1, 1); 
    GAME.bodyMesh.scale.set(1, 1, 2);

    GAME.camera.position.copy(GAME.defaultCameraPos);
    GAME.camera.lookAt(0, 1, 0);

    GAME.entities.forEach(entity => GAME.scene.remove(entity)); GAME.entities = [];
    GAME.particles.forEach(p => GAME.scene.remove(p)); GAME.particles = [];
});

animate();

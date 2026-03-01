// Timestamp: 2026-03-01 09:42:01 CET

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); 
scene.fog = new THREE.Fog(0x87CEEB, 20, 100); 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const defaultCameraPos = new THREE.Vector3(0, 6, 12);
const menuCameraPos = new THREE.Vector3(0, 12, 14);

camera.position.copy(menuCameraPos);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; 
renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
document.body.appendChild(renderer.domElement);

// DOM Elemente
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const touchHint = document.getElementById('touch-hint');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const finalScoreElement = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');
const startOverlay = document.getElementById('startOverlay');
const uiContainer = document.getElementById('ui-container');

// Game States
const STATE_START = 0;
const STATE_TRANSITION = 1;
const STATE_PLAYING = 2;
const STATE_CUTSCENE = 3;
const STATE_GAMEOVER = 4;

let gameState = STATE_START;

// Spiel-Variablen
let score = 0;
let level = 1;
let entities = []; 
let spawnTimer = 0;
let hitTrap = null; 
let startAngle = 0;

// Katzen-Variablen
let catState = 0; 
let catSide = 1; 
let catTimer = 0;
let shakeTimer = 0;

// Dynamische Spielfeldgrenze
let horizontalLimit = 14;

function updateLimits() {
    const dist = defaultCameraPos.z; 
    const vFov = (camera.fov * Math.PI) / 180;
    const visibleHeight = 2 * Math.tan(vFov / 2) * dist;
    const visibleWidth = visibleHeight * (window.innerWidth / window.innerHeight);
    
    horizontalLimit = (visibleWidth / 2) - 1.5; 
    
    if (horizontalLimit > 14) horizontalLimit = 14; 
    if (horizontalLimit < 2) horizontalLimit = 2;   
}

updateLimits();

// --- Beleuchtung ---
// Weiches Umgebungslicht für bessere Grafik
const ambientLight = new THREE.HemisphereLight(0xffffff, 0x228B22, 0.4); 
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 50;
dirLight.shadow.camera.left = -15;
dirLight.shadow.camera.right = 15;
dirLight.shadow.camera.top = 15;
dirLight.shadow.camera.bottom = -15;
scene.add(dirLight);

// --- Boden & Umgebung ---
const groundGeometry = new THREE.PlaneGeometry(30, 200);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 }); 
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; 
ground.receiveShadow = true; 
scene.add(ground);

// Hunderte von Grashalmen hinzufügen für Textur
const grassGroup = new THREE.Group();
const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x1e6a1e });
const grassBladeGeom = new THREE.BoxGeometry(0.1, 0.5, 0.1);

for (let i = 0; i < 500; i++) {
    const grassBlade = new THREE.Mesh(grassBladeGeom, grassMaterial);
    
    // Zufällige Position auf der Wiese
    const randomX = (Math.random() - 0.5) * 30;
    const randomZ = (Math.random() - 0.5) * 200;
    grassBlade.position.set(randomX, 0.25, randomZ);
    
    // Zufällige Höhe und Drehung
    grassBlade.scale.y = Math.random() * 2 + 1;
    grassBlade.rotation.y = Math.random() * Math.PI;
    grassBlade.castShadow = true;
    grassGroup.add(grassBlade);
}
scene.add(grassGroup);

// --- Die Maus ---
const mouseGroup = new THREE.Group();

const bodyGeom = new THREE.SphereGeometry(0.5, 16, 16);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x888888 }); 
const body = new THREE.Mesh(bodyGeom, bodyMat);
body.scale.set(1, 1, 2); 
body.position.y = 0.5;
body.castShadow = true;
mouseGroup.add(body);

const headGeom = new THREE.SphereGeometry(0.4, 16, 16);
const headMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
const head = new THREE.Mesh(headGeom, headMat);
head.position.set(0, 0.6, -0.8); 
head.castShadow = true;
mouseGroup.add(head);

const earGeom = new THREE.CircleGeometry(0.3, 32);
const earMat = new THREE.MeshStandardMaterial({ color: 0x888888, side: THREE.DoubleSide });
const leftEar = new THREE.Mesh(earGeom, earMat);
leftEar.position.set(-0.3, 0.9, -0.6);
leftEar.rotation.y = -Math.PI / 4;
leftEar.castShadow = true;
mouseGroup.add(leftEar);

const rightEar = new THREE.Mesh(earGeom, earMat);
rightEar.position.set(0.3, 0.9, -0.6);
rightEar.rotation.y = Math.PI / 4;
rightEar.castShadow = true;
mouseGroup.add(rightEar);

const noseGeom = new THREE.SphereGeometry(0.08, 8, 8);
const noseMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
const nose = new THREE.Mesh(noseGeom, noseMat);
nose.position.set(0, 0.6, -1.15);
nose.castShadow = true;
mouseGroup.add(nose);

const eyeGeom = new THREE.SphereGeometry(0.05, 8, 8);
const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
leftEye.position.set(-0.15, 0.7, -0.9);
leftEye.castShadow = true;
mouseGroup.add(leftEye);

const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
rightEye.position.set(0.15, 0.7, -0.9);
rightEye.castShadow = true;
mouseGroup.add(rightEye);

const tailGeom = new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8);
const tailMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
const tail = new THREE.Mesh(tailGeom, tailMat);
tail.position.set(0, 0.4, 0.8);
tail.rotation.x = Math.PI / 2;
tail.castShadow = true;
mouseGroup.add(tail);

scene.add(mouseGroup);

// --- Die Katzenpfote (GRAFISCH VERBESSERT) ---
const catGroup = new THREE.Group();
catGroup.position.set(0, 30, 0); 

const furMat = new THREE.MeshStandardMaterial({ color: 0xe67e22 }); 
const padMat = new THREE.MeshStandardMaterial({ color: 0xffa0a0 }); // Rosa Ballen

// Körper (deformierte Kugel für Felloptik)
const mainPawGeom = new THREE.SphereGeometry(1.8, 32, 32);
const mainPaw = new THREE.Mesh(mainPawGeom, furMat);
mainPaw.scale.set(4, 1.5, 3);
mainPaw.position.y = 1.5;
mainPaw.position.z = 0.5;
mainPaw.castShadow = true;
catGroup.add(mainPaw);

// Hauptballen (Rosa, unten)
const mainPadGeom = new THREE.SphereGeometry(1.5, 32, 32);
const mainPad = new THREE.Mesh(mainPadGeom, padMat);
mainPad.scale.set(3.5, 0.8, 2.5);
mainPad.position.y = 0.5;
mainPad.position.z = 0.5;
mainPad.castShadow = true;
catGroup.add(mainPad);

// Zehenballen (3 Stück, rosa)
const toePadGeom = new THREE.SphereGeometry(1, 32, 32);

// Linker Zehballen
const toePadLeft = new THREE.Mesh(toePadGeom, padMat);
toePadLeft.scale.set(1, 0.6, 1.2);
toePadLeft.position.set(-1.8, 0.45, -1);
toePadLeft.castShadow = true;
catGroup.add(toePadLeft);

const toeFurLeft = new THREE.Mesh(toePadGeom, furMat);
toeFurLeft.scale.set(1.2, 0.8, 1.5);
toeFurLeft.position.set(-1.8, 0.9, -1);
toeFurLeft.castShadow = true;
catGroup.add(toeFurLeft);

// Rechter Zehballen
const toePadRight = new THREE.Mesh(toePadGeom, padMat);
toePadRight.scale.set(1, 0.6, 1.2);
toePadRight.position.set(1.8, 0.45, -1);
toePadRight.castShadow = true;
catGroup.add(toePadRight);

const toeFurRight = new THREE.Mesh(toePadGeom, furMat);
toeFurRight.scale.set(1.2, 0.8, 1.5);
toeFurRight.position.set(1.8, 0.9, -1);
toeFurRight.castShadow = true;
catGroup.add(toeFurRight);

// Mittlerer Zehballen (oben)
const toePadCenter = new THREE.Mesh(toePadGeom, padMat);
toePadCenter.scale.set(1.2, 0.7, 1.5);
toePadCenter.position.set(0, 0.5, -1.5);
toePadCenter.castShadow = true;
catGroup.add(toePadCenter);

const toeFurCenter = new THREE.Mesh(toePadGeom, furMat);
toeFurCenter.scale.set(1.5, 1, 2);
toeFurCenter.position.set(0, 1, -1.5);
toeFurCenter.castShadow = true;
catGroup.add(toeFurCenter);

scene.add(catGroup);

// Der Schatten der Katze
const shadowGeom = new THREE.PlaneGeometry(15, 200);
const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 });
const catShadow = new THREE.Mesh(shadowGeom, shadowMat);
catShadow.rotation.x = -Math.PI / 2;
catShadow.position.y = 0.05; 
scene.add(catShadow);

// --- Entities Spawner (Gleichbleibend) ---
function spawnEntity() {
    const trapChance = Math.min(0.05 + (level * 0.02), 0.3);
    const isTrap = Math.random() < trapChance;
    let object;

    if (isTrap) {
        object = new THREE.Group();
        object.userData = { type: 'trap' };

        const boardGeom = new THREE.BoxGeometry(2, 0.2, 3);
        const boardMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b }); 
        const board = new THREE.Mesh(boardGeom, boardMat);
        board.position.y = 0.1;
        board.castShadow = true;
        object.add(board);

        const snapperGroup = new THREE.Group();
        snapperGroup.position.set(0, 0.2, -1.2); 
        
        const wireGeom = new THREE.BoxGeometry(1.8, 0.1, 2.4);
        const wireMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa }); 
        const wire = new THREE.Mesh(wireGeom, wireMat);
        wire.position.set(0, 0, 1.2); 
        wire.castShadow = true;
        
        snapperGroup.add(wire);
        snapperGroup.rotation.x = -Math.PI / 1.1; 
        
        object.add(snapperGroup);
        object.userData.snapper = snapperGroup; 
    } 
    else {
        const availableTypes = Math.min(level, 4);
        const cheeseType = Math.floor(Math.random() * availableTypes);

        if (cheeseType === 0) {
            const geom = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
            const mat = new THREE.MeshStandardMaterial({ color: 0xFFFF00 }); 
            object = new THREE.Mesh(geom, mat);
            object.rotation.x = Math.PI / 2; 
        } 
        else if (cheeseType === 1) {
            const geom = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 3);
            const mat = new THREE.MeshStandardMaterial({ color: 0xFAD02C }); 
            object = new THREE.Mesh(geom, mat);
            object.rotation.x = Math.PI / 2;
        }
        else if (cheeseType === 2) {
            const geom = new THREE.SphereGeometry(0.35, 16, 16);
            const mat = new THREE.MeshStandardMaterial({ color: 0xE74C3C }); 
            object = new THREE.Mesh(geom, mat);
            object.scale.set(1, 0.6, 1); 
        }
        else {
            const geom = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);
            const mat = new THREE.MeshStandardMaterial({ color: 0xF5F5F5 }); 
            object = new THREE.Mesh(geom, mat);
            object.rotation.x = Math.PI / 2;
        }
        object.userData = { type: 'cheese' };
    }
    
    // Spawnt dynamisch im sichtbaren Bereich
    const randomX = (Math.random() - 0.5) * (horizontalLimit * 2);
    const yPos = object.userData.type === 'cheese' && object.geometry.type === 'SphereGeometry' ? 0.3 : 0.5; 
    
    if(object.userData.type === 'trap') object.position.set(randomX, 0, -60);
    else object.position.set(randomX, yPos, -60); 
    
    object.castShadow = true;
    scene.add(object);
    entities.push(object);
}

// --- Hauptschleife (Animations & Logik Update) ---
function animate() {
    requestAnimationFrame(animate);

    if (gameState === STATE_START) {
        startAngle += 0.05;
        const radius = 3;
        mouseGroup.position.x = Math.cos(startAngle) * radius;
        mouseGroup.position.z = Math.sin(startAngle) * radius;
        mouseGroup.rotation.y = -startAngle + Math.PI; 
        
        camera.lookAt(0, 0, 0);

    } else if (gameState === STATE_TRANSITION) {
        mouseGroup.position.lerp(new THREE.Vector3(0, 0, 0), 0.1);
        
        const targetRotation = new THREE.Euler(0, 0, 0);
        const currentQuat = new THREE.Quaternion().setFromEuler(mouseGroup.rotation);
        const targetQuat = new THREE.Quaternion().setFromEuler(targetRotation);
        currentQuat.slerp(targetQuat, 0.1);
        mouseGroup.rotation.setFromQuaternion(currentQuat);

        camera.position.lerp(defaultCameraPos, 0.05);
        camera.lookAt(0, 1, 0);

        if (mouseGroup.position.length() < 0.1 && camera.position.distanceTo(defaultCameraPos) < 0.2) {
            mouseGroup.position.set(0, 0, 0);
            mouseGroup.rotation.set(0, 0, 0);
            camera.position.copy(defaultCameraPos);
            
            gameState = STATE_PLAYING;
            uiContainer.style.display = 'block';
            if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
                touchHint.style.display = 'block';
            }
        }

    } else if (gameState === STATE_PLAYING) {
        const currentPlayerSpeed = 0.35 + (score * 0.002);

        // Limit-Check
        if (moveLeft && mouseGroup.position.x > -horizontalLimit) mouseGroup.position.x -= currentPlayerSpeed;
        if (moveRight && mouseGroup.position.x < horizontalLimit) mouseGroup.position.x += currentPlayerSpeed;

        spawnTimer++;
        const currentSpawnRate = Math.max(15, 70 - (score * 1.5));

        if (spawnTimer > currentSpawnRate) { 
            spawnEntity();
            spawnTimer = 0;
        }

        const playerBox = new THREE.Box3().setFromObject(mouseGroup);
        const currentSpeed = 0.25 + (score * 0.008);

        for (let i = entities.length - 1; i >= 0; i--) {
            const entity = entities[i];
            entity.position.z += currentSpeed; 

            const entityBox = new THREE.Box3().setFromObject(entity);

            if (playerBox.intersectsBox(entityBox)) {
                
                if (entity.userData.type === 'cheese') {
                    scene.remove(entity); 
                    entities.splice(i, 1); 
                    
                    score++; 
                    scoreElement.innerText = score;

                    const newLevel = Math.floor(score / 5) + 1;
                    if (newLevel > level) {
                        level = newLevel;
                        levelElement.innerText = level;
                    }

                    const fatness = Math.min(1 + (score * 0.05), 3);
                    const height = Math.min(1 + (score * 0.02), 1.5); 
                    body.scale.set(fatness, height, 2);
                } 
                else if (entity.userData.type === 'trap') {
                    gameState = STATE_CUTSCENE;
                    hitTrap = entity;
                    hitTrap.position.x = mouseGroup.position.x;
                    hitTrap.position.z = mouseGroup.position.z;
                    
                    moveLeft = false;
                    moveRight = false;
                    isPointerDown = false;
                    touchHint.style.display = 'none';
                }
                continue; 
            }

            if (entity.position.z > 15) {
                scene.remove(entity);
                entities.splice(i, 1);
            }
        }

        if (score >= 5) {
            if (catState === 0) {
                if (Math.random() < 0.002 + (score * 0.0001)) {
                    catState = 1;
                    catSide = Math.random() > 0.5 ? 1 : -1;
                    catTimer = 0;
                    
                    const catDropX = catSide * (horizontalLimit / 2 + 1.5);
                    catShadow.position.x = catDropX; 
                    catGroup.position.set(catDropX, 30, 0); 
                }
            } else if (catState === 1) {
                catTimer++;
                catShadow.material.opacity = Math.min(0.6, catTimer / 50); 
                
                const warningDuration = Math.max(40, 100 - (score * 1.5));
                if (catTimer > warningDuration) {
                    catState = 2; 
                }
            } else if (catState === 2) {
                catGroup.position.y -= 2.5; 
                if (catGroup.position.y <= 0) {
                    catGroup.position.y = 0;
                    catState = 3;
                    catTimer = 0;
                    shakeTimer = 15; // Wackeleffekt starten (GRAFISCH)
                    
                    if ((catSide === -1 && mouseGroup.position.x < 0) || 
                        (catSide === 1 && mouseGroup.position.x > 0)) {
                        
                        gameState = STATE_GAMEOVER;
                        finalScoreElement.innerText = score;
                        gameOverOverlay.style.display = 'flex';
                        touchHint.style.display = 'none';
                        
                        // Maus optisch plattwalzen
                        mouseGroup.scale.set(1.5, 0.1, 1.5);
                    }
                }
            } else if (catState === 3) {
                catTimer++;
                if (catTimer > 30) {
                    catState = 4;
                }
            } else if (catState === 4) {
                catGroup.position.y += 0.8;
                catShadow.material.opacity -= 0.03;
                if (catGroup.position.y > 30) {
                    catState = 0;
                    catShadow.material.opacity = 0;
                }
            }
        }

    } else if (gameState === STATE_CUTSCENE) {
        const targetCamPos = new THREE.Vector3(mouseGroup.position.x, 3, mouseGroup.position.z + 5);
        camera.position.lerp(targetCamPos, 0.05);
        camera.lookAt(mouseGroup.position);

        if (hitTrap.userData.snapper.rotation.x < 0) {
            hitTrap.userData.snapper.rotation.x += 0.3; 
        } else {
            gameState = STATE_GAMEOVER;
            finalScoreElement.innerText = score;
            gameOverOverlay.style.display = 'flex';
        }
    }

    // --- SCREEN SHAKE (Wackelkamera Effekt) ---
    if (shakeTimer > 0) {
        camera.position.x = defaultCameraPos.x + (Math.random() - 0.5) * 1.5;
        camera.position.y = defaultCameraPos.y + (Math.random() - 0.5) * 1.5;
        shakeTimer--;
    } else if (gameState === STATE_PLAYING && shakeTimer === 0) {
        camera.position.lerp(defaultCameraPos, 0.1);
    }

    renderer.render(scene, camera);
}

// --- Neustart ---
// Steuerung Events
document.addEventListener('keydown', (e) => {
    if(gameState !== STATE_PLAYING) return;
    const key = e.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') moveLeft = true;
    if (key === 'arrowright' || key === 'd') moveRight = true;
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') moveLeft = false;
    if (key === 'arrowright' || key === 'd') moveRight = false;
});

function updateMovementDirection(clientX) {
    if(gameState !== STATE_PLAYING) return;
    const screenWidth = window.innerWidth;
    if (clientX < screenWidth / 2) {
        moveLeft = true;
        moveRight = false;
    } else {
        moveRight = true;
        moveLeft = false;
    }
}

// Start-Interaktion
startOverlay.addEventListener('click', () => {
    if (gameState === STATE_START) {
        gameState = STATE_TRANSITION;
        startOverlay.style.display = 'none';
    }
});

restartBtn.addEventListener('click', () => {
    gameState = STATE_PLAYING; 
    hitTrap = null;
    score = 0;
    level = 1;
    spawnTimer = 0;
    
    // Katzenstatus zurücksetzen
    catState = 0;
    catTimer = 0;
    shakeTimer = 0;
    catGroup.position.y = 30;
    catShadow.material.opacity = 0;
    
    scoreElement.innerText = score;
    levelElement.innerText = level;
    gameOverOverlay.style.display = 'none'; 
    
    mouseGroup.position.set(0, 0, 0);
    mouseGroup.scale.set(1, 1, 1); // Plattgewalzt-Effekt aufheben
    body.scale.set(1, 1, 2);

    camera.position.copy(defaultCameraPos);
    camera.lookAt(0, 1, 0);

    entities.forEach(entity => scene.remove(entity));
    entities = [];
});

animate();

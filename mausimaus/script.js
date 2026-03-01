// Timestamp: 2026-03-01 09:10:00 CET

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); 
scene.fog = new THREE.Fog(0x87CEEB, 20, 100); 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Standard-Position fürs Spielen
const defaultCameraPos = new THREE.Vector3(0, 6, 12);
// Start-Position fürs Menü (etwas weiter oben)
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
let gameSpeed = 0.25;
let spawnTimer = 0;
let hitTrap = null; 

// Startmenü-Animation
let startAngle = 0;

// Beleuchtung
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); 
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

// Boden
const groundGeometry = new THREE.PlaneGeometry(30, 200);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 }); 
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; 
ground.receiveShadow = true; 
scene.add(ground);

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

// --- Steuerung ---
let moveLeft = false;
let moveRight = false;
let isPointerDown = false;
const playerSpeed = 0.35; 

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

// Steuerung Events
document.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.id === 'startOverlay') return; 
    isPointerDown = true;
    if(gameState === STATE_PLAYING) touchHint.style.display = 'none';
    updateMovementDirection(e.clientX);
});

document.addEventListener('mousemove', (e) => {
    if (isPointerDown) updateMovementDirection(e.clientX);
});

document.addEventListener('mouseup', () => {
    isPointerDown = false;
    moveLeft = false;
    moveRight = false;
});

document.addEventListener('touchstart', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.id === 'startOverlay') return;
    isPointerDown = true;
    if(gameState === STATE_PLAYING) touchHint.style.display = 'none'; 
    updateMovementDirection(e.touches[0].clientX);
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (isPointerDown) updateMovementDirection(e.touches[0].clientX);
}, { passive: false });

document.addEventListener('touchend', (e) => {
    if (e.touches.length === 0) { 
        isPointerDown = false;
        moveLeft = false;
        moveRight = false;
    } else {
        updateMovementDirection(e.touches[0].clientX);
    }
});

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// --- Entities Spawner ---
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
            object = new Mesh(geom, mat);
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
    
    const randomX = (Math.random() - 0.5) * 28;
    const yPos = object.userData.type === 'cheese' && object.geometry.type === 'SphereGeometry' ? 0.3 : 0.5; 
    
    if(object.userData.type === 'trap') object.position.set(randomX, 0, -60);
    else object.position.set(randomX, yPos, -60); 
    
    object.castShadow = true;
    scene.add(object);
    entities.push(object);
}

// --- Hauptschleife ---
function animate() {
    requestAnimationFrame(animate);

    if (gameState === STATE_START) {
        // Maus rennt im Kreis
        startAngle += 0.05;
        const radius = 3;
        mouseGroup.position.x = Math.cos(startAngle) * radius;
        mouseGroup.position.z = Math.sin(startAngle) * radius;
        // Die Maus schaut immer in Laufrichtung (-startAngle passt die Drehung an)
        mouseGroup.rotation.y = -startAngle + Math.PI; 
        
        camera.lookAt(0, 0, 0);

    } else if (gameState === STATE_TRANSITION) {
        // Fließender Übergang ins Spiel
        mouseGroup.position.lerp(new THREE.Vector3(0, 0, 0), 0.1);
        
        // Drehung sanft auf 0 setzen (nach vorne schauen)
        const targetRotation = new THREE.Euler(0, 0, 0);
        const currentQuat = new THREE.Quaternion().setFromEuler(mouseGroup.rotation);
        const targetQuat = new THREE.Quaternion().setFromEuler(targetRotation);
        currentQuat.slerp(targetQuat, 0.1);
        mouseGroup.rotation.setFromQuaternion(currentQuat);

        // Kamera fahrt in Position
        camera.position.lerp(defaultCameraPos, 0.05);
        camera.lookAt(0, 1, 0);

        // Wenn Maus und Kamera ungefähr in Position sind -> Spiel starten
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
        // Normales Spiel
        if (moveLeft && mouseGroup.position.x > -14) mouseGroup.position.x -= playerSpeed;
        if (moveRight && mouseGroup.position.x < 14) mouseGroup.position.x += playerSpeed;

        spawnTimer++;
        const currentSpawnRate = Math.max(20, 70 - (level * 4)); 

        if (spawnTimer > currentSpawnRate) { 
            spawnEntity();
            spawnTimer = 0;
        }

        const playerBox = new THREE.Box3().setFromObject(mouseGroup);
        const currentSpeed = gameSpeed + (level * 0.02);

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

    } else if (gameState === STATE_CUTSCENE) {
        // Cutscene
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

    renderer.render(scene, camera);
}

// --- Neustart ---
restartBtn.addEventListener('click', () => {
    gameState = STATE_PLAYING; 
    hitTrap = null;
    score = 0;
    level = 1;
    gameSpeed = 0.25;
    spawnTimer = 0;
    
    scoreElement.innerText = score;
    levelElement.innerText = level;
    gameOverOverlay.style.display = 'none'; 
    
    mouseGroup.position.set(0, 0, 0);
    body.scale.set(1, 1, 2);

    camera.position.copy(defaultCameraPos);
    camera.lookAt(0, 1, 0);

    entities.forEach(entity => scene.remove(entity));
    entities = [];
});

animate();

// Timestamp: 2026-03-01 08:58:00 CET

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); 
scene.fog = new THREE.Fog(0x87CEEB, 20, 100); 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 6, 12);
camera.lookAt(0, 1, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; 
renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
document.body.appendChild(renderer.domElement);

const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const restartBtn = document.getElementById('restartBtn');
const gameOverText = document.getElementById('gameOverText');
const touchHint = document.getElementById('touch-hint');

let isGameOver = false;
let score = 0;
let level = 1;
let collectibles = [];
let traps = [];
let speedMultiplier = 0.25;
let spawnTimer = 0;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
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

const groundGeometry = new THREE.PlaneGeometry(30, 200);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 1.0 }); 
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; 
ground.receiveShadow = true; 
scene.add(ground);

// --- Die Maus ---
const mouseGroup = new THREE.Group();

const bodyGeom = new THREE.SphereGeometry(0.5, 16, 16);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 }); 
const body = new THREE.Mesh(bodyGeom, bodyMat);
body.scale.set(1, 1, 2); 
body.position.y = 0.5;
body.castShadow = true;
mouseGroup.add(body);

const headGeom = new THREE.SphereGeometry(0.4, 16, 16);
const headMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
const head = new THREE.Mesh(headGeom, headMat);
head.position.set(0, 0.6, -0.8); 
head.castShadow = true;
mouseGroup.add(head);

const earGeom = new THREE.CircleGeometry(0.3, 32);
const earMat = new THREE.MeshStandardMaterial({ color: 0x888888, side: THREE.DoubleSide, roughness: 0.9 });
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
const noseMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.4 });
const nose = new THREE.Mesh(noseGeom, noseMat);
nose.position.set(0, 0.6, -1.15);
nose.castShadow = true;
mouseGroup.add(nose);

const eyeGeom = new THREE.SphereGeometry(0.05, 8, 8);
const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.2 });
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
    const key = e.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') moveLeft = true;
    if (key === 'arrowright' || key === 'd') moveRight = true;
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') moveLeft = false;
    if (key === 'arrowright' || key === 'd') moveRight = false;
});

if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    touchHint.style.display = 'block'; 
}

function updateMovementDirection(clientX) {
    if (isGameOver) return;
    const screenWidth = window.innerWidth;
    if (clientX < screenWidth / 2) {
        moveLeft = true;
        moveRight = false;
    } else {
        moveRight = true;
        moveLeft = false;
    }
}

document.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON') return; 
    isPointerDown = true;
    touchHint.style.display = 'none';
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

document.addEventListener('mouseleave', () => {
    isPointerDown = false;
    moveLeft = false;
    moveRight = false;
});

document.addEventListener('touchstart', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    isPointerDown = true;
    touchHint.style.display = 'none'; 
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

document.addEventListener('touchcancel', () => {
    isPointerDown = false;
    moveLeft = false;
    moveRight = false;
});

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// --- Schöner Käse Spawner ---
function spawnCheese() {
    let cheeseMesh;
    const availableTypes = Math.min(level, 4);
    const cheeseType = Math.floor(Math.random() * availableTypes);

    // Käse-Gruppe für Hover-Animation
    const cheeseGroup = new THREE.Group();
    cheeseGroup.userData = { 
        hoverOffset: Math.random() * Math.PI * 2,
        rotSpeedX: (Math.random() - 0.5) * 0.04,
        rotSpeedY: (Math.random() - 0.5) * 0.04 + 0.02
    };

    if (cheeseType === 0) {
        // Gouda
        const geom = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
        const mat = new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.3, metalness: 0.1 }); 
        cheeseMesh = new THREE.Mesh(geom, mat);
    } 
    else if (cheeseType === 1) {
        // Emmentaler
        const geom = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 3);
        const mat = new THREE.MeshStandardMaterial({ color: 0xFAD02C, roughness: 0.4 }); 
        cheeseMesh = new THREE.Mesh(geom, mat);
    }
    else if (cheeseType === 2) {
        // Babybel
        const geom = new THREE.SphereGeometry(0.4, 16, 16);
        const mat = new THREE.MeshStandardMaterial({ color: 0xE74C3C, roughness: 0.1, metalness: 0.2 }); 
        cheeseMesh = new THREE.Mesh(geom, mat);
        cheeseMesh.scale.set(1, 0.6, 1); 
    }
    else {
        // Camembert
        const geom = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
        const mat = new THREE.MeshStandardMaterial({ color: 0xFFFAF0, roughness: 0.8 }); 
        cheeseMesh = new THREE.Mesh(geom, mat);
    }
    
    cheeseMesh.castShadow = true;
    cheeseGroup.add(cheeseMesh);

    const randomX = (Math.random() - 0.5) * 28;
    cheeseGroup.position.set(randomX, 0.8, -80); 
    
    scene.add(cheeseGroup);
    collectibles.push(cheeseGroup);
}

// --- Mausefallen Spawner ---
function spawnTrap() {
    const trapGroup = new THREE.Group();
    
    // Holzbrett
    const baseGeom = new THREE.BoxGeometry(1.8, 0.1, 2.2);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = 0.05;
    base.castShadow = true;
    base.receiveShadow = true;
    trapGroup.add(base);

    // Metallbügel
    const wireGeom = new THREE.BoxGeometry(1.6, 0.05, 1.0);
    const wireMat = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, metalness: 0.8, roughness: 0.2 });
    const wire = new THREE.Mesh(wireGeom, wireMat);
    wire.position.set(0, 0.1, -0.4);
    wire.castShadow = true;
    trapGroup.add(wire);

    // Feder/Auslöser in der Mitte (Rot)
    const triggerGeom = new THREE.BoxGeometry(0.3, 0.08, 0.3);
    const triggerMat = new THREE.MeshStandardMaterial({ color: 0x8B0000 });
    const trigger = new THREE.Mesh(triggerGeom, triggerMat);
    trigger.position.set(0, 0.1, 0.2);
    trapGroup.add(trigger);

    const randomX = (Math.random() - 0.5) * 28;
    trapGroup.position.set(randomX, 0, -80);
    
    scene.add(trapGroup);
    traps.push(trapGroup);
}

// --- Hauptschleife ---
function animate() {
    if (isGameOver) return; 
    
    requestAnimationFrame(animate);

    if (moveLeft && mouseGroup.position.x > -14) mouseGroup.position.x -= playerSpeed;
    if (moveRight && mouseGroup.position.x < 14) mouseGroup.position.x += playerSpeed;

    spawnTimer++;
    const currentSpawnRate = Math.max(15, 60 - (level * 3)); 

    if (spawnTimer > currentSpawnRate) { 
        // 20% Chance für eine Falle, steigt mit dem Level leicht an
        const trapChance = 0.15 + (level * 0.02);
        if (Math.random() < trapChance) {
            spawnTrap();
        } else {
            spawnCheese();
        }
        spawnTimer = 0;
    }

    const playerBox = new THREE.Box3().setFromObject(mouseGroup);
    const currentSpeed = speedMultiplier + (level * 0.02);

    // Käse updaten
    for (let i = collectibles.length - 1; i >= 0; i--) {
        const cheese = collectibles[i];
        
        cheese.position.z += currentSpeed; 
        
        // Schwebende und drehende Animation
        cheese.children[0].rotation.x += cheese.userData.rotSpeedX;
        cheese.children[0].rotation.y += cheese.userData.rotSpeedY;
        cheese.position.y = 0.8 + Math.sin(Date.now() * 0.005 + cheese.userData.hoverOffset) * 0.2;

        const cheeseBox = new THREE.Box3().setFromObject(cheese);

        if (playerBox.intersectsBox(cheeseBox)) {
            scene.remove(cheese); 
            collectibles.splice(i, 1); 
            
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

            continue; 
        }

        if (cheese.position.z > 15) {
            scene.remove(cheese);
            collectibles.splice(i, 1);
        }
    }

    // Fallen updaten
    for (let i = traps.length - 1; i >= 0; i--) {
        const trap = traps[i];
        trap.position.z += currentSpeed;

        // Etwas kleinere Kollisionsbox für die Falle, damit man knapp ausweichen kann
        const trapBox = new THREE.Box3().setFromObject(trap);
        trapBox.expandByScalar(-0.1); 

        if (playerBox.intersectsBox(trapBox)) {
            isGameOver = true;
            gameOverText.style.display = 'block';
            restartBtn.style.display = 'inline-block';
            moveLeft = false;
            moveRight = false;
            return; 
        }

        if (trap.position.z > 15) {
            scene.remove(trap);
            traps.splice(i, 1);
        }
    }

    renderer.render(scene, camera);
}

restartBtn.addEventListener('click', () => {
    isGameOver = false; 
    score = 0;
    level = 1;
    speedMultiplier = 0.25;
    spawnTimer = 0;
    
    scoreElement.innerText = score;
    levelElement.innerText = level;
    gameOverText.style.display = 'none';
    restartBtn.style.display = 'none'; 
    mouseGroup.position.x = 0;
    
    body.scale.set(1, 1, 2);

    collectibles.forEach(cheese => scene.remove(cheese));
    collectibles = [];

    traps.forEach(trap => scene.remove(trap));
    traps = [];

    animate();
});

animate();

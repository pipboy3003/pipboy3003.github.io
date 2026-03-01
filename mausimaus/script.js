// Timestamp: 2026-03-01 08:43:39 CET

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
const restartBtn = document.getElementById('restartBtn');
const touchHint = document.getElementById('touch-hint');

let isGameOver = false;
let score = 0;
let collectibles = [];
let collectibleSpeed = 0.25;
let spawnTimer = 0;

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

const groundGeometry = new THREE.PlaneGeometry(30, 200);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 }); 
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; 
ground.receiveShadow = true; 
scene.add(ground);

// --- Die Maus ---
const mouseGroup = new THREE.Group();

// Körper (Kugel, die in die Länge gestreckt wird - garantiert fehlerfrei)
const bodyGeom = new THREE.SphereGeometry(0.5, 16, 16);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x888888 }); 
const body = new THREE.Mesh(bodyGeom, bodyMat);
body.scale.set(1, 1, 2); // Streckt die Kugel auf der Z-Achse
body.position.y = 0.5;
body.castShadow = true;
mouseGroup.add(body);

// Kopf
const headGeom = new THREE.SphereGeometry(0.4, 16, 16);
const headMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
const head = new THREE.Mesh(headGeom, headMat);
head.position.set(0, 0.6, -0.8); // Vorne anbringen
head.castShadow = true;
mouseGroup.add(head);

// Ohren
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

// Nase
const noseGeom = new THREE.SphereGeometry(0.08, 8, 8);
const noseMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
const nose = new THREE.Mesh(noseGeom, noseMat);
nose.position.set(0, 0.6, -1.15);
nose.castShadow = true;
mouseGroup.add(nose);

// Augen
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

// Schwanz
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

document.addEventListener('touchstart', (e) => {
    touchHint.style.display = 'none'; 
    const touchX = e.touches[0].clientX;
    const screenWidth = window.innerWidth;
    
    if (touchX < screenWidth / 2) {
        moveLeft = true;
        moveRight = false;
    } else {
        moveRight = true;
        moveLeft = false;
    }
});

document.addEventListener('touchend', (e) => {
    if (e.touches.length === 0) { 
        moveLeft = false;
        moveRight = false;
    }
});

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// --- Käse Spawner ---
function spawnCheese() {
    const cheeseGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xFFFF00 }); 
    const cheese = new THREE.Mesh(cheeseGeom, cheeseMat);
    cheese.rotation.x = Math.PI / 2; 
    
    const randomX = (Math.random() - 0.5) * 28;
    cheese.position.set(randomX, 0.5, -60); 
    cheese.castShadow = true;
    
    scene.add(cheese);
    collectibles.push(cheese);
}

// --- Hauptschleife ---
function animate() {
    if (isGameOver) return; 
    
    requestAnimationFrame(animate);

    if (moveLeft && mouseGroup.position.x > -14) mouseGroup.position.x -= playerSpeed;
    if (moveRight && mouseGroup.position.x < 14) mouseGroup.position.x += playerSpeed;

    spawnTimer++;
    if (spawnTimer > 70) { 
        spawnCheese();
        spawnTimer = 0;
        collectibleSpeed += 0.001; 
    }

    const playerBox = new THREE.Box3().setFromObject(mouseGroup);

    for (let i = collectibles.length - 1; i >= 0; i--) {
        const cheese = collectibles[i];
        cheese.position.z += collectibleSpeed; 

        const cheeseBox = new THREE.Box3().setFromObject(cheese);

        if (playerBox.intersectsBox(cheeseBox)) {
            scene.remove(cheese); 
            collectibles.splice(i, 1); 
            score++; 
            scoreElement.innerText = score;
            continue; 
        }

        if (cheese.position.z > 15) {
            scene.remove(cheese);
            collectibles.splice(i, 1);
        }
    }

    renderer.render(scene, camera);
}

restartBtn.addEventListener('click', () => {
    isGameOver = false; 
    score = 0;
    collectibleSpeed = 0.25;
    spawnTimer = 0;
    scoreElement.innerText = score;
    restartBtn.style.display = 'none'; 
    mouseGroup.position.x = 0;

    collectibles.forEach(cheese => scene.remove(cheese));
    collectibles = [];

    animate();
});

animate();

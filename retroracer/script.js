// Timestamp: 2026-03-01 08:33:38 CET

// --- Setup Three.js ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Himmelblau
scene.fog = new THREE.Fog(0x87CEEB, 20, 100); // Nebel für Tiefeneffekt

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Kamera leicht erhöht hinter der Maus platzieren
camera.position.set(0, 6, 12);
camera.lookAt(0, 1, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Schatten aktivieren
renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
document.body.appendChild(renderer.domElement);

// --- UI Elemente ---
const scoreElement = document.getElementById('score');
const restartBtn = document.getElementById('restartBtn');
const touchHint = document.getElementById('touch-hint');

// --- Spielvariablen ---
let isGameOver = false;
let score = 0;
let collectibles = [];
let collectibleSpeed = 0.25;
let spawnTimer = 0;

// --- Licht & Schatten ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Etwas heller
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

// --- Die Wiese (Boden) ---
const groundGeometry = new THREE.PlaneGeometry(30, 200);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 }); // Grün
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; 
ground.receiveShadow = true; 
scene.add(ground);

// --- Die Maus (Unser Spieler) ---
const mouseGroup = new THREE.Group();

// Körper
const bodyGeom = new THREE.CapsuleGeometry(0.5, 1.5, 10, 20);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x888888 }); // Grau
const body = new THREE.Mesh(bodyGeom, bodyMat);
body.rotation.z = Math.PI / 2;
body.position.y = 0.5;
body.castShadow = true;
mouseGroup.add(body);

// Kopf
const headGeom = new THREE.SphereGeometry(0.4, 16, 16);
const headMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
const head = new THREE.Mesh(headGeom, headMat);
head.position.set(0.8, 0.6, 0);
head.castShadow = true;
mouseGroup.add(head);

// Ohren (Kreisscheiben)
const earGeom = new THREE.CircleGeometry(0.3, 32);
const earMat = new THREE.MeshStandardMaterial({ color: 0x888888, side: THREE.DoubleSide });
const leftEar = new THREE.Mesh(earGeom, earMat);
leftEar.position.set(0.6, 0.9, -0.3);
leftEar.rotation.y = -Math.PI / 4;
leftEar.castShadow = true;
mouseGroup.add(leftEar);
const rightEar = new THREE.Mesh(earGeom, earMat);
rightEar.position.set(0.6, 0.9, 0.3);
rightEar.rotation.y = Math.PI / 4;
rightEar.castShadow = true;
mouseGroup.add(rightEar);

// Nase (kleine Kugel)
const noseGeom = new THREE.SphereGeometry(0.08, 8, 8);
const noseMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
const nose = new THREE.Mesh(noseGeom, noseMat);
nose.position.set(1.15, 0.6, 0);
nose.castShadow = true;
mouseGroup.add(nose);

// Augen (kleine Kugeln)
const eyeGeom = new THREE.SphereGeometry(0.05, 8, 8);
const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
leftEye.position.set(0.9, 0.7, -0.15);
leftEye.castShadow = true;
mouseGroup.add(leftEye);
const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
rightEye.position.set(0.9, 0.7, 0.15);
rightEye.castShadow = true;
mouseGroup.add(rightEye);

// Schwanz (dünner Zylinder)
const tailGeom = new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8);
const tailMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
const tail = new THREE.Mesh(tailGeom, tailMat);
tail.position.set(-0.8, 0.4, 0);
tail.rotation.z = -Math.PI / 6;
tail.castShadow = true;
mouseGroup.add(tail);

scene.add(mouseGroup);

// --- Steuerung (Tastatur & Touch) ---
let moveLeft = false;
let moveRight = false;
const playerSpeed = 0.35; // Maus ist etwas flinker

// Tastatur: WASD und Pfeiltasten
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

// Touch-Erkennung & Steuerung
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    touchHint.style.display = 'block'; // Mobile Hinweis anzeigen
}

document.addEventListener('touchstart', (e) => {
    touchHint.style.display = 'none'; // Hinweis beim ersten Tippen verstecken
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
    if (e.touches.length === 0) { // Wenn kein Finger mehr auf dem Bildschirm
        moveLeft = false;
        moveRight = false;
    }
});

// Bei Fenstergrößenänderung Kamera anpassen
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// --- Käse Spawner ---
function spawnCheese() {
    // Käse (gelber Zylinder)
    const cheeseGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xFFFF00 }); // Gelb
    const cheese = new THREE.Mesh(cheeseGeom, cheeseMat);
    cheese.rotation.x = Math.PI / 2; // Auf die Kante legen
    
    // Zufällige Position auf der Wiese (X zwischen -14 und 14)
    const randomX = (Math.random() - 0.5) * 28;
    cheese.position.set(randomX, 0.5, -60); // Weit hinten spawnen
    cheese.castShadow = true;
    
    scene.add(cheese);
    collectibles.push(cheese);
}

// --- Hauptschleife (Animation Loop) ---
function animate() {
    if (isGameOver) return; // Nicht zutreffend in dieser Version, aber gute Praxis
    
    requestAnimationFrame(animate);

    // Mausbewegung
    if (moveLeft && mouseGroup.position.x > -14) mouseGroup.position.x -= playerSpeed;
    if (moveRight && mouseGroup.position.x < 14) mouseGroup.position.x += playerSpeed;

    // Käse spawnen
    spawnTimer++;
    if (spawnTimer > 70) { // Ca. alle 1.1 Sekunden
        spawnCheese();
        spawnTimer = 0;
        collectibleSpeed += 0.001; // Käse wird langsam schneller
    }

    // Maus-Kollisionsbox (Rechteck um die Mausgruppe)
    const playerBox = new THREE.Box3().setFromObject(mouseGroup);

    // Käse bewegen und Sammeln prüfen
    for (let i = collectibles.length - 1; i >= 0; i--) {
        const cheese = collectibles[i];
        cheese.position.z += collectibleSpeed; // Auf uns zu kommen

        // Käse-Kollisionsbox
        const cheeseBox = new THREE.Box3().setFromObject(cheese);

        // Sammeln (Kollision)?
        if (playerBox.intersectsBox(cheeseBox)) {
            scene.remove(cheese); // Käse aus Szene entfernen
            collectibles.splice(i, 1); // Käse aus Array entfernen
            score++; // Punktzahl erhöhen
            scoreElement.innerText = score;
            continue; // Nächster Käse
        }

        // Käse hinter der Kamera löschen
        if (cheese.position.z > 15) {
            scene.remove(cheese);
            collectibles.splice(i, 1);
        }
    }

    renderer.render(scene, camera);
}

// --- Spiel-Neustart (behält diese Version bei, setzt aber nur Score zurück) ---
restartBtn.addEventListener('click', () => {
    isGameOver = false; // Nicht genutzt
    score = 0;
    collectibleSpeed = 0.25;
    spawnTimer = 0;
    scoreElement.innerText = score;
    restartBtn.style.display = 'none'; // Sollte nie erscheinen
    mouseGroup.position.x = 0;

    // Alle alten Käse löschen
    collectibles.forEach(cheese => scene.remove(cheese));
    collectibles = [];

    animate();
});

// Spiel starten
animate();

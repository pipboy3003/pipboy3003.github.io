// Timestamp: 2026-03-01 08:16:25 CET

// --- Setup Three.js ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Himmelblau
scene.fog = new THREE.Fog(0x87CEEB, 20, 100); // Nebel für schönen Tiefeneffekt

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Kamera leicht erhöht hinter dem Spieler platzieren
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Schatten aktivieren!
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Weiche Schatten
document.body.appendChild(renderer.domElement);

// --- UI Elemente ---
const scoreElement = document.getElementById('score');
const restartBtn = document.getElementById('restartBtn');

// --- Spielvariablen ---
let isGameOver = false;
let score = 0;
let enemies = [];
let enemySpeed = 0.2;
let spawnTimer = 0;

// --- Licht & Schatten ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // Grundhelligkeit
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true; // Die Sonne wirft Schatten
dirLight.shadow.mapSize.width = 2048; // Höhere Schattenauflösung
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 50;
dirLight.shadow.camera.left = -15;
dirLight.shadow.camera.right = 15;
dirLight.shadow.camera.top = 15;
dirLight.shadow.camera.bottom = -15;
scene.add(dirLight);

// --- Die Straße (Boden) ---
const roadGeometry = new THREE.PlaneGeometry(30, 200);
const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.rotation.x = -Math.PI / 2; // Boden flach hinlegen
road.receiveShadow = true; // Der Boden empfängt Schatten
scene.add(road);

// --- Der Spieler (Unser Auto) ---
const playerGeometry = new THREE.BoxGeometry(2, 1, 4);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x3498db }); // Blau
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = 0.5; // Auf den Boden setzen
player.castShadow = true; // Unser Auto wirft Schatten
scene.add(player);

// --- Steuerung ---
let moveLeft = false;
let moveRight = false;
const playerSpeed = 0.3;

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') moveLeft = true;
    if (e.key === 'ArrowRight' || e.key === 'd') moveRight = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') moveLeft = false;
    if (e.key === 'ArrowRight' || e.key === 'd') moveRight = false;
});

// Bei Fenstergrößenänderung Kamera anpassen
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// --- Gegner Spawner ---
function spawnEnemy() {
    const enemyGeom = new THREE.BoxGeometry(2, 1, 4);
    const enemyMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c }); // Rot
    const enemy = new THREE.Mesh(enemyGeom, enemyMat);
    
    // Zufällige Position auf der Straße (X zwischen -10 und 10)
    const randomX = (Math.random() - 0.5) * 20;
    enemy.position.set(randomX, 0.5, -60); // Weit hinten spawnen
    enemy.castShadow = true;
    
    scene.add(enemy);
    enemies.push(enemy);
}

// --- Hauptschleife (Animation Loop) ---
function animate() {
    if (isGameOver) return;
    
    requestAnimationFrame(animate);

    // Spielerbewegung
    if (moveLeft && player.position.x > -14) player.position.x -= playerSpeed;
    if (moveRight && player.position.x < 14) player.position.x += playerSpeed;

    // Gegner spawnen
    spawnTimer++;
    if (spawnTimer > 60) { // Ca. jede Sekunde
        spawnEnemy();
        spawnTimer = 0;
        enemySpeed += 0.002; // Spiel wird langsam schneller
    }

    // Gegner bewegen und Kollision prüfen
    // Wir nutzen THREE.Box3 für präzise 3D-Kollisionsabfrage
    const playerBox = new THREE.Box3().setFromObject(player);

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.position.z += enemySpeed; // Auf uns zu fahren

        const enemyBox = new THREE.Box3().setFromObject(enemy);

        // Kollision?
        if (playerBox.intersectsBox(enemyBox)) {
            isGameOver = true;
            restartBtn.style.display = 'block';
            return;
        }

        // Gegner hinter der Kamera löschen
        if (enemy.position.z > 15) {
            scene.remove(enemy);
            enemies.splice(i, 1);
            score++;
            scoreElement.innerText = score;
        }
    }

    renderer.render(scene, camera);
}

// --- Spiel-Neustart ---
restartBtn.addEventListener('click', () => {
    isGameOver = false;
    score = 0;
    enemySpeed = 0.2;
    spawnTimer = 0;
    scoreElement.innerText = score;
    restartBtn.style.display = 'none';
    player.position.x = 0;

    // Alle alten Gegner löschen
    enemies.forEach(enemy => scene.remove(enemy));
    enemies = [];

    animate();
});

// Spiel starten
animate();

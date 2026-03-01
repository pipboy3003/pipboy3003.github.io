// Timestamp: 2026-03-01 08:24:59 CET

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

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
let enemies = [];
let enemySpeed = 0.2;
let spawnTimer = 0;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
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

const roadGeometry = new THREE.PlaneGeometry(30, 200);
const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.rotation.x = -Math.PI / 2; 
road.receiveShadow = true; 
scene.add(road);

const playerGeometry = new THREE.BoxGeometry(2, 1, 4);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x3498db });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = 0.5; 
player.castShadow = true; 
scene.add(player);

let moveLeft = false;
let moveRight = false;
const playerSpeed = 0.3;

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

function spawnEnemy() {
    const enemyGeom = new THREE.BoxGeometry(2, 1, 4);
    const enemyMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c });
    const enemy = new THREE.Mesh(enemyGeom, enemyMat);
    
    const randomX = (Math.random() - 0.5) * 20;
    enemy.position.set(randomX, 0.5, -60);
    enemy.castShadow = true;
    
    scene.add(enemy);
    enemies.push(enemy);
}

function animate() {
    if (isGameOver) return;
    
    requestAnimationFrame(animate);

    if (moveLeft && player.position.x > -14) player.position.x -= playerSpeed;
    if (moveRight && player.position.x < 14) player.position.x += playerSpeed;

    spawnTimer++;
    if (spawnTimer > 60) {
        spawnEnemy();
        spawnTimer = 0;
        enemySpeed += 0.002;
    }

    const playerBox = new THREE.Box3().setFromObject(player);

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.position.z += enemySpeed;

        const enemyBox = new THREE.Box3().setFromObject(enemy);

        if (playerBox.intersectsBox(enemyBox)) {
            isGameOver = true;
            restartBtn.style.display = 'block';
            return;
        }

        if (enemy.position.z > 15) {
            scene.remove(enemy);
            enemies.splice(i, 1);
            score++;
            scoreElement.innerText = score;
        }
    }

    renderer.render(scene, camera);
}

restartBtn.addEventListener('click', () => {
    isGameOver = false;
    score = 0;
    enemySpeed = 0.2;
    spawnTimer = 0;
    scoreElement.innerText = score;
    restartBtn.style.display = 'none';
    player.position.x = 0;

    enemies.forEach(enemy => scene.remove(enemy));
    enemies = [];

    animate();
});

animate();

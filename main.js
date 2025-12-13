import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

// DOM elements
const startScreen = document.getElementById('start-screen');
const hud = document.getElementById('hud');
const startButton = document.getElementById('start-button');
const gameContainer = document.getElementById('game-container');

let gameStarted = false;

// Start game on button click
startButton.addEventListener('click', () => {
    startScreen.style.display = 'none';
    hud.style.display = 'block';
    gameStarted = true;
    animate();
});

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 100, 600);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
gameContainer.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(50, 100, 50);
dirLight.castShadow = true;
scene.add(dirLight);

// Physics world
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;

// Ground
const groundGeometry = new THREE.PlaneGeometry(600, 600);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

const groundBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(300, 0.1, 300)),
});
world.addBody(groundBody);

// Simple oval track barriers
function createWall(x, z, width = 10, depth = 10) {
    const geometry = new THREE.BoxGeometry(width, 5, depth);
    const material = new THREE.MeshStandardMaterial({ color: 0xff4444 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, 2.5, z);
    mesh.castShadow = true;
    scene.add(mesh);

    const body = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Box(new CANNON.Vec3(width / 2, 2.5, depth / 2)),
        position: new CANNON.Vec3(x, 2.5, z),
    });
    world.addBody(body);
}

// Outer walls
for (let i = -120; i <= 120; i += 30) {
    createWall(120, i);
    createWall(-120, i);
}
for (let i = -100; i <= 100; i += 30) {
    createWall(i, 120);
    createWall(i, -120);
}

// Car physics
let carBody;
let carMesh;

const chassisShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
carBody = new CANNON.Body({ mass: 150 });
carBody.addShape(chassisShape);
carBody.position.set(0, 5, 0);
world.addBody(carBody);

// Load car model (Ferrari from three.js examples)
const loader = new GLTFLoader();
loader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Ferrari.glb', (gltf) => {
    carMesh = gltf.scene;
    carMesh.scale.set(0.01, 0.01, 0.01);
    carMesh.rotation.y = Math.PI; // Face forward
    scene.add(carMesh);
});

// Vehicle setup
const vehicle = new CANNON.RaycastVehicle({
    chassisBody: carBody,
});

const wheelOptions = {
    radius: 0.5,
    directionLocal: new CANNON.Vec3(0, -1, 0),
    axleLocal: new CANNON.Vec3(1, 0, 0),
    suspensionStiffness: 30,
    suspensionRestLength: 0.3,
    frictionSlip: 5,
    dampingRelaxation: 2.3,
    dampingCompression: 4.4,
};

vehicle.addWheel({ ...wheelOptions, chassisConnectionPointLocal: new CANNON.Vec3(1, 0, 1) });
vehicle.addWheel({ ...wheelOptions, chassisConnectionPointLocal: new CANNON.Vec3(1, 0, -1) });
vehicle.addWheel({ ...wheelOptions, chassisConnectionPointLocal: new CANNON.Vec3(-1, 0, 1) });
vehicle.addWheel({ ...wheelOptions, chassisConnectionPointLocal: new CANNON.Vec3(-1, 0, -1) });

vehicle.addToWorld(world);

// Cockpit camera offset
camera.position.set(0, 1.2, 0.5);

// Controls
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

const maxForce = 600;
const maxSteer = 0.5;

// Animation loop
function animate() {
    if (!gameStarted) return;
    requestAnimationFrame(animate);

    const dt = 1 / 60;
    world.step(dt);

    // Engine force (rear wheels)
    const force = keys['s'] || keys['arrowdown'] ? maxForce :
                  keys['w'] || keys['arrowup'] ? -maxForce : 0;
    vehicle.applyEngineForce(force, 2);
    vehicle.applyEngineForce(force, 3);

    // Steering (front wheels)
    const steer = keys['a'] || keys['arrowleft'] ? maxSteer :
                  keys['d'] || keys['arrowright'] ? -maxSteer : 0;
    vehicle.setSteeringValue(steer, 0);
    vehicle.setSteeringValue(steer, 1);

    // Sync car mesh
    if (carMesh) {
        carMesh.position.copy(carBody.position);
        carMesh.quaternion.copy(carBody.quaternion);
    }

    // Cockpit view: camera follows car interior
    const offset = new THREE.Vector3(0, 1.2, 0.5).applyQuaternion(carBody.quaternion);
    camera.position.copy(carBody.position).add(offset);
    camera.quaternion.copy(carBody.quaternion);

    // Update HUD
    const speed = Math.round(carBody.velocity.length() * 3.6);
    hud.textContent = `Speed: ${speed} km/h`;

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================================
// Mechanic's Quest - Hauptspiel v2
// Feature-Update: 3 Rennstrecken + Fahrzeugauswahl
// ============================================================

// ---- SPIELSTAND ----
const STATE = {
  money: 500,
  parts: 3,
  engine: 1,
  tires: 1,
  armor: 1,
  wins: 0,
  time: 0.25,
  selectedCar: 0,
  selectedTrack: 0,
  isTournament: false,
};

// ---- FAHRZEUG-DEFINITIONEN ----
const CARS = [
  {
    id: 0,
    name: 'Rust Bucket',
    icon: '🚗',
    color: 0xff4400,
    cssColor: '#ff4400',
    desc: 'Dein alter Schrotthaufen. Zuverlässig wie ein Hammer.',
    stats: { speed: 3, handling: 4, armor: 2 },
    accelBonus: 0,
    turnBonus: 0,
    maxSpeedBonus: 0,
  },
  {
    id: 1,
    name: 'City Racer',
    icon: '🏎️',
    color: 0x00ccff,
    cssColor: '#00ccff',
    desc: 'Schnell durch enge Kurven. Karosserie dünn wie Papier.',
    stats: { speed: 4, handling: 5, armor: 1 },
    accelBonus: 20,
    turnBonus: 0.4,
    maxSpeedBonus: 30,
  },
  {
    id: 2,
    name: 'Desert Bruiser',
    icon: '🚙',
    color: 0xddaa22,
    cssColor: '#ddaa22',
    desc: 'Massig, stark, unzerstörbar. Aber träge wie ein Panzer.',
    stats: { speed: 2, handling: 2, armor: 5 },
    accelBonus: -15,
    turnBonus: -0.3,
    maxSpeedBonus: -20,
  },
];

// ---- STRECKEN-DEFINITIONEN ----
const TRACKS = [
  {
    id: 0,
    name: 'Oval Arena',
    icon: '⭕',
    desc: 'Klassische Oval-Strecke. Voll Gas von Anfang an.',
    bgColor: '#0d1a0d',
    laps: 3,
    drawFn: drawTrackOval,
    startX: (W) => W * 0.5,
    startY: (H) => H * 0.83,
    checkpointY: (H) => H * 0.83,
    checkpointTop: (H) => H * 0.42,
    aiPath: (t, W, H, idx) => ({
      x: W*0.5 + Math.cos(t*Math.PI*2) * (W*0.34 - idx*12),
      y: H*0.5  + Math.sin(t*Math.PI*2) * (H*0.29 - idx*8),
    }),
  },
  {
    id: 1,
    name: 'City Circuit',
    icon: '🏙️',
    desc: 'Enge Stadtkurven, scharfe Ecken. Handling ist alles.',
    bgColor: '#0a0a14',
    laps: 3,
    drawFn: drawTrackCity,
    startX: (W) => W * 0.5,
    startY: (H) => H * 0.85,
    checkpointY: (H) => H * 0.85,
    checkpointTop: (H) => H * 0.2,
    aiPath: (t, W, H, idx) => cityAiPath(t, W, H, idx),
  },
  {
    id: 2,
    name: 'Wüsten-Sprint',
    icon: '🏜️',
    desc: 'Gerader Sprint durch die Wüste und zurück. Kein Erbarmen.',
    bgColor: '#1a1000',
    laps: 2,
    drawFn: drawTrackDesert,
    startX: (W) => W * 0.12,
    startY: (H) => H * 0.5,
    checkpointY: (H) => H * 0.5,
    checkpointTop: (H) => H * 0.5,
    aiPath: (t, W, H, idx) => desertAiPath(t, W, H, idx),
  },
];

// ============================================================
// SCREEN-MANAGEMENT
// ============================================================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  const el = document.getElementById(id);
  el.style.display = 'block';
  el.classList.add('active');
}

document.getElementById('btn-start').onclick = () => {
  showScreen('screen-overworld');
  initOverworld();
};
document.getElementById('btn-how').onclick = () => showScreen('screen-howto');
document.getElementById('btn-back').onclick = () => showScreen('screen-menu');
document.getElementById('dialog-close').onclick = () =>
  document.getElementById('dialog-box').classList.add('hidden');
document.getElementById('btn-back-overworld').onclick = () => {
  if (phaserGame) { phaserGame.destroy(true); phaserGame = null; }
  showScreen('screen-overworld');
  owAnimId = requestAnimationFrame(animateOverworld);
  updateHUD();
};
document.getElementById('btn-carselect-back').onclick = () => {
  showScreen('screen-overworld');
  owAnimId = requestAnimationFrame(animateOverworld);
};
document.getElementById('btn-carselect-go').onclick = () => {
  launchRace();
};

function updateHUD() {
  document.getElementById('hud-money').textContent = STATE.money;
  document.getElementById('hud-parts').textContent = STATE.parts;
  document.getElementById('hud-engine').textContent = STATE.engine;
  const hour = Math.floor(STATE.time * 24);
  document.getElementById('time-display').textContent =
    (hour < 6 || hour >= 20) ? '🌙 Nacht' : '☀️ Tag';
}

function showDialog(title, text, actions = []) {
  document.getElementById('dialog-title').textContent = title;
  document.getElementById('dialog-text').textContent = text;
  const actDiv = document.getElementById('dialog-actions');
  actDiv.innerHTML = '';
  actions.forEach(a => {
    const btn = document.createElement('button');
    btn.textContent = a.label;
    btn.onclick = () => { a.action(); updateHUD(); };
    actDiv.appendChild(btn);
  });
  document.getElementById('dialog-box').classList.remove('hidden');
}

function autoSave() {
  try { localStorage.setItem('mechanics_quest_save', JSON.stringify(STATE)); } catch(e){}
}

// ============================================================
// FAHRZEUGAUSWAHL
// ============================================================
function openCarSelect(trackId, isTournament) {
  STATE.selectedTrack = trackId;
  STATE.isTournament = isTournament;

  const track = TRACKS[trackId];
  document.getElementById('carselect-track-name').textContent =
    track.icon + ' Strecke: ' + track.name + ' – ' + track.desc;

  renderCarCards();
  if (owAnimId) { cancelAnimationFrame(owAnimId); owAnimId = null; }
  document.getElementById('dialog-box').classList.add('hidden');
  showScreen('screen-carselect');
}

function renderCarCards() {
  const container = document.getElementById('car-cards');
  container.innerHTML = '';
  CARS.forEach(car => {
    const card = document.createElement('div');
    card.className = 'car-card' + (car.id === STATE.selectedCar ? ' selected' : '');
    card.innerHTML = `
      ${car.id === STATE.selectedCar ? '<div class="selected-badge">✓ GEWÄHLT</div>' : ''}
      <div class="car-icon">${car.icon}</div>
      <div class="car-name" style="color:${car.cssColor}">${car.name}</div>
      ${statBar('Tempo',    car.stats.speed,    car.cssColor)}
      ${statBar('Handling', car.stats.handling, car.cssColor)}
      ${statBar('Panzer',   car.stats.armor,    car.cssColor)}
      <div class="car-desc">${car.desc}</div>
    `;
    card.onclick = () => {
      STATE.selectedCar = car.id;
      renderCarCards();
    };
    container.appendChild(card);
  });
}

function statBar(label, val, color) {
  const pct = (val / 5) * 100;
  return `
    <div class="car-stat">${label} <span>${val}/5</span></div>
    <div class="stat-bar-wrap"><div class="stat-bar" style="width:${pct}%;background:linear-gradient(to right,${color},#ffdd00)"></div></div>
  `;
}

function launchRace() {
  showScreen('screen-race');
  document.getElementById('race-result').classList.add('hidden');
  const car = CARS[STATE.selectedCar];
  document.getElementById('race-car-label').textContent =
    car.icon + ' ' + car.name;
  startRace();
}

// ============================================================
// OVERWORLD - Three.js
// ============================================================
let owScene, owCamera, owRenderer, owAnimId;
let playerMesh, grassBlades = [], buildings = [], npcs = [];
let playerPos = { x: 0, z: 0 };
let playerDir = { x: 0, z: -1 };
let keys = {};
let dayLight, ambientLight, sunMesh;
let owClock;

const BUILDINGS_DATA = [
  { x: 8,   z: -6, color: 0x886644, type: 'race',   text: 'Eine zerstörte Rennstrecke. Wähle Strecke und Fahrzeug!' },
  { x: -8,  z: -4, color: 0x445566, type: 'garage', text: 'Die alte Werkstatt. Upgrade dein Fahrzeug.' },
  { x: 10,  z:  6, color: 0x664422, type: 'shop',   text: 'Ein misstrauischer Händler.' },
  { x: -10, z:  7, color: 0x335533, type: 'bar',    text: 'Gerüchte, Missionen und billiger Treibstoff.' },
];

function initOverworld() {
  if (owRenderer) return;
  const canvas = document.getElementById('canvas-overworld');
  const W = window.innerWidth, H = window.innerHeight;

  owScene = new THREE.Scene();
  owScene.fog = new THREE.FogExp2(0x1a0a00, 0.035);

  owCamera = new THREE.PerspectiveCamera(55, W/H, 0.1, 200);
  owCamera.position.set(0, 14, 14);
  owCamera.lookAt(0, 0, 0);

  owRenderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  owRenderer.setSize(W, H);
  owRenderer.shadowMap.enabled = true;
  owRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
  owRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  owClock = new THREE.Clock();

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 70, 30, 30),
    new THREE.MeshLambertMaterial({ color: 0x3d2b1a })
  );
  ground.rotation.x = -Math.PI/2;
  ground.receiveShadow = true;
  owScene.add(ground);

  const roadMat = new THREE.MeshLambertMaterial({ color: 0x1e1e1e });
  const roadH = new THREE.Mesh(new THREE.PlaneGeometry(4, 70), roadMat);
  roadH.rotation.x = -Math.PI/2; roadH.position.y = 0.01;
  owScene.add(roadH);
  const roadV = new THREE.Mesh(new THREE.PlaneGeometry(70, 4), roadMat);
  roadV.rotation.x = -Math.PI/2; roadV.position.y = 0.01;
  owScene.add(roadV);

  createGrass();
  BUILDINGS_DATA.forEach(b => createBuilding(b));
  createNPCs();

  const car = CARS[STATE.selectedCar];
  playerMesh = createCarMesh(car.color);
  playerMesh.position.set(0, 0.3, 0);
  playerMesh.castShadow = true;
  owScene.add(playerMesh);

  const hl1 = new THREE.PointLight(0xffeedd, 2.0, 10);
  hl1.position.set(0.35, 0.4, -1.0);
  playerMesh.add(hl1);
  const hl2 = new THREE.PointLight(0xffeedd, 2.0, 10);
  hl2.position.set(-0.35, 0.4, -1.0);
  playerMesh.add(hl2);
  const rl = new THREE.PointLight(0xff0000, 0.8, 3);
  rl.position.set(0, 0.3, 1.0);
  playerMesh.add(rl);

  ambientLight = new THREE.AmbientLight(0x334455, 0.5);
  owScene.add(ambientLight);

  dayLight = new THREE.DirectionalLight(0xfff5dd, 1.0);
  dayLight.position.set(20, 30, 20);
  dayLight.castShadow = true;
  dayLight.shadow.mapSize.width = 2048;
  dayLight.shadow.mapSize.height = 2048;
  dayLight.shadow.camera.near = 0.5;
  dayLight.shadow.camera.far = 150;
  dayLight.shadow.camera.left = -35;
  dayLight.shadow.camera.right = 35;
  dayLight.shadow.camera.top = 35;
  dayLight.shadow.camera.bottom = -35;
  owScene.add(dayLight);

  const sunGeo = new THREE.SphereGeometry(1.2, 8, 8);
  sunMesh = new THREE.Mesh(sunGeo, new THREE.MeshBasicMaterial({ color: 0xffee88 }));
  owScene.add(sunMesh);

  createStars();

  document.addEventListener('keydown', e => keys[e.key] = true);
  document.addEventListener('keyup',   e => keys[e.key] = false);
  canvas.addEventListener('click', onOverworldClick);

  window.addEventListener('resize', () => {
    owCamera.aspect = window.innerWidth / window.innerHeight;
    owCamera.updateProjectionMatrix();
    owRenderer.setSize(window.innerWidth, window.innerHeight);
  });

  setInterval(autoSave, 30000);
  updateHUD();
  animateOverworld();
}

function createCarMesh(color) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshPhongMaterial({ color, shininess: 80 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 1.6), bodyMat);
  body.position.y = 0.15; body.castShadow = true;
  group.add(body);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.25, 0.8),
    new THREE.MeshPhongMaterial({ color: 0x222222, shininess: 40 }));
  roof.position.set(0, 0.42, 0.1); roof.castShadow = true;
  group.add(roof);
  const wheelGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.12, 8);
  const wheelMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
  [[-0.45,0,0.55],[0.45,0,0.55],[-0.45,0,-0.55],[0.45,0,-0.55]].forEach(([wx,wy,wz]) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI/2;
    w.position.set(wx, wy, wz);
    w.castShadow = true;
    group.add(w);
  });
  return group;
}

function createBuilding(data) {
  const group = new THREE.Group();
  const h = 2.5 + Math.random() * 1.5;
  const mat = new THREE.MeshPhongMaterial({ color: data.color, shininess: 10 });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2.5, h, 2.5), mat);
  mesh.position.y = h/2;
  mesh.castShadow = true; mesh.receiveShadow = true;
  group.add(mesh);
  const winLight = new THREE.PointLight(0xffaa44, 0.8, 5);
  winLight.position.set(0, h*0.6, 0);
  group.add(winLight);
  group.position.set(data.x, 0, data.z);
  group.userData = { ...data, isBuilding: true };
  owScene.add(group);
  buildings.push(group);
}

function createGrass() {
  const bladeMat = new THREE.MeshLambertMaterial({ color: 0x2d5a1b, side: THREE.DoubleSide });
  for (let i = 0; i < 400; i++) {
    const x = (Math.random()-0.5)*60, z = (Math.random()-0.5)*60;
    if (Math.abs(x) < 2.5 || Math.abs(z) < 2.5) continue;
    const blade = new THREE.Mesh(
      new THREE.PlaneGeometry(0.08, 0.28 + Math.random()*0.22), bladeMat);
    blade.position.set(x, 0.14, z);
    blade.rotation.y = Math.random() * Math.PI;
    blade.userData.phase = Math.random() * Math.PI * 2;
    owScene.add(blade);
    grassBlades.push(blade);
  }
}

function createNPCs() {
  const colors = [0xffccaa, 0xcc9966, 0xee8844, 0xddaa88, 0xbb7744];
  for (let i = 0; i < 6; i++) {
    const npc = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: colors[i % colors.length] });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.7, 6), mat);
    body.position.y = 0.5; npc.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), mat);
    head.position.y = 1.05; npc.add(head);
    const angle = (i/6)*Math.PI*2;
    npc.position.set(Math.cos(angle)*5, 0, Math.sin(angle)*5);
    npc.userData = { walkAngle: angle, walkRadius: 3+Math.random()*3, speed: 0.25+Math.random()*0.35 };
    owScene.add(npc);
    npcs.push(npc);
  }
}

function createStars() {
  const verts = [];
  for (let i=0;i<1000;i++)
    verts.push((Math.random()-0.5)*200, 20+Math.random()*70, (Math.random()-0.5)*200);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  owScene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.18 })));
}

function animateOverworld() {
  owAnimId = requestAnimationFrame(animateOverworld);
  const delta = owClock.getDelta();
  const elapsed = owClock.getElapsedTime();

  const speed = (4 + (STATE.engine-1)*0.3) * delta;
  let moved = false;
  if (keys['w']||keys['W']||keys['ArrowUp'])    { playerPos.z -= speed; playerDir.z=-1; playerDir.x=0; moved=true; }
  if (keys['s']||keys['S']||keys['ArrowDown'])  { playerPos.z += speed; playerDir.z=1;  playerDir.x=0; moved=true; }
  if (keys['a']||keys['A']||keys['ArrowLeft'])  { playerPos.x -= speed; playerDir.x=-1; playerDir.z=0; moved=true; }
  if (keys['d']||keys['D']||keys['ArrowRight']) { playerPos.x += speed; playerDir.x=1;  playerDir.z=0; moved=true; }

  playerPos.x = Math.max(-28, Math.min(28, playerPos.x));
  playerPos.z = Math.max(-28, Math.min(28, playerPos.z));
  playerMesh.position.set(playerPos.x, 0.3, playerPos.z);

  if (moved) {
    const target = Math.atan2(playerDir.x, playerDir.z);
    playerMesh.rotation.y += (target - playerMesh.rotation.y) * 0.2;
  }

  owCamera.position.set(playerPos.x, 14, playerPos.z + 14);
  owCamera.lookAt(playerPos.x, 0, playerPos.z);

  grassBlades.forEach(b => {
    const dist = Math.hypot(b.position.x-playerPos.x, b.position.z-playerPos.z);
    const wind = Math.sin(elapsed*1.8+b.userData.phase)*0.09;
    const reaction = dist < 2.5 ? Math.sin(elapsed*10+b.userData.phase)*0.14*(1-dist/2.5) : 0;
    b.rotation.z = wind + reaction;
  });

  npcs.forEach(n => {
    n.userData.walkAngle += n.userData.speed * delta;
    n.position.x = Math.cos(n.userData.walkAngle) * n.userData.walkRadius;
    n.position.z = Math.sin(n.userData.walkAngle) * n.userData.walkRadius;
    n.rotation.y = -n.userData.walkAngle + Math.PI/2;
  });

  STATE.time = (STATE.time + delta*0.008) % 1;
  const hour = STATE.time * 24;
  const isDay = hour >= 6 && hour < 20;
  const sunAngle = STATE.time*Math.PI*2 - Math.PI/2;
  sunMesh.position.set(
    playerPos.x + Math.cos(sunAngle)*40,
    Math.sin(sunAngle)*35,
    playerPos.z - 25
  );
  if (isDay) {
    const t = Math.sin((hour-6)/14*Math.PI);
    ambientLight.color.setRGB(0.25+t*0.45, 0.25+t*0.4, 0.15+t*0.25);
    ambientLight.intensity = 0.3+t*0.8;
    dayLight.intensity = 0.4+t*1.1;
    dayLight.color.setRGB(1, 0.97-t*0.04, 0.88-t*0.08);
    owScene.fog.color.setRGB(0.3+t*0.4, 0.2+t*0.32, 0.08+t*0.28);
    sunMesh.material.color.setRGB(1, 0.85+t*0.15, 0.4+t*0.5);
  } else {
    ambientLight.color.setRGB(0.04, 0.07, 0.18);
    ambientLight.intensity = 0.2;
    dayLight.intensity = 0.08;
    owScene.fog.color.setRGB(0.01, 0.01, 0.04);
    sunMesh.material.color.setRGB(0.7, 0.7, 0.95);
  }
  dayLight.position.set(
    playerPos.x+Math.cos(sunAngle)*28, 30+Math.sin(sunAngle)*20, playerPos.z+18
  );

  updateHUD();
  owRenderer.render(owScene, owCamera);
}

function onOverworldClick(e) {
  const canvas = document.getElementById('canvas-overworld');
  const rect = canvas.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((e.clientX-rect.left)/rect.width)*2-1,
    -((e.clientY-rect.top)/rect.height)*2+1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, owCamera);
  const hits = raycaster.intersectObjects(buildings.map(b => b.children[0]));
  if (hits.length > 0) handleBuildingClick(hits[0].object.parent.userData);
}

function handleBuildingClick(data) {
  switch(data.type) {
    case 'race':
      showDialog('🏁 Rennbahn', 'Wähle deine Strecke:', [
        { label: '⭕ Oval Arena (kostenlos)',    action: () => openCarSelect(0, false) },
        { label: '🏙️ City Circuit (kostenlos)', action: () => openCarSelect(1, false) },
        { label: '🏜️ Wüsten-Sprint (kostenlos)', action: () => openCarSelect(2, false) },
        { label: '🏆 Turnier – Oval (50 Caps)',  action: () => {
          if (STATE.money >= 50) { STATE.money -= 50; openCarSelect(0, true); }
          else showDialog('❌ Zu wenig Caps','Du brauchst 50 Caps.',[]);
        }},
      ]);
      break;
    case 'garage':
      showDialog('🔧 Werkstatt',
        'Teile: '+STATE.parts+' | Geld: '+STATE.money+' Caps\n\nUpgrades:\n• Motor +1 Lv = 2 Teile\n• Reifen +1 Lv = 1 Teil',
        [
          { label: '⚡ Motor (Lv'+STATE.engine+') – 2 Teile', action: () => {
            if (STATE.engine>=5) return showDialog('✅ Max','Motor auf Stufe 5!',[]);
            if (STATE.parts>=2) { STATE.parts-=2; STATE.engine++; showDialog('✅ Upgrade!','Motor Level '+STATE.engine+'!',[]);}
            else showDialog('❌ Teile fehlen','Brauchst 2 Teile.',[]);
          }},
          { label: '🔄 Reifen (Lv'+STATE.tires+') – 1 Teil', action: () => {
            if (STATE.tires>=5) return showDialog('✅ Max','Reifen auf Stufe 5!',[]);
            if (STATE.parts>=1) { STATE.parts--; STATE.tires++; showDialog('✅ Upgrade!','Reifen Level '+STATE.tires+'!',[]);}
            else showDialog('❌ Teile fehlen','Brauchst 1 Teil.',[]);
          }},
        ]
      );
      break;
    case 'shop':
      showDialog('🛒 Händler','Geld: '+STATE.money+' Caps | Teile: '+STATE.parts,[
        { label: '💰 Teile kaufen (30 Caps)', action: () => {
          if (STATE.money>=30) { STATE.money-=30; STATE.parts++; showDialog('✅ Gekauft!','Teile: '+STATE.parts,[]);}
          else showDialog('❌ Zu arm','Nicht genug Caps.',[]);
        }},
        { label: '💵 Teile verkaufen (20 Caps)', action: () => {
          if (STATE.parts>0) { STATE.parts--; STATE.money+=20; showDialog('✅ Verkauft!','Geld: '+STATE.money+' Caps',[]);}
          else showDialog('❌ Keine Teile','Nichts zu verkaufen.',[]);
        }},
      ]);
      break;
    case 'bar':
      const missions = [
        { q: '"Bring mir 5 Teile."',          r: '+200 Caps', ok:()=>STATE.parts>=5,  pay:()=>{STATE.parts-=5; STATE.money+=200;} },
        { q: '"Gewinne ein Rennen."',           r: '+100 Caps', ok:()=>STATE.wins>=1,   pay:()=>{STATE.money+=100;} },
        { q: '"Sammle 10 Teile insgesamt."',    r: '+150 Caps', ok:()=>STATE.parts>=10, pay:()=>{STATE.money+=150;} },
      ];
      const m = missions[Math.floor(Math.random()*missions.length)];
      showDialog('💬 Bar','Ein Fahrer flüstert:\n'+m.q+'\nBelohnung: '+m.r,[
        { label: '✅ Mission annehmen', action: () => {
          if (m.ok()) { m.pay(); showDialog('💰 Belohnung!','Mission erfüllt! '+m.r,[]);}
          else showDialog('⏳ Noch nicht fertig','Bedingung noch nicht erfüllt.',[]);
        }},
      ]);
      break;
  }
}

// ============================================================
// STRECKEN ZEICHNEN
// ============================================================
function drawTrackOval(g, W, H) {
  g.fillStyle(0x1a2d0a, 1); g.fillRect(0, 0, W, H);
  g.lineStyle(88, 0x2a2a2a, 1);
  g.strokeEllipse(W*0.5, H*0.5, W*0.78, H*0.73);
  g.lineStyle(2, 0xffff00, 0.5);
  g.strokeEllipse(W*0.5, H*0.5, W*0.78, H*0.73);
  g.fillStyle(0x1e3d0f, 1);
  g.fillEllipse(W*0.5, H*0.5, W*0.58, H*0.53);
  for (let i=0;i<18;i++) {
    const a=(i/18)*Math.PI*2;
    const rx=W*0.39+46, ry=H*0.365+46;
    g.fillStyle(i%2===0?0xff2200:0xffffff,1);
    g.fillRect(W*0.5+Math.cos(a)*rx-5, H*0.5+Math.sin(a)*ry-12, 10, 24);
  }
  // Ziellinie
  for (let i=0;i<8;i++) {
    g.fillStyle(i%2===0?0x000000:0xffffff,1);
    g.fillRect(W*0.5-54+i*14, H*0.83-4, 14, 8);
  }
}

function drawTrackCity(g, W, H) {
  g.fillStyle(0x0a0a14, 1); g.fillRect(0, 0, W, H);
  // Stadt-Hintergrund Blöcke
  const blocks = [
    [0.05,0.05,0.18,0.25], [0.25,0.05,0.18,0.12], [0.55,0.05,0.18,0.25],
    [0.78,0.05,0.18,0.18], [0.05,0.7,0.2,0.25],   [0.75,0.7,0.2,0.25],
    [0.3,0.4,0.15,0.2],    [0.55,0.4,0.15,0.2],
  ];
  blocks.forEach(([bx,by,bw,bh]) => {
    g.fillStyle(0x1a1a2e,1);
    g.fillRect(W*bx, H*by, W*bw, H*bh);
    g.lineStyle(1,0x334466,0.8);
    g.strokeRect(W*bx, H*by, W*bw, H*bh);
    // Fenster
    for (let r=0;r<Math.floor(bh*H/20);r++) for (let c=0;c<Math.floor(bw*W/16);c++) {
      if (Math.random()>0.35) {
        g.fillStyle(Math.random()>0.3?0xffee88:0x334466, 0.9);
        g.fillRect(W*bx+c*16+4, H*by+r*20+4, 8, 10);
      }
    }
  });
  // Straße – rechteckiger Kurs
  const roadW = 68;
  g.lineStyle(roadW, 0x222233, 1);
  // Äußerer Rechteck-Kurs
  const mx=W*0.1, my=H*0.12, mw=W*0.8, mh=H*0.76;
  g.strokeRoundedRect(mx, my, mw, mh, 80);
  // Innen ausschneiden
  g.fillStyle(0x0a0a14, 1);
  g.fillRoundedRect(mx+roadW, my+roadW, mw-roadW*2, mh-roadW*2, 60);
  // Mittellinie gestrichelt
  g.lineStyle(3, 0xffff00, 0.4);
  g.strokeRoundedRect(mx+roadW/2, my+roadW/2, mw-roadW, mh-roadW, 70);
  // Curbs an den Ecken
  const corners = [[mx,my],[mx+mw,my],[mx,my+mh],[mx+mw,my+mh]];
  corners.forEach(([cx,cy]) => {
    for (let i=0;i<5;i++) {
      g.fillStyle(i%2===0?0xff2200:0xffffff,1);
      g.fillRect(cx-12+i*6, cy-6, 6, 12);
    }
  });
  // Ziellinie
  for (let i=0;i<8;i++) {
    g.fillStyle(i%2===0?0x000000:0xffffff,1);
    g.fillRect(W*0.5-54+i*14, H*0.85-4, 14, 8);
  }
}

function drawTrackDesert(g, W, H) {
  // Wüstenboden
  g.fillStyle(0x2a1800, 1); g.fillRect(0, 0, W, H);
  // Sand-Textur (Punkte)
  for (let i=0;i<300;i++) {
    g.fillStyle(0x3a2200, 0.6);
    g.fillRect(Math.random()*W, Math.random()*H, 3+Math.random()*8, 2+Math.random()*4);
  }
  // Felsbrocken
  const rocks = [[0.08,0.2],[0.15,0.7],[0.85,0.3],[0.9,0.65],[0.5,0.15],[0.5,0.82],[0.25,0.45],[0.75,0.5]];
  rocks.forEach(([rx,ry]) => {
    g.fillStyle(0x553322,1);
    g.fillEllipse(W*rx, H*ry, 30+Math.random()*40, 20+Math.random()*30);
  });
  // Sprint-Strecke – breite gerade Bahn
  const trackTop = H*0.35, trackBot = H*0.65, trackH = trackBot-trackTop;
  g.fillStyle(0x1e1e1e, 1);
  g.fillRect(W*0.06, trackTop, W*0.88, trackH);
  // Streifen in der Mitte
  g.lineStyle(3, 0xffff00, 0.5);
  g.lineBetween(W*0.06, H*0.5, W*0.94, H*0.5);
  // Curbs oben/unten
  for (let i=0;i<24;i++) {
    g.fillStyle(i%2===0?0xff2200:0xffffff,1);
    g.fillRect(W*0.06+i*(W*0.88/24), trackTop-6, W*0.88/24-2, 12);
    g.fillRect(W*0.06+i*(W*0.88/24), trackBot-6, W*0.88/24-2, 12);
  }
  // U-Turn rechts
  g.fillStyle(0x1e1e1e,1);
  g.fillEllipse(W*0.93, H*0.5, trackH*1.1, trackH*1.4);
  g.fillStyle(0x2a1800,1);
  g.fillEllipse(W*0.93, H*0.5, trackH*0.3, trackH*0.6);
  // U-Turn links (Start)
  g.fillStyle(0x1e1e1e,1);
  g.fillEllipse(W*0.07, H*0.5, trackH*1.1, trackH*1.4);
  g.fillStyle(0x2a1800,1);
  g.fillEllipse(W*0.07, H*0.5, trackH*0.3, trackH*0.6);
  // Ziellinie
  for (let i=0;i<8;i++) {
    g.fillStyle(i%2===0?0x000000:0xffffff,1);
    g.fillRect(W*0.12+i*14, H*0.5-20, 14, 8);
  }
  // Kaktus-Deko
  const cacti = [[0.2,0.25],[0.4,0.8],[0.65,0.22],[0.8,0.78]];
  cacti.forEach(([cx,cy]) => {
    g.fillStyle(0x336622,1);
    g.fillRect(W*cx-4, H*cy-18, 8, 22);
    g.fillRect(W*cx-12, H*cy-10, 8, 8);
    g.fillRect(W*cx+4,  H*cy-14, 8, 8);
  });
}

// AI-Pfade für City & Desert
function cityAiPath(t, W, H, idx) {
  const tt = t % 1;
  const pad = 55 + idx*10;
  const mx=W*0.1+pad, my=H*0.12+pad, mw=W*0.8-pad*2, mh=H*0.76-pad*2;
  // Rechteck abfahren: 4 Seiten
  const perim = 2*(mw+mh);
  const pos = (tt * perim) % perim;
  let x, y, nx=0, ny=0;
  if (pos < mw)            { x=mx+pos;    y=my;      nx=1;  ny=0; }
  else if (pos < mw+mh)   { x=mx+mw;     y=my+(pos-mw); nx=0; ny=1; }
  else if (pos < 2*mw+mh) { x=mx+mw-(pos-mw-mh); y=my+mh; nx=-1;ny=0; }
  else                     { x=mx;        y=my+mh-(pos-2*mw-mh); nx=0;ny=-1; }
  return { x, y };
}

function desertAiPath(t, W, H, idx) {
  const tt = t % 1;
  const trackTop = H*0.38 + idx*12, trackBot = H*0.62 - idx*12;
  const mid = (trackTop+trackBot)/2;
  // Oval-ähnliche Bahn für die Wüstenstrecke
  const x = W*0.5 + Math.cos(tt*Math.PI*2) * (W*0.38 - idx*14);
  const y = mid    + Math.sin(tt*Math.PI*2) * ((trackBot-trackTop)*0.42 - idx*8);
  return { x, y };
}

// ============================================================
// RACING - Phaser3
// ============================================================
let phaserGame = null;
let playerCar, aiCars = [], raceKeys, raceKeys2;
let lap = 1, maxLaps = 3, lapCheckpoint = false;
let raceTimer = 0, boostEnergy = 2.0;

function startRace() {
  const config = {
    type: Phaser.CANVAS,
    canvas: document.getElementById('canvas-race'),
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: TRACKS[STATE.selectedTrack].bgColor,
    scene: { preload: racePreload, create: raceCreate, update: raceUpdate },
    physics: { default: 'arcade', arcade: { gravity:{y:0}, debug:false } }
  };
  phaserGame = new Phaser.Game(config);
}

function racePreload() {}

function raceCreate() {
  const scene = this;
  const W = scene.scale.width, H = scene.scale.height;
  const track = TRACKS[STATE.selectedTrack];
  const car   = CARS[STATE.selectedCar];

  maxLaps = track.laps;

  // Strecke zeichnen
  const g = scene.add.graphics();
  track.drawFn(g, W, H);

  // Auto-Texturen generieren
  const pg = scene.add.graphics();
  pg.fillStyle(car.color, 1); pg.fillRoundedRect(-16,-26,32,52,4);
  pg.fillStyle(0x88aaff,0.8); pg.fillRect(-11,-20,10,10); pg.fillRect(1,-20,10,10);
  pg.fillStyle(0x111111,1);
  pg.fillRect(-18,-18,7,14); pg.fillRect(11,-18,7,14);
  pg.fillRect(-18,10,7,14);  pg.fillRect(11,10,7,14);
  pg.fillStyle(0xff0000,1); pg.fillRect(-14,24,10,6); pg.fillRect(4,24,10,6);
  pg.generateTexture('pcar',32,52); pg.destroy();

  const ag = scene.add.graphics();
  ag.fillStyle(0x0055dd,1); ag.fillRoundedRect(-14,-22,28,44,3);
  ag.fillStyle(0x111111,1);
  ag.fillRect(-16,-16,6,12); ag.fillRect(10,-16,6,12);
  ag.fillRect(-16,8,6,12);   ag.fillRect(10,8,6,12);
  ag.generateTexture('aicar',28,44); ag.destroy();

  // Startpositionen
  const sx = track.startX(W), sy = track.startY(H);

  playerCar = scene.physics.add.image(sx, sy, 'pcar');
  playerCar.setCollideWorldBounds(true);
  playerCar.setDamping(true);
  playerCar.setDrag(0.90);
  playerCar.setMaxVelocity(300 + STATE.engine*22 + car.maxSpeedBonus);

  aiCars = [];
  for (let i=0;i<3;i++) {
    const ai = scene.physics.add.image(sx+(i-1)*45, sy-30*(i+1), 'aicar');
    ai.setDamping(true); ai.setDrag(0.91);
    ai.setMaxVelocity(230+i*18);
    ai.userData = { lap:1, cpPassed:false, pathT: 0.22+i*0.08 };
    aiCars.push(ai);
  }

  raceKeys  = scene.input.keyboard.createCursorKeys();
  raceKeys2 = scene.input.keyboard.addKeys('W,A,S,D,SHIFT');

  lap=1; lapCheckpoint=false; raceTimer=0; boostEnergy=2.0;
  document.getElementById('race-lap').textContent='Runde 1/'+maxLaps;
  document.getElementById('race-car-label').textContent = car.icon+' '+car.name;
}

function raceUpdate(time, delta) {
  if (!playerCar||!playerCar.active) return;
  const scene = this;
  const W = scene.scale.width, H = scene.scale.height;
  const track = TRACKS[STATE.selectedTrack];
  const car   = CARS[STATE.selectedCar];
  raceTimer += delta/1000;

  const accel = (265 + STATE.engine*28 + car.accelBonus) * (delta/1000);
  const turn  = (2.5 + STATE.tires*0.28 + car.turnBonus) * (delta/1000);
  const k = raceKeys, w = raceKeys2;

  const boosting = (k.shift&&k.shift.isDown)||(w.SHIFT&&w.SHIFT.isDown);
  if (boosting && boostEnergy>0) boostEnergy = Math.max(0, boostEnergy-delta/800);
  else if (!boosting) boostEnergy = Math.min(2.0, boostEnergy+delta/2000);
  document.getElementById('boost-fill').style.width = (boostEnergy/2*100)+'%';
  const bm = (boosting&&boostEnergy>0.05) ? 1.7 : 1.0;

  if (k.up.isDown||w.W.isDown) {
    playerCar.body.velocity.x += Math.cos(playerCar.rotation-Math.PI/2)*accel*bm;
    playerCar.body.velocity.y += Math.sin(playerCar.rotation-Math.PI/2)*accel*bm;
  }
  if (k.down.isDown||w.S.isDown) {
    playerCar.body.velocity.x -= Math.cos(playerCar.rotation-Math.PI/2)*accel*0.55;
    playerCar.body.velocity.y -= Math.sin(playerCar.rotation-Math.PI/2)*accel*0.55;
  }
  if (k.left.isDown||w.A.isDown)  playerCar.rotation -= turn;
  if (k.right.isDown||w.D.isDown) playerCar.rotation += turn;

  const spd = Math.hypot(playerCar.body.velocity.x, playerCar.body.velocity.y);
  document.getElementById('race-speed').textContent = Math.round(spd*0.38)+' km/h';

  // AI
  aiCars.forEach((ai,idx) => {
    const d = ai.userData;
    d.pathT += (0.12+idx*0.022)*(delta/1000);
    const pt = track.aiPath(d.pathT, W, H, idx);
    const dx=pt.x-ai.x, dy=pt.y-ai.y, dist=Math.hypot(dx,dy);
    if (dist>8) {
      const aa = (205+idx*20)*(delta/1000);
      ai.body.velocity.x += (dx/dist)*aa;
      ai.body.velocity.y += (dy/dist)*aa;
      ai.rotation = Math.atan2(dy,dx)+Math.PI/2;
    }
  });

  // Checkpoint & Laps
  const cpY = track.checkpointY(H);
  const cpTop = track.checkpointTop(H);
  if (!lapCheckpoint && playerCar.y < cpTop + 30) lapCheckpoint = true;
  if (lapCheckpoint && Math.abs(playerCar.y-cpY)<30 && Math.abs(playerCar.x-track.startX(W))<80) {
    lapCheckpoint = false;
    lap++;
    document.getElementById('race-lap').textContent='Runde '+Math.min(lap,maxLaps)+'/'+maxLaps;
    if (lap > maxLaps) endRace(scene, true);
  }

  const pos = 1+aiCars.filter(a=>a.userData.lap>lap).length;
  document.getElementById('race-pos').textContent='Pos: '+pos;
}

function endRace(scene, finished) {
  if (phaserGame) phaserGame.scene.pause();
  const pos = 1+aiCars.filter(a=>a.userData.lap>maxLaps).length;
  const won = pos<=1;
  if (won) {
    STATE.wins++;
    const cash = 80+STATE.engine*25;
    const parts = 1+Math.floor(Math.random()*3);
    STATE.money += cash;
    STATE.parts += parts;
    document.getElementById('result-title').textContent='🏆 SIEG!';
    document.getElementById('result-title').style.color='#ffdd00';
    document.getElementById('result-text').textContent='+'+cash+' Caps, +'+parts+' Teile!';
  } else {
    STATE.money += 25;
    document.getElementById('result-title').textContent='💀 Verloren';
    document.getElementById('result-title').style.color='#ff4444';
    document.getElementById('result-text').textContent='+25 Caps Trostpreis. Nicht aufgeben!';
  }
  document.getElementById('race-result').classList.remove('hidden');
  autoSave();
}

window.addEventListener('resize', () => {
  if (phaserGame) phaserGame.scale.resize(window.innerWidth, window.innerHeight);
});

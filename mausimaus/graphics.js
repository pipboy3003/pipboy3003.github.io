// Timestamp: 2026-03-01 10:25:00 CET

GAME.setupGraphics = function() {
    GAME.scene = new THREE.Scene();
    GAME.scene.background = new THREE.Color(0x87CEEB);
    GAME.scene.fog = new THREE.Fog(0x87CEEB, 20, 100); 

    GAME.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    GAME.camera.position.copy(GAME.menuCameraPos);
    GAME.camera.lookAt(0, 0, 0);

    GAME.renderer = new THREE.WebGLRenderer({ antialias: true });
    GAME.renderer.setSize(window.innerWidth, window.innerHeight);
    GAME.renderer.shadowMap.enabled = true; 
    document.body.appendChild(GAME.renderer.domElement);

    const ambientLight = new THREE.HemisphereLight(0xffffff, 0x228B22, 0.4); 
    GAME.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    GAME.scene.add(dirLight);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 200), new THREE.MeshStandardMaterial({ color: 0x228B22 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true; 
    GAME.scene.add(ground);

    // Gras
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x1e6a1e });
    const grassGeom = new THREE.BoxGeometry(0.1, 0.5, 0.1);
    for (let i = 0; i < 500; i++) {
        const blade = new THREE.Mesh(grassGeom, grassMat);
        blade.position.set((Math.random()-0.5)*30, 0.25, (Math.random()-0.5)*200);
        blade.rotation.y = Math.random()*Math.PI;
        GAME.scene.add(blade);
        GAME.grassBlades.push(blade);
    }

    // Maus
    GAME.mouseGroup = new THREE.Group();
    GAME.bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), new THREE.MeshStandardMaterial({ color: 0x888888 }));
    GAME.bodyMesh.scale.set(1, 1, 2);
    GAME.bodyMesh.position.y = 0.5;
    GAME.bodyMesh.castShadow = true;
    GAME.mouseGroup.add(GAME.bodyMesh);
    
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), new THREE.MeshStandardMaterial({ color: 0x888888 }));
    head.position.set(0, 0.6, -0.8);
    GAME.mouseGroup.add(head);

    GAME.leftEar = new THREE.Mesh(new THREE.CircleGeometry(0.3, 32), new THREE.MeshStandardMaterial({ color: 0x888888, side: THREE.DoubleSide }));
    GAME.leftEar.position.set(-0.3, 0.9, -0.6);
    GAME.mouseGroup.add(GAME.leftEar);

    GAME.rightEar = GAME.leftEar.clone();
    GAME.rightEar.position.set(0.3, 0.9, -0.6);
    GAME.mouseGroup.add(GAME.rightEar);

    GAME.tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8), new THREE.MeshStandardMaterial({ color: 0x555555 }));
    GAME.tailMesh.position.set(0, 0.4, 0.8);
    GAME.tailMesh.rotation.x = Math.PI / 2;
    GAME.mouseGroup.add(GAME.tailMesh);

    GAME.scene.add(GAME.mouseGroup);

    // Katze
    GAME.catGroup = new THREE.Group();
    const mainPaw = new THREE.Mesh(new THREE.SphereGeometry(1.8, 32, 32), new THREE.MeshStandardMaterial({ color: 0xe67e22 }));
    mainPaw.scale.set(4, 1.5, 3);
    GAME.catGroup.add(mainPaw);
    GAME.catGroup.position.y = 30;
    GAME.scene.add(GAME.catGroup);

    GAME.catShadow = new THREE.Mesh(new THREE.PlaneGeometry(15, 200), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0 }));
    GAME.catShadow.rotation.x = -Math.PI / 2;
    GAME.scene.add(GAME.catShadow);
};

GAME.createClothesline = function() {
    const group = new THREE.Group();
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 30), new THREE.MeshStandardMaterial({ color: 0xeeeeee }));
    rope.rotation.z = Math.PI / 2;
    rope.position.y = 4;
    group.add(rope);

    for(let i = 0; i < 5; i++) {
        const cloth = new THREE.Mesh(new THREE.PlaneGeometry(3, 4), new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff, side: THREE.DoubleSide }));
        cloth.position.set(-10 + (i * 5), 2, 0);
        group.add(cloth);
    }
    return group;
};

GAME.createPuddle = function() {
    const p = new THREE.Mesh(new THREE.CircleGeometry(2, 16), new THREE.MeshStandardMaterial({ color: 0x1a4d80, transparent: true, opacity: 0.6 }));
    p.rotation.x = -Math.PI / 2;
    p.position.y = 0.02;
    return p;
};

GAME.spawnParticles = function(pos, color, count, isDust) {
    for (let i = 0; i < count; i++) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshBasicMaterial({ color: color }));
        p.position.copy(pos);
        p.velocity = new THREE.Vector3((Math.random()-0.5)*0.5, Math.random()*0.5, (Math.random()-0.5)*0.5);
        p.life = 1.0;
        GAME.scene.add(p);
        GAME.particles.push(p);
    }
};

GAME.updateWeightUI = function() {
    const bar = document.getElementById('weight-bar-fill');
    if(bar) bar.style.width = ((GAME.fatness - 1) / (GAME.MAX_FATNESS - 1)) * 100 + '%';
};

GAME.updateLimits = function() {
    GAME.horizontalLimit = 10;
};

// [2026-03-01 10:20:00] graphics.js - Wäscheleinen & Deko

// ... (vorheriger Code bleibt gleich) ...

// Hilfsfunktion für Wäscheleinen-Elemente
GAME.createClothesline = function() {
    const group = new THREE.Group();
    
    // Pfosten links und rechts (außerhalb des Spielfelds)
    const poleGeom = new THREE.CylinderGeometry(0.1, 0.1, 10, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x4d2600 });
    
    const poleL = new THREE.Mesh(poleGeom, poleMat);
    poleL.position.set(-15, 5, 0);
    group.add(poleL);
    
    const poleR = new THREE.Mesh(poleGeom, poleMat);
    poleR.position.set(15, 5, 0);
    group.add(poleR);
    
    // Die Leine
    const ropeGeom = new THREE.CylinderGeometry(0.02, 0.02, 30, 8);
    const rope = new THREE.Mesh(ropeGeom, new THREE.MeshStandardMaterial({ color: 0xeeeeee }));
    rope.rotation.z = Math.PI / 2;
    rope.position.y = 4;
    group.add(rope);
    
    // Kleidung (Socken/Laken) als Hindernisse
    const clothMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    for(let i = 0; i < 5; i++) {
        const cloth = new THREE.Mesh(new THREE.PlaneGeometry(3, 4), clothMat);
        cloth.position.set(-10 + (i * 5), 2, 0);
        cloth.castShadow = true;
        group.add(cloth);
        
        // Zufällige Farbe für Socken/Shirts
        cloth.material = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5), 
            side: THREE.DoubleSide 
        });
    }
    
    return group;
};

// Hilfsfunktion für Pfützen
GAME.createPuddle = function() {
    const geom = new THREE.CircleGeometry(2, 16);
    const mat = new THREE.MeshStandardMaterial({ 
        color: 0x1a4d80, 
        transparent: true, 
        opacity: 0.6,
        roughness: 0.1,
        metalness: 0.5
    });
    const puddle = new THREE.Mesh(geom, mat);
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.y = 0.02; // Knapp über dem Boden
    return puddle;
};

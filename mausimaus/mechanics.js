// Timestamp: 2026-03-01 09:55:33 CET

GAME.spawnEntity = function() {
    const trapChance = Math.min(0.05 + (GAME.level * 0.02), 0.3);
    const rand = Math.random();
    let object = new THREE.Group();

    if (rand < trapChance) {
        object.userData = { type: 'trap' };
        const board = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 3), new THREE.MeshStandardMaterial({ color: 0x8b5a2b }));
        board.position.y = 0.1;
        board.castShadow = true;
        object.add(board);

        const snapperGroup = new THREE.Group();
        snapperGroup.position.set(0, 0.2, -1.2); 
        
        const wire = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 2.4), new THREE.MeshStandardMaterial({ color: 0xaaaaaa }));
        wire.position.set(0, 0, 1.2); 
        wire.castShadow = true;
        
        snapperGroup.add(wire);
        snapperGroup.rotation.x = -Math.PI / 1.1; 
        
        object.add(snapperGroup);
        object.userData.snapper = snapperGroup; 
    } 
    else if (rand < trapChance + 0.08) { 
        // Chili Power-Up
        const chili = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.8, 12), new THREE.MeshStandardMaterial({ color: 0xe74c3c }));
        chili.rotation.x = Math.PI / 2;
        chili.castShadow = true;
        object.add(chili);

        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0x2ecc71 }));
        stem.position.set(0, 0.4, 0);
        chili.add(stem);

        const aura = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshBasicMaterial({ color: 0xe74c3c, transparent: true, opacity: 0.5 }));
        object.add(aura);
        object.add(new THREE.PointLight(0xe74c3c, 0.8, 3));

        object.userData = { type: 'chili', color: 0xe74c3c };
    }
    else {
        // Käse
        const availableTypes = Math.min(GAME.level, 4);
        const cheeseType = Math.floor(Math.random() * availableTypes);
        let mesh, colorHex;

        if (cheeseType === 0) {
            mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16), new THREE.MeshStandardMaterial({ color: 0xFFFF00 })); 
            mesh.rotation.x = Math.PI / 2; colorHex = 0xFFFF00;
        } 
        else if (cheeseType === 1) {
            mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 3), new THREE.MeshStandardMaterial({ color: 0xFAD02C })); 
            mesh.rotation.x = Math.PI / 2; colorHex = 0xFAD02C;
        }
        else if (cheeseType === 2) {
            mesh = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), new THREE.MeshStandardMaterial({ color: 0xE74C3C })); 
            mesh.scale.set(1, 0.6, 1); colorHex = 0xE74C3C;
        }
        else {
            mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16), new THREE.MeshStandardMaterial({ color: 0xF5F5F5 })); 
            mesh.rotation.x = Math.PI / 2; colorHex = 0xF5F5F5;
        }
        mesh.castShadow = true;
        object.add(mesh);

        const aura = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.4 }));
        object.add(aura);
        object.add(new THREE.PointLight(colorHex, 0.5, 3));

        object.userData = { type: 'cheese', color: colorHex };
    }
    
    const randomX = (Math.random() - 0.5) * (GAME.horizontalLimit * 2);
    let yPos = 0.5;
    if (object.userData.type === 'trap') yPos = 0;
    if (object.userData.type === 'cheese' && object.children[0].geometry.type === 'SphereGeometry') yPos = 0.3;
    if (object.userData.type === 'chili') yPos = 0.4;
    
    object.position.set(randomX, yPos, -60); 
    GAME.scene.add(object);
    GAME.entities.push(object);
};

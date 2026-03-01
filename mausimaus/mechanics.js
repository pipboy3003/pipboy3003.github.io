// Timestamp: 2026-03-01 10:25:00 CET

GAME.spawnEntity = function() {
    const rand = Math.random();
    let object = new THREE.Group();
    let type = 'cheese';

    if (rand < 0.2) { // Hindernisse
        const obsRand = Math.random();
        if (obsRand < 0.3 && GAME.level >= 3) {
            object = GAME.createClothesline();
            object.userData = { type: 'clothesline' };
        } else if (obsRand < 0.6) {
            object = GAME.createPuddle();
            object.userData = { type: 'puddle' };
        } else {
            const board = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 3), new THREE.MeshStandardMaterial({ color: 0x8b5a2b }));
            object.add(board);
            const snapper = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 2.4), new THREE.MeshStandardMaterial({ color: 0xaaa }));
            snapper.position.set(0, 0.2, -1.2);
            snapper.rotation.x = -Math.PI / 1.1;
            object.add(snapper);
            object.userData = { type: 'trap', snapper: snapper };
        }
    } else { // Käse oder Chili
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16), new THREE.MeshStandardMaterial({ color: 0xffff00 }));
        mesh.rotation.x = Math.PI / 2;
        object.add(mesh);
        object.userData = { type: 'cheese', color: 0xffff00 };
    }
    
    const randomX = (object.userData.type === 'clothesline') ? 0 : (Math.random() - 0.5) * (GAME.horizontalLimit * 2);
    object.position.set(randomX, 0.5, -80); 
    GAME.scene.add(object);
    GAME.entities.push(object);
};

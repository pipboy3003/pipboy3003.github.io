// Timestamp: 2026-03-01 10:15:00 CET

GAME.spawnEntity = function() {
    const roll = Math.random();
    let type = 'cheese';
    let color = 0xffcc00;

    if (roll < 0.2) { type = 'trap'; color = 0x888888; }
    else if (roll < 0.25) { type = 'chili'; color = 0xff3300; }

    // Fix: Nutzt exakt das berechnete Limit aus der Grafik-Engine
    const margin = 0.5; 
    const spawnX = (Math.random() * (GAME.horizontalLimit * 2 - margin * 2)) - (GAME.horizontalLimit - margin);

    const geometry = type === 'trap' ? new THREE.BoxGeometry(1.2, 0.2, 0.8) : new THREE.SphereGeometry(0.4, 8, 8);
    const material = new THREE.MeshPhongMaterial({ color: color });
    const entity = new THREE.Mesh(geometry, material);

    entity.position.set(spawnX, 0.5, -100);
    entity.userData = { type: type, color: color };

    if (type === 'trap') {
        const snapper = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 0.7), new THREE.MeshPhongMaterial({ color: 0x444444 }));
        snapper.position.y = 0.2;
        snapper.rotation.x = -Math.PI * 0.8;
        entity.add(snapper);
        entity.userData.snapper = snapper;
    }

    GAME.scene.add(entity);
    GAME.entities.push(entity);
};

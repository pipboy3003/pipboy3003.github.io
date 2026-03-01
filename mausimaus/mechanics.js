// [2026-03-01 10:22:00] mechanics.js - Hindernis-Erweiterung

GAME.spawnEntity = function() {
    const rand = Math.random();
    let object = new THREE.Group();
    let type = 'cheese';

    // Höhere Level = mehr Hindernisse
    const obstacleChance = Math.min(0.2 + (GAME.level * 0.05), 0.6);

    if (rand < obstacleChance) {
        const obsRand = Math.random();
        
        if (obsRand < 0.3 && GAME.level >= 3) {
            // WÄSCHELEINE (Breites Hindernis)
            object = GAME.createClothesline();
            object.userData = { type: 'clothesline' };
            type = 'trap'; // Wir behandeln es wie eine Falle bei Kollision
        } 
        else if (obsRand < 0.6) {
            // PFÜTZE (Verlangsamt die Maus?)
            object = GAME.createPuddle();
            object.userData = { type: 'puddle' };
            type = 'puddle';
        }
        else {
            // KLASSISCHE FALLE
            // ... (Dein existierender Fallen-Code hier) ...
            object.userData = { type: 'trap' };
        }
    } 
    else if (rand < obstacleChance + 0.05) {
        // CHILI
        // ... (Dein Chili-Code) ...
    }
    else {
        // KÄSE
        // ... (Dein Käse-Code) ...
    }

    // Positionierung
    const randomX = (type === 'clothesline') ? 0 : (Math.random() - 0.5) * (GAME.horizontalLimit * 2);
    object.position.set(randomX, 0, -80); 
    
    GAME.scene.add(object);
    GAME.entities.push(object);
};

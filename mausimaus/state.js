// Timestamp: 2026-03-01 09:55:33 CET

window.GAME = {
    // Konstanten für den Spielstatus
    STATE_START: 0,
    STATE_TRANSITION: 1,
    STATE_PLAYING: 2,
    STATE_CUTSCENE: 3,
    STATE_GAMEOVER: 4,

    // Spiel-Logik Variablen
    state: 0, // Startet bei STATE_START
    score: 0,
    level: 1,
    fatness: 1,
    MAX_FATNESS: 3,
    
    // Arrays für Objekte in der Welt
    entities: [],
    particles: [],
    grassBlades: [],
    
    // Timer & Events
    spawnTimer: 0,
    hitTrap: null,
    startAngle: 0,
    
    // Katzen-Logik
    catState: 0,
    catSide: 1,
    catTimer: 0,
    shakeTimer: 0,
    
    // Steuerung & Kamera-Limits
    horizontalLimit: 14,
    moveLeft: false,
    moveRight: false,
    isPointerDown: false,
    
    // Standard Kamera-Positionen
    defaultCameraPos: new THREE.Vector3(0, 6, 12),
    menuCameraPos: new THREE.Vector3(0, 12, 14),

    // Referenzen (Werden in graphics.js befüllt)
    scene: null,
    camera: null,
    renderer: null,
    mouseGroup: null,
    bodyMesh: null,
    tailMesh: null,
    leftEar: null,
    rightEar: null,
    catGroup: null,
    catShadow: null
};

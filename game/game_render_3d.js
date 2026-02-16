// [2026-02-16 12:00:00] game_render_3d.js - WebGL & Three.js Renderer (No Assets Required)

Object.assign(Game, {
    // --- THREE.JS GLOBALS ---
    scene: null,
    camera: null,
    renderer: null,
    composer: null,
    playerMesh: null,
    walls: [],
    
    // Config
    TILE_SIZE: 1, // Wir skalieren die Welt auf 1 Unit pro Tile (einfacher für Three.js)
    
    // Materials (werden in initCache erstellt)
    mats: {},

    // Override Init: Startet Three.js statt 2D Canvas
    initCanvas: function() {
        const cvs = document.getElementById('game-canvas');
        if(!cvs) return;
        const viewContainer = document.getElementById('view-container');
        
        // 1. Scene & Camera
        this.scene = new THREE.Scene();
        // Nebel für Atmosphäre
        this.scene.fog = new THREE.FogExp2(0x050505, 0.15); 
        this.scene.background = new THREE.Color(0x000000);

        const aspect = viewContainer.clientWidth / viewContainer.clientHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
        this.camera.position.set(0, 10, 5);
        this.camera.lookAt(0, 0, 0);

        // 2. Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: cvs, 
            antialias: false,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(viewContainer.clientWidth, viewContainer.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 3. Post-Processing (BLOOM)
        const renderScene = new THREE.RenderPass(this.scene, this.camera);
        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(viewContainer.clientWidth, viewContainer.clientHeight),
            1.5, 0.4, 0.85
        );
        bloomPass.threshold = 0.2;
        bloomPass.strength = 1.2; // Glow Stärke
        bloomPass.radius = 0.5;

        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(bloomPass);

        // 4. Init Materials (Prozedural)
        this.initMaterials();

        // 5. Start Loop
        if(this.loopId) cancelAnimationFrame(this.loopId);
        this.drawLoop();
        
        console.log("WebGL Renderer Initialized");
    },

    // Erstellt Texturen/Materialien ohne Bilddateien
    initMaterials: function() {
        const texLoader = new THREE.TextureLoader();
        
        // Helper: Canvas texture generator für Noise
        const createNoiseTexture = (colorHex) => {
            const size = 64;
            const canvas = document.createElement('canvas');
            canvas.width = size; canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = colorHex;
            ctx.fillRect(0,0,size,size);
            
            // Noise overlay
            for(let i=0; i<400; i++) {
                ctx.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
                ctx.fillRect(Math.random()*size, Math.random()*size, 2, 2);
            }
            const tex = new THREE.CanvasTexture(canvas);
            tex.magFilter = THREE.NearestFilter;
            return tex;
        };

        this.mats.wall = new THREE.MeshStandardMaterial({ 
            map: createNoiseTexture('#222222'),
            roughness: 0.9, 
            metalness: 0.1 
        });
        
        this.mats.floor = new THREE.MeshStandardMaterial({ 
            map: createNoiseTexture('#111111'),
            roughness: 0.8,
            metalness: 0.0
        });

        // Glowing Materials for POIs
        this.mats.vault = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 2 });
        this.mats.enemy = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1 });
        this.mats.loot = new THREE.MeshStandardMaterial({ color: 0x39ff14, emissive: 0x39ff14, emissiveIntensity: 0.8 });
    },

    // Wird aufgerufen, wenn Sektor gewechselt wird
    renderStaticMap: function() {
        if(!this.scene) return;
        
        // 1. Clear Scene (behalte Licht am Spieler, falls existent, sonst alles weg)
        // Einfachheitshalber: Alles weg, Player neu bauen.
        while(this.scene.children.length > 0){ 
            this.scene.remove(this.scene.children[0]); 
        }

        if(!this.state.currentMap) return;

        // 2. Build Floor & Walls
        const geoWall = new THREE.BoxGeometry(this.TILE_SIZE, this.TILE_SIZE * 1.5, this.TILE_SIZE);
        const geoFloor = new THREE.PlaneGeometry(this.TILE_SIZE, this.TILE_SIZE);
        
        const mapW = this.MAP_W;
        const mapH = this.MAP_H;

        // Group für statische Welt
        const worldGroup = new THREE.Group();
        this.scene.add(worldGroup);

        for(let y=0; y<mapH; y++) {
            for(let x=0; x<mapW; x++) {
                const type = this.state.currentMap[y][x];
                const px = x * this.TILE_SIZE;
                const pz = y * this.TILE_SIZE;

                // BODEN (Überall)
                const floor = new THREE.Mesh(geoFloor, this.mats.floor);
                floor.rotation.x = -Math.PI / 2;
                floor.position.set(px, 0, pz);
                floor.receiveShadow = true;
                worldGroup.add(floor);

                // OBJEKTE
                if(type === '#') {
                    const wall = new THREE.Mesh(geoWall, this.mats.wall);
                    wall.position.set(px, this.TILE_SIZE * 0.75, pz);
                    wall.castShadow = true;
                    wall.receiveShadow = true;
                    worldGroup.add(wall);
                }
                else if(type === 'V') { // Vault
                    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16), this.mats.vault);
                    v.position.set(px, 0.1, pz);
                    worldGroup.add(v);
                    
                    // Schwebendes Label? Vorerst einfach Glow.
                }
                else if(['M', 'W'].includes(type)) { // Monster
                    const m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), this.mats.enemy);
                    m.position.set(px, 0.5, pz);
                    worldGroup.add(m);
                }
                else if(['X', 'B', 't', 'T'].includes(type)) { // Loot
                    const l = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), this.mats.loot);
                    l.position.set(px, 0.2, pz);
                    l.rotation.y = Math.random();
                    worldGroup.add(l);
                }
            }
        }

        // 3. Player Setup
        this.createPlayer();
    },

    createPlayer: function() {
        // Player Container
        this.playerMesh = new THREE.Group();
        
        // Körper (Unsichtbar oder angedeutet, damit Schatten korrekt fallen?)
        // Wir machen ihn klein und unsichtbar, die Kamera ist der "Kopf"
        
        // TASCHENLAMPE (SpotLight)
        const spotLight = new THREE.SpotLight(0xffffee, 2, 15, Math.PI / 6, 0.5, 1);
        spotLight.position.set(0, 2, 0); // Über dem Kopf
        spotLight.target.position.set(0, 0, -3); // Leuchtet nach vorne
        spotLight.castShadow = true;
        spotLight.shadow.bias = -0.0001;
        
        this.playerMesh.add(spotLight);
        this.playerMesh.add(spotLight.target);
        
        // Kleines Ambient Light um Spieler herum (damit man nicht komplett blind ist in Ecken)
        const pointLight = new THREE.PointLight(0x39ff14, 0.2, 5);
        this.playerMesh.add(pointLight);

        this.scene.add(this.playerMesh);
    },

    // Der Loop
    draw: function() {
        if(!this.renderer || !this.scene || !this.playerMesh) return;
        
        const cvs = this.renderer.domElement;
        // Resize Check
        if (cvs.width !== cvs.clientWidth || cvs.height !== cvs.clientHeight) {
            this.renderer.setSize(cvs.clientWidth, cvs.clientHeight, false);
            this.composer.setSize(cvs.clientWidth, cvs.clientHeight);
            this.camera.aspect = cvs.clientWidth / cvs.clientHeight;
            this.camera.updateProjectionMatrix();
        }

        // 1. Sync Player Pos
        const targetX = this.state.player.x * this.TILE_SIZE;
        const targetZ = this.state.player.y * this.TILE_SIZE;
        
        // Smooth Movement
        this.playerMesh.position.x += (targetX - this.playerMesh.position.x) * 0.2;
        this.playerMesh.position.z += (targetZ - this.playerMesh.position.z) * 0.2;
        
        // Rotation (Blickrichtung)
        // Wir nehmen den Rotation-Wert aus Game.state.player.rot (Radiants)
        // Aber Achtung: In game_map ist 0 = oben (bei -y). In 3D ist -z "vorne".
        // Das Mapping muss passen.
        this.playerMesh.rotation.y = -this.state.player.rot + Math.PI; 

        // 2. Camera Follow (Top Down, slightly angled)
        this.camera.position.x = this.playerMesh.position.x;
        this.camera.position.z = this.playerMesh.position.z + 4; // Hinter/Über Spieler
        this.camera.position.y = 8; // Höhe
        this.camera.lookAt(this.playerMesh.position.x, 0, this.playerMesh.position.z);

        // 3. Render
        // Statt renderer.render nehmen wir composer.render für Bloom
        this.composer.render();
    },

    // Kompatibilität: Dummy-Funktionen für Dinge, die game_core.js vielleicht aufruft
    initCache: function() { 
        // Brauchen wir in 3D nicht mehr, aber Funktion muss existieren
    },
    
    // Text zeichnen?
    // game_core.js nutzt drawText. 
    // Wir können versuchen, das auf ein 2D-Overlay zu mappen, aber
    // für diesen Schritt lassen wir es leer, damit es keine Fehler wirft.
    // Die wichtigsten Infos sind im UI HTML.
    drawText: function(ctx, text, x, y, size, color) {
        // Ignorieren, da wir kein 2D Context mehr auf dem Main Canvas haben.
    }
});

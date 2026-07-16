/*
[2026-07-16 21:32 CEST] Phase 3 Fehlerbehebung: Array-Tilemap statt fehlerhaftem Tiled-JSON.
- Leerer Spielbereich durch ungültige Tileset-Zuordnung behoben.
- Weltdefinition direkt in game.js überführt.
- Ground, Collision, Spawn, Safe-Zone und POI sauber als Datenstruktur angelegt.
[2026-07-16 21:23 CEST] Phase 3 gestartet: echte Starter-Town als Datenwelt ergänzt.
- Tilemap-JSON wird geladen und als Map gerendert.
- Spawnpoint, Kollision und Kamera an Weltgröße gekoppelt.
- Dummy-Preview durch strukturierte Weltbasis ersetzt.
[2026-07-16 11:44 CEST] Game-Preview in eigenes Modul ausgelagert.
*/

export function createGameModule({
  gameContainer,
  worldPanel,
  log
}) {
  let gameInstance = null;

  const WORLD = {
    key: "starter-town",
    tileSize: 32,
    width: 24,
    height: 18,
    spawn: { x: 12, y: 14 },
    safeZones: [
      { x: 11, y: 8, width: 2, height: 1 }
    ],
    pointsOfInterest: [
      { x: 12, y: 2, label: "North Gate" }
    ],
    groundData: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,2,1],
      [1,2,3,4,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,4,3,2,1],
      [1,2,3,3,3,2,2,2,2,5,5,5,5,5,2,2,2,2,2,3,3,3,2,1],
      [1,2,2,2,2,2,2,2,2,5,6,6,6,5,2,2,2,2,2,2,2,2,2,1],
      [1,2,2,2,2,2,2,2,2,5,6,7,6,5,2,2,2,2,2,2,2,2,2,1],
      [1,2,2,2,2,2,2,2,2,5,6,6,6,5,2,2,2,2,2,2,2,2,2,1],
      [1,2,2,2,2,2,2,2,2,5,5,8,5,5,2,2,2,2,2,2,2,2,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,8,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,8,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,8,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,8,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,8,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,8,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,8,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    collisionData: [
      [9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],
      [9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9],
      [9,0,10,10,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,10,10,0,9],
      [9,0,10,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,0,10,0,9],
      [9,0,10,10,10,0,0,0,0,11,11,11,11,11,0,0,0,0,0,10,10,10,0,9],
      [9,0,0,0,0,0,0,0,0,11,0,0,0,11,0,0,0,0,0,0,0,0,0,9],
      [9,0,0,0,0,0,0,0,0,11,0,0,0,11,0,0,0,0,0,0,0,0,0,9],
      [9,0,0,0,0,0,0,0,0,11,0,0,0,11,0,0,0,0,0,0,0,0,0,9],
      [9,0,0,0,0,0,0,0,0,11,11,0,11,11,0,0,0,0,0,0,0,0,0,9],
      [9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9],
      [9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9],
      [9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9],
      [9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9],
      [9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9],
      [9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9],
      [9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9],
      [9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9],
      [9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9]
    ]
  };

  function createFallbackTilesTexture(scene) {
    const tileSize = WORLD.tileSize;
    const canvas = scene.textures.createCanvas("starter-town-tiles", tileSize * 4, tileSize * 3);
    const ctx = canvas.context;

    const paintTile = (index, draw) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = col * tileSize;
      const y = row * tileSize;
      draw(ctx, x, y, tileSize);
    };

    paintTile(0, (c, x, y, s) => {
      c.fillStyle = "#5b4631";
      c.fillRect(x, y, s, s);
      c.fillStyle = "#7e6242";
      c.fillRect(x + 2, y + 2, s - 4, s - 4);
    });

    paintTile(1, (c, x, y, s) => {
      c.fillStyle = "#6f8f4e";
      c.fillRect(x, y, s, s);
      c.fillStyle = "#7ea55b";
      for (let i = 0; i < 24; i += 1) {
        c.fillRect(x + ((i * 11) % s), y + ((i * 7) % s), 3, 3);
      }
    });

    paintTile(2, (c, x, y, s) => {
      c.fillStyle = "#8d7750";
      c.fillRect(x, y, s, s);
      c.fillStyle = "#9f8961";
      c.fillRect(x, y + s / 2 - 3, s, 6);
      c.fillRect(x + s / 2 - 3, y, 6, s);
    });

    paintTile(3, (c, x, y, s) => {
      c.fillStyle = "#3f6e3a";
      c.fillRect(x, y, s, s);
      c.fillStyle = "#295127";
      c.beginPath();
      c.arc(x + s / 2, y + s / 2, 9, 0, Math.PI * 2);
      c.fill();
    });

    paintTile(4, (c, x, y, s) => {
      c.fillStyle = "#8a6845";
      c.fillRect(x, y, s, s);
      c.fillStyle = "#6d4e32";
      c.fillRect(x + 4, y + 4, s - 8, s - 8);
    });

    paintTile(5, (c, x, y, s) => {
      c.fillStyle = "#7d6856";
      c.fillRect(x, y, s, s);
      c.fillStyle = "#9a8572";
      c.fillRect(x + 3, y + 3, s - 6, s - 6);
    });

    paintTile(6, (c, x, y, s) => {
      c.fillStyle = "#a99177";
      c.fillRect(x, y, s, s);
      c.fillStyle = "#c2ac94";
      c.fillRect(x + 5, y + 5, s - 10, s - 10);
    });

    paintTile(7, (c, x, y, s) => {
      c.fillStyle = "#c6ab77";
      c.fillRect(x, y, s, s);
      c.fillStyle = "#e3ca94";
      c.fillRect(x + 6, y + 6, s - 12, s - 12);
    });

    paintTile(8, (c, x, y, s) => {
      c.fillStyle = "#8b7455";
      c.fillRect(x, y, s, s);
      c.fillStyle = "#d3bc8d";
      c.fillRect(x + s / 2 - 4, y, 8, s);
    });

    paintTile(9, (c, x, y, s) => {
      c.clearRect(x, y, s, s);
      c.fillStyle = "rgba(180, 70, 70, 0.35)";
      c.fillRect(x, y, s, s);
    });

    paintTile(10, (c, x, y, s) => {
      c.fillStyle = "rgba(170, 120, 80, 0.5)";
      c.fillRect(x, y, s, s);
    });

    paintTile(11, (c, x, y, s) => {
      c.fillStyle = "rgba(200, 160, 90, 0.5)";
      c.fillRect(x, y, s, s);
    });

    canvas.refresh();
  }

  function createPlayerTexture(scene) {
    const size = 28;
    const canvas = scene.textures.createCanvas("player-token", size, size);
    const ctx = canvas.context;

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#d4b878";
    ctx.beginPath();
    ctx.arc(size / 2, 9, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#2a4058";
    ctx.fillRect(8, 15, 12, 9);

    ctx.fillStyle = "#59b9ac";
    ctx.fillRect(10, 17, 8, 5);

    canvas.refresh();
  }

  function createWorldScene() {
    return class WorldScene extends Phaser.Scene {
      constructor() {
        super("world-scene");
        this.player = null;
        this.cursors = null;
        this.inputKeys = null;
        this.map = null;
        this.collisionLayer = null;
        this.statusText = null;
      }

      preload() {}

      create() {
        createFallbackTilesTexture(this);
        createPlayerTexture(this);

        this.map = this.make.tilemap({
          data: WORLD.groundData,
          tileWidth: WORLD.tileSize,
          tileHeight: WORLD.tileSize
        });

        const tileset = this.map.addTilesetImage(
          "starter-town-tiles",
          "starter-town-tiles",
          WORLD.tileSize,
          WORLD.tileSize,
          0,
          0,
          1
        );

        const groundLayer = this.map.createLayer(0, tileset, 0, 0);
        groundLayer.setDepth(0);

        const collisionMap = this.make.tilemap({
          data: WORLD.collisionData,
          tileWidth: WORLD.tileSize,
          tileHeight: WORLD.tileSize
        });

        const collisionTileset = collisionMap.addTilesetImage(
          "starter-town-tiles",
          "starter-town-tiles",
          WORLD.tileSize,
          WORLD.tileSize,
          0,
          0,
          1
        );

        this.collisionLayer = collisionMap.createLayer(0, collisionTileset, 0, 0);
        this.collisionLayer.setDepth(1);
        this.collisionLayer.setVisible(false);
        this.collisionLayer.setCollision([9, 10, 11]);

        WORLD.safeZones.forEach((zone) => {
          this.add.rectangle(
            zone.x * WORLD.tileSize,
            zone.y * WORLD.tileSize,
            zone.width * WORLD.tileSize,
            zone.height * WORLD.tileSize,
            0x59b9ac,
            0.16
          )
            .setOrigin(0, 0)
            .setDepth(2);
        });

        WORLD.pointsOfInterest.forEach((poi) => {
          this.add.circle(
            poi.x * WORLD.tileSize + WORLD.tileSize / 2,
            poi.y * WORLD.tileSize + WORLD.tileSize / 2,
            7,
            0xd4b878,
            0.88
          ).setDepth(3);
        });

        const spawnX = WORLD.spawn.x * WORLD.tileSize + WORLD.tileSize / 2;
        const spawnY = WORLD.spawn.y * WORLD.tileSize + WORLD.tileSize / 2;

        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        this.player = this.physics.add.sprite(spawnX, spawnY, "player-token");
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(4);
        this.player.body.setSize(18, 20);
        this.player.body.setOffset(5, 6);

        this.physics.add.collider(this.player, this.collisionLayer);

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player, true, 0.14, 0.14);
        this.cameras.main.setZoom(1.6);

        this.cursors = this.input.keyboard.createCursorKeys();
        const wasd = this.input.keyboard.addKeys("W,A,S,D");

        this.inputKeys = {
          up: [this.cursors.up, wasd.W],
          down: [this.cursors.down, wasd.S],
          left: [this.cursors.left, wasd.A],
          right: [this.cursors.right, wasd.D]
        };

        this.statusText = this.add.text(12, 12, "Starter Town", {
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          color: "#eef2f7",
          backgroundColor: "rgba(9, 12, 17, 0.72)",
          padding: { x: 10, y: 6 }
        }).setScrollFactor(0).setDepth(10);

        log("Phase 3 geladen: Starter Town aktiv.");
      }

      update() {
        if (!this.player) {
          return;
        }

        const speed = 150;
        let velocityX = 0;
        let velocityY = 0;

        const isDown = (keys) => keys.some((key) => key?.isDown);

        if (isDown(this.inputKeys.left)) {
          velocityX = -speed;
        } else if (isDown(this.inputKeys.right)) {
          velocityX = speed;
        }

        if (isDown(this.inputKeys.up)) {
          velocityY = -speed;
        } else if (isDown(this.inputKeys.down)) {
          velocityY = speed;
        }

        this.player.setVelocity(velocityX, velocityY);

        if (velocityX !== 0 && velocityY !== 0) {
          this.player.body.velocity.normalize().scale(speed);
        }

        const tileX = Math.floor(this.player.x / WORLD.tileSize);
        const tileY = Math.floor(this.player.y / WORLD.tileSize);

        this.statusText.setText([
          "Starter Town",
          `Position: ${tileX}, ${tileY}`,
          "Move: WASD / Pfeiltasten"
        ]);
      }
    };
  }

  function mountPhaserGame() {
    if (gameInstance || typeof Phaser === "undefined") {
      return;
    }

    const config = {
      type: Phaser.AUTO,
      parent: gameContainer,
      width: WORLD.width * WORLD.tileSize,
      height: WORLD.height * WORLD.tileSize,
      backgroundColor: "#0b1016",
      pixelArt: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      physics: {
        default: "arcade",
        arcade: {
          debug: false
        }
      },
      scene: createWorldScene()
    };

    gameInstance = new Phaser.Game(config);
    worldPanel.dataset.worldReady = "true";
  }

  return {
    mountPhaserGame
  };
}

/*
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
    height: 18
  };

  function injectWorldAssets(scene) {
    scene.load.tilemapTiledJSON("starter-town-map", "./assets/maps/starter-town.json");
  }

  function createFallbackTilesTexture(scene) {
    const tileSize = WORLD.tileSize;
    const canvas = scene.textures.createCanvas("starter-town-tiles", tileSize * 4, tileSize * 3);
    const ctx = canvas.context;

    const paintTile = (index, draw) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = col * tileSize;
      const y = row * tileSize;

      ctx.clearRect(x, y, tileSize, tileSize);
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
      c.fillStyle = "rgba(0,0,0,0)";
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
        this.map = null;
        this.collisionLayer = null;
        this.spawnPoint = { x: 384, y: 448 };
        this.statusText = null;
      }

      preload() {
        injectWorldAssets(this);
      }

      create() {
        createFallbackTilesTexture(this);
        createPlayerTexture(this);

        this.map = this.make.tilemap({ key: "starter-town-map" });

        const tiles = this.map.addTilesetImage("starter-town-tiles", "starter-town-tiles", 32, 32, 0, 0);

        const groundLayer = this.map.createLayer("Ground", tiles, 0, 0);
        this.collisionLayer = this.map.createLayer("Collision", tiles, 0, 0);

        if (groundLayer) {
          groundLayer.setDepth(0);
        }

        if (this.collisionLayer) {
          this.collisionLayer.setDepth(1);
          this.collisionLayer.setVisible(false);
          this.collisionLayer.setCollisionByExclusion([-1, 0], true);
        }

        const objectLayer = this.map.getObjectLayer("Objects");
        if (objectLayer?.objects?.length) {
          const spawnObject = objectLayer.objects.find((obj) => obj.name === "spawn");
          if (spawnObject) {
            this.spawnPoint = {
              x: spawnObject.x + 16,
              y: spawnObject.y - 16
            };
          }

          objectLayer.objects.forEach((obj) => {
            if (obj.type === "safe-zone") {
              this.add.rectangle(obj.x, obj.y - obj.height, obj.width, obj.height, 0x59b9ac, 0.12)
                .setOrigin(0, 0)
                .setDepth(2);
            }

            if (obj.type === "poi") {
              this.add.circle(obj.x + 16, obj.y - 16, 7, 0xd4b878, 0.8).setDepth(3);
            }
          });
        }

        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        this.player = this.physics.add.sprite(this.spawnPoint.x, this.spawnPoint.y, "player-token");
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(4);
        this.player.body.setSize(18, 20);
        this.player.body.setOffset(5, 6);

        if (this.collisionLayer) {
          this.physics.add.collider(this.player, this.collisionLayer);
        }

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

        if (this.statusText) {
          this.statusText.setText([
            "Starter Town",
            `Position: ${tileX}, ${tileY}`,
            "Move: WASD / Pfeiltasten"
          ]);
        }
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

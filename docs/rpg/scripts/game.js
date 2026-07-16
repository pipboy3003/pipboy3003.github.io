/*
[2026-07-16 11:44 CEST] Phaser- und Preview-Logik ausgelagert.
- World-Preview in eigenes Modul verschoben.
- Canvas-Sync und Resize-Logging getrennt vom App-Entry.
*/

const GAME_WIDTH = 960;
const GAME_HEIGHT = 420;

export function createGameModule({ gameContainer, worldPanel, log }) {
  const state = {
    gameInstance: null,
    resizeObserver: null,
    lastSizes: {
      panel: "",
      container: "",
      canvas: ""
    }
  };

  function syncCanvasToContainer() {
    const canvas = gameContainer.querySelector("canvas");
    if (!canvas) {
      return;
    }

    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    canvas.style.width = `${GAME_WIDTH}px`;
    canvas.style.height = `${GAME_HEIGHT}px`;
    canvas.style.maxWidth = "none";
    canvas.style.maxHeight = "none";
    canvas.style.display = "block";
    canvas.style.margin = "0 auto";
  }

  function observeWorldPreviewSizes() {
    if (!window.ResizeObserver || state.resizeObserver) {
      return;
    }

    const canvas = gameContainer.querySelector("canvas");
    if (!canvas || !worldPanel || !gameContainer) {
      return;
    }

    state.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const target = entry.target;
        const width = Math.round(entry.contentRect.width);
        const height = Math.round(entry.contentRect.height);

        let key = "";
        let label = "";

        if (target === worldPanel) {
          key = "panel";
          label = "WorldPanel";
        } else if (target === gameContainer) {
          key = "container";
          label = "GameContainer";
        } else if (target === canvas) {
          key = "canvas";
          label = "Canvas";
        }

        if (!key) {
          continue;
        }

        const value = `${width}x${height}`;
        if (state.lastSizes[key] !== value) {
          state.lastSizes[key] = value;
          log(`${label} Größe: ${value}`);
        }
      }
    });

    state.resizeObserver.observe(worldPanel);
    state.resizeObserver.observe(gameContainer);
    state.resizeObserver.observe(canvas);
  }

  function mountPhaserGame() {
    if (!window.Phaser) {
      log("Phaser konnte nicht geladen werden.");
      return;
    }

    if (state.gameInstance) {
      return;
    }

    gameContainer.innerHTML = "";

    class LobbyScene extends Phaser.Scene {
      constructor() {
        super("LobbyScene");
      }

      create() {
        const width = GAME_WIDTH;
        const height = GAME_HEIGHT;

        const background = this.add.graphics();
        background.fillGradientStyle(0x081019, 0x081019, 0x132437, 0x132437, 1);
        background.fillRect(0, 0, width, height);

        const rings = this.add.graphics({ lineStyle: { width: 1, color: 0x2f7f85, alpha: 0.22 } });
        for (let i = 0; i < 22; i += 1) {
          const x = Phaser.Math.Between(20, width - 20);
          const y = Phaser.Math.Between(20, height - 20);
          const r = Phaser.Math.Between(18, 88);
          rings.strokeCircle(x, y, r);
        }

        const title = this.add.text(width / 2, 88, "RPG ONLINE", {
          fontFamily: "Cinzel, serif",
          fontSize: "36px",
          color: "#f1d79a"
        }).setOrigin(0.5);

        this.add.text(width / 2, 132, "Phase 2 · Character Selection Realm", {
          fontFamily: "Inter, sans-serif",
          fontSize: "16px",
          color: "#96a3b4"
        }).setOrigin(0.5);

        const portal = this.add.circle(width / 2, height / 2 + 28, 74, 0x183d52, 0.9);
        const portalRing = this.add.circle(width / 2, height / 2 + 28, 108);
        portalRing.setStrokeStyle(4, 0xd4b878, 0.85);

        const player = this.add.rectangle(width / 2, height / 2 + 28, 26, 42, 0xd4b878, 1);
        const playerHead = this.add.circle(width / 2, height / 2 - 6, 12, 0xf4dfb0, 1);

        this.add.text(
          width / 2,
          height - 64,
          "Wähle deinen Helden und betrete bald die erste persistente Zone.",
          {
            fontFamily: "Inter, sans-serif",
            fontSize: "15px",
            color: "#d9e1ea",
            align: "center",
            wordWrap: { width: width - 80 }
          }
        ).setOrigin(0.5);

        this.tweens.add({
          targets: [portal, portalRing],
          scale: { from: 0.97, to: 1.03 },
          alpha: { from: 0.85, to: 1 },
          duration: 1800,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut"
        });

        this.tweens.add({
          targets: [player, playerHead],
          y: "-=10",
          duration: 1600,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut"
        });

        this.tweens.add({
          targets: title,
          alpha: { from: 0.72, to: 1 },
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut"
        });

        this.add.text(24, 24, "Viewport live", {
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          color: "#59b9ac"
        });

        this.add.text(width - 24, 24, "GitHub + Firebase", {
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          color: "#d4b878"
        }).setOrigin(1, 0);

        this.add.text(width / 2, height / 2 + 160, "Choose Hero Soon", {
          fontFamily: "Cinzel, serif",
          fontSize: "22px",
          color: "#f0d79e"
        }).setOrigin(0.5);

        log("Phaser-Viewport erfolgreich initialisiert.");
        syncCanvasToContainer();
        observeWorldPreviewSizes();
      }
    }

    const config = {
      type: Phaser.CANVAS,
      parent: gameContainer.id,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: "#081019",
      scene: [LobbyScene],
      scale: {
        mode: Phaser.Scale.NONE,
        width: GAME_WIDTH,
        height: GAME_HEIGHT
      },
      autoRound: true,
      render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false
      }
    };

    state.gameInstance = new Phaser.Game(config);
  }

  return {
    mountPhaserGame
  };
}

/*
[2026-07-16 07:22 CEST] Phase 1 erweitert.
- Phaser-Instanz gegen Doppelinitialisierung abgesichert.
- Game-Container wird vor neuem Mount bereinigt.
- Realtime Database integriert.
- Userdaten und Presence werden bei Login automatisch angelegt bzw. aktualisiert.
[2026-07-16 06:35 CEST] Phase 1 erweitert.
- Realtime Database integriert.
- Userdaten und Presence werden bei Login automatisch angelegt bzw. aktualisiert.
*/

import {
  registerWithEmail,
  loginWithEmail,
  logoutUser,
  watchAuthState
} from "./auth.js";

import {
  ref,
  get,
  set,
  update
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

import { database } from "./firebase-init.js";

const state = {
  authMode: "login",
  currentUser: null,
  gameReady: false,
  gameInstance: null
};

const elements = {
  authModal: document.getElementById("authModal"),
  openAuthBtn: document.getElementById("openAuthBtn"),
  heroAuthBtn: document.getElementById("heroAuthBtn"),
  guestPreviewBtn: document.getElementById("guestPreviewBtn"),
  closeAuthBtn: document.getElementById("closeAuthBtn"),
  authForm: document.getElementById("authForm"),
  emailInput: document.getElementById("emailInput"),
  passwordInput: document.getElementById("passwordInput"),
  submitAuthBtn: document.getElementById("submitAuthBtn"),
  authFeedback: document.getElementById("authFeedback"),
  authStatusText: document.getElementById("authStatusText"),
  logoutBtn: document.getElementById("logoutBtn"),
  loginTabBtn: document.getElementById("loginTabBtn"),
  registerTabBtn: document.getElementById("registerTabBtn"),
  themeToggle: document.getElementById("themeToggle"),
  systemLog: document.getElementById("systemLog"),
  gameContainer: document.getElementById("gameContainer")
};

function appendLog(message) {
  const entry = document.createElement("p");
  const time = new Date().toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  entry.textContent = `[${time}] ${message}`;
  elements.systemLog.prepend(entry);
}

function openModal() {
  elements.authModal.classList.remove("hidden");
  elements.authModal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  elements.authModal.classList.add("hidden");
  elements.authModal.setAttribute("aria-hidden", "true");
}

function setAuthMode(mode) {
  state.authMode = mode;

  const isLogin = mode === "login";
  elements.loginTabBtn.classList.toggle("active", isLogin);
  elements.registerTabBtn.classList.toggle("active", !isLogin);
  elements.submitAuthBtn.textContent = isLogin ? "Einloggen" : "Account erstellen";
  elements.authFeedback.textContent = isLogin
    ? "Melde dich mit deinem Heldenkonto an."
    : "Erstelle deinen ersten Abenteurer-Zugang.";
}

function setTheme() {
  const root = document.documentElement;
  const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  appendLog(`Theme gewechselt: ${next}.`);
}

function updateAuthUI(user) {
  state.currentUser = user;

  if (user) {
    elements.authStatusText.textContent = user.email || `UID ${user.uid}`;
    elements.authFeedback.textContent = `Willkommen, ${user.email ?? user.uid}.`;
    appendLog(`Benutzer angemeldet: ${user.email ?? user.uid}`);
  } else {
    elements.authStatusText.textContent = "Nicht angemeldet";
    elements.authFeedback.textContent = "Noch nicht verbunden.";
    appendLog("Kein Benutzer angemeldet.");
  }
}

function validateAuthInputs(email, password) {
  if (!email || !password) {
    throw new Error("Bitte E-Mail und Passwort eingeben.");
  }

  if (password.length < 6) {
    throw new Error("Das Passwort muss mindestens 6 Zeichen lang sein.");
  }
}

async function ensureUserRecord(user) {
  const userRef = ref(database, `users/${user.uid}`);
  const snapshot = await get(userRef);

  if (!snapshot.exists()) {
    await set(userRef, {
      profile: {
        name: user.email?.split("@")[0] || "Abenteurer",
        class: "warrior",
        level: 1,
        createdAt: Date.now()
      },
      settings: {
        music: true,
        sfx: true
      },
      characterSlots: {
        slot1: {
          name: "Neuer Held",
          class: "warrior",
          level: 1
        },
        slot2: null,
        slot3: null
      }
    });

    appendLog("Neue Userstruktur automatisch angelegt.");
  } else {
    appendLog("Userstruktur bereits vorhanden.");
  }
}

async function updatePresence(user) {
  const presenceRef = ref(database, `presence/${user.uid}`);

  await update(presenceRef, {
    online: true,
    zone: "starter-town",
    x: 12,
    y: 8,
    updatedAt: Date.now()
  });

  appendLog("Presence erfolgreich aktualisiert.");
}

async function initializePlayerData(user) {
  try {
    await ensureUserRecord(user);
    await updatePresence(user);
  } catch (error) {
    appendLog(`Datenbankfehler: ${error?.message || "Unbekannter Fehler"}`);
  }
}

function mountPhaserGame() {
  if (!window.Phaser) {
    appendLog("Phaser konnte nicht geladen werden.");
    return;
  }

  if (state.gameInstance) {
    return;
  }

  elements.gameContainer.innerHTML = "";

  class LobbyScene extends Phaser.Scene {
    constructor() {
      super("LobbyScene");
    }

    create() {
      const width = this.scale.width;
      const height = this.scale.height;

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

      this.add.text(width / 2, 132, "Phase 1 · Foundation Realm", {
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
        "Hier entsteht deine erste Stadt, dein HUD und dein Multiplayer-Layer.",
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

      this.add.text(width / 2, height / 2 + 160, "Enter World Soon", {
        fontFamily: "Cinzel, serif",
        fontSize: "22px",
        color: "#f0d79e"
      }).setOrigin(0.5);

      appendLog("Phaser-Viewport erfolgreich initialisiert.");
    }
  }

  const config = {
    type: Phaser.AUTO,
    parent: "gameContainer",
    width: 960,
    height: 420,
    backgroundColor: "#081019",
    scene: [LobbyScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  };

  state.gameInstance = new Phaser.Game(config);
  state.gameReady = true;
}

async function handleAuthSubmit(event) {
  event.preventDefault();

  const email = elements.emailInput.value.trim();
  const password = elements.passwordInput.value.trim();

  try {
    validateAuthInputs(email, password);
    elements.submitAuthBtn.disabled = true;
    elements.authFeedback.textContent = "Verbindung wird aufgebaut ...";

    if (state.authMode === "login") {
      await loginWithEmail(email, password);
      elements.authFeedback.textContent = "Login erfolgreich.";
      appendLog("Login erfolgreich ausgeführt.");
    } else {
      await registerWithEmail(email, password);
      elements.authFeedback.textContent = "Account erfolgreich erstellt.";
      appendLog("Registrierung erfolgreich ausgeführt.");
    }

    closeModal();
  } catch (error) {
    const message = error?.message || "Authentifizierung fehlgeschlagen.";
    elements.authFeedback.textContent = message;
    appendLog(`Auth-Fehler: ${message}`);
  } finally {
    elements.submitAuthBtn.disabled = false;
  }
}

function bindEvents() {
  elements.openAuthBtn.addEventListener("click", openModal);
  elements.heroAuthBtn.addEventListener("click", openModal);
  elements.closeAuthBtn.addEventListener("click", closeModal);

  elements.guestPreviewBtn.addEventListener("click", () => {
    appendLog("Gastvorschau geöffnet.");
    document.getElementById("gameContainer")?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  });

  elements.loginTabBtn.addEventListener("click", () => setAuthMode("login"));
  elements.registerTabBtn.addEventListener("click", () => setAuthMode("register"));
  elements.themeToggle.addEventListener("click", setTheme);

  elements.logoutBtn.addEventListener("click", async () => {
    try {
      if (state.currentUser) {
        await update(ref(database, `presence/${state.currentUser.uid}`), {
          online: false,
          updatedAt: Date.now()
        });
      }

      await logoutUser();
      appendLog("Benutzer erfolgreich ausgeloggt.");
    } catch (error) {
      appendLog(`Logout-Fehler: ${error?.message || "Unbekannter Fehler"}`);
    }
  });

  elements.authForm.addEventListener("submit", handleAuthSubmit);

  elements.authModal.addEventListener("click", (event) => {
    if (event.target === elements.authModal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.authModal.classList.contains("hidden")) {
      closeModal();
    }
  });
}

function init() {
  setAuthMode("login");
  bindEvents();
  mountPhaserGame();

  watchAuthState(async (user) => {
    updateAuthUI(user);

    if (user) {
      await initializePlayerData(user);
    }
  });

  appendLog("Phase 1 initialisiert.");
}

init();

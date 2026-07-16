/*
[2026-07-16 08:24 CEST] Phase 2 implementiert.
- Character-Slots werden aus Firebase geladen.
- Character-Creation-Modal mit Name und Klasse ergänzt.
- Aktiver Charakter wird gespeichert und UI-seitig hervorgehoben.
- Enter World erst mit aktivem Charakter freigegeben.
[2026-07-16 07:34 CEST] Diagnose- und Stabilitätsfix für World Preview.
- Phaser vollständig ohne Auto-Scaling betrieben.
- Canvas mit festen Pixelmaßen erzeugt.
- ResizeObserver für Panel, Container und Canvas hinzugefügt.
- Loggt Größenänderungen sichtbar ins System-Log.
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
  update,
  onValue,
  off
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

import { database } from "./firebase-init.js";

const GAME_WIDTH = 960;
const GAME_HEIGHT = 420;
const DEFAULT_CLASS = "warrior";

const CLASS_DATA = {
  warrior: {
    label: "Warrior",
    hp: 140,
    mana: 40
  },
  mage: {
    label: "Mage",
    hp: 80,
    mana: 140
  },
  ranger: {
    label: "Ranger",
    hp: 100,
    mana: 90
  }
};

const SLOT_LABELS = {
  slot1: "Slot I",
  slot2: "Slot II",
  slot3: "Slot III"
};

const state = {
  authMode: "login",
  currentUser: null,
  gameReady: false,
  gameInstance: null,
  resizeObserver: null,
  selectedSlot: null,
  activeCharacter: null,
  characterSlots: {
    slot1: null,
    slot2: null,
    slot3: null
  },
  userCharactersRef: null,
  userCharactersCallback: null,
  lastSizes: {
    panel: "",
    container: "",
    canvas: ""
  }
};

const elements = {
  authModal: document.getElementById("authModal"),
  openAuthBtn: document.getElementById("openAuthBtn"),
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
  gameContainer: document.getElementById("gameContainer"),
  worldPanel: document.querySelector(".world-panel"),
  slotGrid: document.getElementById("slotGrid"),
  enterWorldBtn: document.getElementById("enterWorldBtn"),
  activeCharacterText: document.getElementById("activeCharacterText"),
  characterModal: document.getElementById("characterModal"),
  closeCharacterBtn: document.getElementById("closeCharacterBtn"),
  characterForm: document.getElementById("characterForm"),
  characterNameInput: document.getElementById("characterNameInput"),
  characterClassInput: document.getElementById("characterClassInput"),
  characterFeedback: document.getElementById("characterFeedback")
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

function openAuthModal() {
  elements.authModal.classList.remove("hidden");
  elements.authModal.setAttribute("aria-hidden", "false");
}

function closeAuthModal() {
  elements.authModal.classList.add("hidden");
  elements.authModal.setAttribute("aria-hidden", "true");
}

function openCharacterModal(slotKey) {
  state.selectedSlot = slotKey;
  elements.characterModal.classList.remove("hidden");
  elements.characterModal.setAttribute("aria-hidden", "false");
  elements.characterNameInput.value = "";
  elements.characterClassInput.value = DEFAULT_CLASS;
  elements.characterFeedback.textContent = `${SLOT_LABELS[slotKey]} wird erstellt.`;
  elements.characterNameInput.focus();
}

function closeCharacterModal() {
  elements.characterModal.classList.add("hidden");
  elements.characterModal.setAttribute("aria-hidden", "true");
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

function sanitizeCharacterName(name) {
  return name.trim().replace(/\s+/g, " ").slice(0, 20);
}

function getClassLabel(classKey) {
  return CLASS_DATA[classKey]?.label ?? "Unknown";
}

function getCharacterSummary(character) {
  if (!character) {
    return "Keiner";
  }

  return `${character.name} · ${getClassLabel(character.class)} · Lvl ${character.level}`;
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
    elements.activeCharacterText.textContent = "Keiner";
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

function validateCharacterInputs(name, classKey) {
  if (!name) {
    throw new Error("Bitte einen Heldennamen eingeben.");
  }

  if (name.length < 3) {
    throw new Error("Der Heldenname muss mindestens 3 Zeichen lang sein.");
  }

  if (!CLASS_DATA[classKey]) {
    throw new Error("Bitte eine gültige Klasse wählen.");
  }
}

async function ensureUserRecord(user) {
  const userRef = ref(database, `users/${user.uid}`);
  const snapshot = await get(userRef);

  if (!snapshot.exists()) {
    await set(userRef, {
      profile: {
        name: user.email?.split("@")[0] || "Abenteurer",
        class: DEFAULT_CLASS,
        level: 1,
        createdAt: Date.now()
      },
      settings: {
        music: true,
        sfx: true
      },
      activeCharacter: null,
      characterSlots: {
        slot1: null,
        slot2: null,
        slot3: null
      }
    });

    appendLog("Neue Userstruktur automatisch angelegt.");
  } else {
    const data = snapshot.val() || {};
    const updates = {};

    if (!Object.prototype.hasOwnProperty.call(data, "activeCharacter")) {
      updates["activeCharacter"] = null;
    }

    if (!data.characterSlots) {
      updates["characterSlots"] = {
        slot1: null,
        slot2: null,
        slot3: null
      };
    }

    if (Object.keys(updates).length > 0) {
      await update(userRef, updates);
      appendLog("Userstruktur für Phase 2 ergänzt.");
    } else {
      appendLog("Userstruktur bereits vorhanden.");
    }
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
    attachCharacterListener(user.uid);
  } catch (error) {
    appendLog(`Datenbankfehler: ${error?.message || "Unbekannter Fehler"}`);
  }
}

function renderCharacterSlots() {
  const buttons = elements.slotGrid.querySelectorAll(".slot-card");

  buttons.forEach((button) => {
    const slotKey = button.dataset.slot;
    const data = state.characterSlots[slotKey];
    const isActive = state.activeCharacter === slotKey;

    const badge = button.querySelector(".slot-badge");
    const name = button.querySelector(".slot-name");
    const meta = button.querySelector(".slot-meta");

    badge.textContent = SLOT_LABELS[slotKey];
    button.classList.toggle("active-slot", isActive);
    button.classList.toggle("filled-slot", Boolean(data));

    if (data) {
      name.textContent = data.name;
      meta.textContent = `${getClassLabel(data.class)} · Level ${data.level}`;
    } else {
      name.textContent = "Leer";
      meta.textContent = "Neuen Helden erstellen";
    }
  });

  const activeData = state.activeCharacter ? state.characterSlots[state.activeCharacter] : null;
  elements.activeCharacterText.textContent = getCharacterSummary(activeData);
  elements.enterWorldBtn.disabled = !activeData;
}

function attachCharacterListener(uid) {
  detachCharacterListener();

  state.userCharactersRef = ref(database, `users/${uid}`);

  state.userCharactersCallback = (snapshot) => {
    const data = snapshot.val() || {};
    state.characterSlots = {
      slot1: data.characterSlots?.slot1 ?? null,
      slot2: data.characterSlots?.slot2 ?? null,
      slot3: data.characterSlots?.slot3 ?? null
    };
    state.activeCharacter = data.activeCharacter ?? null;

    renderCharacterSlots();
    appendLog("Character-Slots synchronisiert.");
  };

  onValue(state.userCharactersRef, state.userCharactersCallback);
}

function detachCharacterListener() {
  if (state.userCharactersRef && state.userCharactersCallback) {
    off(state.userCharactersRef, "value", state.userCharactersCallback);
  }

  state.userCharactersRef = null;
  state.userCharactersCallback = null;
}

async function saveCharacterToSlot(slotKey, payload) {
  if (!state.currentUser) {
    throw new Error("Du musst eingeloggt sein.");
  }

  const userRef = ref(database, `users/${state.currentUser.uid}`);
  const updates = {};
  updates[`characterSlots/${slotKey}`] = payload;
  updates["activeCharacter"] = slotKey;

  await update(userRef, updates);
}

async function setActiveCharacter(slotKey) {
  if (!state.currentUser) {
    throw new Error("Du musst eingeloggt sein.");
  }

  const slotData = state.characterSlots[slotKey];
  if (!slotData) {
    openCharacterModal(slotKey);
    return;
  }

  await update(ref(database, `users/${state.currentUser.uid}`), {
    activeCharacter: slotKey
  });

  appendLog(`${slotData.name} als aktiver Held gesetzt.`);
}

function handleSlotClick(event) {
  const button = event.target.closest(".slot-card");
  if (!button) {
    return;
  }

  if (!state.currentUser) {
    openAuthModal();
    appendLog("Login benötigt, um Character-Slots zu nutzen.");
    return;
  }

  const slotKey = button.dataset.slot;
  const slotData = state.characterSlots[slotKey];

  if (slotData) {
    setActiveCharacter(slotKey).catch((error) => {
      appendLog(`Slot-Fehler: ${error?.message || "Unbekannter Fehler"}`);
    });
  } else {
    openCharacterModal(slotKey);
  }
}

function syncCanvasToContainer() {
  const canvas = elements.gameContainer.querySelector("canvas");
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

  const canvas = elements.gameContainer.querySelector("canvas");
  if (!canvas || !elements.worldPanel || !elements.gameContainer) {
    return;
  }

  state.resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const target = entry.target;
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      let key = "";
      let label = "";

      if (target === elements.worldPanel) {
        key = "panel";
        label = "WorldPanel";
      } else if (target === elements.gameContainer) {
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
        appendLog(`${label} Größe: ${value}`);
      }
    }
  });

  state.resizeObserver.observe(elements.worldPanel);
  state.resizeObserver.observe(elements.gameContainer);
  state.resizeObserver.observe(canvas);
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

      appendLog("Phaser-Viewport erfolgreich initialisiert.");
      syncCanvasToContainer();
      observeWorldPreviewSizes();
    }
  }

  const config = {
    type: Phaser.CANVAS,
    parent: "gameContainer",
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

    closeAuthModal();
  } catch (error) {
    const message = error?.message || "Authentifizierung fehlgeschlagen.";
    elements.authFeedback.textContent = message;
    appendLog(`Auth-Fehler: ${message}`);
  } finally {
    elements.submitAuthBtn.disabled = false;
  }
}

async function handleCharacterSubmit(event) {
  event.preventDefault();

  const rawName = elements.characterNameInput.value;
  const characterName = sanitizeCharacterName(rawName);
  const characterClass = elements.characterClassInput.value;

  try {
    validateCharacterInputs(characterName, characterClass);

    if (!state.selectedSlot) {
      throw new Error("Kein Character-Slot ausgewählt.");
    }

    elements.characterFeedback.textContent = "Charakter wird gespeichert ...";

    const classData = CLASS_DATA[characterClass];
    const payload = {
      name: characterName,
      class: characterClass,
      level: 1,
      stats: {
        hp: classData.hp,
        mana: classData.mana
      },
      createdAt: Date.now()
    };

    await saveCharacterToSlot(state.selectedSlot, payload);

    elements.characterFeedback.textContent = "Charakter erfolgreich gespeichert.";
    appendLog(`${characterName} in ${SLOT_LABELS[state.selectedSlot]} gespeichert.`);
    closeCharacterModal();
  } catch (error) {
    const message = error?.message || "Charakter konnte nicht gespeichert werden.";
    elements.characterFeedback.textContent = message;
    appendLog(`Character-Fehler: ${message}`);
  }
}

function handleEnterWorld() {
  if (!state.currentUser) {
    openAuthModal();
    appendLog("Login benötigt, bevor du die Welt betreten kannst.");
    return;
  }

  const activeCharacter = state.activeCharacter
    ? state.characterSlots[state.activeCharacter]
    : null;

  if (!activeCharacter) {
    appendLog("Bitte zuerst einen aktiven Charakter auswählen.");
    return;
  }

  appendLog(`Weltbeitritt vorbereitet für ${activeCharacter.name}.`);
}

function bindEvents() {
  elements.openAuthBtn.addEventListener("click", openAuthModal);
  elements.closeAuthBtn.addEventListener("click", closeAuthModal);

  elements.guestPreviewBtn.addEventListener("click", () => {
    appendLog("World Preview geöffnet.");
    elements.gameContainer?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  });

  elements.enterWorldBtn.addEventListener("click", handleEnterWorld);

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

      detachCharacterListener();
      state.characterSlots = { slot1: null, slot2: null, slot3: null };
      state.activeCharacter = null;
      renderCharacterSlots();

      await logoutUser();
      appendLog("Benutzer erfolgreich ausgeloggt.");
    } catch (error) {
      appendLog(`Logout-Fehler: ${error?.message || "Unbekannter Fehler"}`);
    }
  });

  elements.authForm.addEventListener("submit", handleAuthSubmit);
  elements.characterForm.addEventListener("submit", handleCharacterSubmit);
  elements.slotGrid.addEventListener("click", handleSlotClick);

  elements.closeCharacterBtn.addEventListener("click", closeCharacterModal);

  elements.authModal.addEventListener("click", (event) => {
    if (event.target === elements.authModal) {
      closeAuthModal();
    }
  });

  elements.characterModal.addEventListener("click", (event) => {
    if (event.target === elements.characterModal) {
      closeCharacterModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.authModal.classList.contains("hidden")) {
      closeAuthModal();
    }

    if (event.key === "Escape" && !elements.characterModal.classList.contains("hidden")) {
      closeCharacterModal();
    }
  });
}

function init() {
  setAuthMode("login");
  renderCharacterSlots();
  bindEvents();
  mountPhaserGame();

  watchAuthState(async (user) => {
    updateAuthUI(user);

    if (user) {
      await initializePlayerData(user);
    } else {
      detachCharacterListener();
      state.characterSlots = { slot1: null, slot2: null, slot3: null };
      state.activeCharacter = null;
      renderCharacterSlots();
    }
  });

  appendLog("Phase 2 initialisiert.");
}

init();

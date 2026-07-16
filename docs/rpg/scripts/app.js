/*
[2026-07-16 21:10 CEST] Delete-Dialog in App-State verdrahtet.
- Custom-Delete-Dialog an Character-Modul übergeben.
- Escape-Handling für Delete-Dialog ergänzt.
[2026-07-16 21:07 CEST] Auth-UI logisch nach Login-State getrennt.
- Gäste sehen nur Login/Registrieren.
- Eingeloggte User sehen nur Account-Status und Logout.
- Auth-Modal folgt jetzt klaren Zuständen statt Misch-UI.
[2026-07-16 20:52 CEST] Character-Menü für ausgeloggte User ausgeblendet.
- Character-Panel wird über den Auth-State ein- und ausgeblendet.
- Beim Logout bleibt der Bereich vollständig verborgen.
[2026-07-16 11:44 CEST] App-Einstieg modularisiert.
- UI, Character-Handling und Game-Preview in Teilmodule zerlegt.
- app.js dient nur noch als Orchestrator.
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
import { appendLog, showModal, hideModal, toggleTheme } from "./ui.js";
import { createGameModule } from "./game.js";
import { createCharacterModule } from "./characters.js";

const DEFAULT_CLASS = "warrior";

const state = {
  authMode: "login",
  currentUser: null
};

const elements = {
  authModal: document.getElementById("authModal"),
  authGuestView: document.getElementById("authGuestView"),
  authUserView: document.getElementById("authUserView"),
  authTabs: document.getElementById("authTabs"),
  signedInTitle: document.getElementById("signedInTitle"),
  signedInText: document.getElementById("signedInText"),
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
  characterPanel: document.getElementById("characterPanel"),
  slotGrid: document.getElementById("slotGrid"),
  enterWorldBtn: document.getElementById("enterWorldBtn"),
  activeCharacterText: document.getElementById("activeCharacterText"),
  characterModal: document.getElementById("characterModal"),
  closeCharacterBtn: document.getElementById("closeCharacterBtn"),
  characterForm: document.getElementById("characterForm"),
  characterNameInput: document.getElementById("characterNameInput"),
  characterClassInput: document.getElementById("characterClassInput"),
  characterFeedback: document.getElementById("characterFeedback"),
  deleteDialog: document.getElementById("deleteCharacterDialog"),
  deleteDialogText: document.getElementById("deleteDialogText")
};

const log = (message) => appendLog(elements.systemLog, message);

const gameModule = createGameModule({
  gameContainer: elements.gameContainer,
  worldPanel: elements.worldPanel,
  log
});

const characterModule = createCharacterModule({
  database,
  slotGrid: elements.slotGrid,
  activeCharacterText: elements.activeCharacterText,
  enterWorldBtn: elements.enterWorldBtn,
  characterModal: elements.characterModal,
  characterNameInput: elements.characterNameInput,
  characterClassInput: elements.characterClassInput,
  characterFeedback: elements.characterFeedback,
  deleteDialog: elements.deleteDialog,
  deleteDialogText: elements.deleteDialogText,
  showModal,
  hideModal,
  log,
  getCurrentUser: () => state.currentUser,
  openAuthModal
});

function openAuthModal() {
  showModal(elements.authModal);
}

function closeAuthModal() {
  hideModal(elements.authModal);
}

function setCharacterPanelVisibility(isVisible) {
  elements.characterPanel.hidden = !isVisible;
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

function updateAuthModalState(user) {
  const isLoggedIn = Boolean(user);

  elements.authGuestView.hidden = isLoggedIn;
  elements.authUserView.hidden = !isLoggedIn;

  if (isLoggedIn) {
    elements.signedInTitle.textContent = "Du bist eingeloggt";
    elements.signedInText.textContent = `Verbunden als ${user.email ?? user.uid}.`;
  } else {
    elements.signedInTitle.textContent = "Du bist eingeloggt";
    elements.signedInText.textContent = "Dein Konto ist bereits verbunden.";
    elements.authForm.reset();
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

function updateAuthUI(user) {
  state.currentUser = user;
  updateAuthModalState(user);

  if (user) {
    elements.authStatusText.textContent = user.email || `UID ${user.uid}`;
    elements.authFeedback.textContent = `Willkommen, ${user.email ?? user.uid}.`;
    setCharacterPanelVisibility(true);
    log(`Benutzer angemeldet: ${user.email ?? user.uid}`);
  } else {
    elements.authStatusText.textContent = "Nicht angemeldet";
    elements.authFeedback.textContent = "Noch nicht verbunden.";
    elements.activeCharacterText.textContent = "Keiner";
    setCharacterPanelVisibility(false);
    log("Kein Benutzer angemeldet.");
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

    log("Neue Userstruktur automatisch angelegt.");
    return;
  }

  const data = snapshot.val() || {};
  const updates = {};

  if (!Object.prototype.hasOwnProperty.call(data, "activeCharacter")) {
    updates.activeCharacter = null;
  }

  if (!data.characterSlots) {
    updates.characterSlots = {
      slot1: null,
      slot2: null,
      slot3: null
    };
  }

  if (Object.keys(updates).length > 0) {
    await update(userRef, updates);
    log("Userstruktur für Phase 2 ergänzt.");
  } else {
    log("Userstruktur bereits vorhanden.");
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

  log("Presence erfolgreich aktualisiert.");
}

async function initializePlayerData(user) {
  try {
    await ensureUserRecord(user);
    await updatePresence(user);
    characterModule.attachCharacterListener(user.uid);
  } catch (error) {
    log(`Datenbankfehler: ${error?.message || "Unbekannter Fehler"}`);
  }
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
      log("Login erfolgreich ausgeführt.");
    } else {
      await registerWithEmail(email, password);
      elements.authFeedback.textContent = "Account erfolgreich erstellt.";
      log("Registrierung erfolgreich ausgeführt.");
    }

    closeAuthModal();
  } catch (error) {
    const message = error?.message || "Authentifizierung fehlgeschlagen.";
    elements.authFeedback.textContent = message;
    log(`Auth-Fehler: ${message}`);
  } finally {
    elements.submitAuthBtn.disabled = false;
  }
}

function handleEnterWorld() {
  if (!state.currentUser) {
    openAuthModal();
    log("Login benötigt, bevor du die Welt betreten kannst.");
    return;
  }

  const activeCharacter = characterModule.getActiveCharacter();

  if (!activeCharacter) {
    log("Bitte zuerst einen aktiven Charakter auswählen.");
    return;
  }

  log(`Weltbeitritt vorbereitet für ${activeCharacter.name}.`);
}

function bindEvents() {
  elements.openAuthBtn.addEventListener("click", openAuthModal);
  elements.closeAuthBtn.addEventListener("click", closeAuthModal);
  elements.closeCharacterBtn.addEventListener("click", characterModule.closeCharacterModal);

  elements.guestPreviewBtn.addEventListener("click", () => {
    log("World Preview geöffnet.");
    elements.gameContainer.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  });

  elements.enterWorldBtn.addEventListener("click", handleEnterWorld);
  elements.loginTabBtn.addEventListener("click", () => setAuthMode("login"));
  elements.registerTabBtn.addEventListener("click", () => setAuthMode("register"));
  elements.themeToggle.addEventListener("click", () => toggleTheme(log));

  elements.logoutBtn.addEventListener("click", async () => {
    try {
      if (state.currentUser) {
        await update(ref(database, `presence/${state.currentUser.uid}`), {
          online: false,
          updatedAt: Date.now()
        });
      }

      characterModule.resetCharacterState();
      setCharacterPanelVisibility(false);
      await logoutUser();
      log("Benutzer erfolgreich ausgeloggt.");
      closeAuthModal();
    } catch (error) {
      log(`Logout-Fehler: ${error?.message || "Unbekannter Fehler"}`);
    }
  });

  elements.authForm.addEventListener("submit", handleAuthSubmit);
  elements.characterForm.addEventListener("submit", characterModule.handleCharacterSubmit);

  elements.authModal.addEventListener("click", (event) => {
    if (event.target === elements.authModal) {
      closeAuthModal();
    }
  });

  elements.characterModal.addEventListener("click", (event) => {
    if (event.target === elements.characterModal) {
      characterModule.closeCharacterModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.authModal.classList.contains("hidden")) {
      closeAuthModal();
    }

    if (event.key === "Escape" && !elements.characterModal.classList.contains("hidden")) {
      characterModule.closeCharacterModal();
    }
  });
}

function init() {
  setAuthMode("login");
  setCharacterPanelVisibility(false);
  updateAuthModalState(null);
  bindEvents();
  gameModule.mountPhaserGame();

  watchAuthState(async (user) => {
    updateAuthUI(user);

    if (user) {
      await initializePlayerData(user);
    } else {
      characterModule.resetCharacterState();
    }
  });

  log("Phase 2 modular initialisiert.");
}

init();

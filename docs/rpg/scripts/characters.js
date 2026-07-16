/*
[2026-07-16 21:10 CEST] Eigenes Delete-Dialogfenster integriert.
- Browser-confirm entfernt.
- Löschbestätigung läuft jetzt über ein gestyltes <dialog>-Modal.
- Delete-Flow bleibt modular und spielkonsistent.
[2026-07-16 11:44 CEST] Character-Logik in eigenes Modul ausgelagert.
- Slot-Rendering, Create, Delete und Active-Character handling separiert.
*/

import {
  ref,
  update,
  onValue,
  off
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

import { getCharacterSummary } from "./ui.js";

const DEFAULT_CLASS = "warrior";

const CLASS_DATA = {
  warrior: { label: "Warrior", hp: 140, mana: 40 },
  mage: { label: "Mage", hp: 80, mana: 140 },
  ranger: { label: "Ranger", hp: 100, mana: 90 }
};

const SLOT_LABELS = {
  slot1: "Slot I",
  slot2: "Slot II",
  slot3: "Slot III"
};

export function createCharacterModule({
  database,
  slotGrid,
  activeCharacterText,
  enterWorldBtn,
  characterModal,
  characterNameInput,
  characterClassInput,
  characterFeedback,
  deleteDialog,
  deleteDialogText,
  showModal,
  hideModal,
  log,
  getCurrentUser,
  openAuthModal
}) {
  const state = {
    selectedSlot: null,
    activeCharacter: null,
    pendingDeleteSlot: null,
    characterSlots: {
      slot1: null,
      slot2: null,
      slot3: null
    },
    userCharactersRef: null,
    userCharactersCallback: null
  };

  function getClassLabel(classKey) {
    return CLASS_DATA[classKey]?.label ?? "Unknown";
  }

  function sanitizeCharacterName(name) {
    return name.trim().replace(/\s+/g, " ").slice(0, 20);
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

  function renderCharacterSlots() {
    const buttons = slotGrid.querySelectorAll(".slot-card");

    buttons.forEach((button) => {
      const slotKey = button.dataset.slot;
      const data = state.characterSlots[slotKey];
      const isActive = state.activeCharacter === slotKey;

      const badge = button.querySelector(".slot-badge");
      const name = button.querySelector(".slot-name");
      const meta = button.querySelector(".slot-meta");
      const deleteButton = button.querySelector(".slot-delete");

      badge.textContent = SLOT_LABELS[slotKey];
      button.classList.toggle("active-slot", isActive);
      button.classList.toggle("filled-slot", Boolean(data));
      deleteButton.classList.toggle("visible", Boolean(data));

      if (data) {
        name.textContent = data.name;
        meta.textContent = `${getClassLabel(data.class)} · Level ${data.level}`;
      } else {
        name.textContent = "Leer";
        meta.textContent = "Neuen Helden erstellen";
      }
    });

    const activeData = state.activeCharacter ? state.characterSlots[state.activeCharacter] : null;
    activeCharacterText.textContent = getCharacterSummary(activeData, getClassLabel);
    enterWorldBtn.disabled = !activeData;
  }

  function openCharacterModal(slotKey) {
    state.selectedSlot = slotKey;
    showModal(characterModal);
    characterNameInput.value = "";
    characterClassInput.value = DEFAULT_CLASS;
    characterFeedback.textContent = `${SLOT_LABELS[slotKey]} wird erstellt.`;
    characterNameInput.focus();
  }

  function closeCharacterModal() {
    hideModal(characterModal);
  }

  function openDeleteDialog(slotKey) {
    const slotData = state.characterSlots[slotKey];
    if (!slotData) {
      return;
    }

    state.pendingDeleteSlot = slotKey;
    deleteDialogText.textContent = `${slotData.name} aus ${SLOT_LABELS[slotKey]} wird dauerhaft gelöscht.`;
    deleteDialog.showModal();
  }

  function closeDeleteDialog() {
    state.pendingDeleteSlot = null;
    if (deleteDialog.open) {
      deleteDialog.close("cancel");
    }
  }

  function detachCharacterListener() {
    if (state.userCharactersRef && state.userCharactersCallback) {
      off(state.userCharactersRef, "value", state.userCharactersCallback);
    }

    state.userCharactersRef = null;
    state.userCharactersCallback = null;
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
      log("Character-Slots synchronisiert.");
    };

    onValue(state.userCharactersRef, state.userCharactersCallback);
  }

  async function saveCharacterToSlot(slotKey, payload) {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      throw new Error("Du musst eingeloggt sein.");
    }

    const userRef = ref(database, `users/${currentUser.uid}`);
    const updates = {};
    updates[`characterSlots/${slotKey}`] = payload;
    updates.activeCharacter = slotKey;

    await update(userRef, updates);
  }

  async function setActiveCharacter(slotKey) {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      throw new Error("Du musst eingeloggt sein.");
    }

    const slotData = state.characterSlots[slotKey];
    if (!slotData) {
      openCharacterModal(slotKey);
      return;
    }

    await update(ref(database, `users/${currentUser.uid}`), {
      activeCharacter: slotKey
    });

    log(`${slotData.name} als aktiver Held gesetzt.`);
  }

  async function deleteCharacterFromSlot(slotKey) {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      throw new Error("Du musst eingeloggt sein.");
    }

    const existingCharacter = state.characterSlots[slotKey];
    if (!existingCharacter) {
      return;
    }

    const userRef = ref(database, `users/${currentUser.uid}`);
    const updates = {};
    updates[`characterSlots/${slotKey}`] = null;

    if (state.activeCharacter === slotKey) {
      updates.activeCharacter = null;
    }

    await update(userRef, updates);
  }

  function handleSlotClick(event) {
    const deleteTrigger = event.target.closest("[data-delete-slot]");
    if (deleteTrigger) {
      return;
    }

    const button = event.target.closest(".slot-card");
    if (!button) {
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      openAuthModal();
      log("Login benötigt, um Character-Slots zu nutzen.");
      return;
    }

    const slotKey = button.dataset.slot;
    const slotData = state.characterSlots[slotKey];

    if (slotData) {
      setActiveCharacter(slotKey).catch((error) => {
        log(`Slot-Fehler: ${error?.message || "Unbekannter Fehler"}`);
      });
    } else {
      openCharacterModal(slotKey);
    }
  }

  function handleDeleteSlot(slotKey) {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      openAuthModal();
      log("Login benötigt, um einen Slot zu löschen.");
      return;
    }

    const slotData = state.characterSlots[slotKey];
    if (!slotData) {
      return;
    }

    openDeleteDialog(slotKey);
  }

  async function confirmDelete() {
    const slotKey = state.pendingDeleteSlot;
    if (!slotKey) {
      return;
    }

    const slotData = state.characterSlots[slotKey];
    if (!slotData) {
      closeDeleteDialog();
      return;
    }

    try {
      await deleteCharacterFromSlot(slotKey);
      log(`${slotData.name} aus ${SLOT_LABELS[slotKey]} gelöscht.`);
    } catch (error) {
      log(`Delete-Fehler: ${error?.message || "Unbekannter Fehler"}`);
    } finally {
      closeDeleteDialog();
    }
  }

  async function handleCharacterSubmit(event) {
    event.preventDefault();

    const rawName = characterNameInput.value;
    const characterName = sanitizeCharacterName(rawName);
    const characterClass = characterClassInput.value;

    try {
      validateCharacterInputs(characterName, characterClass);

      if (!state.selectedSlot) {
        throw new Error("Kein Character-Slot ausgewählt.");
      }

      characterFeedback.textContent = "Charakter wird gespeichert ...";

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
      characterFeedback.textContent = "Charakter erfolgreich gespeichert.";
      log(`${characterName} in ${SLOT_LABELS[state.selectedSlot]} gespeichert.`);
      closeCharacterModal();
    } catch (error) {
      const message = error?.message || "Charakter konnte nicht gespeichert werden.";
      characterFeedback.textContent = message;
      log(`Character-Fehler: ${message}`);
    }
  }

  function resetCharacterState() {
    detachCharacterListener();
    state.selectedSlot = null;
    state.activeCharacter = null;
    state.pendingDeleteSlot = null;
    state.characterSlots = {
      slot1: null,
      slot2: null,
      slot3: null
    };
    renderCharacterSlots();
    closeDeleteDialog();
  }

  function getActiveCharacter() {
    return state.activeCharacter ? state.characterSlots[state.activeCharacter] : null;
  }

  function bindEvents() {
    slotGrid.addEventListener("click", handleSlotClick);

    slotGrid.addEventListener("click", (event) => {
      const deleteTrigger = event.target.closest("[data-delete-slot]");
      if (!deleteTrigger) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      handleDeleteSlot(deleteTrigger.dataset.deleteSlot);
    });

    deleteDialog.addEventListener("close", () => {
      if (deleteDialog.returnValue === "confirm") {
        confirmDelete();
      } else {
        state.pendingDeleteSlot = null;
        log("Löschung abgebrochen.");
      }
    });
  }

  renderCharacterSlots();
  bindEvents();

  return {
    attachCharacterListener,
    detachCharacterListener,
    resetCharacterState,
    handleCharacterSubmit,
    openCharacterModal,
    closeCharacterModal,
    closeDeleteDialog,
    getActiveCharacter
  };
}

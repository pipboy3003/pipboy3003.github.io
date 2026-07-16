/*
[2026-07-16 11:44 CEST] UI-Helfer in separates Modul ausgelagert.
- Modal-Steuerung zentralisiert.
- Logging, Theme-Toggle und Status-Helfer gebündelt.
*/

export function appendLog(systemLogElement, message) {
  const entry = document.createElement("p");
  const time = new Date().toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  entry.textContent = `[${time}] ${message}`;
  systemLogElement.prepend(entry);
}

export function showModal(modalElement) {
  modalElement.classList.remove("hidden");
  modalElement.setAttribute("aria-hidden", "false");
}

export function hideModal(modalElement) {
  modalElement.classList.add("hidden");
  modalElement.setAttribute("aria-hidden", "true");
}

export function toggleTheme(logFn) {
  const root = document.documentElement;
  const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  logFn(`Theme gewechselt: ${next}.`);
}

export function getCharacterSummary(character, getClassLabel) {
  if (!character) {
    return "Keiner";
  }

  return `${character.name} · ${getClassLabel(character.class)} · Lvl ${character.level}`;
}

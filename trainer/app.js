const BEREICHE = ["Technik", "Organisation", "Führung & Personal"];
const SPEICHER_KEY = "imm-hq-trainer-antworten-v1";

let ausgewaehlterBereich = "Alle";
let aktuelleFrageIndex = 0;
let antworten = {};

function bereichAnzeigename(wert) {
  const text = String(wert || "").toLowerCase().trim();

  if (text.includes("technik")) {
    return "Technik";
  }

  if (text.includes("organisation")) {
    return "Organisation";
  }

  if (
    text.includes("führung") ||
    text.includes("fuhrung") ||
    text.includes("personal") ||
    text.includes("fachgespräch") ||
    text.includes("fachgesprach")
  ) {
    return "Führung & Personal";
  }

  return "Organisation";
}

function frageText(frage) {
  return frage.frage || frage.question || "";
}

function optionen(frage) {
  return frage.optionen || frage.antworten || frage.answers || [];
}

function erklaerung(frage) {
  return frage.antwort || frage.erklaerung || frage.explanation || "";
}

function richtigeAntwort(frage) {
  const wert = frage.richtig ?? frage.correct ?? frage.correctAnswer ?? 0;

  if (typeof wert === "number") {
    return wert;
  }

  if (typeof wert === "string") {
    const buchstaben = ["a", "b", "c", "d", "e", "f"];
    const index = buchstaben.indexOf(wert.toLowerCase().trim());

    if (index >= 0) {
      return index;
    }

    const zahl = Number(wert);

    if (!Number.isNaN(zahl)) {
      return zahl;
    }
  }

  return 0;
}

function vorhandeneFragenNormalisieren() {
  const quelle = window.questions || window.fragen || [];

  if (Array.isArray(quelle)) {
    return quelle
      .map((frage, index) => ({
        id: frage.id || `frage-${index + 1}`,
        art: "quiz",
        bereich: bereichAnzeigename(frage.bereich || frage.thema || frage.category),
        frage: frageText(frage),
        optionen: optionen(frage),
        richtig: richtigeAntwort(frage),
        erklaerung: erklaerung(frage)
      }))
      .filter(frage => frage.frage && frage.optionen.length >= 2);
  }

  if (quelle && typeof quelle === "object") {
    const ergebnis = [];

    Object.entries(quelle).forEach(([thema, fragen]) => {
      if (!Array.isArray(fragen)) {
        return;
      }

      fragen.forEach((frage, index) => {
        ergebnis.push({
          id: frage.id || `${thema}-${index + 1}`,
          art: "quiz",
          bereich: bereichAnzeigename(frage.bereich || frage.thema || thema),
          frage: frageText(frage),
          optionen: optionen(frage),
          richtig: richtigeAntwort(frage),
          erklaerung: erklaerung(frage)
        });
      });
    });

    return ergebnis.filter(frage => frage.frage && frage.optionen.length >= 2);
  }

  return [];
}

function fachgespraechNormalisieren() {
  const faelle = window.fachgespraechFaelle || [];

  return faelle.map((fall, index) => ({
    id: fall.id || `fachgespraech-${index + 1}`,
    art: "fachgespraech",
    bereich: "Führung & Personal",
    titel: fall.titel || "Fachgespräch",
    dauer: fall.dauer || "30 Minuten Vorbereitung · 15 Minuten Fachgespräch",
    situation: fall.situation || "",
    auftrag: fall.auftrag || "",
    loesung: Array.isArray(fall.loesung) ? fall.loesung : [],
    rueckfragen: Array.isArray(fall.rueckfragen) ? fall.rueckfragen : []
  }));
}

const alleFragen = [
  ...vorhandeneFragenNormalisieren(),
  ...fachgespraechNormalisieren()
];

function ladeAntworten() {
  try {
    antworten = JSON.parse(localStorage.getItem(SPEICHER_KEY)) || {};
  } catch {
    antworten = {};
  }
}

function speichereAntworten() {
  localStorage.setItem(SPEICHER_KEY, JSON.stringify(antworten));
}

function fragenFuerBereich(bereich = "Alle") {
  if (bereich === "Alle") {
    return alleFragen;
  }

  return alleFragen.filter(frage => frage.bereich === bereich);
}

function prozent(teil, gesamt) {
  if (gesamt === 0) {
    return 0;
  }

  return Math.round((teil / gesamt) * 100);
}

function fortschritt(bereich = "Alle") {
  const fragen = fragenFuerBereich(bereich);
  const quizFragen = fragen.filter(frage => frage.art === "quiz");

  const beantwortet = quizFragen.filter(frage => Boolean(antworten[frage.id])).length;
  const richtig = quizFragen.filter(frage => antworten[frage.id]?.istRichtig).length;

  return {
    gesamt: quizFragen.length,
    beantwortet,
    richtig,
    prozent: prozent(beantwortet, quizFragen.length)
  };
}

function renderFortschritt() {
  const gesamt = fortschritt();

  document.getElementById("total-progress-text").textContent =
    `${gesamt.beantwortet} von ${gesamt.gesamt} beantwortet`;

  document.getElementById("total-progress-percent").textContent =
    `${gesamt.prozent} %`;

  document.getElementById("total-progress-bar").style.width =
    `${gesamt.prozent}%`;

  document.getElementById("area-progress").innerHTML = BEREICHE.map(bereich => {
    const daten = fortschritt(bereich);
    const fachgespraechAnzahl = fragenFuerBereich(bereich)
      .filter(frage => frage.art === "fachgespraech").length;

    const zusatz =
      fachgespraechAnzahl > 0
        ? ` · ${fachgespraechAnzahl} Fachgespräch${fachgespraechAnzahl === 1 ? "" : "e"}`
        : "";

    return `
      <article class="area-progress-item">
        <span class="area-progress-title">${bereich}</span>
        <span class="area-progress-number">
          ${daten.beantwortet}/${daten.gesamt} beantwortet · ${daten.richtig} richtig${zusatz}
        </span>
        <div class="area-progress-track" aria-hidden="true">
          <div class="area-progress-fill" style="width: ${daten.prozent}%"></div>
        </div>
      </article>
    `;
  }).join("");
}

function renderFilter() {
  const filter = ["Alle", ...BEREICHE];

  document.getElementById("area-filters").innerHTML = filter.map(bereich => {
    const aktiv = bereich === ausgewaehlterBereich ? "is-active" : "";
    const anzahl = fragenFuerBereich(bereich).length;

    return `
      <button
        class="filter-button ${aktiv}"
        type="button"
        data-bereich="${bereich}">
        ${bereich} (${anzahl})
      </button>
    `;
  }).join("");

  document.querySelectorAll("[data-bereich]").forEach(button => {
    button.addEventListener("click", () => {
      ausgewaehlterBereich = button.dataset.bereich;
      aktuelleFrageIndex = 0;
      renderFilter();
      renderFrage();
    });
  });
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderQuizFrage(frage, nummer, gesamt) {
  const gespeicherteAntwort = antworten[frage.id];
  const buchstaben = ["A", "B", "C", "D", "E", "F"];

  const antwortButtons = frage.optionen.map((antwort, index) => {
    let klassen = "answer";

    if (gespeicherteAntwort && index === frage.richtig) {
      klassen += " is-solution";
    }

    if (gespeicherteAntwort && gespeicherteAntwort.auswahl === index) {
      klassen += gespeicherteAntwort.istRichtig
        ? " is-correct"
        : " is-wrong";
    }

    return `
      <button
        class="${klassen}"
        type="button"
        data-answer-index="${index}"
        ${gespeicherteAntwort ? "disabled" : ""}>
        <span class="answer-letter">${buchstaben[index] || index + 1}</span>
        <span class="answer-text">${escapeHtml(antwort)}</span>
      </button>
    `;
  }).join("");

  let feedback = "";

  if (gespeicherteAntwort) {
    const klasse = gespeicherteAntwort.istRichtig ? "correct" : "wrong";
    const symbol = gespeicherteAntwort.istRichtig ? "✓" : "✕";
    const text = gespeicherteAntwort.istRichtig
      ? "Richtig beantwortet."
      : "Leider nicht richtig. Die richtige Antwort ist grün markiert.";

    feedback = `
      <div class="feedback ${klasse}">
        <span>${symbol}</span>
        <span>${text} ${escapeHtml(frage.erklaerung)}</span>
      </div>
    `;
  }

  const statusKlasse = gespeicherteAntwort
    ? gespeicherteAntwort.istRichtig ? "correct" : "wrong"
    : "";

  const statusText = gespeicherteAntwort
    ? gespeicherteAntwort.istRichtig ? "Richtig" : "Falsch"
    : "Noch offen";

  return `
    <div class="question-meta">
      <span class="question-number">Frage ${nummer} von ${gesamt}</span>
      <span class="question-area">${frage.bereich}</span>
    </div>

    <h2 class="question-title">${escapeHtml(frage.frage)}</h2>

    <div class="answers">${antwortButtons}</div>

    ${feedback}

    <div class="question-footer">
      <span class="answer-status">
        <span class="status-dot ${statusKlasse}"></span>
        ${statusText}
      </span>

      <div class="filter-buttons">
        <button id="previous-question" class="button button-secondary" type="button">
          Zurück
        </button>
        <button id="next-question" class="button" type="button">
          Nächste Frage
        </button>
      </div>
    </div>
  `;
}

function renderFachgespraech(fall, nummer, gesamt) {
  const loesungen = fall.loesung
    .map(punkt => `<li>${escapeHtml(punkt)}</li>`)
    .join("");

  const rueckfragen = fall.rueckfragen
    .map(frage => `<li>${escapeHtml(frage)}</li>`)
    .join("");

  return `
    <div class="question-meta">
      <span class="question-number">Fachgespräch ${nummer} von ${gesamt}</span>
      <span class="question-area">Führung &amp; Personal</span>
    </div>

    <h2 class="question-title">${escapeHtml(fall.titel)}</h2>

    <div class="feedback correct">
      <span>⏱</span>
      <span>${escapeHtml(fall.dauer)}</span>
    </div>

    <h3>Ausgangssituation</h3>
    <p class="subtitle">${escapeHtml(fall.situation).replaceAll("\n", "<br>")}</p>

    <h3>Ihr Handlungsauftrag</h3>
    <div class="feedback">
      <span>→</span>
      <span>${escapeHtml(fall.auftrag)}</span>
    </div>

    <label for="fachgespraech-notizen" class="section-label">
      Eigene Lösungsstruktur und Notizen
    </label>

    <textarea
      id="fachgespraech-notizen"
      rows="9"
      style="width: 100%; margin-top: 8px; padding: 12px; border: 1px solid #e4e7ec; border-radius: 10px; font: inherit; line-height: 1.5; resize: vertical;"
      placeholder="1. Situation analysieren&#10;2. Ziele festlegen&#10;3. Maßnahmen begründen&#10;4. Umsetzung und Kontrolle"></textarea>

    <div class="filter-buttons" style="margin-top: 16px;">
      <button id="show-solution" class="button" type="button">
        Lösungsschwerpunkte anzeigen
      </button>
    </div>

    <div id="fachgespraech-loesung" hidden>
      <h3 style="margin-top: 24px;">Lösungsschwerpunkte</h3>
      <ol>${loesungen}</ol>

      <h3>Typische Prüfer-Rückfragen</h3>
      <ol>${rueckfragen}</ol>

      <div class="feedback correct">
        <span>✓</span>
        <span>
          Selbstcheck: Ist Ihre Lösung strukturiert? Begründen Sie jede Maßnahme mit
          Auswirkungen auf Mitarbeitende, Qualität, Termine, Kosten und Arbeitssicherheit.
        </span>
      </div>
    </div>

    <div class="question-footer">
      <span class="answer-status">
        <span class="status-dot"></span>
        Mündliche Prüfungssimulation
      </span>

      <div class="filter-buttons">
        <button id="previous-question" class="button button-secondary" type="button">
          Zurück
        </button>
        <button id="next-question" class="button" type="button">
          Nächster Fall
        </button>
      </div>
    </div>
  `;
}

function renderFrage() {
  const fragen = fragenFuerBereich(ausgewaehlterBereich);
  const quiz = document.getElementById("quiz-card");

  if (fragen.length === 0) {
    quiz.innerHTML = `
      <div class="empty-state">
        Für diesen Bereich sind noch keine Fragen hinterlegt.
      </div>
    `;
    return;
  }

  if (aktuelleFrageIndex >= fragen.length) {
    aktuelleFrageIndex = 0;
  }

  const frage = fragen[aktuelleFrageIndex];

  quiz.innerHTML = frage.art === "fachgespraech"
    ? renderFachgespraech(frage, aktuelleFrageIndex + 1, fragen.length)
    : renderQuizFrage(frage, aktuelleFrageIndex + 1, fragen.length);

  if (frage.art === "quiz") {
    document.querySelectorAll("[data-answer-index]").forEach(button => {
      button.addEventListener("click", () => {
        beantworteFrage(frage, Number(button.dataset.answerIndex));
      });
    });
  }

  const loesungButton = document.getElementById("show-solution");

  if (loesungButton) {
    loesungButton.addEventListener("click", () => {
      document.getElementById("fachgespraech-loesung").hidden = false;
      loesungButton.disabled = true;
      loesungButton.textContent = "Lösungsschwerpunkte eingeblendet";
    });
  }

  document.getElementById("previous-question").addEventListener("click", () => {
    aktuelleFrageIndex =
      (aktuelleFrageIndex - 1 + fragen.length) % fragen.length;

    renderFrage();
  });

  document.getElementById("next-question").addEventListener("click", () => {
    aktuelleFrageIndex = (aktuelleFrageIndex + 1) % fragen.length;
    renderFrage();
  });
}

function beantworteFrage(frage, auswahl) {
  if (antworten[frage.id]) {
    return;
  }

  antworten[frage.id] = {
    auswahl,
    istRichtig: auswahl === frage.richtig
  };

  speichereAntworten();
  renderFortschritt();
  renderFrage();
}

function resetTraining() {
  const bestaetigt = window.confirm(
    "Möchtest du alle gespeicherten Antworten und Fortschritte wirklich löschen?"
  );

  if (!bestaetigt) {
    return;
  }

  antworten = {};
  speichereAntworten();
  aktuelleFrageIndex = 0;
  renderFortschritt();
  renderFrage();
}

function start() {
  ladeAntworten();
  renderFortschritt();
  renderFilter();
  renderFrage();

  document
    .getElementById("reset-button")
    .addEventListener("click", resetTraining);
}

document.addEventListener("DOMContentLoaded", start);
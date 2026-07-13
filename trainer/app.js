const BEREICHE = [
  "Technik",
  "Organisation",
  "Führung & Personal"
];

let ausgewaehlterBereich = "Alle";
let aktuelleFrageIndex = 0;
let antworten = {};

function normalisiereFragen() {
  const quelle =
    window.questions ||
    window.fragen ||
    window.quizQuestions ||
    [];

  return quelle.map((item, index) => ({
    id: item.id ?? index + 1,
    bereich: item.bereich ?? item.category ?? "Technik",
    frage: item.frage ?? item.question ?? "",
    antworten: item.antworten ?? item.answers ?? [],
    richtig: item.richtig ?? item.correct ?? item.correctAnswer ?? 0,
    erklaerung: item.erklaerung ?? item.explanation ?? ""
  }));
}

const alleFragen = normalisiereFragen();

function ladeAntworten() {
  try {
    antworten = JSON.parse(localStorage.getItem("hq-trainer-antworten")) || {};
  } catch {
    antworten = {};
  }
}

function speichereAntworten() {
  localStorage.setItem("hq-trainer-antworten", JSON.stringify(antworten));
}

function gefilterteFragen() {
  if (ausgewaehlterBereich === "Alle") return alleFragen;
  return alleFragen.filter(frage => frage.bereich === ausgewaehlterBereich);
}

function prozent(teil, gesamt) {
  return gesamt === 0 ? 0 : Math.round((teil / gesamt) * 100);
}

function fortschritt(bereich = "Alle") {
  const fragen = bereich === "Alle"
    ? alleFragen
    : alleFragen.filter(frage => frage.bereich === bereich);

  const beantwortet = fragen.filter(frage => antworten[frage.id]).length;
  const richtig = fragen.filter(frage => antworten[frage.id]?.istRichtig).length;

  return {
    gesamt: fragen.length,
    beantwortet,
    richtig,
    prozent: prozent(beantwortet, fragen.length)
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

    return `
      <article class="area-progress-item">
        <span class="area-progress-title">${bereich}</span>
        <span class="area-progress-number">
          ${daten.beantwortet}/${daten.gesamt} beantwortet · ${daten.richtig} richtig
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
    const anzahl = bereich === "Alle"
      ? alleFragen.length
      : alleFragen.filter(frage => frage.bereich === bereich).length;

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

function antwortText(antwort) {
  if (typeof antwort === "string") return antwort;
  return antwort.text ?? antwort.antwort ?? "";
}

function istRichtigeAntwort(frage, index) {
  if (Array.isArray(frage.richtig)) return frage.richtig.includes(index);

  if (typeof frage.richtig === "string") {
    const buchstaben = ["a", "b", "c", "d"];
    return buchstaben.indexOf(frage.richtig.toLowerCase()) === index;
  }

  return Number(frage.richtig) === index;
}

function renderFrage() {
  const fragen = gefilterteFragen();
  const quiz = document.getElementById("quiz-card");

  if (!fragen.length) {
    quiz.innerHTML = `
      <div class="empty-state">
        Für diesen Bereich sind noch keine Fragen hinterlegt.
      </div>
    `;
    return;
  }

  if (aktuelleFrageIndex >= fragen.length) aktuelleFrageIndex = 0;
  const frage = fragen[aktuelleFrageIndex];
  const gespeicherteAntwort = antworten[frage.id];
  const buchstaben = ["A", "B", "C", "D", "E", "F"];

  const antwortButtons = frage.antworten.map((antwort, index) => {
    let klassen = "answer";
    const bereitsBeantwortet = Boolean(gespeicherteAntwort);

    if (bereitsBeantwortet && istRichtigeAntwort(frage, index)) {
      klassen += " is-solution";
    }

    if (bereitsBeantwortet && gespeicherteAntwort.auswahl === index) {
      klassen += gespeicherteAntwort.istRichtig
        ? " is-correct"
        : " is-wrong";
    }

    return `
      <button
        class="${klassen}"
        type="button"
        data-answer-index="${index}"
        ${bereitsBeantwortet ? "disabled" : ""}>
        <span class="answer-letter">${buchstaben[index]}</span>
        <span class="answer-text">${antwortText(antwort)}</span>
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
        <span>${text}${frage.erklaerung ? ` ${frage.erklaerung}` : ""}</span>
      </div>
    `;
  }

  const statusKlasse = gespeicherteAntwort
    ? gespeicherteAntwort.istRichtig ? "correct" : "wrong"
    : "";

  const statusText = gespeicherteAntwort
    ? gespeicherteAntwort.istRichtig ? "Richtig" : "Falsch"
    : "Noch offen";

  quiz.innerHTML = `
    <div class="question-meta">
      <span class="question-number">
        Frage ${aktuelleFrageIndex + 1} von ${fragen.length}
      </span>
      <span class="question-area">${frage.bereich}</span>
    </div>

    <h2 class="question-title">${frage.frage}</h2>

    <div class="answers">${antwortButtons}</div>

    ${feedback}

    <div class="question-footer">
      <span class="answer-status">
        <span class="status-dot ${statusKlasse}"></span>
        ${statusText}
      </span>

      <div class="fg-aktionen">
        <button id="previous-question" class="button button-secondary" type="button">
          Zurück
        </button>
        <button id="next-question" class="button" type="button">
          Nächste Frage
        </button>
      </div>
    </div>
  `;

  document.querySelectorAll("[data-answer-index]").forEach(button => {
    button.addEventListener("click", () => {
      beantworteFrage(frage, Number(button.dataset.answerIndex));
    });
  });

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
  if (antworten[frage.id]) return;

  antworten[frage.id] = {
    auswahl,
    istRichtig: istRichtigeAntwort(frage, auswahl)
  };

  speichereAntworten();
  renderFortschritt();
  renderFrage();
}

function resetTraining() {
  const bestaetigt = window.confirm(
    "Möchtest du alle gespeicherten Antworten und Fortschritte wirklich löschen?"
  );

  if (!bestaetigt) return;

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

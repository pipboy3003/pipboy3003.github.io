async function ladeFragenAusText() {
  const response = await fetch("fragen.txt");
  const text = await response.text();
  const zeilen = text.split(/\r?\n/);

  const antwortBuchstaben = ["A", "B", "C", "D"];
  const ergebnis = {};

  let aktuellerBereich = null;
  let aktuelleFrage = null;

  function bereichSchluessel(name) {
    const normalisiert = name.toLowerCase().trim();

    if (normalisiert.includes("technik")) {
      return "technik";
    }

    if (normalisiert.includes("organisation")) {
      return "organisation";
    }

    if (normalisiert.includes("führung") || normalisiert.includes("fuhrung") || normalisiert.includes("personal")) {
      return "fuehrung";
    }

    return normalisiert.replace(/[^a-z0-9]/g, "");
  }

  function frageAbschliessen() {
    if (!aktuelleFrage || !aktuellerBereich) {
      return;
    }

    const richtigIndex = antwortBuchstaben.indexOf((aktuelleFrage.richtigBuchstabe || "A").toUpperCase());

    ergebnis[aktuellerBereich] = ergebnis[aktuellerBereich] || [];
    ergebnis[aktuellerBereich].push({
      id: `${aktuellerBereich}-${ergebnis[aktuellerBereich].length + 1}`,
      frage: aktuelleFrage.frage || "",
      optionen: aktuelleFrage.optionen || [],
      richtig: richtigIndex >= 0 ? richtigIndex : 0,
      antwort: aktuelleFrage.erklaerung || ""
    });

    aktuelleFrage = null;
  }

  zeilen.forEach(zeileRoh => {
    const zeile = zeileRoh.trim();

    if (!zeile) {
      return;
    }

    const bereichMatch = zeile.match(/^\[(.+)\]$/);
    if (bereichMatch) {
      aktuellerBereich = bereichSchluessel(bereichMatch[1]);
      return;
    }

    if (zeile === "---") {
      frageAbschliessen();
      return;
    }

    if (zeile.startsWith("F:")) {
      aktuelleFrage = { optionen: [] };
      aktuelleFrage.frage = zeile.slice(2).trim();
      return;
    }

    if (!aktuelleFrage) {
      return;
    }

    if (zeile.startsWith("R:")) {
      aktuelleFrage.richtigBuchstabe = zeile.slice(2).trim();
      return;
    }

    if (zeile.startsWith("E:")) {
      aktuelleFrage.erklaerung = zeile.slice(2).trim();
      return;
    }

    const optionMatch = zeile.match(/^([A-D]):\s*(.+)$/);
    if (optionMatch) {
      aktuelleFrage.optionen.push(optionMatch[2].trim());
    }
  });

  frageAbschliessen();

  window.questions = ergebnis;
}

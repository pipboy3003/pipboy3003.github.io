// ============================================================
// INDUSTRIEMEISTER TRAINER - Fragendatenbank
// Themenbereiche: Organisation HQ | Technik HQ
// ============================================================

const QUESTIONS = {

  // ============================================================
  // ORGANISATION - Hauptqualifikation
  // ============================================================
  organisation: [
    {
      frage: "Was versteht man unter dem Begriff 'Kontinuierlicher Verbesserungsprozess' (KVP)?",
      antwort: "KVP ist ein systematischer Ansatz zur ständigen schrittweisen Verbesserung von Prozessen, Produkten und Dienstleistungen durch alle Mitarbeiter.",
      optionen: [
        "Einmaliges Optimierungsprojekt durch externe Berater",
        "Systematischer Ansatz zur ständigen schrittweisen Verbesserung durch alle Mitarbeiter",
        "Automatisches Software-Update-System",
        "Jährliche Unternehmensrevision durch den Vorstand"
      ],
      richtig: 1
    },
    {
      frage: "Welche 4 Phasen hat der PDCA-Zyklus?",
      antwort: "Plan (Planen), Do (Ausführen), Check (Überprüfen), Act (Handeln/Verbessern).",
      optionen: [
        "Planen, Delegieren, Kontrollieren, Abschließen",
        "Plan, Do, Check, Act",
        "Prepare, Design, Create, Assess",
        "Planen, Durchführen, Checken, Auswerten"
      ],
      richtig: 1
    },
    {
      frage: "Was ist die Aufgabe des Industriemeisters im Rahmen des Arbeitsschutzes?",
      antwort: "Der Meister ist verantwortlich für die Umsetzung und Überwachung von Arbeitsschutzmaßnahmen, Unterweisungen der Mitarbeiter und die Gefährdungsbeurteilung.",
      optionen: [
        "Nur administrative Dokumentation führen",
        "Ausschließlich den Betriebsarzt informieren",
        "Umsetzung und Überwachung von Schutzmaßnahmen sowie Unterweisungen durchführen",
        "Schutzmaßnahmen durch den Betriebsrat umsetzen lassen"
      ],
      richtig: 2
    },
    {
      frage: "Was bedeutet OEE (Overall Equipment Effectiveness)?",
      antwort: "OEE ist eine Kennzahl zur Bewertung der Gesamtanlageneffektivität. OEE = Verfügbarkeit × Leistungsgrad × Qualitätsrate.",
      optionen: [
        "Kennzahl für den Umsatz einer Anlage pro Jahr",
        "Kennzahl: Verfügbarkeit × Leistungsgrad × Qualitätsrate",
        "Messung der Mitarbeitereffektivität",
        "Kennzahl für den Energieverbrauch einer Anlage"
      ],
      richtig: 1
    },
    {
      frage: "Was ist eine FMEA (Failure Mode and Effects Analysis)?",
      antwort: "FMEA ist eine systematische Methode zur präventiven Erkennung, Bewertung und Vermeidung von Fehlern und deren Auswirkungen in Produkten oder Prozessen.",
      optionen: [
        "Nachträgliche Fehleranalyse nach einem Produktionsstopp",
        "Systematische präventive Methode zur Erkennung und Bewertung möglicher Fehler",
        "Finanzielle Analyse der Maschinenausfallkosten",
        "Methode zur Lieferantenbewertung"
      ],
      richtig: 1
    },
    {
      frage: "Welche Führungsstile unterscheidet man grundlegend?",
      antwort: "Autoritärer (direktiver), kooperativer (demokratischer) und Laissez-faire Führungsstil sind die klassischen Grundtypen nach Lewin.",
      optionen: [
        "Aktiver, passiver und neutraler Führungsstil",
        "Autoritärer, kooperativer und Laissez-faire Führungsstil",
        "Formeller, informeller und hybride Führungsstil",
        "Technischer, kaufmännischer und sozialer Führungsstil"
      ],
      richtig: 1
    },
    {
      frage: "Was versteht man unter 'Lean Management'?",
      antwort: "Lean Management ist eine Unternehmensphilosophie zur Minimierung von Verschwendung (Muda) in allen Prozessen bei gleichzeitiger Maximierung des Kundennutzens.",
      optionen: [
        "Reduzierung der Mitarbeiterzahl zur Kostensenkung",
        "Philosophie zur Minimierung von Verschwendung bei maximiertem Kundennutzen",
        "Einsatz schlanker IT-Systeme im Büro",
        "Optimierung der Lieferkette durch externe Partner"
      ],
      richtig: 1
    },
    {
      frage: "Was sind die 7 Verschwendungsarten (Muda) im Lean Management?",
      antwort: "Überproduktion, Wartezeiten, Transport, überflüssige Prozesse, Bestände, Bewegungen, Fehler/Nacharbeit.",
      optionen: [
        "Planung, Einkauf, Produktion, Lager, Versand, Service, Verwaltung",
        "Überproduktion, Wartezeiten, Transport, Prozesse, Bestände, Bewegungen, Fehler",
        "Kosten, Zeit, Qualität, Energie, Personal, Fläche, Material",
        "Rohstoffe, Halbzeuge, Fertigteile, Werkzeuge, Maschinen, Energie, Zeit"
      ],
      richtig: 1
    },
    {
      frage: "Was ist der Unterschied zwischen einer Stellen- und einer Funktionsbeschreibung?",
      antwort: "Eine Stellenbeschreibung definiert Aufgaben, Kompetenzen und Verantwortung einer konkreten Stelle. Eine Funktionsbeschreibung beschreibt die Aufgaben einer Funktion unabhängig von der Person.",
      optionen: [
        "Kein Unterschied, beide Begriffe sind synonym",
        "Stellenbeschreibung ist personenbezogen, Funktionsbeschreibung ist stellenunabhängig",
        "Funktionsbeschreibung gilt nur für Führungskräfte",
        "Stellenbeschreibung gilt nur für Produktionsmitarbeiter"
      ],
      richtig: 1
    },
    {
      frage: "Was versteht man unter 'Betrieblichem Vorschlagswesen'?",
      antwort: "Das betriebliche Vorschlagswesen ist ein System, das Mitarbeiter dazu motiviert, Verbesserungsideen einzubringen. Angenommene Vorschläge werden prämiert.",
      optionen: [
        "Formelle Beschwerdestelle für Mitarbeiter",
        "System zur Prämierung von Verbesserungsvorschlägen durch Mitarbeiter",
        "Intranet-basiertes Informationssystem",
        "Regelmäßiges Mitarbeitergespräch zur Leistungsbewertung"
      ],
      richtig: 1
    },
    {
      frage: "Was ist der Unterschied zwischen Führen mit Zielen (MbO) und situativem Führen?",
      antwort: "MbO (Management by Objectives) setzt gemeinsam vereinbarte Ziele als Steuerungsinstrument. Situatives Führen passt den Führungsstil an den Reifegrad und die Situation des Mitarbeiters an.",
      optionen: [
        "MbO ist moderner, situatives Führen veraltet",
        "MbO nutzt Ziele als Steuerung; situatives Führen passt den Stil an Mitarbeiter und Situation an",
        "Beide Methoden sind identisch",
        "Situatives Führen betrifft nur Krisen, MbO den Normalzustand"
      ],
      richtig: 1
    },
    {
      frage: "Was sind Cp und Cpk Werte und was sagen sie aus?",
      antwort: "Cp (Prozessfähigkeitsindex) misst die potenzielle Fähigkeit eines Prozesses. Cpk berücksichtigt zusätzlich die Prozesslage (Mittelwertverschiebung). Cp/Cpk ≥ 1,33 gilt als fähig.",
      optionen: [
        "Cp misst Kundenzufriedenheit, Cpk die Lieferzeit",
        "Cp = potenzielle Prozessfähigkeit; Cpk = Prozessfähigkeit unter Berücksichtigung der Lage; ≥1,33 = fähig",
        "Beide Kennzahlen messen die Anlagenverfügbarkeit",
        "Cp und Cpk sind identische Kennzahlen"
      ],
      richtig: 1
    },
    {
      frage: "Welche Rechte und Pflichten hat der Betriebsrat laut BetrVG?",
      antwort: "Der Betriebsrat hat Informations-, Beratungs-, Anhörungs- und Mitbestimmungsrechte. Pflichten sind u.a. Verschwiegenheit, Interessenvertretung aller Mitarbeiter und Einhaltung von Betriebsvereinbarungen.",
      optionen: [
        "Nur Informationsrecht, keine Mitbestimmung",
        "Informations-, Beratungs-, Anhörungs- und Mitbestimmungsrechte; Pflicht zur Verschwiegenheit und Interessenvertretung",
        "Vollständiges Vetorecht bei allen unternehmerischen Entscheidungen",
        "Nur Recht auf jährliche Betriebsversammlung"
      ],
      richtig: 1
    },
    {
      frage: "Was ist ein Gantt-Diagramm und wofür wird es eingesetzt?",
      antwort: "Ein Gantt-Diagramm ist ein Balkendiagramm zur Projektplanung. Es zeigt Aufgaben, deren Dauer und zeitliche Abfolge übersichtlich auf einer Zeitachse.",
      optionen: [
        "Kreisdiagramm zur Kostenverteilung in Projekten",
        "Balkendiagramm zur Visualisierung von Projektaufgaben, Dauer und Zeitplanung",
        "Netzplan zur Darstellung von Materialflüssen",
        "Liniendiagramm zur Qualitätsentwicklung"
      ],
      richtig: 1
    },
    {
      frage: "Was versteht man unter dem 'kritischen Pfad' in der Netzplantechnik?",
      antwort: "Der kritische Pfad ist die längste Vorgangskette im Netzplan ohne Pufferzeiten. Eine Verzögerung eines Vorgangs auf dem kritischen Pfad verzögert das Gesamtprojekt.",
      optionen: [
        "Der teuerste Teilbereich eines Projekts",
        "Die längste Vorgangskette ohne Puffer – Verzögerung hier verzögert das gesamte Projekt",
        "Der Projektabschnitt mit dem höchsten Risiko",
        "Die kürzeste mögliche Projektdurchführungszeit"
      ],
      richtig: 1
    }
  ],

  // ============================================================
  // TECHNIK - Hauptqualifikation
  // ============================================================
  technik: [
    {
      frage: "Was versteht man unter CNC (Computerized Numerical Control)?",
      antwort: "CNC bezeichnet die rechnergestützte numerische Steuerung von Werkzeugmaschinen. Bewegungen und Bearbeitungsabläufe werden durch NC-Programme gesteuert.",
      optionen: [
        "Manuelle Steuerung von Maschinen durch eine Steuerkonsole",
        "Rechnergestützte numerische Steuerung von Werkzeugmaschinen durch NC-Programme",
        "Computerbasiertes Qualitätskontrollsystem",
        "Netzwerkbasiertes Kommunikationssystem in der Fertigung"
      ],
      richtig: 1
    },
    {
      frage: "Was ist der Unterschied zwischen ISO-Toleranz und Passungssystem?",
      antwort: "ISO-Toleranzen legen zulässige Maßabweichungen fest. Das Passungssystem (Einheitsbohrung/Einheitswelle) definiert das Zusammenspiel zweier Bauteile (Spiel-, Übermaß- oder Übergangspassung).",
      optionen: [
        "Kein Unterschied, beide Begriffe sind identisch",
        "ISO-Toleranz = zulässige Maßabweichung; Passungssystem = Zusammenspiel zweier Bauteile",
        "ISO-Toleranz gilt nur für Längenmaße, Passungssystem nur für Winkel",
        "Passungssystem ist veraltet und wird durch ISO-Toleranz ersetzt"
      ],
      richtig: 1
    },
    {
      frage: "Welche Schweißverfahren gibt es und wie unterscheiden sie sich?",
      antwort: "Hauptverfahren: MIG/MAG (Metallschutzgasschweißen), WIG (Wolfram-Inertgas), E-Hand, Laserschweißen, Widerstandsschweißen. Unterschied: Wärmequelle, Schutzgas, Einsatzbereich.",
      optionen: [
        "Es gibt nur thermisches und mechanisches Schweißen",
        "MIG/MAG, WIG, E-Hand, Laser, Widerstandsschweißen – unterscheiden sich in Wärmequelle, Schutzgas und Anwendungsbereich",
        "Alle Verfahren verwenden identische Elektroden",
        "Schweißverfahren werden nur nach Materialstärke unterschieden"
      ],
      richtig: 1
    },
    {
      frage: "Was ist der Unterschied zwischen Drehen, Fräsen und Schleifen?",
      antwort: "Drehen: rotierendes Werkstück, stehendes Werkzeug. Fräsen: rotierendes Werkzeug, stehendes/geführtes Werkstück. Schleifen: geometrisch unbestimmte Schneide, Feinbearbeitung.",
      optionen: [
        "Alle drei sind identische spanende Verfahren",
        "Drehen: rotierendes Werkstück; Fräsen: rotierendes Werkzeug; Schleifen: geometrisch unbestimmte Schneide",
        "Drehen und Fräsen sind spanlos, Schleifen ist spanend",
        "Schleifen ist nur zum Entfernen von Rost geeignet"
      ],
      richtig: 1
    },
    {
      frage: "Was ist eine Härtekurve (Zeit-Temperatur-Umwandlungsdiagramm, ZTU)?",
      antwort: "Das ZTU-Diagramm zeigt die Umwandlungen im Stahl in Abhängigkeit von Zeit und Temperatur. Es dient zur Auswahl der richtigen Abkühlgeschwindigkeit beim Härten.",
      optionen: [
        "Diagramm zur Schmelzpunktbestimmung von Legierungen",
        "Diagramm, das Gefügeumwandlungen in Stahl abhängig von Zeit und Temperatur zeigt",
        "Diagramm zur Berechnung von Biegemomenten",
        "Tabelle mit Härtewerten verschiedener Materialien"
      ],
      richtig: 1
    },
    {
      frage: "Was versteht man unter SPS (Speicherprogrammierbare Steuerung)?",
      antwort: "SPS ist ein digitales Steuergerät zur Automatisierung von Maschinen und Anlagen. Es ersetzt klassische Relaissteuerungen und ist frei programmierbar.",
      optionen: [
        "Analoge Steuerung durch Relais und Schütze",
        "Digitales, frei programmierbares Steuergerät für Maschinen und Anlagen",
        "Software zur ERP-Verwaltung in der Fertigung",
        "Hydraulisches Steuerungssystem für Pressen"
      ],
      richtig: 1
    },
    {
      frage: "Was ist der Unterschied zwischen Zug-, Druck- und Scherbeanspruchung?",
      antwort: "Zugbeanspruchung: Kräfte ziehen auseinander. Druckbeanspruchung: Kräfte drücken zusammen. Scherbeanspruchung: Kräfte wirken parallel versetzt (Abscherung).",
      optionen: [
        "Zug und Druck sind identisch, nur Richtung unterschiedlich; Scher ist eine Kombination",
        "Zug = Kräfte auseinander; Druck = Kräfte zusammen; Scher = parallele versetzte Kräfte",
        "Alle drei Beanspruchungsarten haben identische Auswirkungen",
        "Scherbeanspruchung tritt nur bei Schraubenverbindungen auf"
      ],
      richtig: 1
    },
    {
      frage: "Was ist der Unterschied zwischen Wärmeleitfähigkeit und Wärmekapazität?",
      antwort: "Wärmeleitfähigkeit (λ) beschreibt, wie gut ein Stoff Wärme leitet. Wärmekapazität (c) beschreibt, wie viel Energie nötig ist, um einen Stoff um 1 K zu erwärmen.",
      optionen: [
        "Beide Begriffe sind gleichwertig und beschreiben dasselbe",
        "Wärmeleitfähigkeit = Güte der Wärmeleitung; Wärmekapazität = benötigte Energie je K Temperaturerhöhung",
        "Wärmekapazität gilt nur für Gase",
        "Wärmeleitfähigkeit wird nur in der Elektrotechnik verwendet"
      ],
      richtig: 1
    },
    {
      frage: "Was ist der Unterschied zwischen Gleichstrom (DC) und Wechselstrom (AC)?",
      antwort: "Gleichstrom (DC) fließt konstant in eine Richtung. Wechselstrom (AC) wechselt seine Richtung periodisch (in Deutschland 50 Hz).",
      optionen: [
        "DC hat höhere Spannung als AC",
        "DC fließt konstant in eine Richtung; AC wechselt periodisch die Richtung (50 Hz in DE)",
        "AC wird nur in Batterien verwendet",
        "DC und AC sind physikalisch identisch"
      ],
      richtig: 1
    },
    {
      frage: "Was versteht man unter Werkstoffprüfung und welche Verfahren gibt es?",
      antwort: "Werkstoffprüfung ermittelt mechanische, physikalische und chemische Eigenschaften. Verfahren: Zugversuch, Härteprüfung (Brinell/Vickers/Rockwell), Kerbschlagbiegeversuch, Zerstörungsfreie Prüfung (RT, UT, MT, PT).",
      optionen: [
        "Nur visuelle Kontrolle der Oberfläche",
        "Ermittlung von Eigenschaften durch Zugversuch, Härteprüfung, Kerbschlag, ZfP-Verfahren",
        "Ausschließlich chemische Analyse",
        "Nur Maßkontrolle mit Messmitteln"
      ],
      richtig: 1
    },
    {
      frage: "Was bedeutet IP-Schutzart (z.B. IP67)?",
      antwort: "IP (Ingress Protection) gibt den Schutz eines Gehäuses gegen Eindringen von Fremdkörpern (1. Ziffer) und Wasser (2. Ziffer) an. IP67 = staubdicht, Schutz gegen zeitweiliges Untertauchen.",
      optionen: [
        "Kennzeichnung der Internetprotokoll-Version",
        "Schutzklasse: 1. Ziffer = Schutz gegen Fremdkörper; 2. Ziffer = Schutz gegen Wasser; IP67 = staubdicht + Untertauchen",
        "Industriestandard für Netzwerkverbindungen",
        "Kennzahl für die Produktionspräzision"
      ],
      richtig: 1
    },
    {
      frage: "Was ist der Unterschied zwischen Kraft, Arbeit und Leistung?",
      antwort: "Kraft (F) = Masse × Beschleunigung [N]. Arbeit (W) = Kraft × Weg [J]. Leistung (P) = Arbeit / Zeit [W]. Leistung beschreibt, wie schnell Arbeit verrichtet wird.",
      optionen: [
        "Kraft, Arbeit und Leistung sind synonyme Begriffe",
        "F = m×a [N]; W = F×s [J]; P = W/t [W] – Leistung = Arbeit pro Zeit",
        "Leistung ist die Summe aus Kraft und Arbeit",
        "Kraft und Arbeit sind identisch, Leistung ist deren Verhältnis zur Masse"
      ],
      richtig: 1
    },
    {
      frage: "Was sind Getriebebauarten und wofür werden sie eingesetzt?",
      antwort: "Haupttypen: Stirnradgetriebe, Kegelradgetriebe, Planetengetriebe, Schneckengetriebe, Riemengetriebe. Einsatz: Drehzahl- und Drehmomentanpassung zwischen Antrieb und Abtrieb.",
      optionen: [
        "Es gibt nur Zahnrad- und Riemengetriebe",
        "Stirnrad, Kegelrad, Planeten, Schnecke, Riemen – zur Drehzahl- und Drehmomentwandlung",
        "Getriebe werden nur zur Drehzahlerhöhung genutzt",
        "Getriebebauarten unterscheiden sich nur im Material"
      ],
      richtig: 1
    },
    {
      frage: "Was versteht man unter Pneumatik und Hydraulik? Was sind die wesentlichen Unterschiede?",
      antwort: "Pneumatik nutzt Druckluft als Druckmedium (schnell, sauber, kompressibel). Hydraulik nutzt Öl (hohe Kräfte, inkompressibel, präzise). Pneumatik: bis ~10 bar; Hydraulik: bis >300 bar.",
      optionen: [
        "Beide sind identisch, nur das Medium unterscheidet sich minimal",
        "Pneumatik = Druckluft (schnell, kompressibel, bis ~10 bar); Hydraulik = Öl (hohe Kraft, inkompressibel, bis >300 bar)",
        "Hydraulik ist veraltet und wird von Pneumatik ersetzt",
        "Pneumatik wird nur für große Kräfte eingesetzt"
      ],
      richtig: 1
    },
    {
      frage: "Was ist der Unterschied zwischen formschlüssiger, kraftschlüssiger und stoffschlüssiger Verbindung?",
      antwort: "Formschluss: Hintergreifen (z.B. Passfeder, Stift). Kraftschluss: Reibung durch Anpresskraft (z.B. Schraube, Presspassung). Stoffschluss: Materialverbindung (z.B. Schweißen, Kleben, Löten).",
      optionen: [
        "Alle drei Verbindungsarten sind lösbare Verbindungen",
        "Formschluss = Hintergreifen; Kraftschluss = Reibung/Anpresskraft; Stoffschluss = Materialverbindung",
        "Stoffschluss ist die schwächste Verbindungsart",
        "Kraftschluss ist nur für temporäre Verbindungen geeignet"
      ],
      richtig: 1
    }
  ]
};

const questions = [
  // ---------------------------------------------------------
  // TECHNIK
  // ---------------------------------------------------------
  {
    id: 1,
    bereich: "Technik",
    frage: "Welche Kennzahl beschreibt den Anteil der tatsächlich verfügbaren Maschinenzeit an der planbaren Produktionszeit?",
    antworten: [
      "Maschinenverfügbarkeit",
      "Arbeitsproduktivität",
      "Ausschussquote",
      "Lagerumschlagshäufigkeit"
    ],
    richtig: 0,
    erklaerung: "Die Maschinenverfügbarkeit zeigt, wie viel der planbaren Zeit eine Maschine technisch einsatzbereit ist."
  },
  {
    id: 2,
    bereich: "Technik",
    frage: "Eine CNC-Maschine fällt wiederholt wegen desselben Fehlers aus. Welcher erste Schritt ist für eine nachhaltige Instandhaltung am sinnvollsten?",
    antworten: [
      "Die Maschine bei jedem Ausfall sofort ersetzen",
      "Die Störungsursache systematisch analysieren und dokumentieren",
      "Die Wartungsintervalle vollständig streichen",
      "Die Bediener ohne weitere Prüfung wechseln"
    ],
    richtig: 1,
    erklaerung: "Wiederkehrende Störungen müssen zuerst systematisch erfasst und auf ihre Ursache zurückgeführt werden."
  },
  {
    id: 3,
    bereich: "Technik",
    frage: "Welche Instandhaltungsart soll einen Ausfall verhindern, bevor eine Störung eintritt?",
    antworten: [
      "Ausfallbedingte Instandsetzung",
      "Vorbeugende Wartung",
      "Notfallreparatur",
      "Fehleranalyse nach Stillstand"
    ],
    richtig: 1,
    erklaerung: "Vorbeugende Wartung soll Funktionsverluste und ungeplante Stillstände vermeiden."
  },
  {
    id: 4,
    bereich: "Technik",
    frage: "Welche Maßnahme steigert die Prozesssicherheit beim Rüsten einer Maschine am stärksten?",
    antworten: [
      "Rüstschritte nur mündlich weitergeben",
      "Standardisierte Rüstanweisung mit Checkliste verwenden",
      "Jede Schicht frei über den Ablauf entscheiden lassen",
      "Erst nach der Serienproduktion die Einstellungen kontrollieren"
    ],
    richtig: 1,
    erklaerung: "Standardisierte Rüstanweisungen und Checklisten reduzieren Bedienfehler und machen Abläufe reproduzierbar."
  },
  {
    id: 5,
    bereich: "Technik",
    frage: "Was ist ein wesentliches Ziel der Wertstromanalyse?",
    antworten: [
      "Ausschließlich die Personalkosten erhöhen",
      "Material- und Informationsflüsse sichtbar machen und Verschwendung erkennen",
      "Die Anzahl der Produkte im Lager vergrößern",
      "Nur die Maschinenstunden erfassen"
    ],
    richtig: 1,
    erklaerung: "Die Wertstromanalyse betrachtet den gesamten Material- und Informationsfluss, um Verschwendung und Engpässe zu erkennen."
  },
  {
    id: 6,
    bereich: "Technik",
    frage: "Welche Folge hat eine zu hohe Schnittgeschwindigkeit beim Zerspanen am ehesten?",
    antworten: [
      "Werkzeugverschleiß und thermische Belastung steigen",
      "Die Werkzeugstandzeit steigt immer",
      "Es entsteht grundsätzlich keine Wärme",
      "Die Maßhaltigkeit verbessert sich unabhängig vom Werkstoff"
    ],
    richtig: 0,
    erklaerung: "Eine überhöhte Schnittgeschwindigkeit kann zu starker Wärmeentwicklung, hohem Werkzeugverschleiß und Qualitätsproblemen führen."
  },
  {
    id: 7,
    bereich: "Technik",
    frage: "Wofür steht die Abkürzung OEE im Produktionsumfeld?",
    antworten: [
      "Gesamtanlageneffektivität",
      "Organisationseinheit Energie",
      "Optimierte Einzelteilentwicklung",
      "Elektronische Einsatzplanung"
    ],
    richtig: 0,
    erklaerung: "OEE steht für Overall Equipment Effectiveness und bewertet Verfügbarkeit, Leistung und Qualität einer Anlage."
  },
  {
    id: 8,
    bereich: "Technik",
    frage: "Welche drei Faktoren fließen typischerweise in die OEE ein?",
    antworten: [
      "Verfügbarkeit, Leistung und Qualität",
      "Kosten, Umsatz und Gewinn",
      "Personalzahl, Lagerbestand und Lieferzeit",
      "Arbeitszeit, Pausenzeit und Urlaubszeit"
    ],
    richtig: 0,
    erklaerung: "Die Gesamtanlageneffektivität setzt sich aus Verfügbarkeit, Leistungsgrad und Qualitätsrate zusammen."
  },
  {
    id: 9,
    bereich: "Technik",
    frage: "Welche Aussage beschreibt eine Erstteilprüfung richtig?",
    antworten: [
      "Sie findet erst nach Abschluss der gesamten Serie statt",
      "Sie prüft das erste gefertigte Teil vor der Serienfreigabe",
      "Sie ersetzt alle weiteren Prüfungen vollständig",
      "Sie wird nur bei Handmontage benötigt"
    ],
    richtig: 1,
    erklaerung: "Mit der Erstteilprüfung wird geprüft, ob Maschine, Werkzeug und Einstellungen vor Serienbeginn korrekte Teile liefern."
  },
  {
    id: 10,
    bereich: "Technik",
    frage: "Was ist bei einer Engpassmaschine in der Produktionsplanung besonders wichtig?",
    antworten: [
      "Sie möglichst oft ungeplant stillstehen zu lassen",
      "Ihre Kapazität und Verfügbarkeit besonders sorgfältig zu planen",
      "Nur Aufträge mit geringer Priorität einzuplanen",
      "Sie unabhängig von den Folgeprozessen zu betrachten"
    ],
    richtig: 1,
    erklaerung: "Der Engpass bestimmt häufig die Gesamtleistung des Systems und braucht daher eine besonders zuverlässige Planung."
  },
  {
    id: 11,
    bereich: "Technik",
    frage: "Welche Aufgabe gehört zur Arbeitsvorbereitung?",
    antworten: [
      "Arbeitspläne, Arbeitsgänge und Vorgabezeiten festlegen",
      "Lohnsteuerbescheinigungen ausstellen",
      "Arbeitsverträge abschließen",
      "Jahresabschlüsse erstellen"
    ],
    richtig: 0,
    erklaerung: "Die Arbeitsvorbereitung plant und beschreibt unter anderem Arbeitsabläufe, Betriebsmittel, Zeiten und Arbeitspläne."
  },
  {
    id: 12,
    bereich: "Technik",
    frage: "Welche Maßnahme reduziert Rüstzeiten im Sinne von SMED besonders wirksam?",
    antworten: [
      "Möglichst viele Tätigkeiten erst bei Maschinenstillstand erledigen",
      "Interne Rüstvorgänge in externe Rüstvorgänge verlagern",
      "Werkzeuge erst während des Stillstands suchen",
      "Einstellungen nicht dokumentieren"
    ],
    richtig: 1,
    erklaerung: "SMED zielt darauf, vorbereitende Tätigkeiten bei laufender Maschine durchzuführen und Stillstandszeit zu verringern."
  },

  // ---------------------------------------------------------
  // ORGANISATION
  // ---------------------------------------------------------
  {
    id: 13,
    bereich: "Organisation",
    frage: "Welche Kosten werden einem einzelnen Produkt direkt zugerechnet?",
    antworten: [
      "Einzelkosten",
      "Gemeinkosten",
      "Fixkosten",
      "Kalkulatorische Kosten"
    ],
    richtig: 0,
    erklaerung: "Einzelkosten können einem Kostenträger direkt zugeordnet werden, zum Beispiel Material für ein bestimmtes Produkt."
  },
  {
    id: 14,
    bereich: "Organisation",
    frage: "Welche Aufgabe hat eine Kostenstelle in der Kostenrechnung?",
    antworten: [
      "Sie sammelt Gemeinkosten dort, wo sie entstehen",
      "Sie ersetzt die Finanzbuchhaltung vollständig",
      "Sie legt den Verkaufspreis verbindlich fest",
      "Sie berechnet ausschließlich den Umsatz"
    ],
    richtig: 0,
    erklaerung: "Kostenstellen erfassen Gemeinkosten nach Entstehungsbereichen, beispielsweise Fertigung, Verwaltung oder Material."
  },
  {
    id: 15,
    bereich: "Organisation",
    frage: "Was zeigt der Deckungsbeitrag eines Produkts?",
    antworten: [
      "Umsatz abzüglich variabler Kosten",
      "Umsatz abzüglich aller fixen Kosten",
      "Materialkosten abzüglich Lohnkosten",
      "Gewinn vor Abzug der variablen Kosten"
    ],
    richtig: 0,
    erklaerung: "Der Deckungsbeitrag zeigt, welchen Betrag ein Produkt nach Abzug seiner variablen Kosten zur Deckung der Fixkosten leistet."
  },
  {
    id: 16,
    bereich: "Organisation",
    frage: "Wann ist der Break-even-Point erreicht?",
    antworten: [
      "Wenn die Gesamterlöse den Gesamtkosten entsprechen",
      "Wenn keine Fixkosten vorhanden sind",
      "Wenn nur variable Kosten entstehen",
      "Wenn der Lagerbestand maximal ist"
    ],
    richtig: 0,
    erklaerung: "Am Break-even-Point sind Erlöse und Gesamtkosten gleich hoch; das Unternehmen macht weder Gewinn noch Verlust."
  },
  {
    id: 17,
    bereich: "Organisation",
    frage: "Welche Aussage zur ABC-Analyse ist richtig?",
    antworten: [
      "A-Güter haben meist einen hohen Wertanteil und benötigen besondere Aufmerksamkeit",
      "C-Güter verursachen immer den größten Beschaffungsaufwand",
      "Alle Güter werden unabhängig von ihrem Wert gleich gesteuert",
      "Die ABC-Analyse bewertet ausschließlich Arbeitssicherheit"
    ],
    richtig: 0,
    erklaerung: "A-Güter besitzen in der Regel einen hohen Wertanteil und sollten besonders eng gesteuert werden."
  },
  {
    id: 18,
    bereich: "Organisation",
    frage: "Was ist ein typisches Ziel der Produktionsplanung und -steuerung?",
    antworten: [
      "Termine, Kapazitäten, Material und Aufträge aufeinander abstimmen",
      "Ausschließlich den Verkaufspreis erhöhen",
      "Gesetzliche Pausenregelungen abschaffen",
      "Nur Personalakten verwalten"
    ],
    richtig: 0,
    erklaerung: "Die Produktionsplanung und -steuerung stimmt Aufträge, Termine, Personal, Maschinen und Material bedarfsgerecht ab."
  },
  {
    id: 19,
    bereich: "Organisation",
    frage: "Welche Funktion hat ein Kanban-System?",
    antworten: [
      "Es steuert Material bedarfsorientiert nach dem Pull-Prinzip",
      "Es ersetzt sämtliche Qualitätsprüfungen",
      "Es berechnet Lohn- und Gehaltsabrechnungen",
      "Es dient nur zur Archivierung alter Aufträge"
    ],
    richtig: 0,
    erklaerung: "Kanban steuert Nachschub anhand des tatsächlichen Verbrauchs und unterstützt eine verbrauchsorientierte Materialversorgung."
  },
  {
    id: 20,
    bereich: "Organisation",
    frage: "Was muss vor einer Tätigkeit mit erkennbaren Gefährdungen durchgeführt werden?",
    antworten: [
      "Eine Gefährdungsbeurteilung",
      "Eine Kostenstellenrechnung",
      "Eine Marktanalyse",
      "Eine Inventur"
    ],
    richtig: 0,
    erklaerung: "Die Gefährdungsbeurteilung ermittelt Gefahren, bewertet Risiken und leitet erforderliche Schutzmaßnahmen ab."
  },
  {
    id: 21,
    bereich: "Organisation",
    frage: "Welche Rangfolge der Schutzmaßnahmen entspricht dem STOP-Prinzip?",
    antworten: [
      "Substitution, technische, organisatorische und persönliche Maßnahmen",
      "Sicherheit, Termin, Organisation und Personal",
      "Steuern, Teilen, Optimieren und Prüfen",
      "Sofort handeln, Termine planen, Ordnung schaffen, Personal schulen"
    ],
    richtig: 0,
    erklaerung: "Nach dem STOP-Prinzip haben Substitution sowie technische Maßnahmen Vorrang vor organisatorischen und persönlichen Maßnahmen."
  },
  {
    id: 22,
    bereich: "Organisation",
    frage: "Welche Maßnahme ist ein Beispiel für technischen Arbeitsschutz?",
    antworten: [
      "Schutzgitter an einer Maschine anbringen",
      "Eine Sicherheitsunterweisung dokumentieren",
      "Mitarbeitende zur PSA-Nutzung verpflichten",
      "Pausenzeiten im Schichtplan festlegen"
    ],
    richtig: 0,
    erklaerung: "Ein Schutzgitter beseitigt oder vermindert Gefährdungen direkt an der technischen Quelle."
  },
  {
    id: 23,
    bereich: "Organisation",
    frage: "Was beschreibt die Durchlaufzeit eines Auftrags?",
    antworten: [
      "Die Zeit vom Auftragsbeginn bis zur Fertigstellung",
      "Nur die reine Bearbeitungszeit an einer Maschine",
      "Nur die Transportzeit zwischen zwei Lagern",
      "Die Dauer der jährlichen Inventur"
    ],
    richtig: 0,
    erklaerung: "Die Durchlaufzeit umfasst typischerweise Bearbeitungs-, Warte-, Transport- und Liegezeiten eines Auftrags."
  },
  {
    id: 24,
    bereich: "Organisation",
    frage: "Welche Kennzahl hilft, die Liefertreue zu beurteilen?",
    antworten: [
      "Anteil termingerecht ausgelieferter Aufträge",
      "Anzahl der Arbeitsunfälle",
      "Höhe des Eigenkapitals",
      "Durchschnittliche Krankheitsdauer"
    ],
    richtig: 0,
    erklaerung: "Liefertreue misst, wie viele Aufträge zum vereinbarten Termin geliefert werden."
  },

  // ---------------------------------------------------------
  // FÜHRUNG & PERSONAL
  // ---------------------------------------------------------
  {
    id: 25,
    bereich: "Führung & Personal",
    frage: "Was ist bei einem Konflikt zwischen zwei Mitarbeitenden ein sinnvoller erster Schritt?",
    antworten: [
      "Beide Seiten getrennt anhören und die Fakten erfassen",
      "Den Konflikt grundsätzlich ignorieren",
      "Sofort eine Abmahnung ohne Gespräch aussprechen",
      "Die Mitarbeitenden ohne Begründung in andere Abteilungen versetzen"
    ],
    richtig: 0,
    erklaerung: "Zunächst sollten beide Sichtweisen angehört und die Ursachen sachlich ermittelt werden."
  },
  {
    id: 26,
    bereich: "Führung & Personal",
    frage: "Was zeichnet ein wirksames Mitarbeitergespräch aus?",
    antworten: [
      "Klare Ziele, aktives Zuhören, konkrete Vereinbarungen und Rückmeldung",
      "Ausschließlich Kritik ohne Lösungsvorschläge",
      "Möglichst viele Unterbrechungen durch den Vorgesetzten",
      "Keine Vorbereitung, damit das Gespräch spontan bleibt"
    ],
    richtig: 0,
    erklaerung: "Ein wirksames Gespräch ist vorbereitet, respektvoll und endet mit nachvollziehbaren Vereinbarungen."
  },
  {
    id: 27,
    bereich: "Führung & Personal",
    frage: "Was ist ein Ziel der Personalentwicklung?",
    antworten: [
      "Kompetenzen für aktuelle und zukünftige Aufgaben aufbauen",
      "Mitarbeitende grundsätzlich austauschen",
      "Ausschließlich Fehlzeiten dokumentieren",
      "Nur Arbeitsverträge archivieren"
    ],
    richtig: 0,
    erklaerung: "Personalentwicklung erweitert fachliche, methodische und soziale Kompetenzen für heutige und zukünftige Aufgaben."
  },
  {
    id: 28,
    bereich: "Führung & Personal",
    frage: "Welches Instrument zeigt, welche Mitarbeitenden welche Maschinen oder Tätigkeiten sicher beherrschen?",
    antworten: [
      "Qualifikationsmatrix",
      "Kostenartenrechnung",
      "Liquiditätsplan",
      "Materialstückliste"
    ],
    richtig: 0,
    erklaerung: "Eine Qualifikationsmatrix macht vorhandene Kompetenzen und Qualifizierungsbedarf transparent."
  },
  {
    id: 29,
    bereich: "Führung & Personal",
    frage: "Wie sollte ein Meister reagieren, wenn eine neue Mitarbeiterin bei einer sicherheitskritischen Tätigkeit unsicher ist?",
    antworten: [
      "Tätigkeit stoppen, unterweisen und erst nach Befähigungsnachweis freigeben",
      "Die Mitarbeiterin ohne Begleitung weitermachen lassen",
      "Die Unsicherheit ignorieren, um den Termin zu halten",
      "Die Aufgabe dauerhaft ohne Erklärung entziehen"
    ],
    richtig: 0,
    erklaerung: "Sicherheit geht vor. Eine Tätigkeit darf erst nach ausreichender Unterweisung und nachgewiesener Befähigung selbstständig ausgeführt werden."
  },
  {
    id: 30,
    bereich: "Führung & Personal",
    frage: "Welche Führungsmaßnahme stärkt die Eigenverantwortung eines erfahrenen Teams?",
    antworten: [
      "Ziele und Entscheidungsrahmen klar vereinbaren und Verantwortung übertragen",
      "Jeden einzelnen Arbeitsschritt dauerhaft vorgeben",
      "Informationen nur an einzelne Personen weitergeben",
      "Fehler grundsätzlich öffentlich bloßstellen"
    ],
    richtig: 0,
    erklaerung: "Bei geeigneter Qualifikation stärkt ein klarer Entscheidungsrahmen mit Verantwortung die Eigenverantwortung."
  },
  {
    id: 31,
    bereich: "Führung & Personal",
    frage: "Was beschreibt das Ziel eines betrieblichen Eingliederungsmanagements?",
    antworten: [
      "Arbeitsunfähigkeit überwinden, erneuter Arbeitsunfähigkeit vorbeugen und den Arbeitsplatz erhalten",
      "Mitarbeitende nach längerer Krankheit automatisch kündigen",
      "Krankmeldungen öffentlich bewerten",
      "Überstunden für erkrankte Personen anordnen"
    ],
    richtig: 0,
    erklaerung: "Das betriebliche Eingliederungsmanagement unterstützt eine nachhaltige Rückkehr und soll erneuter Arbeitsunfähigkeit vorbeugen."
  },
  {
    id: 32,
    bereich: "Führung & Personal",
    frage: "Welche Aussage beschreibt Qualitätsmanagement zutreffend?",
    antworten: [
      "Es plant, lenkt, sichert und verbessert Qualität systematisch",
      "Es prüft nur Endprodukte und verhindert keine Fehler",
      "Es ist ausschließlich Aufgabe der Qualitätsabteilung",
      "Es betrifft nur die Dokumentation, nicht die Prozesse"
    ],
    richtig: 0,
    erklaerung: "Qualitätsmanagement umfasst präventive Planung, Lenkung, Sicherung und kontinuierliche Verbesserung von Qualität."
  },
  {
    id: 33,
    bereich: "Führung & Personal",
    frage: "Wofür wird der PDCA-Zyklus im Qualitätsmanagement verwendet?",
    antworten: [
      "Für kontinuierliche Verbesserung durch Planen, Umsetzen, Prüfen und Handeln",
      "Nur für die Lohnabrechnung",
      "Für die Berechnung der Maschinenlaufzeit",
      "Ausschließlich für Arbeitsschutzunterweisungen"
    ],
    richtig: 0,
    erklaerung: "PDCA steht für Plan, Do, Check, Act und beschreibt einen wiederkehrenden Verbesserungsprozess."
  },
  {
    id: 34,
    bereich: "Führung & Personal",
    frage: "Welche Maßnahme ist bei wiederholten Qualitätsfehlern am nachhaltigsten?",
    antworten: [
      "Ursache analysieren, Gegenmaßnahmen festlegen und deren Wirksamkeit prüfen",
      "Fehlerhafte Teile ohne Analyse entsorgen",
      "Nur die betroffene Person kritisieren",
      "Die Prüfdokumentation abschaffen"
    ],
    richtig: 0,
    erklaerung: "Nachhaltige Qualitätsverbesserung verlangt Ursachenanalyse, geeignete Maßnahmen und eine Wirksamkeitskontrolle."
  },
  {
    id: 35,
    bereich: "Führung & Personal",
    frage: "Welche Wirkung hat konstruktives Feedback?",
    antworten: [
      "Es beschreibt beobachtbares Verhalten, zeigt Auswirkungen und ermöglicht Verbesserung",
      "Es greift die Persönlichkeit der Person an",
      "Es wird nur bei schwerwiegenden Fehlern gegeben",
      "Es ersetzt Zielvereinbarungen vollständig"
    ],
    richtig: 0,
    erklaerung: "Konstruktives Feedback bezieht sich auf beobachtbares Verhalten und unterstützt konkrete Weiterentwicklung."
  },
  {
    id: 36,
    bereich: "Führung & Personal",
    frage: "Was gehört zu einer guten Unterweisung vor Aufnahme einer neuen Tätigkeit?",
    antworten: [
      "Arbeitsablauf, Gefährdungen, Schutzmaßnahmen und Verständnis kontrollieren",
      "Nur eine Unterschrift ohne Erklärung einholen",
      "Ausschließlich die Produktionsmenge erklären",
      "Die Unterweisung erst nach dem ersten Unfall durchführen"
    ],
    richtig: 0,
    erklaerung: "Eine wirksame Unterweisung erklärt Tätigkeit, Risiken und Schutzmaßnahmen und prüft, ob die Inhalte verstanden wurden."
  }
];

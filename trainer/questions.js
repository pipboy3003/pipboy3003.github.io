// ============================================================
// INDUSTRIEMEISTER TRAINER - Fragendatenbank
// Themenbereiche: Organisation HQ | Technik HQ
// ============================================================

window.questions = {

  // ============================================================
  // ORGANISATION - Hauptqualifikation
  // ============================================================
  organisation: [
    {
      id: "orga-kvp-001",
      bereich: "Organisation",
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
      id: "orga-pdca-001",
      bereich: "Organisation",
      frage: "Welche 4 Phasen hat der PDCA-Zyklus?",
      antwort: "Plan (Planen), Do (Ausführen), Check (Überprüfen), Act (Handeln und Verbessern).",
      optionen: [
        "Planen, Delegieren, Kontrollieren, Abschließen",
        "Plan, Do, Check, Act",
        "Prepare, Design, Create, Assess",
        "Planen, Durchführen, Checken, Auswerten"
      ],
      richtig: 1
    },
    {
      id: "orga-arbeitsschutz-001",
      bereich: "Organisation",
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
      id: "orga-oee-001",
      bereich: "Organisation",
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
      id: "orga-fmea-001",
      bereich: "Organisation",
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
      id: "orga-fuehrungsstile-001",
      bereich: "Organisation",
      frage: "Welche Führungsstile unterscheidet man grundlegend?",
      antwort: "Autoritärer, kooperativer und Laissez-faire Führungsstil sind klassische Grundtypen nach Lewin.",
      optionen: [
        "Aktiver, passiver und neutraler Führungsstil",
        "Autoritärer, kooperativer und Laissez-faire Führungsstil",
        "Formeller, informeller und hybrider Führungsstil",
        "Technischer, kaufmännischer und sozialer Führungsstil"
      ],
      richtig: 1
    },
    {
      id: "orga-lean-001",
      bereich: "Organisation",
      frage: "Was versteht man unter Lean Management?",
      antwort: "Lean Management ist eine Unternehmensphilosophie zur Minimierung von Verschwendung bei gleichzeitiger Maximierung des Kundennutzens.",
      optionen: [
        "Reduzierung der Mitarbeiterzahl zur Kostensenkung",
        "Philosophie zur Minimierung von Verschwendung bei maximiertem Kundennutzen",
        "Einsatz schlanker IT-Systeme im Büro",
        "Optimierung der Lieferkette durch externe Partner"
      ],
      richtig: 1
    },
    {
      id: "orga-muda-001",
      bereich: "Organisation",
      frage: "Was sind die 7 Verschwendungsarten (Muda) im Lean Management?",
      antwort: "Überproduktion, Wartezeiten, Transport, überflüssige Prozesse, Bestände, Bewegungen sowie Fehler und Nacharbeit.",
      optionen: [
        "Planung, Einkauf, Produktion, Lager, Versand, Service, Verwaltung",
        "Überproduktion, Wartezeiten, Transport, Prozesse, Bestände, Bewegungen, Fehler",
        "Kosten, Zeit, Qualität, Energie, Personal, Fläche, Material",
        "Rohstoffe, Halbzeuge, Fertigteile, Werkzeuge, Maschinen, Energie, Zeit"
      ],
      richtig: 1
    },
    {
      id: "orga-stellenbeschreibung-001",
      bereich: "Organisation",
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
      id: "orga-bvw-001",
      bereich: "Organisation",
      frage: "Was versteht man unter betrieblichem Vorschlagswesen?",
      antwort: "Das betriebliche Vorschlagswesen motiviert Mitarbeiter, Verbesserungsideen einzubringen. Angenommene Vorschläge können prämiert werden.",
      optionen: [
        "Formelle Beschwerdestelle für Mitarbeiter",
        "System zur Prämierung von Verbesserungsvorschlägen durch Mitarbeiter",
        "Intranet-basiertes Informationssystem",
        "Regelmäßiges Mitarbeitergespräch zur Leistungsbewertung"
      ],
      richtig: 1
    },
    {
      id: "orga-mbo-001",
      bereich: "Organisation",
      frage: "Was ist der Unterschied zwischen Führen mit Zielen (MbO) und situativem Führen?",
      antwort: "MbO setzt gemeinsam vereinbarte Ziele als Steuerungsinstrument. Situatives Führen passt den Führungsstil an Reifegrad und Situation des Mitarbeiters an.",
      optionen: [
        "MbO ist moderner, situatives Führen ist veraltet",
        "MbO nutzt Ziele als Steuerung; situatives Führen passt den Stil an Mitarbeiter und Situation an",
        "Beide Methoden sind identisch",
        "Situatives Führen betrifft nur Krisen"
      ],
      richtig: 1
    },
    {
      id: "orga-cpk-001",
      bereich: "Organisation",
      frage: "Was sagen Cp- und Cpk-Werte aus?",
      antwort: "Cp misst die potenzielle Prozessfähigkeit. Cpk berücksichtigt zusätzlich die Prozesslage beziehungsweise Mittelwertverschiebung.",
      optionen: [
        "Cp misst Kundenzufriedenheit, Cpk die Lieferzeit",
        "Cp = potenzielle Prozessfähigkeit; Cpk = Prozessfähigkeit unter Berücksichtigung der Lage",
        "Beide Kennzahlen messen die Anlagenverfügbarkeit",
        "Cp und Cpk sind identische Kennzahlen"
      ],
      richtig: 1
    },
    {
      id: "orga-betriebsrat-001",
      bereich: "Organisation",
      frage: "Welche Rechte und Pflichten hat der Betriebsrat laut BetrVG?",
      antwort: "Der Betriebsrat hat Informations-, Beratungs-, Anhörungs- und Mitbestimmungsrechte. Er vertritt die Interessen der Mitarbeiter und ist zur Verschwiegenheit verpflichtet.",
      optionen: [
        "Nur Informationsrecht, keine Mitbestimmung",
        "Informations-, Beratungs-, Anhörungs- und Mitbestimmungsrechte; Pflicht zur Verschwiegenheit und Interessenvertretung",
        "Vollständiges Vetorecht bei allen unternehmerischen Entscheidungen",
        "Nur Recht auf jährliche Betriebsversammlung"
      ],
      richtig: 1
    },
    {
      id: "orga-gantt-001",
      bereich: "Organisation",
      frage: "Was ist ein Gantt-Diagramm und wofür wird es eingesetzt?",
      antwort: "Ein Gantt-Diagramm ist ein Balkendiagramm zur Projektplanung. Es zeigt Aufgaben, Dauer und zeitliche Abfolge auf einer Zeitachse.",
      optionen: [
        "Kreisdiagramm zur Kostenverteilung in Projekten",
        "Balkendiagramm zur Visualisierung von Projektaufgaben, Dauer und Zeitplanung",
        "Netzplan zur Darstellung von Materialflüssen",
        "Liniendiagramm zur Qualitätsentwicklung"
      ],
      richtig: 1
    },
    {
      id: "orga-kritischer-pfad-001",
      bereich: "Organisation",
      frage: "Was versteht man unter dem kritischen Pfad in der Netzplantechnik?",
      antwort: "Der kritische Pfad ist die längste Vorgangskette ohne Pufferzeiten. Eine Verzögerung eines kritischen Vorgangs verzögert das Gesamtprojekt.",
      optionen: [
        "Der teuerste Teilbereich eines Projekts",
        "Die längste Vorgangskette ohne Puffer; Verzögerung hier verzögert das Gesamtprojekt",
        "Der Projektabschnitt mit dem höchsten Risiko",
        "Die kürzeste mögliche Projektdurchführungszeit"
      ],
      richtig: 1
    },
    {
      id: "orga-recycling-spaene-001",
      bereich: "Organisation",
      frage: "Was kann aus verölten Metallspänen recycelt beziehungsweise aufbereitet werden?",
      antwort: "Gereinigte Späne können als Schrott verwertet werden. Das abgetrennte Öl kann als Rohstoff für Kühlschmierstoffe dienen.",
      optionen: [
        "Nur Entsorgung als Sondermüll möglich",
        "Späne als Schrott, Öl als Rohstoff für Kühlschmierstoffe",
        "Verwendung als Brennstoff im Heizkraftwerk",
        "Weiterverwendung ohne Trennung von Öl und Metall"
      ],
      richtig: 1
    },
    {
      id: "orga-gemeinkosten-001",
      bereich: "Organisation",
      frage: "Was ist der Zweck von Gemeinkostenzuschlagsätzen in der Kostenrechnung?",
      antwort: "Sie verteilen Gemeinkosten, die nicht direkt einem Produkt zugerechnet werden können, indirekt über einen Verteilungsschlüssel auf Kostenträger.",
      optionen: [
        "Sie dienen ausschließlich der Berechnung von Boni für Meister",
        "Sie ermöglichen die indirekte Verteilung nicht direkt zurechenbarer Kosten auf Kostenträger",
        "Sie ersetzen die Materialeinzelkosten vollständig",
        "Sie werden nur für Exportprodukte benötigt"
      ],
      richtig: 1
    },
    {
      id: "orga-jit-001",
      bereich: "Organisation",
      frage: "Welche Voraussetzungen sind für eine sinnvolle Just-in-Time-Anlieferung notwendig?",
      antwort: "Der Hersteller muss zuverlässig liefern können, der Transport muss gesichert und wirtschaftlich sein, und der optimale Lieferzyklus muss festgelegt werden.",
      optionen: [
        "Nur ein großes Zentrallager wird benötigt",
        "Zuverlässige Lieferung, gesicherter Transport und wirtschaftliche Transportkosten",
        "Just-in-Time funktioniert unabhängig von der Lieferantenzuverlässigkeit",
        "Es sind ausschließlich lange Vertragslaufzeiten notwendig"
      ],
      richtig: 1
    },
    {
      id: "orga-konflikt-001",
      bereich: "Organisation",
      frage: "Welche Stufe folgt im Konfliktlösungsmodell nach der Identifikation des Konflikts?",
      antwort: "Nach der Identifikation und Definition des Konflikts werden unter Einbeziehung aller Beteiligten Lösungsmöglichkeiten entwickelt.",
      optionen: [
        "Sofortige disziplinarische Maßnahme gegen den Verursacher",
        "Entwicklung von Lösungsmöglichkeiten unter Einbeziehung aller Beteiligten",
        "Direkte Eskalation an die Geschäftsleitung",
        "Abschluss und Dokumentation ohne weitere Schritte"
      ],
      richtig: 1
    }
  ],

  // ============================================================
  // TECHNIK - Hauptqualifikation
  // ============================================================
  technik: [
    {
      id: "technik-cnc-001",
      bereich: "Technik",
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
      id: "technik-passung-001",
      bereich: "Technik",
      frage: "Was ist der Unterschied zwischen ISO-Toleranz und Passungssystem?",
      antwort: "ISO-Toleranzen legen zulässige Maßabweichungen fest. Das Passungssystem definiert das Zusammenspiel zweier Bauteile.",
      optionen: [
        "Kein Unterschied, beide Begriffe sind identisch",
        "ISO-Toleranz = zulässige Maßabweichung; Passungssystem = Zusammenspiel zweier Bauteile",
        "ISO-Toleranz gilt nur für Längenmaße, Passungssystem nur für Winkel",
        "Passungssystem ist veraltet"
      ],
      richtig: 1
    },
    {
      id: "technik-schweissverfahren-001",
      bereich: "Technik",
      frage: "Welche Schweißverfahren gibt es und wie unterscheiden sie sich?",
      antwort: "Beispiele sind MIG/MAG, WIG, E-Hand, Laser- und Widerstandsschweißen. Sie unterscheiden sich insbesondere durch Wärmequelle, Schutzgas und Einsatzbereich.",
      optionen: [
        "Es gibt nur thermisches und mechanisches Schweißen",
        "MIG/MAG, WIG, E-Hand, Laser und Widerstandsschweißen unterscheiden sich in Wärmequelle, Schutzgas und Einsatzbereich",
        "Alle Verfahren verwenden identische Elektroden",
        "Schweißverfahren werden nur nach Materialstärke unterschieden"
      ],
      richtig: 1
    },
    {
      id: "technik-zerspanung-001",
      bereich: "Technik",
      frage: "Was ist der Unterschied zwischen Drehen, Fräsen und Schleifen?",
      antwort: "Beim Drehen rotiert das Werkstück, beim Fräsen rotiert das Werkzeug. Schleifen ist Spanen mit geometrisch unbestimmten Schneiden.",
      optionen: [
        "Alle drei sind identische spanende Verfahren",
        "Drehen: rotierendes Werkstück; Fräsen: rotierendes Werkzeug; Schleifen: geometrisch unbestimmte Schneide",
        "Drehen und Fräsen sind spanlos, Schleifen ist spanend",
        "Schleifen ist nur zum Entfernen von Rost geeignet"
      ],
      richtig: 1
    },
    {
      id: "technik-zta-001",
      bereich: "Technik",
      frage: "Was ist ein Zeit-Temperatur-Umwandlungsdiagramm (ZTU-Diagramm)?",
      antwort: "Das ZTU-Diagramm zeigt Gefügeumwandlungen im Stahl in Abhängigkeit von Zeit und Temperatur und hilft bei der Wahl der Abkühlgeschwindigkeit.",
      optionen: [
        "Diagramm zur Schmelzpunktbestimmung von Legierungen",
        "Diagramm, das Gefügeumwandlungen in Stahl abhängig von Zeit und Temperatur zeigt",
        "Diagramm zur Berechnung von Biegemomenten",
        "Tabelle mit Härtewerten verschiedener Materialien"
      ],
      richtig: 1
    },
    {
      id: "technik-sps-001",
      bereich: "Technik",
      frage: "Was versteht man unter SPS (Speicherprogrammierbare Steuerung)?",
      antwort: "Eine SPS ist ein digitales, frei programmierbares Steuergerät zur Automatisierung von Maschinen und Anlagen.",
      optionen: [
        "Analoge Steuerung durch Relais und Schütze",
        "Digitales, frei programmierbares Steuergerät für Maschinen und Anlagen",
        "Software zur ERP-Verwaltung in der Fertigung",
        "Hydraulisches Steuerungssystem für Pressen"
      ],
      richtig: 1
    },
    {
      id: "technik-beanspruchung-001",
      bereich: "Technik",
      frage: "Was ist der Unterschied zwischen Zug-, Druck- und Scherbeanspruchung?",
      antwort: "Zugkräfte ziehen auseinander, Druckkräfte drücken zusammen und Scherkräfte wirken parallel versetzt aufeinander.",
      optionen: [
        "Zug und Druck sind identisch; Scher ist eine Kombination",
        "Zug = Kräfte auseinander; Druck = Kräfte zusammen; Scher = parallele versetzte Kräfte",
        "Alle Beanspruchungsarten haben identische Auswirkungen",
        "Scherbeanspruchung tritt nur bei Schrauben auf"
      ],
      richtig: 1
    },
    {
      id: "technik-waerme-001",
      bereich: "Technik",
      frage: "Was ist der Unterschied zwischen Wärmeleitfähigkeit und Wärmekapazität?",
      antwort: "Wärmeleitfähigkeit beschreibt, wie gut ein Stoff Wärme leitet. Wärmekapazität beschreibt die Energie, die für eine Temperaturerhöhung benötigt wird.",
      optionen: [
        "Beide Begriffe beschreiben dasselbe",
        "Wärmeleitfähigkeit = Güte der Wärmeleitung; Wärmekapazität = Energie für Temperaturerhöhung",
        "Wärmekapazität gilt nur für Gase",
        "Wärmeleitfähigkeit wird nur in der Elektrotechnik verwendet"
      ],
      richtig: 1
    },
    {
      id: "technik-strom-001",
      bereich: "Technik",
      frage: "Was ist der Unterschied zwischen Gleichstrom (DC) und Wechselstrom (AC)?",
      antwort: "Gleichstrom fließt konstant in eine Richtung. Wechselstrom wechselt seine Richtung periodisch.",
      optionen: [
        "DC hat grundsätzlich höhere Spannung als AC",
        "DC fließt konstant in eine Richtung; AC wechselt periodisch die Richtung",
        "AC wird nur in Batterien verwendet",
        "DC und AC sind physikalisch identisch"
      ],
      richtig: 1
    },
    {
      id: "technik-werkstoffpruefung-001",
      bereich: "Technik",
      frage: "Was versteht man unter Werkstoffprüfung und welche Verfahren gibt es?",
      antwort: "Werkstoffprüfung ermittelt mechanische, physikalische und chemische Eigenschaften, etwa durch Zugversuch, Härteprüfung, Kerbschlagbiegeversuch und zerstörungsfreie Prüfungen.",
      optionen: [
        "Nur visuelle Kontrolle der Oberfläche",
        "Ermittlung von Eigenschaften durch Zugversuch, Härteprüfung, Kerbschlag und zerstörungsfreie Prüfverfahren",
        "Ausschließlich chemische Analyse",
        "Nur Maßkontrolle mit Messmitteln"
      ],
      richtig: 1
    },
    {
      id: "technik-ip-001",
      bereich: "Technik",
      frage: "Was bedeutet die IP-Schutzart IP67?",
      antwort: "IP67 bedeutet: staubdicht und geschützt gegen zeitweiliges Untertauchen in Wasser.",
      optionen: [
        "Kennzeichnung der Internetprotokoll-Version",
        "Schutzklasse: staubdicht und Schutz gegen zeitweiliges Untertauchen",
        "Industriestandard für Netzwerkverbindungen",
        "Kennzahl für Produktionspräzision"
      ],
      richtig: 1
    },
    {
      id: "technik-kraft-arbeit-leistung-001",
      bereich: "Technik",
      frage: "Was ist der Unterschied zwischen Kraft, Arbeit und Leistung?",
      antwort: "Kraft ist Masse mal Beschleunigung, Arbeit ist Kraft mal Weg, und Leistung ist Arbeit pro Zeit.",
      optionen: [
        "Kraft, Arbeit und Leistung sind synonyme Begriffe",
        "F = m × a; W = F × s; P = W / t; Leistung ist Arbeit pro Zeit",
        "Leistung ist die Summe aus Kraft und Arbeit",
        "Kraft und Arbeit sind identisch"
      ],
      richtig: 1
    },
    {
      id: "technik-getriebe-001",
      bereich: "Technik",
      frage: "Wofür werden Getriebe eingesetzt?",
      antwort: "Getriebe dienen zur Anpassung von Drehzahl und Drehmoment zwischen Antrieb und Abtrieb.",
      optionen: [
        "Es gibt nur Zahnrad- und Riemengetriebe",
        "Stirnrad-, Kegelrad-, Planeten-, Schnecken- und Riemengetriebe dienen der Drehzahl- und Drehmomentanpassung",
        "Getriebe werden nur zur Drehzahlerhöhung genutzt",
        "Getriebebauarten unterscheiden sich nur im Material"
      ],
      richtig: 1
    },
    {
      id: "technik-pneumatik-hydraulik-001",
      bereich: "Technik",
      frage: "Was sind die wesentlichen Unterschiede zwischen Pneumatik und Hydraulik?",
      antwort: "Pneumatik nutzt kompressible Druckluft und eignet sich für schnelle Bewegungen. Hydraulik nutzt Öl und ermöglicht hohe, präzise Kräfte.",
      optionen: [
        "Beide Systeme sind identisch",
        "Pneumatik nutzt Druckluft; Hydraulik nutzt Öl für hohe Kräfte und präzise Bewegungen",
        "Hydraulik ist vollständig durch Pneumatik ersetzt",
        "Pneumatik wird nur für große Kräfte eingesetzt"
      ],
      richtig: 1
    },
    {
      id: "technik-fuegeverbindungen-001",
      bereich: "Technik",
      frage: "Was ist der Unterschied zwischen formschlüssiger, kraftschlüssiger und stoffschlüssiger Verbindung?",
      antwort: "Formschluss entsteht durch Hintergreifen, Kraftschluss durch Reibung und Anpresskraft, Stoffschluss durch eine Materialverbindung.",
      optionen: [
        "Alle drei Verbindungsarten sind lösbar",
        "Formschluss = Hintergreifen; Kraftschluss = Reibung; Stoffschluss = Materialverbindung",
        "Stoffschluss ist grundsätzlich die schwächste Verbindung",
        "Kraftschluss ist nur für temporäre Verbindungen geeignet"
      ],
      richtig: 1
    },
    {
      id: "technik-wartungseinheit-001",
      bereich: "Technik",
      frage: "Welche Bauteile gehören zu einer Wartungseinheit der Druckluftaufbereitung?",
      antwort: "Eine Wartungseinheit besteht aus Filter, Druckregelventil mit Manometer und gegebenenfalls einem Öler.",
      optionen: [
        "Nur ein einzelner Kompressor",
        "Filter, Druckregelventil mit Manometer und gegebenenfalls Öler",
        "Ausschließlich ein Sicherheitsventil",
        "Nur ein Wasserabscheider"
      ],
      richtig: 1
    },
    {
      id: "technik-gleitlager-001",
      bereich: "Technik",
      frage: "Welche Vorteile bietet ein Gleitlager mit hydrodynamischer Schmierung?",
      antwort: "Es ermöglicht verschleißarmen Dauerbetrieb, eignet sich für hohe Drehzahlen, verträgt Stoßbelastungen und besitzt eine gute Wärmeleitfähigkeit.",
      optionen: [
        "Hohes Anlaufmoment und geringe Lebensdauer",
        "Verschleißarmer Dauerbetrieb, hohe Drehzahlen und hohe Wärmeleitfähigkeit",
        "Nur für niedrige Drehzahlen ohne Stoßbelastung geeignet",
        "Es benötigt keine Schmierung"
      ],
      richtig: 1
    },
    {
      id: "technik-zfp-001",
      bereich: "Technik",
      frage: "Welche zerstörungsfreien Prüfverfahren werden in der Fertigung eingesetzt?",
      antwort: "Beispiele sind Wirbelstromprüfung, Magnetpulverprüfung, Eindringprüfung, Röntgen- oder Gammaprüfung, Ultraschallprüfung und hydrostatische Prüfung.",
      optionen: [
        "Ausschließlich der Zugversuch",
        "Wirbelstrom-, Magnetpulver-, Eindring-, Röntgen-/Gamma-, Ultraschall- und hydrostatische Prüfung",
        "Nur Sichtprüfung mit dem bloßen Auge",
        "Nur Härteprüfung nach Brinell"
      ],
      richtig: 1
    }
  ]

};

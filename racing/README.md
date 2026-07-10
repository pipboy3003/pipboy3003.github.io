# Mechanic's Quest - RPG Racing Game

Postapokalyptisches Browser-Rennspiel mit isometrischer 3D-Overworld, dynamischen Schatten, Tages/Nacht-Zyklus und RPG-Elementen.

## Schnellstart

Oeffne `racing/index.html` im Browser oder nutze GitHub Pages:
https://pipboy3003.github.io/racing/

## Firebase einrichten (optional - fuer Cloud-Spielstand)

1. Gehe zu https://console.firebase.google.com
2. Neues Projekt erstellen (z.B. "mechanics-quest")
3. "Web App" hinzufuegen -> Konfiguration kopieren
4. In `firebase.js` die firebaseConfig ausfuellen
5. Firestore Database aktivieren -> Test-Modus

Ohne Firebase: Spielstand wird automatisch im localStorage gespeichert.

## Steuerung

- W / Pfeil hoch = Vorwaerts
- S / Pfeil runter = Rueckwaerts
- A / Pfeil links = Links
- D / Pfeil rechts = Rechts
- SHIFT = Boost (Rennen)
- Klick auf Gebaude = Interagieren

## Projektstruktur

```
racing/
  index.html   - Haupt-HTML + Screens
  style.css    - Styling (Dark Post-Apoc Theme)
  game.js      - Spiellogik: Three.js Overworld + Phaser3 Rennen
  firebase.js  - Firebase Modul (Speichern/Laden)
  README.md    - Diese Datei
```

## Features

- Three.js isometrische 3D-Overworld mit Fog
- Dynamische Schatten (PCFSoftShadowMap)
- Echte PointLights als Headlights + Ruecklichter
- Gras wackelt im Wind und reagiert auf Spieler-Naehe
- Sonne/Mond Tages-/Nachtzyklus
- Phaser3 Top-Down Rennen mit Arcade Physics
- 3 KI-Gegner mit Pfad-Verfolgung
- Boost-System mit Energie-Anzeige
- Upgrade-System: Motor und Reifen Level 1-5
- RPG-Gebaeude: Rennbahn, Werkstatt, Haendler, Bar
- Missions-System in der Bar
- Auto-Save alle 30 Sekunden (localStorage + Firebase)

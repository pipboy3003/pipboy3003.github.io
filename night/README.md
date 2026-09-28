# Nachtfahrt – Basepaket 1

Das ist **eine fahrbare 3D-Grundversion**, noch **kein fertiges Liefer-Spiel**. Enthalten: Nachtstadt, Garagen-Start, Auto mit Arcade-Steuerung, Gebäude, Straßen, Beleuchtung, Regen, Start-/Pausemenü und Fahrbahnbegrenzung. Die Liefermissionen, Minikarte und Abrechnung folgen in späteren kompletten Dateipaketen.

## Upload ohne Terminal

1. Im Repository `pipboy3003/pipboy3003.github.io` auf Branch `main` den Ordner `night` anlegen.
2. Die drei Dateien `index.html`, `style.css` und `game.js` sowie diese `README.md` **direkt in `night/`** hochladen. Keine zusätzlichen Ordner zwischen `night` und `index.html`.
3. Commit erstellen. Wenn GitHub Pages von `main` / Root veröffentlicht, die Adresse `https://pipboy3003.github.io/night/` aufrufen. Wenn Pages anders eingestellt ist, unter Settings > Pages den Veröffentlichungszweig prüfen.
4. Die erste Anzeige ist das Startmenü. „Nachtschicht starten“ anklicken und mit WASD/Pfeiltasten fahren. Esc pausiert, R setzt zur Garage zurück.

Three.js wird aus einem gepinnten jsDelivr-CDN geladen: für den **ersten** Stand ist daher Internetzugang nötig. Kein npm, kein Build und kein Firebase erforderlich. Auf GitHub Pages läuft die Seite als statische Datei. Für einen späteren Stand können wir Three.js lokal über Vite bündeln und eine passende Deployment-Pipeline bauen.

## Noch offen

Lieferungen, Zeitlimit, Auto-Schaden, Minikarte, Audio, Speichern und Auswertung sind noch **nicht** enthalten. Geschwindigkeitsanzeige `km/h*` ist ein grober Arcade-Anzeigewert, keine Messung. Keine Live-Browserprüfung in dieser Erstellungsumgebung; nach Upload bitte Menü, Stadtansicht, Steuerung, Pause und Browserkonsole testen.

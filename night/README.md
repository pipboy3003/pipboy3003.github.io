# Nachtfahrt Racing – Stand 0.1

Ersetzt den bisherigen Stadt-/Liefer-Prototyp unter `/night` durch einen geschlossenen 3D-Rundkurs. Fahren, Bremsen, Lenken, Regen, fünf Kameras und der visuelle Fahrzeugstil bleiben erhalten. Neu: Rennstrecke, drei Checkpoints pro Runde, drei Runden, Rennzeit und lokal gespeicherte Bestzeit. Noch nicht enthalten: Gegner, Motorensound, Schadenssystem und Fahrzeugauswahl.

## Upload

Die vollständigen Dateien `index.html`, `game.js` und `README.md` aus diesem Paket im bestehenden `/night`-Ordner ersetzen. `style.css` und `favicon.svg` bleiben erhalten. Kein npm oder Build; Three.js lädt online über CDN. Änderungen selbst committen. Alte Stadtdateien müssen nicht gelöscht werden; sie sind im Git-Verlauf erhalten.

## Steuerung

W/Pfeil hoch Gas, S/Pfeil runter Bremsen/Rückwärts, A/D oder Pfeile Lenken, C Kamerawahl, Esc Pause, R Reset zur Startlinie mit fünf Sekunden Zeitstrafe. Starte über das Hauptmenü. Fahre den Rundkurs in der durch die Checkpoints angegebenen Reihenfolge; nach drei gültigen Runden erscheint die Ergebnisanzeige.

## Testcheck

Startmenü, Start und Pause testen. Einmal gegen die Fahrtrichtung fahren: keine Rundenzählung. Checkpoints 1–3 in Fahrtrichtung passieren, danach Start/Ziel überqueren: Runde 2/3. Nach der dritten Runde Ergebnis und Bestzeit prüfen. R sollte zur Startlinie zurücksetzen und fünf Sekunden Zeitstrafe vergeben. Alle fünf Kameras beim Beschleunigen testen. Falls die Runde nicht zählt, das Checkpoint-Feedback prüfen und melden, an welcher Stelle es ausbleibt. Browser-Laufzeittest war beim Erstellen des Pakets nicht möglich.

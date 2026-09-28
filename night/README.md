# Nachtfahrt – erste Lieferung

Stadt und Renn-Nacht bleiben getrennte Welten. Das Spiel startet nach dem Intro automatisch in der Nachtschicht. Im Nordwesten, auf der Straße vor dem Nachtkiosk, liegt eine orange Lieferzone. Fahre hinein und halte 1,2 Sekunden nahezu still: die Lieferung wird genau einmal abgeschlossen. Das HUD zeigt Entfernung oder Haltefortschritt. Weitere Lieferungen und Bezahlung folgen erst nach diesem Test.

Upload: `mission.js` neu anlegen; `game.js`, `index.html`, `README.md` komplett ersetzen. `city-world.js`, `style.css`, `favicon.svg` unverändert lassen. Eigener Commit auf main.

Test: Stadtstart, Marker auf der Nordweststraße, Hindurchfahren zählt nicht, Stopp zählt genau einmal, Wechsel mit E ins Rennen und R zurück – erledigte Lieferung bleibt in der laufenden Sitzung erledigt. Kein persistenter Spielstand über Browser-Neuladen. Im Browser noch nicht automatisch getestet.

# Nachtfahrt – Auftragsbrief und Missionspfeil

Dieses Update ändert nur die erste Lieferung. Vor Annahme ist der Nachtkiosk-Marker aus. Starte nach dem Loading-Screen mit Enter. Bleibe bei der Garage stehen und bestätige dort mit E: Erst dann wird die Mission aktiv und ein Brief von Mara erscheint. Leyla am Nachtkiosk bekommt Ersatzlampen und Sicherungen. Schließe den Brief mit Enter oder E.

Während der Mission steht oben mittig ein orangefarbener Pfeil. Er zeigt **relativ zur Fahrtrichtung des Autos** auf das Missionsziel und nennt die ungefähre Distanz. Fahre zur orangefarbenen Zone auf der Straße vor dem Nachtkiosk und halte etwa 1,2 Sekunden an. Vor Annahme darf Durchfahren nichts auslösen. Ein abgeschlossener Auftrag bleibt beim Wechsel zur Rennstrecke innerhalb derselben Sitzung erledigt; ein Browser-Neuladen setzt ihn zurück.

Upload nach `/night`: `mission.js`, `game.js`, `index.html`, `README.md` vollständig ersetzen. `city-world.js`, `style.css`, `favicon.svg` nicht ändern. Danach auf GitHub selbst committen.

Tests: Nach Enter an Garage E drücken. Brief prüfen, schließen, Pfeil bei Drehung des Autos überprüfen, Kiosk anfahren, durchfahren zählt nicht, anhalten zählt genau einmal. Danach Rennen betreten und zurückkehren; Lieferung bleibt erledigt. Im Browser nicht automatisch getestet.

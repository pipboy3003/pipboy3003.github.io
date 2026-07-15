# AT Learning Website – Setup-Anleitung

## 1. Firebase-Projekt einrichten
1. Auf https://console.firebase.google.com ein neues Projekt anlegen.
2. Unter "Authentication" -> "Sign-in method" die Methode "E-Mail/Passwort" aktivieren.
3. Unter "Firestore Database" eine neue Datenbank im Produktionsmodus anlegen.
4. Unter "Projekteinstellungen" -> "Meine Apps" eine Web-App hinzufügen und die Konfiguration kopieren.
5. Die kopierten Werte in `firebase-config.js` eintragen (ersetzt die Platzhalter DEIN_API_KEY etc.).

## 2. Firestore-Regeln einspielen
Die Datei `firebase/firestore.rules` enthält die Sicherheitsregeln (Admin/Lehrer/Schüler-Rollen).
Am einfachsten über die Firebase Console unter "Firestore Database" -> "Regeln" einfügen und veröffentlichen.

## 3. Ersten Admin-Nutzer anlegen
Da der Admin-Bereich neue Nutzer nur erstellen kann, wenn schon ein Admin eingeloggt ist,
muss der allererste Admin-Account manuell angelegt werden:
1. In der Firebase Console unter "Authentication" -> "Nutzer hinzufügen" eine E-Mail + Passwort anlegen.
2. In "Firestore Database" die Collection `users` anlegen, Dokument-ID = die eben erzeugte User-UID.
3. Feld `role` = "admin", Feld `name` = euer Name, Feld `email` = die E-Mail-Adresse.

## 4. Klassen anlegen (Schritt für Schritt in der Firebase Console)

Aktuell gibt es im Admin-Bereich der Website nur ein Formular für **Termine** einer bereits
existierenden Klasse – die Klasse selbst (Name, Zeitraum, Material) muss einmalig manuell in der
Firebase Console angelegt werden. Das machst du so:

### 4.1 Klassen-Dokument erstellen
1. In der Firebase Console zu **Firestore Database** wechseln.
2. Falls noch nicht vorhanden, Collection `klassen` anlegen (Button "Collection starten").
3. Neues Dokument anlegen – als **Dokument-ID** nicht automatisch generieren lassen, sondern
   selbst eine sprechende ID vergeben, z. B. `im25sp10` (klein geschrieben, ohne Sonderzeichen).
   Diese ID benutzt du später auch beim Anlegen der Nutzer (siehe Schritt 4.3).
4. Folgende Felder im Dokument hinzufügen:

| Feldname | Typ | Beispielwert |
|---|---|---|
| `name` | string | Gepr. Industriemeister(in) Metall – IM25SP10 |
| `start` | string | 2025-11-08 |
| `end` | string | 2026-05-31 |
| `material` | array (von maps) | siehe Schritt 4.2 |

### 4.2 Material-Feld befüllen (optional, aber empfohlen)
Das Feld `material` ist ein Array, jeder Eintrag ist eine Map mit drei Strings:
- `titel` – z. B. "HQ-Trainer – Organisation & Technik"
- `typ` – einer von: `trainer`, `pdf`, `video`, oder leer lassen
- `link` – die URL, z. B. https://pipboy3003.github.io/trainer

In der Firestore Console: Feldtyp "array" wählen, dann pro Eintrag "map" als Typ wählen und die
drei Unterfelder ergänzen.

### 4.3 Termine als Unterkollektion anlegen
Innerhalb des Klassen-Dokuments (z. B. `klassen/im25sp10`) eine **Unterkollektion** namens
`termine` erstellen. Jedes Dokument darin ist ein einzelner Termin mit folgenden Feldern:

| Feldname | Typ | Beispielwert |
|---|---|---|
| `datum` | string | 2025-11-08 |
| `zeit` | string | 08:00 - 16:30 |
| `thema` | string | Fertigungstechnik |
| `dozent` | string | Nannt |
| `raum` | string | Raum 1 |
| `abgesagt` | boolean | false |

Die Dokument-ID der Termine kann automatisch generiert werden – wird nicht manuell benötigt.
Alternativ kannst du Termine bequemer direkt über den Admin-Bereich der Website anlegen
("Kalender verwalten" -> "+ Neuer Termin"), sobald die Klasse selbst existiert.

### 4.4 Nutzer der Klasse zuordnen (verbindet Rollen mit Klassen)
Erst wenn die Klasse existiert, ergibt die Rollenzuordnung Sinn:
- Ein **Schüler**-Nutzer bekommt im Admin-Bereich unter "Nutzer verwalten" die passende Klasse
  aus der Dropdown-Liste zugewiesen -> das Feld `klasseId` im Nutzerprofil verweist auf die
  Dokument-ID der Klasse (z. B. `im25sp10`).
- Ein **Lehrer**-Nutzer bekommt ebenfalls eine Klasse zugewiesen -> das Feld `klassenIds`
  ist ein Array und kann mehrere Klassen-IDs enthalten, falls ein Dozent mehrere Klassen unterrichtet.

Kurz gesagt: Erst Klasse anlegen (4.1–4.3), danach Nutzer mit Rolle "Lehrer" oder "Schüler"
über den Admin-Bereich anlegen und dabei die passende Klasse aus der Liste auswählen.

### 4.5 Schnellstart mit Beispieldaten
Die Datei `firebase/klassen-seed.json` enthält bereits fertige Beispieldaten für die drei
Klassen IM25SP10, IM25SP20 und IME25SP21 in genau diesem Format. Wer sich das manuelle Eintippen
sparen möchte, findet im Ordner `firebase/` bereits ein fertiges Import-Skript `import-klassen.js`,
das die Beispieldaten automatisch anlegt:

```
cd firebase
npm install firebase-admin
# Service-Account-Key aus Firebase Console -> Projekteinstellungen -> Dienstkonten herunterladen
# und als serviceAccountKey.json in diesen Ordner legen
node import-klassen.js
```

Das Skript legt alle drei Beispiel-Klassen inkl. Terminen automatisch in Firestore an.

## 5. Cloud Function für automatische E-Mails
Im Ordner `firebase/functions` liegt die Funktion `onTerminChange`, die bei jeder Termin-Änderung
automatisch eine Sammel-E-Mail an Schüler und Dozenten der betroffenen Klasse schickt.

Setup:
```
npm install -g firebase-tools
firebase login
cd firebase
firebase functions:config:set smtp.user="deine@adresse.de" smtp.pass="dein-app-passwort"
firebase deploy --only functions
```

Hinweis: Bei Gmail muss ein "App-Passwort" verwendet werden (nicht das normale Passwort),
da Google den direkten Login über Drittanbieter-Apps blockiert.

## 6. Website hochladen (GitHub Pages)
Einfach den gesamten Inhalt dieses ZIP-Archivs (außer dem `firebase`-Ordner) in euer GitHub-Repository
pushen. Der `firebase`-Ordner ist nur für die Firebase-CLI-Konfiguration gedacht und muss nicht
zwingend mit auf GitHub Pages landen, kann aber zur Versionierung mit hochgeladen werden.

## Rollen im System
- **Admin**: Kann Termine, Kurse, Nutzer und Einstellungen bearbeiten.
- **Lehrer**: Sieht nur seine zugeordneten Klassen, Stundenplan und Anwesenheitsliste (nur eigene Klassen, DSGVO-konform).
- **Schüler**: Sieht nur seinen eigenen Kalender, kann sich jederzeit bis Unterrichtsbeginn ab- und wieder anmelden.


## 7. Dozenten verwalten

Im Admin-Bereich unter "Kalender verwalten" gibt es jetzt eine kleine Dozentenverwaltung.
Dort kannst du neue Dozenten per Textfeld hinzufügen – sie erscheinen danach automatisch im
Dropdown-Menü bei der Terminerstellung, sodass du beim Eintragen von Terminen nicht mehr tippen,
sondern nur noch auswählen musst. Folgende Dozenten sind bereits als Beispieldaten vorbereitet
(aus `firebase/dozenten-seed.json`, kann bei Bedarf ähnlich wie die Klassen importiert werden):
Nannt, Jordan, Dragojlovic, Fr. Eisele, Waldhier, Holzwarth, Hr. Weber, Hr. Fischer.

## 8. Zufallspasswörter & Willkommens-E-Mails

Beim Anlegen eines neuen Nutzers (Schüler oder Lehrer) wird jetzt automatisch ein zufälliges,
10-stelliges Startpasswort generiert – ein manuelles Eintippen ist nicht mehr nötig.

**Solange noch kein E-Mail-Versand eingerichtet ist:** Das generierte Passwort wird dir direkt
nach dem Anlegen im Admin-Bereich angezeigt. Du musst es in diesem Fall händisch an den jeweiligen
Nutzer weitergeben (z. B. per WhatsApp oder persönlich).

**Sobald der SMTP-Versand eingerichtet ist** (siehe Punkt 5, Cloud Function `onTerminChange`):
Die zusätzliche Cloud Function `sendeWillkommensmail` ist bereits vorbereitet und verschickt das
Passwort automatisch per E-Mail an den neuen Nutzer, sobald sie zusammen mit den anderen Functions
deployed wird (`firebase deploy --only functions`). Es ist keine zusätzliche Konfiguration nötig –
sie nutzt dieselben SMTP-Zugangsdaten wie die Termin-Benachrichtigungen.

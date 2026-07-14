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

## 4. Klassen anlegen
Die Datei `firebase/klassen-seed.json` enthält Beispiel-Klassendaten (IM25SP10, IM25SP20, IME25SP21)
inkl. Stundenplan-Terminen. Diese können entweder manuell über den Admin-Bereich nachgepflegt werden,
oder per Skript in Firestore importiert werden (Collection `klassen`, Subcollection `termine`).

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

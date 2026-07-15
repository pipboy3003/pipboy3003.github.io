// Import-Skript: liest firebase/klassen-seed.json und legt Klassen + Termine in Firestore an.
// Voraussetzung: Firebase Admin SDK Service-Account-Key (JSON) aus der Firebase Console
// (Projekteinstellungen -> Dienstkonten -> Neuen privaten Schlüssel generieren).
//
// Ausführung:
//   npm install firebase-admin
//   node import-klassen.js

const admin = require('firebase-admin');
const fs = require('fs');

// Pfad zu deinem heruntergeladenen Service-Account-Key anpassen:
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function importiereKlassen() {
  const klassen = JSON.parse(fs.readFileSync('./klassen-seed.json', 'utf-8'));

  for (const klasse of klassen) {
    const { id, termine, ...klassenDaten } = klasse;
    console.log(`Lege Klasse an: ${id}`);
    await db.collection('klassen').doc(id).set(klassenDaten);

    for (const termin of termine || []) {
      await db.collection('klassen').doc(id).collection('termine').add(termin);
    }
    console.log(`  -> ${termine?.length || 0} Termine importiert.`);
  }

  console.log('Import abgeschlossen!');
  process.exit(0);
}

importiereKlassen().catch(err => {
  console.error('Fehler beim Import:', err);
  process.exit(1);
});

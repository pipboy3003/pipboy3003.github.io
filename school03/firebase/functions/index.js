// Cloud Functions: automatischer Sammel-E-Mail-Versand bei Terminänderungen.
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const nodemailer = require('nodemailer');

// SMTP-Zugangsdaten setzen:
// firebase functions:config:set smtp.user="deine@adresse.de" smtp.pass="dein-app-passwort"
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: functions.config().smtp.user, pass: functions.config().smtp.pass }
});

exports.onTerminChange = functions.firestore
  .document('klassen/{klasseId}/termine/{terminId}')
  .onWrite(async (change, context) => {
    const klasseId = context.params.klasseId;
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;

    let changeType = 'geändert';
    if (!before && after) changeType = 'neu hinzugefügt';
    if (before && !after) changeType = 'abgesagt / gelöscht';
    if (after && after.abgesagt) changeType = 'abgesagt';

    const klasseDoc = await admin.firestore().collection('klassen').doc(klasseId).get();
    const klasse = klasseDoc.data();
    if (!klasse) return;

    const usersSnap = await admin.firestore().collection('users').where('klasseId', '==', klasseId).get();
    const schuelerMails = usersSnap.docs.map(d => d.data().email).filter(Boolean);

    const lehrerSnap = await admin.firestore().collection('users')
      .where('role', '==', 'lehrer').where('klassenIds', 'array-contains', klasseId).get();
    const lehrerMails = lehrerSnap.docs.map(d => d.data().email).filter(Boolean);

    const alleEmpfaenger = [...new Set([...schuelerMails, ...lehrerMails])];
    if (alleEmpfaenger.length === 0) return;

    const termin = after || before;
    const betreff = `Stundenplan-Änderung: ${klasse.name}`;
    const text = `Hallo,\n\nes gab eine Änderung im Stundenplan von "${klasse.name}":\n\n` +
      `Status: ${changeType}\nDatum: ${termin.datum || '-'}\nUhrzeit: ${termin.zeit || '-'}\n` +
      `Thema: ${termin.thema || '-'}\nDozent: ${termin.dozent || '-'}\nRaum: ${termin.raum || '-'}\n\n` +
      `Bitte prüfen Sie den aktuellen Stundenplan im Klassenbereich der Website.\n\nViele Grüße\nAT Learning`;

    await transporter.sendMail({
      from: '"AT Learning" <' + functions.config().smtp.user + '>',
      to: functions.config().smtp.user,
      bcc: alleEmpfaenger.join(','),
      subject: betreff,
      text: text
    });

    await admin.firestore().collection('aenderungen').add({
      klasseId, changeType, termin, empfaengerAnzahl: alleEmpfaenger.length,
      zeitstempel: admin.firestore.FieldValue.serverTimestamp()
    });
  });


// Sendet automatisch das Startpasswort an neu angelegte Nutzer, sobald ein neuer Eintrag in
// "ausstehendeWillkommensmails" erscheint. Setzt voraus, dass SMTP konfiguriert ist (siehe oben).
exports.sendeWillkommensmail = functions.firestore
  .document('ausstehendeWillkommensmails/{mailId}')
  .onCreate(async (snap, context) => {
    const daten = snap.data();
    const betreff = 'Ihr Zugang zum AT Learning Klassenbereich';
    const text = `Hallo ${daten.name},\n\nIhr persönlicher Zugang zum Klassenbereich wurde angelegt.\n\n` +
      `E-Mail: ${daten.email}\nStartpasswort: ${daten.passwort}\n\n` +
      `Bitte melden Sie sich über "Mein Bereich" auf der Website an. Aus Sicherheitsgründen empfehlen ` +
      `wir, das Passwort nach der ersten Anmeldung zu ändern.\n\nViele Grüße\nAT Learning`;

    await transporter.sendMail({
      from: '"AT Learning" <' + functions.config().smtp.user + '>',
      to: daten.email,
      subject: betreff,
      text: text
    });

    await snap.ref.update({ versendet: true, versendetAm: admin.firestore.FieldValue.serverTimestamp() });
  });

// Firebase-Konfiguration – zentrale Datei für alle Seiten
// WICHTIG: Trage hier deine echten Firebase-Projektdaten ein
// (console.firebase.google.com -> Projekteinstellungen -> "Meine Apps" -> Web-App)

const firebaseConfig = {
  apiKey: "DEIN_API_KEY",
  authDomain: "DEIN_PROJEKT.firebaseapp.com",
  projectId: "DEIN_PROJEKT",
  storageBucket: "DEIN_PROJEKT.appspot.com",
  messagingSenderId: "DEINE_SENDER_ID",
  appId: "DEINE_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

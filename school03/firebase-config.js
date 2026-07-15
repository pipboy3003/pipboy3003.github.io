// Firebase-Konfiguration – bitte mit echten Projektdaten aus der Firebase Console ersetzen
// (Projekteinstellungen -> Meine Apps -> Web-App -> SDK-Konfiguration kopieren).
const firebaseConfig = {
  apiKey: "DEIN_API_KEY",
  authDomain: "DEIN_PROJEKT.firebaseapp.com",
  projectId: "DEIN_PROJEKT",
  storageBucket: "DEIN_PROJEKT.appspot.com",
  messagingSenderId: "DEINE_SENDER_ID",
  appId: "DEINE_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// firebase.js – Firebase v10 Modular SDK
// ANLEITUNG:
// 1. Gehe zu https://console.firebase.google.com
// 2. Neues Projekt erstellen (z.B. "mechanics-quest")
// 3. "Web App" hinzufuegen -> Konfiguration kopieren -> hier eintragen
// 4. In Firebase Console: Firestore Database aktivieren (Test-Modus)

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// =============================================
// HIER DEINE FIREBASE CONFIG EINTRAGEN:
// =============================================
const firebaseConfig = {
  apiKey: "DEIN_API_KEY",
  authDomain: "DEIN_PROJECT.firebaseapp.com",
  projectId: "DEIN_PROJECT_ID",
  storageBucket: "DEIN_PROJECT.appspot.com",
  messagingSenderId: "DEINE_SENDER_ID",
  appId: "DEINE_APP_ID"
};
// =============================================

let db = null;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('Firebase verbunden');
  const statusEl = document.getElementById('firebase-status');
  if (statusEl) statusEl.textContent = '🟢 Firebase verbunden';
} catch(e) {
  console.warn('Firebase nicht konfiguriert - Spiel laeuft im Offline-Modus', e);
  const statusEl = document.getElementById('firebase-status');
  if (statusEl) statusEl.textContent = '🟡 Offline-Modus (kein Firebase)';
}

const SAVE_KEY = 'mechanics_quest_save';

export async function saveGame(state) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  if (db) {
    try {
      await setDoc(doc(db, 'saves', 'player1'), state);
      console.log('Spielstand in Firebase gespeichert');
    } catch(e) { console.warn('Firebase save failed', e); }
  }
}

export async function loadGame() {
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'saves', 'player1'));
      if (snap.exists()) return snap.data();
    } catch(e) { console.warn('Firebase load failed', e); }
  }
  const local = localStorage.getItem(SAVE_KEY);
  return local ? JSON.parse(local) : null;
}

export { db };

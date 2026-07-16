/*
[2026-07-16 06:28 CEST] Firebase Setup erweitert.
- Auth und Realtime Database initialisiert.
- Phase 1 für Login und spätere Multiplayer-Daten vorbereitet.
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBbYbswfsuyXhgK-t_Whz7sGven7J2fT2w",
  authDomain: "rpg01-793eb.firebaseapp.com",
  projectId: "rpg01-793eb",
  storageBucket: "rpg01-793eb.firebasestorage.app",
  messagingSenderId: "381934095221",
  appId: "1:381934095221:web:71007bb26d223de0a7213c",
  databaseURL: "https://rpg01-793eb-default-rtdb.europe-west1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export { app, auth, database };

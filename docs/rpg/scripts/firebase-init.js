/*
[2026-07-16 06:19 CEST] Phase 1 initial erstellt.
- Firebase Initialisierung per modularer Web-SDK.
- Platzhalter-Konfiguration für dein eigenes Firebase-Projekt.
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBbYbswfsuyXhgK-t_Whz7sGven7J2fT2w",
    authDomain: "rpg01-793eb.firebaseapp.com",
    projectId: "rpg01-793eb",
    storageBucket: "rpg01-793eb.firebasestorage.app",
    messagingSenderId: "381934095221",
    appId: "1:381934095221:web:71007bb26d223de0a7213c",
    measurementId: "G-4GCT9YCJJ8"
  };


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };

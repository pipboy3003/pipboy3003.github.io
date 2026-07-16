/*
[2026-07-16 20:31 CEST] Auth-Modul bereinigt und kompakt gehalten.
- E-Mail/Passwort Registrierung ausgelagert.
- Login, Logout und Auth-State-Observer zentralisiert.
- Firebase-Fehler werden in lesbare deutsche Meldungen übersetzt.
*/

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import { app } from "./firebase-init.js";

const auth = getAuth(app);

function mapAuthError(error) {
  const code = error?.code || "";

  switch (code) {
    case "auth/email-already-in-use":
      return "Diese E-Mail wird bereits verwendet.";
    case "auth/invalid-email":
      return "Die E-Mail-Adresse ist ungültig.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "Login fehlgeschlagen. Bitte Eingaben prüfen.";
    case "auth/wrong-password":
      return "Das Passwort ist falsch.";
    case "auth/weak-password":
      return "Das Passwort ist zu schwach.";
    case "auth/too-many-requests":
      return "Zu viele Versuche. Bitte später erneut probieren.";
    case "auth/network-request-failed":
      return "Netzwerkfehler. Bitte Verbindung prüfen.";
    default:
      return error?.message || "Unbekannter Auth-Fehler.";
  }
}

export async function registerWithEmail(email, password) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
}

export async function loginWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
}

export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentAuthUser() {
  return auth.currentUser;
}

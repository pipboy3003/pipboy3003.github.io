/*
[2026-07-16 06:19 CEST] Phase 1 initial erstellt.
- Registrierung, Login, Logout und Auth-State-Observer für Firebase.
*/

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { auth } from "./firebase-init.js";

async function registerWithEmail(email, password) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

async function loginWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

async function logoutUser() {
  await signOut(auth);
}

function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export {
  registerWithEmail,
  loginWithEmail,
  logoutUser,
  watchAuthState
};

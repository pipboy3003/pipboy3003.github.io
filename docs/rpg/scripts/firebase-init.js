import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBbYbswfsuyXhgK-t_Whz7sGven7J2fT2w",
  authDomain: "rpg01-793eb.firebaseapp.com",
  projectId: "rpg01-793eb",
  storageBucket: "rpg01-793eb.firebasestorage.app",
  messagingSenderId: "381934095221",
  appId: "1:381934095221:web:71007bb26d223de0a7213c",
  databaseURL: "https://rpg01-793eb-default-rtdb.europe-west1.firebasedatabase.app"
};

export const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

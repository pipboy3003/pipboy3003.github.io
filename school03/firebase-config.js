// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDEz_5zme77W5vQfz_KyCxJG1tETjS-7cc",
  authDomain: "at-learning-c4bb4.firebaseapp.com",
  projectId: "at-learning-c4bb4",
  storageBucket: "at-learning-c4bb4.firebasestorage.app",
  messagingSenderId: "450143412430",
  appId: "1:450143412430:web:af2a1b085ac7b5568cf09f",
  measurementId: "G-D7N8TQX6JP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

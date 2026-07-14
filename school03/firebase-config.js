const firebaseConfig = {
  apiKey: "AIzaSyDEz_5zme77W5vQfz_KyCxJG1tETjS-7cc",
  authDomain: "at-learning-c4bb4.firebaseapp.com",
  projectId: "at-learning-c4bb4",
  storageBucket: "at-learning-c4bb4.firebasestorage.app",
  messagingSenderId: "450143412430",
  appId: "1:450143412430:web:af2a1b085ac7b5568cf09f",
  measurementId: "G-D7N8TQX6JP"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

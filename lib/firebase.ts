import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC9PT6eA_XcMrJH2aELFWbTWrExMfJsuDM",
  authDomain: "mygotooutfit.firebaseapp.com",
  projectId: "mygotooutfit",
  storageBucket: "mygotooutfit.firebasestorage.app",
  messagingSenderId: "928307727666",
  appId: "1:928307727666:web:b282fa687171f545ad9b2b",
  measurementId: "G-6JG2NTZ8JN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

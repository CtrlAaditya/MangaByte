import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDLFnf9NGa6cfFigAO0SeQk_TWnZN3vRnM",
  authDomain: "mangabyte-cfe09.firebaseapp.com",
  projectId: "mangabyte-cfe09",
  storageBucket: "mangabyte-cfe09.firebasestorage.app",
  messagingSenderId: "763797031762",
  appId: "1:763797031762:web:e7b53f863d04e48436488b",
  measurementId: "G-DRY7S14LZS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

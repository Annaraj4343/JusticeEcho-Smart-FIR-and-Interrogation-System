import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCpszU3qqpaPKNjtX-yxI29urLJxLPHZSM",
  authDomain: "justiceecho-168ea.firebaseapp.com",
  projectId: "justiceecho-168ea",
  storageBucket: "justiceecho-168ea.appspot.com",
  messagingSenderId: "1048109030048",
  appId: "1:1048109030048:web:0ecdf8237d200fa78007c5",
  measurementId: "G-FPMGY28RH4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db }; 
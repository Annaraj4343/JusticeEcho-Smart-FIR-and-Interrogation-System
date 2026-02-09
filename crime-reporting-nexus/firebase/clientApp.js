"use strict";
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCpszU3qqpaPKNjtX-yxI29urLJxLPHZSM",
  authDomain: "justiceecho-168ea.firebaseapp.com",
  projectId: "justiceecho-168ea",
  storageBucket: "justiceecho-168ea.appspot.com",
  messagingSenderId: "1048109030048",
  appId: "1:1048109030048:web:0ecdf8237d200fa78007c5",
  measurementId: "G-FPMGY28RH4",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

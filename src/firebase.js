// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCVgWXLRznAdXp4o7DT2vbggC6-vZVGLgw",
  authDomain: "echowrite-work.firebaseapp.com",
  projectId: "echowrite-work",
  storageBucket: "echowrite-work.firebasestorage.app",
  messagingSenderId: "49179556374",
  appId: "1:49179556374:web:e0ea456f9c1d3ccf189337",
  measurementId: "G-25BLLXY5BY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export { analytics };

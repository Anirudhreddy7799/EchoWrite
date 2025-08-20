// server/firestore.js
import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, increment } from "firebase/firestore";

// Firebase configuration (same as main app)
const firebaseConfig = {
  apiKey: "AIzaSyCVgWXLRznAdXp4o7DT2vbggC6-vZVGLgw",
  authDomain: "echowrite-work.firebaseapp.com",
  projectId: "echowrite-work",
  storageBucket: "echowrite-work.firebasestorage.app",
  messagingSenderId: "49179556374",
  appId: "1:49179556374:web:e0ea456f9c1d3ccf189337",
  measurementId: "G-25BLLXY5BY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const addPurchasedMinutes = async (uid, minutes) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      purchasedMinutes: increment(minutes)
    });
    console.log(`Added ${minutes} minutes to user ${uid}`);
    return true;
  } catch (error) {
    console.error("Error adding purchased minutes:", error);
    throw error;
  }
};

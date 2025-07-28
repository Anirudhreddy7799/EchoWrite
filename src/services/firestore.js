// src/services/firestore.js
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  increment,
  collection,
  addDoc
} from "firebase/firestore";
import { db } from "../firebase";

// 1) Create a new user profile on signup
export async function createUserProfile(uid, email) {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    email,
    usedMinutes: 0,
    purchasedMinutes: 0,
    createdAt: serverTimestamp()
  });
}

// 2) Fetch a user profile
export async function getUserProfile(uid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
}

// 3) Update usedMinutes by +delta (delta can be negative)
export async function updateUsedMinutes(uid, delta) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    usedMinutes: increment(delta)
  });
}

// 4) Add purchased minutes when user buys more
export async function addPurchasedMinutes(uid, delta) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    purchasedMinutes: increment(delta)
  });
}

// 5) Create a new transcription session
export async function createSession(userId) {
  const sessionsCol = collection(db, "sessions");
  const docRef = await addDoc(sessionsCol, {
    userId,
    createdAt: serverTimestamp(),
    usedMinutes: 0
  });
  return docRef.id; // sessionId
}

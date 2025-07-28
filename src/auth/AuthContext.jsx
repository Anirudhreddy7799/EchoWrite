// src/auth/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import { createUserProfile, getUserProfile } from "../services/firestore";

const AuthContext = createContext();

// Provider component wraps your app and makes auth object available
export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes (login, logout)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Fetch the Firestore profile
        const profile = await getUserProfile(u.uid);
        // Merge Auth user + profile data
        setUser({ uid: u.uid, email: u.email, ...profile });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe; 
  }, []);

  // Signup function
  const signup = async (email, password) => {
    // 1. Create the auth user
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // 2. Create the Firestore document
    await createUserProfile(cred.user.uid, cred.user.email);
    return cred;
  };

  // Login function
  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  // Logout function
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  return useContext(AuthContext);
}

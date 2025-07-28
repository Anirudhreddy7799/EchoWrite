// src/auth/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth";

const AuthContext = createContext();

// Provider component wraps your app and makes auth object available
export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes (login, logout)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe; 
  }, []);

  // Signup function
  const signup = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password);

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

// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";

import Signup    from "./pages/Signup";
import Login     from "./pages/Login";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const { user, loading } = useAuth();

  // Show nothing while auth state is loading
  if (loading) return null;

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Dashboard /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/signup"
        element={!user ? <Signup /> : <Navigate to="/" replace />}
      />
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/" replace />}
      />
    </Routes>
  );
}

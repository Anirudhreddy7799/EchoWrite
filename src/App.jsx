// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";

import Signup    from "./pages/Signup";
import Login     from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Conversation from "./pages/Conversation";
import BuyMinutes from "./pages/BuyMinutes";

export default function App() {
  const { user, loading } = useAuth();

  // Show nothing while auth state is loading
  if (loading) return null;

  return (
    <Routes>
      <Route path="/c/:sessionId" element={<Conversation />} />
      <Route path="/buy" element={user ? <BuyMinutes /> : <Navigate to="/login" replace />} />
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

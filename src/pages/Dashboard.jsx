// src/pages/Dashboard.jsx
import React from "react";
import { useAuth } from "../auth/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h2 className="text-2xl mb-4">Welcome, {user.email}</h2>
      <p>This is your EchoWrite dashboard.</p>
      <button
        onClick={logout}
        className="mt-6 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Log Out
      </button>
    </div>
  );
}

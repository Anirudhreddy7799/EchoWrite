// src/pages/Dashboard.jsx
import React from "react";
import { useAuth }      from "../auth/AuthContext";
import { createSession } from "../services/firestore";
import { useNavigate }   from "react-router-dom";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();

  // Compute remaining minutes = free (15) + purchased - used
  const freeMinutes      = 15;
  const remaining = freeMinutes + (user.purchasedMinutes || 0) - (user.usedMinutes || 0);

  const handleStart = async () => {
    // Prevent starting if no minutes left
    if (remaining <= 0) {
      alert("You have no minutes left. Please purchase more to start a session.");
      return;
    }
    // 1) Create session in Firestore
    const sessionId = await createSession(user.uid);
    // 2) Navigate to the live page
    navigate(`/c/${sessionId}`);
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow space-y-6">
      <h2 className="text-2xl">Welcome, {user.email}</h2>

      <div className="bg-gray-100 p-4 rounded">
        <p>Free minutes left: {Math.max(freeMinutes - (user.usedMinutes || 0), 0)}</p>
        <p>Purchased minutes: {user.purchasedMinutes || 0}</p>
        <p className="font-semibold">Total remaining: {remaining}</p>
      </div>

      <button
        onClick={handleStart}
        disabled={remaining <= 0}
        className={`w-full p-3 text-white rounded ${
          remaining > 0
            ? "bg-indigo-600 hover:bg-indigo-700"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        Start Conversation
      </button>

      <button
        onClick={logout}
        className="w-full mt-2 p-2 text-red-600 border border-red-600 rounded hover:bg-red-50"
      >
        Log Out
      </button>
    </div>
  );
}

// src/pages/Dashboard.jsx
import React from "react";
import { useAuth } from "../auth/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  const freeMinutesUsed = user?.usedMinutes || 0;
  const purchasedMinutes = user?.purchasedMinutes || 0;
  const freeMinutesRemaining = Math.max(0, 15 - freeMinutesUsed);

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h2 className="text-2xl mb-4">Welcome, {user.email}</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Your Minutes</h3>
        <div className="space-y-2">
          <p className="text-gray-700">
            Free minutes used: <span className="font-bold">{freeMinutesUsed}</span> / 15
          </p>
          <p className="text-gray-700">
            Free minutes remaining: <span className="font-bold text-green-600">{freeMinutesRemaining}</span>
          </p>
          <p className="text-gray-700">
            Purchased minutes: <span className="font-bold text-blue-600">{purchasedMinutes}</span>
          </p>
        </div>
      </div>

      <button
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 mb-4"
        disabled={freeMinutesRemaining === 0 && purchasedMinutes === 0}
      >
        Start Conversation
      </button>

      <button
        onClick={logout}
        className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Log Out
      </button>
    </div>
  );
}

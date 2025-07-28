// src/pages/Conversation.jsx
import React from "react";
import { useParams } from "react-router-dom";

export default function Conversation() {
  const { sessionId } = useParams();

  return (
    <div className="max-w-2xl mx-auto mt-20 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-medium mb-4">Session: {sessionId}</h2>
      <p>— Audio streaming & live transcription will go here —</p>
    </div>
  );
}

// src/pages/Conversation.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

export default function Conversation() {
  const { sessionId } = useParams();
  const [transcripts, setTranscripts] = useState([]);
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    // 1) Connect to backend Socket.io
    const socket = io(import.meta.env.VITE_BACKEND_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
    });

    // 2) Receive transcripts
    socket.on("transcript", (text) => {
      setTranscripts((prev) => [...prev, text]);
    });

    // 3) Request mic access and start streaming
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        // Use MediaRecorder to capture audio
        const options = { mimeType: "audio/webm; codecs=opus" };
        const recorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = recorder;

        recorder.addEventListener("dataavailable", (e) => {
          if (e.data.size > 0 && socket.connected) {
            // Read blob as ArrayBuffer, then send
            e.data.arrayBuffer().then((buf) => {
              socket.emit("audio-chunk", buf);
            });
          }
        });

        // Start recorder with small timeslice for low latency
        recorder.start(250); // emit data every 250ms
      })
      .catch((err) => {
        console.error("Mic error:", err);
      });

    return () => {
      // Cleanup on unmount
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-20 p-6 bg-white rounded shadow space-y-4">
      <h2 className="text-2xl font-medium">Session: {sessionId}</h2>
      <div className="h-64 overflow-y-auto border p-4">
        {transcripts.map((t, i) => (
          <p key={i} className="mb-2">{t}</p>
        ))}
      </div>
    </div>
  );
}

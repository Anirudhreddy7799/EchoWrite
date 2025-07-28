// server/index.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import WebSocket from "ws";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 4000;
const AAI_KEY = process.env.ASSEMBLYAI_API_KEY;
if (!AAI_KEY) throw new Error("Missing ASSEMBLYAI_API_KEY in .env");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // 1) Open AssemblyAI realtime WebSocket
  const aaiSocket = new WebSocket(
    "wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000",
    { headers: { Authorization: AAI_KEY } }
  );

  aaiSocket.on("open", () => {
    console.log("AAI WS open for", socket.id);
  });

  aaiSocket.on("message", (msg) => {
    // Parse transcript JSON and send to frontend
    const data = JSON.parse(msg);
    if (data.text) {
      socket.emit("transcript", data.text);
    }
  });

  // 2) When client sends audio chunk, forward to AssemblyAI
  socket.on("audio-chunk", (chunk) => {
    if (aaiSocket.readyState === WebSocket.OPEN) {
      aaiSocket.send(chunk);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    aaiSocket.close();
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

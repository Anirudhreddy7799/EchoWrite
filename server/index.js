// server/index.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { AssemblyAI } from "assemblyai";
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

  // Initialize AssemblyAI client
  const client = new AssemblyAI({
    apiKey: AAI_KEY,
  });

  // Create transcriber with streaming configuration
  const transcriber = client.streaming.transcriber({
    sampleRate: 16_000,
    formatTurns: true
  });

  // Set up transcriber event listeners
  transcriber.on("open", ({ id }) => {
    console.log(`Session opened with ID: ${id} for client ${socket.id}`);
  });

  transcriber.on("error", (error) => {
    console.error("AssemblyAI Error:", error);
    socket.emit("error", error.message);
  });

  transcriber.on("close", (code, reason) => {
    console.log("AssemblyAI session closed:", code, reason);
  });

  transcriber.on("turn", (turn) => {
    if (!turn.transcript) {
      return;
    }
    console.log("Transcript:", turn.transcript);
    socket.emit("transcript", turn.transcript);
  });

  // Connect to AssemblyAI when client connects
  transcriber.connect().then(() => {
    console.log("Connected to AssemblyAI streaming service for client:", socket.id);
  }).catch((error) => {
    console.error("Failed to connect to AssemblyAI:", error);
    socket.emit("error", "Failed to connect to transcription service");
  });

  // Handle audio chunks from client
  socket.on("audio-chunk", async (chunk) => {
    try {
      // Convert ArrayBuffer to Uint8Array and send to transcriber
      const audioData = new Uint8Array(chunk);
      await transcriber.sendAudio(audioData);
    } catch (error) {
      console.error("Error sending audio to AssemblyAI:", error);
    }
  });

  socket.on("disconnect", async () => {
    console.log("Client disconnected:", socket.id);
    try {
      await transcriber.close();
    } catch (error) {
      console.error("Error closing transcriber:", error);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

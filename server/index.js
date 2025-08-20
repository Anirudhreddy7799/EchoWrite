import dotenv from "dotenv";
dotenv.config();
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { AssemblyAI } from "assemblyai";
import Stripe from "stripe";
import bodyParser from "body-parser";
import { addPurchasedMinutes } from "./firestore.js";

const PORT = process.env.PORT || 4000;
const AAI_KEY = process.env.ASSEMBLYAI_API_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

if (!AAI_KEY) throw new Error("Missing ASSEMBLYAI_API_KEY in .env");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize Stripe
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" }) : null;

// Stripe payment endpoints
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    const { minutes, uid, priceId } = req.body;

    if (!uid) {
      return res.status(400).json({ error: "User ID required" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: `${CLIENT_URL}/?checkout_success=1`,
      cancel_url: `${CLIENT_URL}/dashboard`,
      metadata: { uid, minutes: minutes.toString() }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook to handle successful payments
app.post("/webhook", bodyParser.raw({ type: "application/json" }), async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).send("Stripe not configured");
    }

    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const uid = session.metadata.uid;
      const minutes = parseInt(session.metadata.minutes, 10);
      
      console.log(`Payment successful for user ${uid}: ${minutes} minutes`);
      await addPurchasedMinutes(uid, minutes);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: error.message });
  }
});

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

  // Implement keep-alive mechanism
  const keepAliveInterval = setInterval(() => {
    if (transcriber && transcriber.isConnected) {
      console.log("Sending keep-alive ping to AssemblyAI");
      transcriber.sendPing().catch((error) => {
        console.error("Error sending keep-alive ping:", error.message);
      });
    }
  }, 30000); // Send ping every 30 seconds

  // Handle audio chunks from client
  socket.on("audio-chunk", async (chunk) => {
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      try {
        if (!transcriber || !transcriber.isConnected) {
          console.error("Transcriber is not connected. Attempting to reconnect...");
          await transcriber.connect();
          console.log("Reconnected to AssemblyAI streaming service.");
        }

        // Convert ArrayBuffer to Uint8Array and send to transcriber
        const audioData = new Uint8Array(chunk);
        await transcriber.sendAudio(audioData);
        break; // Exit the retry loop if successful
      } catch (error) {
        console.error("Error sending audio to AssemblyAI:", error.message);

        if (error.message.includes("Socket is not open")) {
          console.error("Reinitializing transcriber due to closed socket...");
          retryCount++;

          if (retryCount > maxRetries) {
            console.error("Max retries reached. Failed to reconnect to AssemblyAI.");
            socket.emit("error", "Failed to reconnect to transcription service after multiple attempts");
            break;
          }

          try {
            await transcriber.connect();
            console.log("Reconnected to AssemblyAI after socket error. Retrying audio transmission...");
          } catch (reconnectError) {
            console.error("Failed to reconnect to AssemblyAI:", reconnectError.message);
            socket.emit("error", "Failed to reconnect to transcription service");
            break;
          }
        } else {
          socket.emit("error", "Failed to send audio to transcription service");
          break;
        }
      }
    }
  });

  socket.on("disconnect", async () => {
    console.log("Client disconnected:", socket.id);
    clearInterval(keepAliveInterval); // Clear keep-alive interval
    try {
      if (transcriber && transcriber.isConnected) {
        await transcriber.close();
      }
    } catch (error) {
      console.error("Error closing transcriber:", error.message);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

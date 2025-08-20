// src/pages/Conversation.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import io from "socket.io-client";
import { useAuth } from "../auth/AuthContext";
import { updateUsedMinutes } from "../services/firestore";

export default function Conversation() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const [transcripts, setTranscripts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [localSeconds, setLocalSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const flushRef = useRef(0);
  const audioCtxRef = useRef(null);
  const isPausedRef = useRef(false);

  useEffect(() => {
    // 1) Connect to backend Socket.io
    const socket = io(import.meta.env.VITE_BACKEND_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
      setIsConnected(true);
      setError(null);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("error", (errorMsg) => {
      setError(errorMsg);
      console.error("Server error:", errorMsg);
    });

    // 2) Receive transcripts
    socket.on("transcript", (text) => {
      setTranscripts((prev) => [...prev, text]);
    });

    // Helpers: resample + convert to 16-bit PCM
    const resampleTo16kMono = (audioBuffer) => {
      const targetRate = 16000;
      const srcRate = audioBuffer.sampleRate;
      const channelData = audioBuffer.numberOfChannels > 1
        ? audioBuffer.getChannelData(0) // take first channel
        : audioBuffer.getChannelData(0);

      if (srcRate === targetRate) {
        return channelData;
      }

      const sampleRateRatio = srcRate / targetRate;
      const newLength = Math.round(channelData.length / sampleRateRatio);
      const resampled = new Float32Array(newLength);

      let offsetResult = 0;
      let offsetBuffer = 0;

      while (offsetResult < newLength) {
        const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
        // average to reduce aliasing
        let accum = 0;
        let count = 0;
        for (let i = offsetBuffer; i < nextOffsetBuffer && i < channelData.length; i++) {
          accum += channelData[i];
          count++;
        }
        resampled[offsetResult] = count > 0 ? accum / count : 0;
        offsetResult++;
        offsetBuffer = nextOffsetBuffer;
      }

      return resampled;
    };

    const floatTo16BitPCM = (float32Array) => {
      const l = float32Array.length;
      const int16 = new Int16Array(l);
      for (let i = 0; i < l; i++) {
        let s = Math.max(-1, Math.min(1, float32Array[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      return int16;
    };

    // 3) Request mic access and start streaming
    navigator.mediaDevices.getUserMedia({ 
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true
      } 
    })
      .then((stream) => {
        // Use MediaRecorder for low-latency chunks, decode and resample each chunk
        const options = { 
          mimeType: "audio/webm; codecs=opus",
          // audioBitsPerSecond intentionally left default; encoding compressed
        };
        const recorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = recorder;

        recorder.addEventListener("dataavailable", async (e) => {
          try {
            if (e.data.size > 0 && socketRef.current && socketRef.current.connected && !isPausedRef.current) {
              setLocalSeconds((s) => {
                const next = s + 0.1;
                flushRef.current += 0.1;
                if (flushRef.current >= 1) {
                  const minutesDelta = flushRef.current / 60;
                  updateUsedMinutes(user.uid, minutesDelta);
                  flushRef.current = 0;
                }
                return next;
              });

              const arrayBuffer = await e.data.arrayBuffer();

              // Lazily create AudioContext once
              if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
              }

              // Decode compressed chunk to AudioBuffer
              const audioCtx = audioCtxRef.current;
              let audioBuffer;
              try {
                audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
              } catch (decodeErr) {
                console.warn("decodeAudioData failed, trying callback API:", decodeErr);
                audioBuffer = await new Promise((resolve, reject) => {
                  audioCtx.decodeAudioData(arrayBuffer.slice(0), resolve, reject);
                });
              }

              // Resample to 16k mono and convert to 16-bit PCM
              const float32 = resampleTo16kMono(audioBuffer);
              const int16 = floatTo16BitPCM(float32);

              // Emit the raw PCM buffer to server
              socketRef.current.emit("audio-chunk", int16.buffer);
            }
          } catch (err) {
            console.error("Error processing audio chunk:", err);
          }
        });

        recorder.addEventListener("start", () => {
          setIsRecording(true);
        });

        recorder.addEventListener("stop", () => {
          setIsRecording(false);
          if (flushRef.current > 0) {
            const minutesDelta = flushRef.current / 60;
            updateUsedMinutes(user.uid, minutesDelta);
            flushRef.current = 0;
          }
        });

        // Start recorder with small timeslice for low latency
        recorder.start(100);
      })
      .catch((err) => {
        console.error("Mic error:", err);
        setTranscripts(prev => [...prev, `Error accessing microphone: ${err.message}`]);
      });

    return () => {
      // Cleanup on unmount
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      if (socketRef.current) socketRef.current.disconnect();
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, [user.uid]);

  // Calculate remaining minutes
  const free = 15;
  const used = (user.usedMinutes || 0) + localSeconds / 60;
  const purchased = user.purchasedMinutes || 0;
  const remaining = free + purchased - used;

  // Handle 15-minute free limit
  useEffect(() => {
    if (remaining <= 0 && mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      socketRef.current.disconnect();
      alert("Your free time is up! Please purchase more minutes to continue.");
    }
  }, [remaining, isRecording]);

  // Stop recording function
  // Pause recording function
  const handlePause = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      isPausedRef.current = true;
    }
  };

  // Resume recording function
  const handleResume = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      isPausedRef.current = false;
    }
  };

  // End recording/session function
  const handleEnd = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    setIsPaused(false);
    isPausedRef.current = false;
  };

  return (
    <div className="max-w-2xl mx-auto mt-20 p-6 bg-white rounded shadow space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-medium">Session: {sessionId}</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Low minutes warning */}
      {remaining <= 2 && remaining > 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p className="font-semibold">⚠️ Only {remaining.toFixed(2)} minutes left!</p>
          <Link to="/buy" className="text-indigo-600 underline hover:text-indigo-800">
            Buy more minutes
          </Link>
        </div>
      )}

      {/* Recording controls */}
      <div className="flex flex-col gap-2 bg-gray-100 p-4 rounded">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 ${isRecording ? 'text-red-600' : 'text-gray-600'}`}> 
            <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm font-medium">
              {isRecording ? (isPaused ? 'Paused' : 'Recording') : 'Stopped'}
            </span>
          </div>
          <span className="text-sm text-gray-600">
            Remaining: <span className={`font-bold ${remaining <= 2 ? 'text-red-600' : 'text-green-600'}`}>
              {Math.max(0, remaining.toFixed(2))} min
            </span>
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={isPaused ? handleResume : handlePause}
            disabled={!isRecording}
            className={`px-4 py-2 rounded text-white font-medium ${
              isRecording 
                ? (isPaused ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600')
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isPaused ? 'Continue' : 'Pause'}
          </button>
          <button
            onClick={handleEnd}
            disabled={!isRecording}
            className={`px-4 py-2 rounded text-white font-medium ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            End
          </button>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded">
        <p className="text-sm text-gray-600 mb-2">🎤 Live Transcription:</p>
        <div className="h-64 overflow-y-auto border bg-white p-4 rounded">
          {transcripts.length === 0 ? (
            <p className="text-gray-400 italic">Start speaking to see transcription...</p>
          ) : (
            transcripts.map((t, i) => (
              <p key={i} className="mb-2 text-gray-800">{t}</p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

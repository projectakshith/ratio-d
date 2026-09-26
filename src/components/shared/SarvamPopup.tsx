"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  MessageSquare,
  Radio,
} from "lucide-react";
import AiOrbCanvas, { OrbState } from "./AiOrbCanvas";
import { useApp } from "@/context/AppContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Helper to format model output into clean, readable plain text
function formatPlainText(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/\*\*(.*?)\*\*/g, "$1") // strip bold
    .replace(/\*(.*?)\*/g, "$1") // strip italic
    .replace(/^#{1,6}\s+/gm, "") // strip headers
    .replace(/`{1,3}(.*?)`{1,3}/g, "$1") // strip backticks
    .replace(/^\s*[-*]\s+/gm, "• ") // clean bullet points
    .trim();
}

// 16kHz mono WAV audio encoder
function encodeWAV(samples: Float32Array, sampleRate: number = 16000): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  /* RIFF header */
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + samples.length * 2, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"
  /* format chunk */
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono channel
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); // 16-bit
  /* data chunk */
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([view], { type: "audio/wav" });
}

export default function SarvamPopup() {
  const { userData, customDisplayName } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"orb" | "chat">("orb");
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [input, setInput] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [currentInsight, setCurrentInsight] = useState(
    "Tap the orb or mic to ask about your attendance, bunk limits, or exam prep."
  );
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Yo! I'm Sarvam AI (105B). Ask me anything or tap the dotted orb to talk with your voice.",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio recording refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const recordedSamplesRef = useRef<Float32Array[]>([]);
  const recordingStartTimeRef = useRef<number>(0);

  // Retrieve current student data context from AppContext or localStorage
  const getStudentData = useCallback(() => {
    if (userData) return userData;
    try {
      const stored = localStorage.getItem("ratio_data");
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  }, [userData]);

  // Compute initial instant insight without spending API tokens
  useEffect(() => {
    if (isOpen) {
      const data = getStudentData();
      if (data && Array.isArray(data.attendance) && data.attendance.length > 0) {
        const att = data.attendance;
        const critical = att.filter((a: any) => (parseFloat(a.percent) || 0) < 75);
        const name = customDisplayName || data.profile?.name?.split(" ")[0] || "Student";

        let totalCond = 0;
        let totalPres = 0;
        att.forEach((a: any) => {
          totalCond += parseInt(a.conducted) || 0;
          totalPres += parseInt(a.present) || 0;
        });
        const overallPct = totalCond > 0 ? ((totalPres / totalCond) * 100).toFixed(1) : "0";

        if (critical.length > 0) {
          const names = critical
            .map((c: any) => c.course || c.code)
            .slice(0, 2)
            .join(", ");
          setCurrentInsight(
            `Yo ${name}!\nOverall attendance: ${overallPct}%\nWarning: ${critical.length} subject(s) below 75% (${names}).\n\nTap the orb to ask for a comeback schedule!`
          );
        } else {
          setCurrentInsight(
            `Looking good ${name}!\nOverall attendance: ${overallPct}%\nAll courses are above 75%.\n\nTap the orb to check how many classes you can safely bunk.`
          );
        }
      }
    }
  }, [isOpen, getStudentData, customDisplayName]);

  // Scroll chat to bottom
  useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  // Stop audio playback
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsSpeakingAudio(false);
    if (orbState === "speaking") setOrbState("idle");
  }, [orbState]);

  // Text-to-Speech via Sarvam bulbul:v3
  const speakText = useCallback(
    async (text: string) => {
      if (!audioEnabled) return;
      stopAudio();
      setOrbState("speaking");
      setIsSpeakingAudio(true);

      try {
        const cleanForSpeech = formatPlainText(text);
        const res = await fetch("/api/sarvam/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: cleanForSpeech,
            language_code: "en-IN",
            speaker: "shubh",
          }),
        });

        if (!res.ok) throw new Error("TTS failed");
        const data = await res.json();
        if (data?.audio) {
          const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
          audioRef.current = audio;
          audio.onended = () => {
            setIsSpeakingAudio(false);
            setOrbState("idle");
          };
          audio.onerror = () => {
            setIsSpeakingAudio(false);
            setOrbState("idle");
          };
          await audio.play();
        } else {
          setIsSpeakingAudio(false);
          setOrbState("idle");
        }
      } catch {
        setIsSpeakingAudio(false);
        setOrbState("idle");
      }
    },
    [audioEnabled, stopAudio]
  );

  // Send message to Sarvam
  const handleSend = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend || input).trim();
      if (!text) return;

      stopAudio();
      const userMessage: Message = { role: "user", content: text };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setLiveTranscript("");
      setOrbState("thinking");
      setCurrentInsight("Consulting Sarvam AI (105B)...");

      try {
        const res = await fetch("/api/sarvam", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            studentContext: getStudentData(),
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Sarvam failed");

        const reply = formatPlainText(data.content);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: reply },
        ]);
        setCurrentInsight(reply);

        if (audioEnabled) {
          await speakText(reply);
        } else {
          setOrbState("idle");
        }
      } catch (err: any) {
        const errorMsg = `Cooked: ${err.message || "Something went wrong"}. Please check your connection.`;
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: errorMsg },
        ]);
        setCurrentInsight(errorMsg);
        setOrbState("idle");
      }
    },
    [input, messages, audioEnabled, speakText, stopAudio, getStudentData]
  );

  // Stop 16kHz WAV Recording and transcribe with Sarvam saaras:v4
  const stopRecording = useCallback(
    async (shouldSend: boolean = true) => {
      setIsVoiceActive(false);

      // Clean up audio nodes
      if (processorNodeRef.current) {
        processorNodeRef.current.disconnect();
        processorNodeRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        try {
          await audioContextRef.current.close();
        } catch {}
        audioContextRef.current = null;
      }

      const duration = Date.now() - recordingStartTimeRef.current;
      const chunks = recordedSamplesRef.current;
      recordedSamplesRef.current = [];

      if (!shouldSend || chunks.length === 0 || duration < 500) {
        setOrbState("idle");
        if (duration < 500) {
          setCurrentInsight("Recording was too short. Speak for at least a full second.");
        }
        return;
      }

      setOrbState("thinking");
      setCurrentInsight("Transcribing voice with Sarvam saaras:v4...");

      // Combine samples into one Float32Array
      let totalLength = 0;
      for (const chunk of chunks) totalLength += chunk.length;
      const combined = new Float32Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      // Encode into pristine 16kHz mono WAV
      const wavBlob = encodeWAV(combined, 16000);

      try {
        const formData = new FormData();
        formData.append("file", wavBlob, "voice.wav");

        const res = await fetch("/api/sarvam/stt", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error || "STT failed");
        }

        const data = await res.json();
        const transcript = data?.transcript?.trim();

        if (transcript) {
          setLiveTranscript(transcript);
          handleSend(transcript);
        } else {
          setOrbState("idle");
          setCurrentInsight("No clear speech detected in audio. Tap the orb to try again.");
        }
      } catch (err: any) {
        console.error("STT error:", err);
        setOrbState("idle");
        setCurrentInsight("Couldn't process audio. You can also type your question below.");
      }
    },
    [handleSend]
  );

  // Start 16kHz audio capture via AudioContext
  const startRecording = useCallback(async () => {
    stopAudio();

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      alert("Microphone recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      mediaStreamRef.current = stream;
      recordedSamplesRef.current = [];
      recordingStartTimeRef.current = Date.now();

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      // Buffer size 4096 gives ~0.25s chunks at 16kHz
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorNodeRef.current = processor;

      processor.onaudioprocess = (e) => {
        const channelData = e.inputBuffer.getChannelData(0);
        recordedSamplesRef.current.push(new Float32Array(channelData));
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      setIsVoiceActive(true);
      setOrbState("listening");
      setLiveTranscript("");
      setCurrentInsight("🎙️ Recording your voice... speak your question, then tap orb or mic when done!");
    } catch {
      setIsVoiceActive(false);
      setOrbState("idle");
      setCurrentInsight("Microphone access denied. Please allow mic permissions in your browser.");
    }
  }, [stopAudio]);

  const handleOrbClick = () => {
    if (isVoiceActive) {
      stopRecording(true);
    } else if (isSpeakingAudio) {
      stopAudio();
    } else {
      startRecording();
    }
  };

  const handleClear = () => {
    stopAudio();
    setMessages([
      {
        role: "assistant",
        content: "Cleared! Tap the orb or speak to ask another question.",
      },
    ]);
    setCurrentInsight("What would you like to calculate or know next?");
  };

  const samplePrompts = [
    { label: "⚡ can i bunk?", query: "Look at my real attendance: which classes can I safely bunk this week, and which ones are in danger of debarment?" },
    { label: "🎯 9 CGPA target", query: "Based on my current internal marks, what exact scores do I need in finals to score a 9 CGPA?" },
    { label: "🚨 critical subjects", query: "Which of my subjects are currently below 75% or near the edge? Calculate how many classes I must attend consecutively." },
    { label: "🗣️ hinglish recap", query: "Give me a quick summary of my attendance and marks in chill Hinglish." },
  ];

  return (
    <>
      {/* Floating Action Button on Dashboard */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-5 md:bottom-8 md:right-8 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full border border-theme-border shadow-xl backdrop-blur-md transition-colors"
        style={{
          backgroundColor: "var(--theme-card)",
          color: "var(--theme-text)",
        }}
        aria-label="Open Sarvam AI"
      >
        <div className="w-2.5 h-2.5 rounded-full bg-[#ceff1c] animate-pulse" />
        <Sparkles size={16} className="text-[#ceff1c]" />
        <span
          className="text-[13px] font-bold tracking-tight lowercase"
          style={{ fontFamily: "var(--font-montserrat)" }}
        >
          sarvam ai
        </span>
      </motion.button>

      {/* Main Popup Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{
              backgroundColor: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(10px)",
            }}
            onClick={() => {
              stopAudio();
              setIsOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="w-full sm:max-w-[490px] h-[88vh] sm:h-[670px] rounded-t-[32px] sm:rounded-[32px] border border-theme-border shadow-2xl flex flex-col overflow-hidden"
              style={{ backgroundColor: "var(--theme-bg)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-theme-border flex items-center justify-between gap-3 bg-theme-card/30 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-theme-emphasis flex items-center justify-center text-theme-bg font-black">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3
                        className="text-[1.15rem] font-black tracking-tight lowercase leading-none"
                        style={{ fontFamily: "var(--font-montserrat)" }}
                      >
                        sarvam ai
                      </h3>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-[#ceff1c]/15 text-[#ceff1c] border border-[#ceff1c]/30">
                        105b voice
                      </span>
                    </div>
                    <p
                      className="text-[10px] text-theme-muted mt-0.5"
                      style={{ fontFamily: "var(--font-afacad)" }}
                    >
                      sarvam-105b · saaras:v4 stt · bulbul:v3 tts
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Audio toggle button */}
                  <button
                    onClick={() => {
                      if (isSpeakingAudio) stopAudio();
                      setAudioEnabled(!audioEnabled);
                    }}
                    title={audioEnabled ? "Voice output enabled" : "Voice output muted"}
                    className={`p-2 rounded-xl transition-all ${
                      audioEnabled
                        ? "text-[#ceff1c] bg-[#ceff1c]/10"
                        : "text-theme-muted hover:text-theme-text"
                    }`}
                  >
                    {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>

                  {/* Reset */}
                  <button
                    onClick={handleClear}
                    title="Reset chat"
                    className="p-2 rounded-xl text-theme-muted hover:text-theme-text hover:bg-theme-text/5 transition-all"
                  >
                    <RotateCcw size={15} />
                  </button>

                  {/* Close */}
                  <button
                    onClick={() => {
                      stopAudio();
                      setIsOpen(false);
                    }}
                    className="p-2 rounded-xl text-theme-muted hover:text-theme-text hover:bg-theme-text/5 transition-all"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              {/* View Switcher: Orb & Voice vs Chat */}
              <div className="px-4 py-2 border-b border-theme-border/40 flex items-center justify-between bg-theme-card/15 shrink-0">
                <div className="flex gap-1.5 p-1 bg-theme-card/60 rounded-xl border border-theme-border/50 text-[11px] font-bold">
                  <button
                    onClick={() => setActiveTab("orb")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                      activeTab === "orb"
                        ? "bg-theme-emphasis text-theme-bg shadow-sm"
                        : "text-theme-muted hover:text-theme-text"
                    }`}
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    <Radio size={12} />
                    <span>orb & voice</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("chat")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                      activeTab === "chat"
                        ? "bg-theme-emphasis text-theme-bg shadow-sm"
                        : "text-theme-muted hover:text-theme-text"
                    }`}
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    <MessageSquare size={12} />
                    <span>chat log</span>
                  </button>
                </div>

                <div className="text-[10px] font-bold uppercase tracking-wider text-theme-muted flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      orbState === "listening"
                        ? "bg-[#ceff1c] animate-ping"
                        : orbState === "speaking"
                        ? "bg-sky-400 animate-pulse"
                        : orbState === "thinking"
                        ? "bg-purple-400 animate-spin"
                        : "bg-theme-muted/50"
                    }`}
                  />
                  <span>{orbState}</span>
                </div>
              </div>

              {/* Tab 1: Orb & Voice Mode */}
              {activeTab === "orb" && (
                <div className="flex-1 flex flex-col items-center justify-between p-4 overflow-y-auto scrollbar-none">
                  {/* Status Indicator */}
                  <div className="text-center mt-0.5">
                    <span
                      className="text-[10.5px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-theme-border bg-theme-card/50 text-theme-muted"
                      style={{ fontFamily: "var(--font-montserrat)" }}
                    >
                      {orbState === "listening"
                        ? "🎙️ recording... tap orb to finish"
                        : orbState === "thinking"
                        ? "⚡ reasoning with sarvam..."
                        : orbState === "speaking"
                        ? "🔊 speaking response..."
                        : "✦ tap orb to speak"}
                    </span>
                  </div>

                  {/* Big Animated 3D Dotted Orb */}
                  <div className="relative my-auto flex flex-col items-center justify-center">
                    <AiOrbCanvas
                      state={orbState}
                      size={240}
                      onClick={handleOrbClick}
                      className="relative z-10"
                    />

                    {/* Glowing circular aura under orb */}
                    <div
                      className="absolute inset-0 rounded-full blur-2xl opacity-20 pointer-events-none transition-all duration-500"
                      style={{
                        backgroundColor:
                          orbState === "listening"
                            ? "#ceff1c"
                            : orbState === "speaking"
                            ? "#38bdf8"
                            : orbState === "thinking"
                            ? "#c084fc"
                            : "#ceff1c",
                        transform: "scale(0.8)",
                      }}
                    />

                    {/* Realtime voice transcription pill */}
                    {liveTranscript && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 max-w-[340px] text-center px-4 py-1.5 rounded-full bg-theme-emphasis text-theme-bg text-[11px] font-bold tracking-tight shadow-md"
                        style={{ fontFamily: "var(--font-afacad)" }}
                      >
                        "{liveTranscript}"
                      </motion.div>
                    )}
                  </div>

                  {/* AI Insight Card - Clean Plain Text & Scrollable */}
                  <div className="w-full space-y-2.5 shrink-0">
                    <div
                      className="p-4 rounded-2xl bg-theme-card/70 border border-theme-border text-left shadow-inner max-h-44 sm:max-h-52 overflow-y-auto scrollbar-thin"
                      style={{ fontFamily: "var(--font-afacad)" }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-[#ceff1c]">
                          ai insight
                        </p>
                        {isSpeakingAudio && (
                          <span className="text-[10px] font-bold text-sky-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                            speaking
                          </span>
                        )}
                      </div>
                      <div className="text-[13.5px] leading-relaxed text-theme-text whitespace-pre-line font-medium">
                        {formatPlainText(currentInsight)}
                      </div>
                    </div>

                    {/* Quick action chips */}
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                      {samplePrompts.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(p.query)}
                          className="whitespace-nowrap px-3 py-1.5 rounded-xl text-[11px] font-bold border border-theme-border text-theme-muted hover:text-theme-text hover:border-theme-text/40 bg-theme-card/40 transition-all shrink-0 active:scale-95"
                          style={{ fontFamily: "var(--font-montserrat)" }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Full Chat Log View */}
              {activeTab === "chat" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
                  {messages.map((m, idx) => {
                    const isUser = m.role === "user";
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-[18px] px-3.5 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-line ${
                            isUser
                              ? "bg-theme-emphasis text-theme-bg font-semibold rounded-tr-sm"
                              : "bg-theme-card border border-theme-border text-theme-text font-normal rounded-tl-sm"
                          }`}
                          style={{ fontFamily: "var(--font-afacad)" }}
                        >
                          {formatPlainText(m.content)}
                          {!isUser && (
                            <button
                              onClick={() => speakText(m.content)}
                              className="mt-2 block text-[10px] font-bold text-theme-muted hover:text-[#ceff1c] transition-colors"
                            >
                              🔊 read aloud
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                  {orbState === "thinking" && (
                    <div className="flex justify-start">
                      <div
                        className="bg-theme-card border border-theme-border text-theme-muted rounded-[18px] rounded-tl-sm px-4 py-2 text-[12px] flex items-center gap-2"
                        style={{ fontFamily: "var(--font-afacad)" }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-theme-muted animate-ping" />
                        sarvam is reasoning...
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Input Footer */}
              <div className="p-3 sm:p-4 border-t border-theme-border bg-theme-card/30 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  {/* Voice Button */}
                  <button
                    type="button"
                    onClick={isVoiceActive ? () => stopRecording(true) : startRecording}
                    className={`p-2.5 rounded-xl transition-all shrink-0 ${
                      isVoiceActive
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-theme-card border border-theme-border text-theme-text hover:border-theme-text/40"
                    }`}
                    title={isVoiceActive ? "Stop recording and send" : "Record voice question"}
                  >
                    {isVoiceActive ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="ask attendance, marks, or tap mic..."
                    disabled={orbState === "thinking"}
                    className="flex-1 bg-theme-card border border-theme-border rounded-xl px-3.5 py-2.5 text-[13px] text-theme-text placeholder:text-theme-muted/70 focus:outline-none focus:border-theme-text/50 transition-colors disabled:opacity-50"
                    style={{ fontFamily: "var(--font-afacad)" }}
                  />

                  <button
                    type="submit"
                    disabled={!input.trim() || orbState === "thinking"}
                    className="p-2.5 rounded-xl bg-theme-emphasis text-theme-bg font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                    aria-label="Send message"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import RecordingPanel from "./components/RecordingPanel";
import TranscriptPanel from "./components/TranscriptPanel";
import NotePad, { type Note } from "./components/NotePad";
import SummaryPanel from "./components/SummaryPanel";
import SettingsModal, { type Settings } from "./components/SettingsModal";
import type { TranscriptEntry, RecordingStatus } from "./types";

function loadSettings(): Settings {
  return {
    provider:     (localStorage.getItem("kefir_provider") as Settings["provider"]) ?? "anthropic",
    anthropicKey: localStorage.getItem("kefir_api_key")    ?? "",
    openAiKey:    localStorage.getItem("kefir_openai_key") ?? "",
    whisperModel: localStorage.getItem("kefir_whisper")    ?? "base",
  };
}

function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return `${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function App() {
  const [isRecording, setIsRecording]     = useState(false);
  const [transcript, setTranscript]       = useState<TranscriptEntry[]>([]);
  const [notes, setNotes]                 = useState<Note[]>([]);
  const [summary, setSummary]             = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [status, setStatus]               = useState<RecordingStatus>({ phase: "idle", message: "Ready" });
  const [showSettings, setShowSettings]   = useState(false);
  const [settings, setSettings]           = useState<Settings>(loadSettings);
  const [elapsedMs, setElapsedMs]         = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Tauri event listeners ─────────────────────────────────
  useEffect(() => {
    const unT = listen<TranscriptEntry>("transcript-update", (e) =>
      setTranscript((prev) => [...prev, e.payload])
    );
    const unS = listen<RecordingStatus>("recording-status", (e) => {
      setStatus(e.payload);
      if (e.payload.phase === "done" || e.payload.phase === "error") setIsRecording(false);
    });
    return () => { unT.then((f) => f()); unS.then((f) => f()); };
  }, []);

  // ── Timer helpers ─────────────────────────────────────────
  const startTimer = useCallback(() => {
    setElapsedMs(0);
    timerRef.current = setInterval(() => setElapsedMs((ms) => ms + 1000), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const elapsed = fmtTime(elapsedMs);

  // ── Recording controls ────────────────────────────────────
  const handleStart = useCallback(async () => {
    try {
      setTranscript([]);
      setSummary("");
      await invoke("start_recording");
      setIsRecording(true);
      startTimer();
      setStatus({ phase: "recording", message: "Recording..." });
    } catch (e) {
      setStatus({ phase: "error", message: `Start failed: ${e}` });
    }
  }, [startTimer]);

  const handleStop = useCallback(async () => {
    try {
      stopTimer();
      setStatus({ phase: "processing", message: "Stopping & transcribing..." });
      await invoke("stop_recording");
      setIsRecording(false);
    } catch (e) {
      setStatus({ phase: "error", message: `Stop failed: ${e}` });
      setIsRecording(false);
    }
  }, [stopTimer]);

  // ── Notes ─────────────────────────────────────────────────
  const handleAddNote  = useCallback((note: Note) => setNotes((prev) => [...prev, note]), []);
  const handleClrNotes = useCallback(() => setNotes([]), []);

  // ── Summarize ─────────────────────────────────────────────
  const activeKey = settings.provider === "anthropic" ? settings.anthropicKey : settings.openAiKey;

  const handleSummarize = useCallback(async () => {
    if (!activeKey) { setShowSettings(true); return; }
    if (transcript.length === 0) return;
    setIsSummarizing(true);
    try {
      const transcriptText = transcript
        .map((e) => `[${e.timestamp}] [${e.speaker}${e.speakerLabel ? ` (${e.speakerLabel})` : ""}]: ${e.text}`)
        .join("\n");

      // Format user notes the same way — injected as "what I found important"
      const formattedNotes = notes.map((n) => `[${n.timestamp}] ${n.text}`);

      const result = await invoke<string>("summarize_transcript", {
        transcript:  transcriptText,
        apiKey:      activeKey,
        provider:    settings.provider,
        model:       settings.whisperModel,
        userNotes:   formattedNotes,
      });
      setSummary(result);
    } catch (e) {
      setSummary(`Error: ${e}`);
    } finally {
      setIsSummarizing(false);
    }
  }, [transcript, notes, activeKey, settings.provider, settings.whisperModel]);

  // ── Settings ──────────────────────────────────────────────
  const handleSettingsSave = useCallback((s: Settings) => {
    localStorage.setItem("kefir_provider",   s.provider);
    localStorage.setItem("kefir_api_key",    s.anthropicKey);
    localStorage.setItem("kefir_openai_key", s.openAiKey);
    localStorage.setItem("kefir_whisper",    s.whisperModel);
    setSettings(s);
    setShowSettings(false);
  }, []);

  const providerLabel = settings.provider === "anthropic" ? "Claude" : "GPT";

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon" />
          <span className="brand-name">Kefir</span>
          <span className="brand-sub">AI Meeting Notetaker</span>
        </div>

        <RecordingPanel
          isRecording={isRecording}
          elapsed={isRecording ? elapsed : undefined}
          onStart={handleStart}
          onStop={handleStop}
        />

        <div className="header-right">
          {activeKey && <span className="provider-badge">{providerLabel}</span>}
          <span className={`status-pill status-pill--${status.phase}`}>{status.message}</span>
          <button className="icon-btn" onClick={() => setShowSettings(true)} title="Settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      <main className="app-body">
        <TranscriptPanel entries={transcript} isRecording={isRecording} />
        <NotePad
          notes={notes}
          isRecording={isRecording}
          elapsed={elapsed}
          onAdd={handleAddNote}
          onClear={handleClrNotes}
        />
        <SummaryPanel
          summary={summary}
          isSummarizing={isSummarizing}
          canSummarize={transcript.length > 0 && !isRecording && !isSummarizing}
          hasApiKey={!!activeKey}
          providerLabel={providerLabel}
          onSummarize={handleSummarize}
        />
      </main>

      {showSettings && (
        <SettingsModal
          current={settings}
          onSave={handleSettingsSave}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

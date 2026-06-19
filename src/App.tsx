import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import Sidebar, { type View } from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import MeetingView from "./components/MeetingView";
import SettingsPage from "./components/SettingsPage";
import type { Note } from "./components/NotePad";
import type { TranscriptEntry, RecordingStatus, Settings } from "./types";

function loadSettings(): Settings {
  return {
    provider:     (localStorage.getItem("kefir_provider")     as Settings["provider"])    ?? "anthropic",
    anthropicKey: localStorage.getItem("kefir_api_key")       ?? "",
    openAiKey:    localStorage.getItem("kefir_openai_key")    ?? "",
    asrProvider:  (localStorage.getItem("kefir_asr_provider") as Settings["asrProvider"]) ?? "local",
    deepgramKey:  localStorage.getItem("kefir_deepgram_key")  ?? "",
    whisperModel: localStorage.getItem("kefir_whisper")       ?? "base",
  };
}

function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return `${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function NotesView({ notes }: { notes: Note[] }) {
  return (
    <div className="dashboard">
      <div className="dash-greeting">
        <h1>Session Notes</h1>
        <p>Timestamped highlights captured during your last recording.</p>
      </div>

      {notes.length === 0 ? (
        <div style={{
          background: "var(--s1)", border: "1px solid var(--bdr)", borderRadius: "var(--r-l)",
          padding: "40px 32px", textAlign: "center",
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📝</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--tx2)", marginBottom: 6 }}>No notes yet</div>
          <div style={{ fontSize: 12, color: "var(--tx3)", lineHeight: 1.65 }}>
            Start a meeting and stamp highlights during recording.<br />
            They'll appear here with timestamps.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {notes.map((n, i) => (
            <div key={n.id} style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 16,
              background: "var(--s1)",
              border: "1px solid var(--bdr)",
              borderLeft: "3px solid var(--orange-40)",
              borderRadius: "var(--r-m)",
              padding: "12px 16px",
              transition: "border-color 0.15s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.borderLeftColor = "var(--orange)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderLeftColor = "var(--orange-40)")}
            >
              <div style={{
                fontFamily: "var(--mono)", fontSize: 11, color: "var(--orange)",
                flexShrink: 0, paddingTop: 2, fontVariantNumeric: "tabular-nums",
              }}>
                {n.timestamp}
              </div>
              <div style={{ fontSize: 13.5, color: "var(--tx1)", lineHeight: 1.6 }}>
                {n.text}
              </div>
              <div style={{
                marginLeft: "auto", fontSize: 10.5, color: "var(--tx3)",
                flexShrink: 0, paddingTop: 2,
              }}>
                #{i + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [activeView,    setActiveView]    = useState<View>("dashboard");
  const [sidebarOpen,  setSidebarOpen]   = useState(true);
  const [isRecording,  setIsRecording]   = useState(false);
  const [transcript,   setTranscript]    = useState<TranscriptEntry[]>([]);
  const [notes,        setNotes]         = useState<Note[]>([]);
  const [summary,      setSummary]       = useState("");
  const [isSummarizing,setIsSummarizing] = useState(false);
  const [status,       setStatus]        = useState<RecordingStatus>({ phase: "idle", message: "Ready" });
  const [settings,     setSettings]      = useState<Settings>(loadSettings);
  const [elapsedMs,    setElapsedMs]     = useState(0);
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

  // ── Timer ─────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    setElapsedMs(0);
    timerRef.current = setInterval(() => setElapsedMs((ms) => ms + 1000), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const elapsed = fmtTime(elapsedMs);

  // ── Recording ─────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    try {
      setTranscript([]);
      setSummary("");
      await invoke("start_recording", {
        asrProvider: settings.asrProvider,
        deepgramKey: settings.deepgramKey,
      });
      setIsRecording(true);
      startTimer();
      setStatus({ phase: "recording", message: "Recording..." });
      setActiveView("meeting");
    } catch (e) {
      setStatus({ phase: "error", message: `Start failed: ${e}` });
    }
  }, [startTimer, settings]);

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
    if (!activeKey) { setActiveView("settings"); return; }
    if (transcript.length === 0) return;
    setIsSummarizing(true);
    try {
      const transcriptText = transcript
        .map((e) => `[${e.timestamp}] [${e.speaker}${e.speakerLabel ? ` (${e.speakerLabel})` : ""}]: ${e.text}`)
        .join("\n");
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
  }, [transcript, notes, activeKey, settings]);

  // ── Settings save ──────────────────────────────────────────
  const handleSettingsSave = useCallback((s: Settings) => {
    localStorage.setItem("kefir_provider",     s.provider);
    localStorage.setItem("kefir_api_key",      s.anthropicKey);
    localStorage.setItem("kefir_openai_key",   s.openAiKey);
    localStorage.setItem("kefir_asr_provider", s.asrProvider);
    localStorage.setItem("kefir_deepgram_key", s.deepgramKey);
    localStorage.setItem("kefir_whisper",      s.whisperModel);
    setSettings(s);
  }, []);

  const isProcessing = status.phase === "processing";

  return (
    <div className="app">
      <Sidebar
        activeView={activeView}
        expanded={sidebarOpen}
        isRecording={isRecording}
        onNavigate={setActiveView}
        onToggle={() => setSidebarOpen((v) => !v)}
      />

      <div className="app-content">
        {activeView === "dashboard" && (
          <Dashboard
            status={status}
            transcript={transcript}
            notes={notes}
            elapsed={elapsed}
            settings={settings}
            onStartMeeting={() => { setActiveView("meeting"); }}
          />
        )}

        {activeView === "meeting" && (
          <MeetingView
            isRecording={isRecording}
            isProcessing={isProcessing}
            isSummarizing={isSummarizing}
            transcript={transcript}
            notes={notes}
            summary={summary}
            elapsed={elapsed}
            status={status}
            settings={settings}
            onStart={handleStart}
            onStop={handleStop}
            onAddNote={handleAddNote}
            onClearNotes={handleClrNotes}
            onSummarize={handleSummarize}
          />
        )}

        {activeView === "notes" && (
          <NotesView notes={notes} />
        )}

        {activeView === "settings" && (
          <SettingsPage current={settings} onSave={handleSettingsSave} />
        )}
      </div>
    </div>
  );
}

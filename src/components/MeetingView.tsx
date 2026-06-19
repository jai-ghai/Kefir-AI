import { useState, useEffect } from "react";
import type { TranscriptEntry, RecordingStatus } from "../types";
import type { Settings } from "../types";
import type { Note } from "./NotePad";
import TranscriptPanel from "./TranscriptPanel";
import NotePad from "./NotePad";

interface Props {
  isRecording:   boolean;
  isProcessing:  boolean;
  isSummarizing: boolean;
  transcript:    TranscriptEntry[];
  notes:         Note[];
  summary:       string;
  elapsed:       string;
  status:        RecordingStatus;
  settings:      Settings;
  onStart:       () => void;
  onStop:        () => void;
  onAddNote:     (note: Note) => void;
  onClearNotes:  () => void;
  onSummarize:   () => void;
}

function renderSummaryMd(md: string) {
  return md.split("\n").map((line, i) => {
    if (line.startsWith("## ")) {
      return (
        <div key={i} className="sm-section">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
          {line.slice(3)}
        </div>
      );
    }
    if (line.match(/^[-•*] /)) {
      return (
        <div key={i} className="sm-bullet">
          <span className="sm-dot" />
          <span>{line.replace(/^[-•*] /, "")}</span>
        </div>
      );
    }
    if (!line.trim()) return <div key={i} className="sm-spacer" />;
    return <p key={i} className="sm-para">{line}</p>;
  });
}

function SessionPanel({
  isRecording, transcript, notes, elapsed, status,
}: Pick<Props, "isRecording" | "transcript" | "notes" | "elapsed" | "status">) {
  const speakers = Array.from(new Set(transcript.map((e) => e.speaker)));
  const hasMe   = speakers.includes("ME");
  const hasThem = speakers.includes("THEM");

  return (
    <div className="session-panel">
      <div className="session-panel-header">
        <h3>Session</h3>
        <div className="session-title">
          {isRecording ? "Active Meeting" : status.phase === "idle" ? "No active session" : "Session complete"}
        </div>
        {isRecording && <div className="session-time">{elapsed}</div>}
      </div>

      <div className="session-panel-body">
        {/* Stats */}
        <div className="sp-section">
          <div className="sp-section-label">Stats</div>
          <div className="sp-stat">
            <span className="sp-stat-key">Segments</span>
            <span className="sp-stat-val">{transcript.length}</span>
          </div>
          <div className="sp-stat">
            <span className="sp-stat-key">Notes</span>
            <span className="sp-stat-val">{notes.length}</span>
          </div>
          <div className="sp-stat">
            <span className="sp-stat-key">Duration</span>
            <span className="sp-stat-val">{elapsed}</span>
          </div>
        </div>

        {/* Participants */}
        <div className="sp-section">
          <div className="sp-section-label">Participants</div>
          {hasMe && (
            <div className="sp-participant">
              <div className="sp-avatar sp-avatar--me">Y</div>
              <div>
                <div className="sp-participant-name">You</div>
                <div className="sp-participant-role">Host</div>
              </div>
            </div>
          )}
          {hasThem && (
            <div className="sp-participant">
              <div className="sp-avatar sp-avatar--them">T</div>
              <div>
                <div className="sp-participant-name">Them</div>
                <div className="sp-participant-role">Participant</div>
              </div>
            </div>
          )}
          {!hasMe && !hasThem && (
            <div className="sp-empty">Participants appear once recording starts.</div>
          )}
        </div>

        {/* Phase status */}
        <div className="sp-section">
          <div className="sp-section-label">Status</div>
          <span className={`status-pill status-pill--${status.phase}`} style={{ fontSize: 11, padding: "4px 10px" }}>
            {status.message}
          </span>
        </div>
      </div>
    </div>
  );
}

function ReportView({
  summary, transcript, notes, elapsed, isSummarizing, settings, onBack,
}: Pick<Props, "summary" | "transcript" | "notes" | "elapsed" | "isSummarizing" | "settings"> & { onBack: () => void }) {
  const [copied, setCopied] = useState(false);
  const providerLabel = settings.provider === "anthropic" ? "Claude" : "GPT";

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!summary && isSummarizing) {
    return (
      <div className="report-view" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="sm-loading">
          <div className="sm-dots"><span /><span /><span /></div>
          <p>Analysing with {providerLabel}…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-view">
      {/* Report header */}
      <div className="report-header">
        <div className="report-header-top">
          <span className="report-success-badge">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Analysis complete
          </span>
          <span className="provider-badge">{providerLabel}</span>
        </div>
        <div className="report-title-row">
          <div className="report-title">Meeting Summary</div>
          <div className="report-actions">
            <button className="btn-ghost" onClick={onBack} style={{ fontSize: 11.5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Workspace
            </button>
            <button className={`copy-btn ${copied ? "copy-btn--copied" : ""}`} onClick={handleCopy}>
              {copied ? (
                <>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="report-metrics">
        <div className="rmetric">
          <div className="rmetric-label">Duration</div>
          <div className="rmetric-value rmetric-value--orange">{elapsed}</div>
          <div className="rmetric-sub">total session time</div>
        </div>
        <div className="rmetric">
          <div className="rmetric-label">Segments</div>
          <div className="rmetric-value rmetric-value--blue">{String(transcript.length).padStart(2, "0")}</div>
          <div className="rmetric-sub">transcript entries</div>
        </div>
        <div className="rmetric">
          <div className="rmetric-label">Notes</div>
          <div className="rmetric-value rmetric-value--green">{String(notes.length).padStart(2, "0")}</div>
          <div className="rmetric-sub">highlights captured</div>
        </div>
        <div className="rmetric">
          <div className="rmetric-label">Speakers</div>
          <div className="rmetric-value rmetric-value--default">
            {Array.from(new Set(transcript.map((e) => e.speaker))).length.toString().padStart(2, "0")}
          </div>
          <div className="rmetric-sub">identified</div>
        </div>
      </div>

      {/* Body: summary + sidebar */}
      <div className="report-body">
        <div className="report-main">
          {renderSummaryMd(summary)}
        </div>

        <div className="report-sidebar">
          {/* Notes */}
          <div className="rs-section">
            <div className="rs-title">Your highlights</div>
            {notes.length === 0 ? (
              <div className="rs-empty">No notes taken during this session.</div>
            ) : (
              notes.map((n) => (
                <div key={n.id} className="rs-note-item">
                  <span className="rs-note-ts">{n.timestamp}</span>
                  <span className="rs-note-text">{n.text}</span>
                </div>
              ))
            )}
          </div>

          {/* Powered by */}
          <div className="rs-section">
            <div className="rs-title">Generated by</div>
            <div className="rs-provider">
              <div>
                <div className="rs-provider-name">
                  {settings.provider === "anthropic" ? "Anthropic Claude" : "OpenAI GPT"}
                </div>
                <div className="rs-provider-sub">
                  {settings.provider === "anthropic"
                    ? "claude-sonnet-4-6"
                    : settings.whisperModel || "gpt-4o"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MeetingView({
  isRecording, isProcessing, isSummarizing, transcript, notes, summary, elapsed,
  status, settings, onStart, onStop, onAddNote, onClearNotes, onSummarize,
}: Props) {
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (summary && !isSummarizing) setShowReport(true);
  }, [summary, isSummarizing]);

  const activeKey    = settings.provider === "anthropic" ? settings.anthropicKey : settings.openAiKey;
  const canSummarize = transcript.length > 0 && !isRecording && !isProcessing && !isSummarizing;

  if (showReport && (summary || isSummarizing)) {
    return (
      <div className="meeting-view">
        {/* Keep bar for re-record access */}
        <div className="rec-bar" style={{ gap: 10 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--tx2)" }}>Report</h2>
          </div>
          <button className="btn-ghost" onClick={() => setShowReport(false)} style={{ fontSize: 11.5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to workspace
          </button>
        </div>
        <ReportView
          summary={summary}
          transcript={transcript}
          notes={notes}
          elapsed={elapsed}
          isSummarizing={isSummarizing}
          settings={settings}
          onBack={() => setShowReport(false)}
        />
      </div>
    );
  }

  return (
    <div className="meeting-view">
      <div className="rec-bar">
        <div className="rec-bar-brand">
          <h2>Meeting Workspace</h2>
        </div>

        {isRecording && elapsed && (
          <div className="rec-live">
            <span className="rec-live-dot" />
            <span className="rec-live-label">Recording</span>
            <span className="rec-live-time">{elapsed}</span>
          </div>
        )}

        {isProcessing && (
          <div className="rec-processing">
            <span className="spinner" style={{ borderTopColor: "var(--blue)", borderColor: "var(--blue-20)" }} />
            Transcribing...
          </div>
        )}

        {!isRecording && !isProcessing && status.message !== "Ready" && (
          <span className={`status-pill status-pill--${status.phase}`}>{status.message}</span>
        )}

        <div className="rec-bar-controls">
          {canSummarize && (
            <button className="btn-secondary" onClick={onSummarize} disabled={!activeKey} style={{ fontSize: 12 }}>
              {isSummarizing ? (
                <><span className="spinner" style={{ borderTopColor: "var(--tx2)", borderColor: "var(--bdr-m)" }} /> Generating</>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Summarize
                </>
              )}
            </button>
          )}
          <button
            className={`rec-btn ${isRecording ? "rec-btn--stop" : "rec-btn--start"}`}
            onClick={isRecording ? onStop : onStart}
            disabled={isProcessing}
          >
            <span className="rec-icon">{isRecording ? "■" : "●"}</span>
            {isRecording ? "Stop" : "Record"}
          </button>
        </div>
      </div>

      <div className="workspace-grid">
        <SessionPanel
          isRecording={isRecording}
          transcript={transcript}
          notes={notes}
          elapsed={elapsed}
          status={status}
        />
        <TranscriptPanel entries={transcript} isRecording={isRecording} />
        <NotePad
          notes={notes}
          isRecording={isRecording}
          elapsed={elapsed}
          onAdd={onAddNote}
          onClear={onClearNotes}
        />
      </div>
    </div>
  );
}

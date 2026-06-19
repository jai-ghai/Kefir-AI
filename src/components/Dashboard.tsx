import type { RecordingStatus, Settings } from "../types";
import type { Note } from "./NotePad";
import type { TranscriptEntry } from "../types";

interface Props {
  status:      RecordingStatus;
  transcript:  TranscriptEntry[];
  notes:       Note[];
  elapsed:     string;
  settings:    Settings;
  onStartMeeting: () => void;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard({ status, transcript, notes, elapsed, settings, onStartMeeting }: Props) {
  const hasSession  = transcript.length > 0 || status.phase !== "idle";
  const activeKey   = settings.provider === "anthropic" ? settings.anthropicKey : settings.openAiKey;
  const hasApiKey   = !!activeKey;
  const hasAsr      = settings.asrProvider === "local" || !!settings.deepgramKey;

  return (
    <div className="dashboard">
      {/* Greeting */}
      <div className="dash-greeting">
        <h1>{greeting()}, Jai</h1>
        <p>Your local AI meeting notetaker — all processing stays on your device.</p>
      </div>

      {/* Session metrics — show live or last-session data */}
      <div>
        <div className="dash-section-title">Session</div>
        <div style={{ marginTop: 12 }}>
          {hasSession ? (
            <div className="dash-grid">
              <div className="metric-card metric-card--orange">
                <div className="metric-label">Duration</div>
                <div className="metric-value">{elapsed}</div>
                <div className="metric-sub">{status.message}</div>
              </div>
              <div className="metric-card metric-card--blue">
                <div className="metric-label">Segments</div>
                <div className="metric-value">{transcript.length}</div>
                <div className="metric-sub">transcript entries</div>
              </div>
              <div className="metric-card metric-card--green">
                <div className="metric-label">Notes taken</div>
                <div className="metric-value">{notes.length}</div>
                <div className="metric-sub">timestamped highlights</div>
              </div>
            </div>
          ) : (
            <div className="dash-action-card">
              <div>
                <h3>Ready to capture your meeting</h3>
                <p>
                  Kefir records your microphone and system audio simultaneously, transcribes with Whisper,
                  and generates structured summaries using {settings.provider === "anthropic" ? "Claude" : "GPT"}.
                  Everything runs locally — no data leaves your device.
                </p>
              </div>
              <button className="btn-primary" style={{ fontSize: 13, padding: "10px 20px" }} onClick={onStartMeeting}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
                Start Meeting
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div>
        <div className="dash-section-title">Capabilities</div>
        <div className="dash-feature-grid" style={{ marginTop: 12 }}>
          <div className="dash-feature">
            <div className="dash-feature-icon dash-feature-icon--orange">🎙️</div>
            <div className="dash-feature-text">
              <h4>Dual-stream capture</h4>
              <p>Records your mic and system audio simultaneously via WASAPI loopback — no extra cables.</p>
            </div>
          </div>
          <div className="dash-feature">
            <div className="dash-feature-icon dash-feature-icon--blue">📝</div>
            <div className="dash-feature-text">
              <h4>Timestamped notes</h4>
              <p>Stamp highlights during the meeting; they appear alongside the transcript in your report.</p>
            </div>
          </div>
          <div className="dash-feature">
            <div className="dash-feature-icon dash-feature-icon--green">🔒</div>
            <div className="dash-feature-text">
              <h4>Fully local</h4>
              <p>Whisper transcription runs offline on your machine. API keys never leave your device.</p>
            </div>
          </div>
          <div className="dash-feature">
            <div className="dash-feature-icon dash-feature-icon--yellow">✨</div>
            <div className="dash-feature-text">
              <h4>AI summaries</h4>
              <p>Post-meeting reports with key decisions, action items, and highlights via Claude or GPT.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div>
        <div className="dash-section-title">Configuration</div>
        <div className="dash-status-grid" style={{ marginTop: 12 }}>
          <div className="dash-status-card">
            <div className={`status-dot-big ${hasApiKey ? "status-dot-big--green" : "status-dot-big--orange"}`} />
            <div className="dash-status-info">
              <div className="dash-status-name">LLM Provider</div>
              <div className="dash-status-val">
                {hasApiKey
                  ? `${settings.provider === "anthropic" ? "Anthropic Claude" : "OpenAI GPT"} — ready`
                  : "No API key configured"}
              </div>
            </div>
          </div>
          <div className="dash-status-card">
            <div className={`status-dot-big ${hasAsr ? "status-dot-big--green" : "status-dot-big--grey"}`} />
            <div className="dash-status-info">
              <div className="dash-status-name">Transcription</div>
              <div className="dash-status-val">
                {settings.asrProvider === "local"
                  ? `Local Whisper (${settings.whisperModel})`
                  : settings.deepgramKey ? "Deepgram — live streaming" : "Deepgram — key missing"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

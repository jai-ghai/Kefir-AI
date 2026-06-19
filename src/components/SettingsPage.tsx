import { useState } from "react";
import type { Settings } from "../types";

interface Props {
  current: Settings;
  onSave:  (s: Settings) => void;
}

type Tab = "preferences" | "privacy" | "about";

const TAB_ITEMS: { id: Tab; label: string }[] = [
  { id: "preferences", label: "Preferences" },
  { id: "privacy",     label: "Privacy" },
  { id: "about",       label: "About" },
];

export default function SettingsPage({ current, onSave }: Props) {
  const [s, setS]             = useState<Settings>(current);
  const [tab, setTab]         = useState<Tab>("preferences");
  const [showAnt, setShowAnt] = useState(false);
  const [showOai, setShowOai] = useState(false);
  const [showDg,  setShowDg]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  const set = (patch: Partial<Settings>) => setS((prev) => ({ ...prev, ...patch }));

  const handleSave = () => {
    onSave(s);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-view">
      {/* Settings sidebar tabs */}
      <div className="settings-nav">
        <div className="settings-nav-header">
          <h2>Settings</h2>
          <p>Configure Kefir</p>
        </div>
        {TAB_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`settings-nav-item ${tab === item.id ? "settings-nav-item--active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="settings-content">
        {tab === "preferences" && (
          <>
            {/* LLM Provider */}
            <div className="settings-section">
              <div className="settings-section-title">
                LLM Provider <span>for meeting summaries</span>
              </div>

              <div className="settings-field">
                <label className="field-label">Provider</label>
                <div className="provider-row">
                  {(["anthropic", "openai"] as const).map((p) => (
                    <button
                      key={p}
                      className={`provider-btn ${s.provider === p ? "provider-btn--active" : ""}`}
                      onClick={() => set({ provider: p })}
                    >
                      {p === "anthropic" ? "Anthropic Claude" : "OpenAI GPT"}
                    </button>
                  ))}
                </div>
              </div>

              {s.provider === "anthropic" && (
                <div className="settings-field">
                  <label className="field-label">Anthropic API Key</label>
                  <div className="key-row">
                    <input
                      type={showAnt ? "text" : "password"}
                      className="key-input"
                      value={s.anthropicKey}
                      onChange={(e) => set({ anthropicKey: e.target.value })}
                      placeholder="sk-ant-..."
                    />
                    <button className="btn-secondary" onClick={() => setShowAnt((v) => !v)}
                      style={{ flexShrink: 0, padding: "7px 12px", fontSize: 12 }}>
                      {showAnt ? "Hide" : "Show"}
                    </button>
                  </div>
                  <p className="field-hint">
                    Model: <code style={{ fontFamily: "var(--mono)", fontSize: "10.5px", color: "var(--tx2)" }}>claude-sonnet-4-6</code>.
                    Your key is stored locally and never transmitted.
                  </p>
                </div>
              )}

              {s.provider === "openai" && (
                <>
                  <div className="settings-field">
                    <label className="field-label">OpenAI API Key</label>
                    <div className="key-row">
                      <input
                        type={showOai ? "text" : "password"}
                        className="key-input"
                        value={s.openAiKey}
                        onChange={(e) => set({ openAiKey: e.target.value })}
                        placeholder="sk-..."
                      />
                      <button className="btn-secondary" onClick={() => setShowOai((v) => !v)}
                        style={{ flexShrink: 0, padding: "7px 12px", fontSize: 12 }}>
                        {showOai ? "Hide" : "Show"}
                      </button>
                    </div>
                    <p className="field-hint">Key is stored locally only.</p>
                  </div>

                  <div className="settings-field">
                    <label className="field-label">OpenAI Model</label>
                    <select
                      className="key-input"
                      value={s.whisperModel.startsWith("gpt") ? s.whisperModel : "gpt-4o"}
                      onChange={(e) => set({ whisperModel: e.target.value })}
                    >
                      <option value="gpt-4o">GPT-4o (recommended)</option>
                      <option value="gpt-4o-mini">GPT-4o Mini — faster, cheaper</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="settings-divider" />

            {/* ASR Provider */}
            <div className="settings-section">
              <div className="settings-section-title">
                Transcription <span>speech-to-text engine</span>
              </div>

              <div className="settings-field">
                <label className="field-label">ASR Provider</label>
                <div className="provider-row">
                  {(["local", "deepgram"] as const).map((p) => (
                    <button
                      key={p}
                      className={`provider-btn ${s.asrProvider === p ? "provider-btn--active" : ""}`}
                      onClick={() => set({ asrProvider: p })}
                    >
                      {p === "local" ? "Local Whisper" : "Deepgram (live)"}
                    </button>
                  ))}
                </div>
              </div>

              {s.asrProvider === "local" && (
                <div className="settings-field">
                  <label className="field-label">Whisper Model</label>
                  <select
                    className="key-input"
                    value={s.whisperModel.startsWith("gpt") ? "base" : s.whisperModel}
                    onChange={(e) => set({ whisperModel: e.target.value })}
                  >
                    <option value="tiny">Tiny — fastest, least accurate</option>
                    <option value="base">Base — recommended</option>
                    <option value="small">Small — more accurate, slower</option>
                    <option value="medium">Medium — most accurate, slowest</option>
                  </select>
                  <p className="field-hint">
                    Runs fully offline via faster-whisper after recording completes.
                  </p>
                </div>
              )}

              {s.asrProvider === "deepgram" && (
                <div className="settings-field">
                  <label className="field-label">Deepgram API Key</label>
                  <div className="key-row">
                    <input
                      type={showDg ? "text" : "password"}
                      className="key-input"
                      value={s.deepgramKey}
                      onChange={(e) => set({ deepgramKey: e.target.value })}
                      placeholder="Enter Deepgram API key..."
                    />
                    <button className="btn-secondary" onClick={() => setShowDg((v) => !v)}
                      style={{ flexShrink: 0, padding: "7px 12px", fontSize: 12 }}>
                      {showDg ? "Hide" : "Show"}
                    </button>
                  </div>
                  <p className="field-hint">
                    Real-time streaming — transcript appears during the meeting. Audio is never written to disk.
                  </p>
                </div>
              )}
            </div>

            <div className="settings-footer">
              <button className="btn-primary" onClick={handleSave}>
                {saved ? (
                  <>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Saved
                  </>
                ) : (
                  "Save changes"
                )}
              </button>
              <button className="btn-secondary" onClick={() => setS(current)}>
                Reset
              </button>
            </div>
          </>
        )}

        {tab === "privacy" && (
          <div className="settings-section">
            <div className="settings-section-title">Privacy & Data</div>

            <div className="settings-card">
              <div className="settings-card-info">
                <h4>Local processing</h4>
                <p>
                  All audio is captured and processed on your machine. Whisper transcription runs entirely
                  offline. Audio files are stored in your system's temp directory and can be deleted manually.
                </p>
              </div>
              <div style={{ color: "var(--green)", fontSize: 22 }}>🔒</div>
            </div>

            <div className="settings-card">
              <div className="settings-card-info">
                <h4>API key storage</h4>
                <p>
                  API keys are stored in your browser's localStorage, local to this device. They are
                  sent only to the respective provider (Anthropic / OpenAI) at summarization time.
                  No keys are stored on any server.
                </p>
              </div>
              <div style={{ color: "var(--blue)", fontSize: 22 }}>🗝️</div>
            </div>

            <div className="settings-card">
              <div className="settings-card-info">
                <h4>Deepgram streaming</h4>
                <p>
                  If you use Deepgram, audio is streamed in real-time to Deepgram's servers for transcription.
                  Audio is not stored on disk in this mode, but is processed by a third party.
                  Review Deepgram's privacy policy for details.
                </p>
              </div>
              <div style={{ color: "var(--yellow)", fontSize: 22 }}>ℹ️</div>
            </div>

            <div className="settings-card">
              <div className="settings-card-info">
                <h4>Consent</h4>
                <p>
                  Kefir stores no personal data on external servers. All meeting content remains on-device.
                  Ensure all participants have consented before recording a meeting.
                </p>
              </div>
              <div style={{ color: "var(--primary)", fontSize: 22 }}>⚖️</div>
            </div>
          </div>
        )}

        {tab === "about" && (
          <div className="settings-section">
            <div className="settings-section-title">About Kefir</div>

            <div className="settings-card" style={{ flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, background: "var(--primary)", borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{ width: 18, height: 18, background: "#565E74", borderRadius: 4 }} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--tx1)", letterSpacing: "-0.3px" }}>
                    Kefir
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--tx3)" }}>AI Meeting Notetaker · v0.1.0</div>
                </div>
              </div>
              <p className="field-hint" style={{ lineHeight: 1.65, maxWidth: 480 }}>
                Kefir is a local-first, privacy-preserving meeting notetaker for Windows. It captures dual audio
                streams (microphone + system audio) via WASAPI loopback, transcribes with faster-whisper,
                and generates structured summaries via Claude or GPT. Built with Tauri + React.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
              {[
                { label: "Framework", value: "Tauri 2 + React 18" },
                { label: "ASR",       value: "faster-whisper / Deepgram" },
                { label: "LLM",       value: "Claude Sonnet / GPT-4o" },
                { label: "Audio",     value: "WASAPI Loopback + cpal" },
              ].map((row) => (
                <div key={row.label} className="dash-status-card" style={{ gap: 12 }}>
                  <div className="dash-status-info">
                    <div className="dash-status-name">{row.label}</div>
                    <div className="dash-status-val">{row.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

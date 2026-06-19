import { useState } from "react";
import type { Settings } from "../types";

export type { Settings };

interface Props {
  current:  Settings;
  onSave:   (s: Settings) => void;
  onClose:  () => void;
}

export default function SettingsModal({ current, onSave, onClose }: Props) {
  const [s, setS]             = useState<Settings>(current);
  const [showAnt, setShowAnt] = useState(false);
  const [showOai, setShowOai] = useState(false);
  const [showDg,  setShowDg]  = useState(false);

  const set = (patch: Partial<Settings>) => setS((prev) => ({ ...prev, ...patch }));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Settings</h3>
          <button className="icon-btn" onClick={onClose}>&#10005;</button>
        </div>

        <div className="modal-body">
          {/* ── Provider ── */}
          <label className="field-label">LLM Provider</label>
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

          {/* ── Anthropic key ── */}
          {s.provider === "anthropic" && (
            <>
              <label className="field-label" style={{ marginTop: "1.25rem" }}>
                Anthropic API Key
              </label>
              <div className="key-row">
                <input
                  type={showAnt ? "text" : "password"}
                  className="key-input"
                  value={s.anthropicKey}
                  onChange={(e) => set({ anthropicKey: e.target.value })}
                  placeholder="sk-ant-..."
                  autoFocus
                />
                <button className="icon-btn" onClick={() => setShowAnt((v) => !v)}>
                  {showAnt ? "Hide" : "Show"}
                </button>
              </div>
              <p className="field-hint">
                Model used: <code>claude-sonnet-4-6</code>. Key never leaves your device.
              </p>
            </>
          )}

          {/* ── OpenAI key ── */}
          {s.provider === "openai" && (
            <>
              <label className="field-label" style={{ marginTop: "1.25rem" }}>
                OpenAI API Key
              </label>
              <div className="key-row">
                <input
                  type={showOai ? "text" : "password"}
                  className="key-input"
                  value={s.openAiKey}
                  onChange={(e) => set({ openAiKey: e.target.value })}
                  placeholder="sk-..."
                  autoFocus
                />
                <button className="icon-btn" onClick={() => setShowOai((v) => !v)}>
                  {showOai ? "Hide" : "Show"}
                </button>
              </div>
              <label className="field-label" style={{ marginTop: "1rem" }}>
                OpenAI Model
              </label>
              <select
                className="key-input"
                value={s.whisperModel.startsWith("gpt") ? s.whisperModel : "gpt-4o"}
                onChange={(e) => set({ whisperModel: e.target.value })}
              >
                <option value="gpt-4o">GPT-4o (recommended)</option>
                <option value="gpt-4o-mini">GPT-4o Mini (faster, cheaper)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
              </select>
              <p className="field-hint">Key never leaves your device.</p>
            </>
          )}

          {/* ── ASR provider ── */}
          <div className="settings-divider" />
          <label className="field-label">Transcription (ASR) Provider</label>
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

          {s.asrProvider === "deepgram" && (
            <>
              <label className="field-label" style={{ marginTop: "1rem" }}>
                Deepgram API Key
              </label>
              <div className="key-row">
                <input
                  type={showDg ? "text" : "password"}
                  className="key-input"
                  value={s.deepgramKey}
                  onChange={(e) => set({ deepgramKey: e.target.value })}
                  placeholder="Enter Deepgram API key..."
                />
                <button className="icon-btn" onClick={() => setShowDg((v) => !v)}>
                  {showDg ? "Hide" : "Show"}
                </button>
              </div>
              <p className="field-hint">
                Real-time streaming — transcript appears <em>during</em> the meeting.
                Audio never touches disk. Get a key at deepgram.com.
              </p>
            </>
          )}

          {s.asrProvider === "local" && (
            <>
              <label className="field-label" style={{ marginTop: "1rem" }}>
                Whisper Model
              </label>
              <select
                className="key-input"
                value={s.whisperModel}
                onChange={(e) => set({ whisperModel: e.target.value })}
              >
                <option value="tiny">Tiny — fastest, least accurate</option>
                <option value="base">Base — recommended</option>
                <option value="small">Small — more accurate, slower</option>
                <option value="medium">Medium — most accurate, slowest</option>
              </select>
              <p className="field-hint">
                Post-call processing. Runs fully offline via faster-whisper.
              </p>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(s)}>Save</button>
        </div>
      </div>
    </div>
  );
}

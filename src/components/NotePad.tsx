import { useState, useRef, useEffect, KeyboardEvent } from "react";

export interface Note {
  id:        string;
  timestamp: string;
  text:      string;
}

interface Props {
  notes:       Note[];
  isRecording: boolean;
  elapsed:     string;
  onAdd:       (note: Note) => void;
  onClear:     () => void;
}

export default function NotePad({ notes, isRecording, elapsed, onAdd, onClear }: Props) {
  const [draft, setDraft] = useState("");
  const listRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [notes.length]);

  const commit = () => {
    const text = draft.trim();
    if (!text) return;
    onAdd({ id: crypto.randomUUID(), timestamp: elapsed, text });
    setDraft("");
    inputRef.current?.focus();
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      commit();
    }
  };

  return (
    <section className="np-panel">
      <div className="panel-header">
        <div className="ph-left">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--tx3)" }}>
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
          <h2>Notes</h2>
        </div>
        <div className="ph-right">
          {notes.length > 0 && (
            <>
              <span className="np-count">{notes.length}</span>
              <button className="btn-ghost btn-ghost--danger" onClick={onClear} style={{ fontSize: 11 }}>
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      <div className="np-list" ref={listRef}>
        {notes.length === 0 ? (
          <div className="empty-state">
            {isRecording ? (
              <>
                <strong>Capture highlights</strong>
                Type a note and press Enter to stamp it with the current timestamp.
              </>
            ) : (
              <>
                <strong>No notes yet</strong>
                Timestamped highlights appear here during recording.
              </>
            )}
          </div>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="np-item">
              <span className="np-ts">{n.timestamp}</span>
              <span className="np-text">{n.text}</span>
            </div>
          ))
        )}
      </div>

      <div className="np-composer">
        <div className={`np-input-row ${isRecording ? "np-input-row--active" : ""}`}>
          <textarea
            ref={inputRef}
            className="np-textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            placeholder={isRecording ? "Type a highlight…" : "Start recording to take notes"}
            disabled={!isRecording}
            rows={2}
          />
          {isRecording && (
            <button className="np-send" onClick={commit} disabled={!draft.trim()} title="Stamp note (Enter)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 10 4 15 9 20" />
                <path d="M20 4v7a4 4 0 0 1-4 4H4" />
              </svg>
            </button>
          )}
        </div>
        {isRecording && (
          <div className="np-footer">
            <span className="np-ts-preview">{elapsed}</span>
            <span>↵ to stamp</span>
          </div>
        )}
      </div>
    </section>
  );
}

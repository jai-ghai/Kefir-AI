import { useState, useRef, useEffect, KeyboardEvent } from "react";

export interface Note {
  id:        string;
  timestamp: string;
  text:      string;
}

interface Props {
  notes:       Note[];
  isRecording: boolean;
  elapsed:     string;       // current recording time for auto-stamping
  onAdd:       (note: Note) => void;
  onClear:     () => void;
}

export default function NotePad({ notes, isRecording, elapsed, onAdd, onClear }: Props) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [notes.length]);

  const commit = () => {
    const text = draft.trim();
    if (!text) return;
    onAdd({ id: crypto.randomUUID(), timestamp: elapsed, text });
    setDraft("");
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      commit();
    }
  };

  return (
    <section className="panel notepad-panel">
      <div className="panel-header">
        <h2>Your Notes</h2>
        {notes.length > 0 && (
          <button className="clear-btn" onClick={onClear} title="Clear notes">
            Clear
          </button>
        )}
      </div>

      <div className="notepad-list" ref={listRef}>
        {notes.length === 0 ? (
          <div className="empty-state">
            {isRecording
              ? "Type a note and press Enter to stamp it."
              : "Your timestamped highlights will appear here during recording."}
          </div>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="note-item">
              <span className="note-ts">{n.timestamp}</span>
              <span className="note-text">{n.text}</span>
            </div>
          ))
        )}
      </div>

      <div className="notepad-input-wrap">
        <textarea
          className="notepad-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          placeholder={isRecording ? "Type a highlight… (Enter to stamp)" : "Start recording to take notes"}
          disabled={!isRecording}
          rows={2}
        />
        {isRecording && (
          <div className="notepad-hint">
            <span className="note-ts-preview">{elapsed}</span>
            <span>↵ to stamp</span>
          </div>
        )}
      </div>
    </section>
  );
}

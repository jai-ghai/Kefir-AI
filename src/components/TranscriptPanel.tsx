import { useEffect, useRef } from "react";
import type { TranscriptEntry } from "../types";

interface Props {
  entries: TranscriptEntry[];
  isRecording: boolean;
}

export default function TranscriptPanel({ entries, isRecording }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length]);

  return (
    <section className="panel transcript-panel">
      <div className="panel-header">
        <h2>Live Transcript</h2>
        <span className="panel-badge">{entries.length} segments</span>
      </div>
      <div className="panel-body">
        {entries.length === 0 ? (
          <div className="empty-state">
            {isRecording
              ? "Transcript will appear after you stop recording..."
              : "Start a recording to capture the meeting transcript."}
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className={`t-entry t-entry--${entry.speaker === "ME" ? "me" : "them"}`}
            >
              <div className="t-meta">
                <span className="t-speaker">
                  {entry.speaker === "ME" ? "You" : entry.speakerLabel ?? "Them"}
                </span>
                <span className="t-time">{entry.timestamp}</span>
              </div>
              <p className="t-text">{entry.text}</p>
            </div>
          ))
        )}
        {isRecording && entries.length > 0 && (
          <div className="t-listening">
            <span className="pulse" /> Listening...
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </section>
  );
}

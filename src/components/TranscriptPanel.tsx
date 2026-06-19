import { useEffect, useRef } from "react";
import type { TranscriptEntry } from "../types";

interface Props {
  entries:     TranscriptEntry[];
  isRecording: boolean;
}

export default function TranscriptPanel({ entries, isRecording }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length]);

  return (
    <section className="transcript-panel">
      <div className="panel-header">
        <div className="ph-left">
          <h2>Live Transcript</h2>
        </div>
        <div className="ph-right">
          <span className="panel-badge">{entries.length} segments</span>
        </div>
      </div>

      <div className="panel-body">
        {entries.length === 0 ? (
          <div className="empty-state">
            {isRecording ? (
              <>
                <div className="pulse" style={{ marginBottom: 4 }}>
                  <span /><span /><span />
                </div>
                <strong>Listening...</strong>
                Transcript will appear here as audio is captured.
              </>
            ) : (
              <>
                <strong>No transcript yet</strong>
                Start recording to capture the meeting.
              </>
            )}
          </div>
        ) : (
          <>
            {entries.map((entry) => {
              const isMe = entry.speaker === "ME";
              return (
                <div key={entry.id} className="t-entry">
                  <div className="t-entry-meta">
                    <span className={`t-entry-speaker t-entry-speaker--${isMe ? "me" : "them"}`}>
                      {isMe ? "You" : entry.speakerLabel ?? "Them"}
                    </span>
                    <span className="t-entry-ts">{entry.timestamp}</span>
                  </div>
                  <div className="t-entry-text">{entry.text}</div>
                </div>
              );
            })}

            {isRecording && (
              <div className="t-listening">
                <span className="pulse">
                  <span /><span /><span />
                </span>
                Listening...
              </div>
            )}
          </>
        )}

        <div ref={bottomRef} />
      </div>
    </section>
  );
}

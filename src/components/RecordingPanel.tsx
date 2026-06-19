interface Props {
  isRecording:   boolean;
  isProcessing:  boolean;
  elapsed?:      string;
  statusMessage: string;
  onStart:       () => void;
  onStop:        () => void;
}

export default function RecordingPanel({
  isRecording, isProcessing, elapsed, statusMessage, onStart, onStop,
}: Props) {
  return (
    <div className="rec-bar app-drag">
      {/* Brand label */}
      <div className="rec-bar-brand app-nodrag">
        <h2>Meeting Workspace</h2>
      </div>

      {/* Live recording state */}
      {isRecording && elapsed && (
        <div className="rec-live app-nodrag">
          <span className="rec-live-dot" />
          <span className="rec-live-label">Recording</span>
          <span className="rec-live-time">{elapsed}</span>
        </div>
      )}

      {isProcessing && (
        <div className="rec-processing app-nodrag">
          <span className="spinner" style={{ borderTopColor: "var(--blue)", borderColor: "var(--blue-20)" }} />
          Transcribing...
        </div>
      )}

      {!isRecording && !isProcessing && statusMessage !== "Ready" && (
        <span className="status-pill app-nodrag">{statusMessage}</span>
      )}

      {/* Controls */}
      <div className="rec-bar-controls app-nodrag">
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
  );
}

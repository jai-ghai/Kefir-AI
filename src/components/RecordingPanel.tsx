interface Props {
  isRecording: boolean;
  elapsed?: string;
  onStart: () => void;
  onStop: () => void;
}

export default function RecordingPanel({ isRecording, elapsed, onStart, onStop }: Props) {
  return (
    <div className="recording-panel">
      {isRecording && (
        <div className="rec-indicator">
          <span className="rec-dot" />
          <span className="rec-time">{elapsed}</span>
        </div>
      )}
      <button
        className={`record-btn ${isRecording ? "record-btn--stop" : "record-btn--start"}`}
        onClick={isRecording ? onStop : onStart}
      >
        {isRecording ? (
          <>
            <span className="btn-icon">&#9632;</span> Stop
          </>
        ) : (
          <>
            <span className="btn-icon">&#9679;</span> Record
          </>
        )}
      </button>
    </div>
  );
}

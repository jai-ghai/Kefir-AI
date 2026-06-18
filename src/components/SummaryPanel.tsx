interface Props {
  summary: string;
  isSummarizing: boolean;
  canSummarize: boolean;
  hasApiKey: boolean;
  providerLabel: string;
  onSummarize: () => void;
}

export default function SummaryPanel({
  summary,
  isSummarizing,
  canSummarize,
  hasApiKey,
  providerLabel,
  onSummarize,
}: Props) {
  return (
    <section className="panel summary-panel">
      <div className="panel-header">
        <h2>AI Summary</h2>
        <button
          className="summarize-btn"
          onClick={onSummarize}
          disabled={!canSummarize}
          title={!hasApiKey ? "Add API key in Settings" : undefined}
        >
          {isSummarizing ? (
            <><span className="spinner" /> Generating...</>
          ) : (
            "Generate Summary"
          )}
        </button>
      </div>
      <div className="panel-body">
        {!summary && !isSummarizing ? (
          <div className="empty-state">
            {!hasApiKey
              ? "Add your Anthropic API key in Settings, then generate a summary."
              : "Stop recording and click Generate Summary for AI-powered meeting notes."}
          </div>
        ) : isSummarizing ? (
          <div className="loading-state">
            <div className="loading-orb" />
            <p>Analysing transcript with {providerLabel}...</p>
          </div>
        ) : (
          <pre className="summary-content">{summary}</pre>
        )}
      </div>
    </section>
  );
}

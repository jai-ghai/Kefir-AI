import { useState } from "react";

interface Props {
  summary: string;
  isSummarizing: boolean;
  canSummarize: boolean;
  hasApiKey: boolean;
  providerLabel: string;
  onSummarize: () => void;
}

function renderSummary(md: string) {
  return md.split("\n").map((line, i) => {
    if (line.startsWith("## ")) {
      return <div key={i} className="sm-section">{line.slice(3)}</div>;
    }
    if (line.match(/^[-•*] /)) {
      return (
        <div key={i} className="sm-bullet">
          <span className="sm-dot" />
          <span>{line.replace(/^[-•*] /, "")}</span>
        </div>
      );
    }
    if (!line.trim()) return <div key={i} className="sm-spacer" />;
    return <p key={i} className="sm-para">{line}</p>;
  });
}

export default function SummaryPanel({
  summary,
  isSummarizing,
  canSummarize,
  hasApiKey,
  providerLabel,
  onSummarize,
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="panel summary-panel">
      <div className="panel-header">
        <div className="ph-left">
          <h2>AI Summary</h2>
        </div>
        <div className="ph-right">
          {summary && !isSummarizing && (
            <button
              className={`copy-btn ${copied ? "copy-btn--copied" : ""}`}
              onClick={handleCopy}
              title="Copy summary to clipboard"
            >
              {copied ? (
                <>
                  {/* Check icon */}
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  {/* Copy icon */}
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          )}
          <button
            className="primary-btn"
            onClick={onSummarize}
            disabled={!canSummarize}
            title={!hasApiKey ? "Add API key in Settings" : undefined}
          >
            {isSummarizing ? (
              <><span className="spinner" /> Generating</>
            ) : (
              "Summarize"
            )}
          </button>
        </div>
      </div>

      <div className="panel-body">
        {!summary && !isSummarizing ? (
          <div className="empty-state">
            {!hasApiKey
              ? "Add your API key in Settings, then generate a summary after recording."
              : "Stop recording and click Summarize for AI-powered meeting notes."}
          </div>
        ) : isSummarizing ? (
          <div className="sm-loading">
            <div className="sm-dots">
              <span /><span /><span />
            </div>
            <p>Analysing with {providerLabel}…</p>
          </div>
        ) : (
          <div className="sm-content">{renderSummary(summary)}</div>
        )}
      </div>
    </section>
  );
}

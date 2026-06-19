type View = "dashboard" | "meeting" | "notes" | "settings";

const HomeIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const MicIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="8" y1="22" x2="16" y2="22" />
  </svg>
);

const NotesIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s" }}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const NAV_ITEMS: { id: View; label: string; icon: JSX.Element }[] = [
  { id: "dashboard", label: "Dashboard", icon: <HomeIcon /> },
  { id: "meeting",   label: "Meeting",   icon: <MicIcon /> },
  { id: "notes",     label: "Notes",     icon: <NotesIcon /> },
  { id: "settings",  label: "Settings",  icon: <SettingsIcon /> },
];

interface Props {
  activeView:  View;
  expanded:    boolean;
  isRecording: boolean;
  onNavigate:  (view: View) => void;
  onToggle:    () => void;
}

export type { View };

export default function Sidebar({ activeView, expanded, isRecording, onNavigate, onToggle }: Props) {
  return (
    <aside className={`sidebar ${expanded ? "sidebar--expanded" : ""}`}>
      {/* Brand header — also acts as toggle */}
      <div className="sidebar-header" onClick={onToggle}>
        <div className="logo-mark" />
        {expanded && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="logo-text">Kefir</div>
            <div className="logo-sub">AI Meeting Notetaker</div>
          </div>
        )}
        {expanded && (
          <div style={{ color: "var(--tx4)", flexShrink: 0 }}>
            <ChevronIcon expanded={expanded} />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`sidebar-item ${activeView === item.id ? "sidebar-item--active" : ""}`}
            onClick={() => onNavigate(item.id)}
            title={!expanded ? item.label : undefined}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {expanded && <span className="sidebar-label">{item.label}</span>}
            {item.id === "meeting" && isRecording && (
              <span className={`sidebar-rec-dot ${expanded ? "" : "sidebar-rec-dot--abs"}`} />
            )}
          </button>
        ))}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="sidebar-avatar" title="User profile">J</div>
        {expanded && (
          <div className="sidebar-user">
            <span className="sidebar-user-name">Jai Ghai</span>
            <span className="sidebar-user-role">Meeting Host</span>
          </div>
        )}
      </div>
    </aside>
  );
}

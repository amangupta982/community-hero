// Scrolls the .center-col container so `selector` appears at the top of it.
// Falls back to scrollIntoView on mobile where center-col may not be the scroll root.
function scrollInCol(selector) {
  const target = document.querySelector(selector);
  if (!target) return;
  const col = document.querySelector(".center-col");
  if (!col) { target.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
  const colRect    = col.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  col.scrollTo({ top: col.scrollTop + (targetRect.top - colRect.top), behavior: "smooth" });
}

export default function Navbar({ reports, onDashboard }) {
  const critical = reports.filter((r) => r.severity === "Critical").length;
  const today    = new Date().toDateString();
  const todayCount = reports.filter(
    (r) => r.createdAt && new Date(r.createdAt).toDateString() === today
  ).length;

  return (
    <nav className="navbar" role="banner">
      <div className="nav-brand">
        <svg width="36" height="40" viewBox="0 0 40 46" fill="none" aria-hidden className="nav-shield-logo">
          <path d="M20 1L2 9v14c0 10.5 7.7 20.3 18 22.4C30.3 43.3 38 33.5 38 23V9L20 1z"
            fill="url(#shield-grad)" />
          <text x="20" y="30" textAnchor="middle" fill="white" fontSize="14" fontWeight="800"
            fontFamily="system-ui, sans-serif">CH</text>
          <defs>
            <linearGradient id="shield-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
        </svg>
        <div className="nav-logo-text">
          <span className="nav-logo-name">Community Hero</span>
          <span className="nav-logo-sub">Civic Issue Tracker</span>
        </div>
      </div>

      {/* Sidebar navigation */}
      <div className="sidebar-nav">
        <button
          className="sidebar-nav-item active"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <span className="sidebar-nav-icon" aria-hidden>🏠</span>
          <span className="sidebar-nav-label">Overview</span>
        </button>
        <button
          className="sidebar-nav-item"
          onClick={() => scrollInCol(".map-wrap")}
        >
          <span className="sidebar-nav-icon" aria-hidden>🗺️</span>
          <span className="sidebar-nav-label">Map View</span>
        </button>
        <button
          className="sidebar-nav-item"
          onClick={() => scrollInCol(".list")}
        >
          <span className="sidebar-nav-icon" aria-hidden>📋</span>
          <span className="sidebar-nav-label">My Reports</span>
        </button>
        <button
          className="sidebar-nav-item"
          onClick={onDashboard}
          aria-label="Open city intelligence dashboard"
        >
          <span className="sidebar-nav-icon" aria-hidden>📊</span>
          <span className="sidebar-nav-label">Analytics</span>
        </button>
      </div>

      {/* Smart Tools section */}
      <div className="sidebar-section-label">Smart Tools</div>

      <div className="sidebar-ai-card" onClick={onDashboard} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onDashboard()}>
        <div className="sidebar-ai-title">
          <span aria-hidden>🤖</span>
          AI Assistant
          <span className="sidebar-ai-arrow" aria-hidden>›</span>
        </div>
        <div className="sidebar-ai-desc">
          Smart detection, routing and follow-up for faster resolution.
        </div>
      </div>

      {/* Community card */}
      <div className="sidebar-community-card">
        <div className="sidebar-community-title">
          Together we can build better communities
        </div>
        <div className="sidebar-community-desc">
          Report issues. Track progress. See real change.
        </div>
        <span className="sidebar-community-emoji" aria-hidden>👷</span>
      </div>

      {/* Live impact stats */}
      <div className="sidebar-section-label">Live Impact</div>
      <div className="sidebar-stats-grid">
        <div className="sidebar-stat-cell">
          <span className="sidebar-stat-n">{reports.length}</span>
          <span className="sidebar-stat-l">Reported</span>
        </div>
        <div className="sidebar-stat-cell">
          <span className="sidebar-stat-n" style={critical > 0 ? { color: "#ef4444" } : {}}>
            {critical}
          </span>
          <span className="sidebar-stat-l">Critical</span>
        </div>
        <div className="sidebar-stat-cell">
          <span className="sidebar-stat-n">{todayCount}</span>
          <span className="sidebar-stat-l">Today</span>
        </div>
      </div>

      {/* Civic tips */}
      <div className="sidebar-section-label">Tips</div>
      <div className="sidebar-tips">
        <div className="sidebar-tip">
          <span aria-hidden>📸</span>
          <span>Photograph issues in daylight for better AI accuracy</span>
        </div>
        <div className="sidebar-tip">
          <span aria-hidden>📍</span>
          <span>Enable GPS to auto-pin your report on the city map</span>
        </div>
        <div className="sidebar-tip">
          <span aria-hidden>⚡</span>
          <span>AI drafts an official complaint to the right dept in seconds</span>
        </div>
        <div className="sidebar-tip">
          <span aria-hidden>🔀</span>
          <span>Duplicate reports merge and escalate priority automatically</span>
        </div>
      </div>

      {/* Hidden stats used by top header via reports prop */}
      <div className="nav-stats" aria-label="Live statistics">
        {reports.length > 0 && (
          <>
            <div className="nav-stat">
              <span className="nav-stat-n">{reports.length}</span>
              <span className="nav-stat-l">Issues</span>
            </div>
            {critical > 0 && (
              <div className="nav-stat nav-stat-crit">
                <span className="nav-stat-dot" aria-hidden />
                <span className="nav-stat-n">{critical}</span>
                <span className="nav-stat-l">Critical</span>
              </div>
            )}
            {todayCount > 0 && (
              <div className="nav-stat nav-stat-today">
                <span className="nav-stat-n">{todayCount}</span>
                <span className="nav-stat-l">Today</span>
              </div>
            )}
          </>
        )}
      </div>
    </nav>
  );
}

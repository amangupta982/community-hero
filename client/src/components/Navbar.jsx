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
          onClick={() => document.querySelector(".map-wrap")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        >
          <span className="sidebar-nav-icon" aria-hidden>🗺️</span>
          <span className="sidebar-nav-label">Map View</span>
        </button>
        <button
          className="sidebar-nav-item"
          onClick={() => document.querySelector(".list")?.scrollIntoView({ behavior: "smooth", block: "start" })}
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

      <div className="sidebar-ai-card">
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

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="sidebar-footer-btn">
          <span aria-hidden>❓</span>
          <span>Help & Support</span>
        </button>
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

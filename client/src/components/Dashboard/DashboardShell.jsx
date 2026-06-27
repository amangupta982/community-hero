import { useState } from "react";
import { useDashboard } from "../../hooks/useDashboard.js";
import CityView    from "./CityView.jsx";
import AdminView   from "./AdminView.jsx";
import OfficerView from "./OfficerView.jsx";
import CitizenView from "./CitizenView.jsx";

const ROLES = [
  { id: "city",    label: "🏛️ City Official", desc: "Full city analytics"         },
  { id: "admin",   label: "🗺️ Ward Admin",     desc: "Ward performance & SLA"      },
  { id: "officer", label: "👮 Field Officer",  desc: "Assignments & urgent queue"   },
  { id: "citizen", label: "🏙️ Citizen",        desc: "Community transparency view"  },
];

function LiveDot() {
  return <span className="dash-live-dot" aria-label="Live data" title="Auto-refreshes every 20 seconds" />;
}

export default function DashboardShell({ onBack }) {
  const [role, setRole] = useState("city");
  const { stats, insights, loading, lastUpdated } = useDashboard();

  return (
    <div className="dash-shell">
      {/* Top bar */}
      <div className="dash-topbar">
        <button className="dash-back-btn" onClick={onBack} aria-label="Back to app">
          ← Back
        </button>
        <div className="dash-topbar-center">
          <span className="dash-topbar-title">City Intelligence Dashboard</span>
          <LiveDot />
        </div>
        <span className="dash-topbar-time">
          {lastUpdated
            ? `Updated ${lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
            : "Loading…"}
        </span>
      </div>

      {/* Role tabs */}
      <div className="dash-role-tabs" role="tablist" aria-label="Dashboard view">
        {ROLES.map((r) => (
          <button
            key={r.id}
            role="tab"
            aria-selected={role === r.id}
            className={`dash-role-tab${role === r.id ? " active" : ""}`}
            onClick={() => setRole(r.id)}
          >
            <span className="tab-label">{r.label}</span>
            <span className="tab-desc">{r.desc}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="dash-body">
        {loading ? (
          <div className="dash-loading">
            <span className="dash-loading-spin">⟳</span>
            Loading city data…
          </div>
        ) : (
          <div role="tabpanel">
            {role === "city"    && <CityView    stats={stats} insights={insights} />}
            {role === "admin"   && <AdminView   stats={stats} />}
            {role === "officer" && <OfficerView stats={stats} />}
            {role === "citizen" && <CitizenView stats={stats} />}
          </div>
        )}
      </div>
    </div>
  );
}

import StatCard from "./StatCard.jsx";
import TrendChart from "./TrendChart.jsx";
import { getIssueMeta } from "../../constants/index.js";

const HOW_STEPS = [
  {
    icon: "📸",
    title: "Snap a photo",
    desc: "Take a photo of any issue on public property — road, footpath, streetlight, drain.",
  },
  {
    icon: "🔍",
    title: "Vision AI",
    desc: "Gemini 2.5 identifies the issue type and severity from the photo in seconds.",
  },
  {
    icon: "📍",
    title: "Geo AI",
    desc: "GPS + reverse geocoding pins the exact location on the city map.",
  },
  {
    icon: "🌐",
    title: "Context AI",
    desc: "Checks nearby schools, hospitals, weather, and 60-day area history.",
  },
  {
    icon: "⚡",
    title: "Risk AI",
    desc: "Scores public risk 0–100 and estimates urgency, cost, and repair time.",
  },
  {
    icon: "✉️",
    title: "Complaint AI",
    desc: "Drafts an official letter to the right government department automatically.",
  },
];

export default function CitizenView({ stats }) {
  const { overview, trend, byType } = stats;
  const todayCount = trend[trend.length - 1]?.count ?? 0;
  const weekCount = trend.reduce((s, d) => s + d.count, 0);

  return (
    <div className="dash-view">
      <div className="citizen-hero">
        <div className="citizen-hero-icon">🏙️</div>
        <div>
          <h2 className="citizen-hero-title">Your city, in real time</h2>
          <p className="citizen-hero-sub">
            Every photo you take triggers 7 AI agents, generates an official government complaint,
            and maps the issue for city authorities — automatically.
          </p>
        </div>
      </div>

      <div className="dash-kpi-row">
        <StatCard label="Active Issues" value={overview.total} icon="📍" accent="#6366f1" />
        <StatCard label="Reported Today" value={todayCount} icon="📸" accent="#f59e0b" />
        <StatCard label="This Week" value={weekCount} icon="📅" accent="#7c3aed" />
        <StatCard
          label="Citizens Heard"
          value={overview.totalCitizenReports}
          icon="👥"
          accent="#047857"
        />
      </div>

      <div className="dash-grid-2">
        <div className="dash-panel">
          <div className="dash-panel-head">
            <span className="dash-panel-title">Weekly Activity</span>
          </div>
          <TrendChart data={trend} />
          <p className="citizen-trend-note">
            {weekCount === 0
              ? "No reports this week — be the first to flag an issue in your area."
              : `${weekCount} issue${weekCount !== 1 ? "s" : ""} reported this week. Each one generates an official government complaint automatically.`}
          </p>
        </div>

        <div className="dash-panel">
          <div className="dash-panel-head">
            <span className="dash-panel-title">What's being tracked</span>
          </div>
          <div className="citizen-type-list">
            {byType.length === 0 ? (
              <p className="dash-empty-note">
                No issues yet. Use the camera button on the home screen to report your first issue.
              </p>
            ) : (
              byType.slice(0, 6).map((t, i) => {
                const meta = getIssueMeta(t.type);
                const pct = Math.max((t.count / (byType[0]?.count || 1)) * 100, 3);
                return (
                  <div key={i} className="citizen-type-row">
                    <span
                      className="citizen-type-chip"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {meta.emoji} {t.type}
                    </span>
                    <div className="citizen-type-track">
                      <div
                        className="citizen-type-fill"
                        style={{
                          width: `${pct}%`,
                          background: meta.color,
                          "--bar-delay": `${i * 55}ms`,
                        }}
                      />
                    </div>
                    <span className="citizen-type-n">{t.count}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="dash-panel">
        <div className="dash-panel-head">
          <span className="dash-panel-title">How AI works for you</span>
          <span className="dash-panel-badge">7 agents · ~10 seconds</span>
        </div>
        <div className="how-steps-grid">
          {HOW_STEPS.map((step, i) => (
            <div key={i} className="how-step">
              <div className="how-step-num">{i + 1}</div>
              <div className="how-step-icon">{step.icon}</div>
              <div className="how-step-title">{step.title}</div>
              <div className="how-step-desc">{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

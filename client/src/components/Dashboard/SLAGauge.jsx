export default function SLAGauge({ compliance = 100, onTrack = 0, atRisk = 0, breached = 0 }) {
  const r     = 38;
  const circ  = 2 * Math.PI * r;
  const filled = circ * (compliance / 100);
  const color  = compliance >= 80 ? "#047857" : compliance >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="sla-gauge-wrap">
      <svg
        viewBox="0 0 96 96"
        className="sla-svg"
        role="img"
        aria-label={`SLA compliance ${compliance}%`}
      >
        <circle cx="48" cy="48" r={r} fill="none" stroke="var(--border)" strokeWidth="10" />
        <circle
          cx="48" cy="48" r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          transform="rotate(-90 48 48)"
          style={{ transition: "stroke-dasharray 0.9s ease" }}
        />
        <text
          x="48" y="44"
          textAnchor="middle"
          fontSize="19"
          fontWeight="700"
          fill={color}
          fontFamily="var(--font-display)"
        >
          {compliance}%
        </text>
        <text x="48" y="60" textAnchor="middle" fontSize="9" fill="var(--muted)">SLA</text>
      </svg>

      <div className="sla-legend">
        <span className="sla-leg sla-ok">✓ {onTrack} on track</span>
        <span className="sla-leg sla-risk">⚠ {atRisk} at risk</span>
        <span className="sla-leg sla-breach">✗ {breached} breached</span>
      </div>
    </div>
  );
}

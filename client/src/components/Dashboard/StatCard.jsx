import { useEffect, useRef, useState } from "react";

function AnimatedNumber({ value }) {
  const [displayed, setDisplayed] = useState(value);
  const fromRef  = useRef(value);
  const timerRef = useRef(null);

  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return;
    const duration = 600;
    const start    = Date.now();
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const p    = Math.min((Date.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(from + (value - from) * ease));
      if (p >= 1) { fromRef.current = value; clearInterval(timerRef.current); }
    }, 16);
    return () => clearInterval(timerRef.current);
  }, [value]);

  return <>{displayed.toLocaleString("en-IN")}</>;
}

export default function StatCard({ label, value = 0, sub, icon, accent, fmtOverride }) {
  return (
    <div className="dash-stat-card" style={accent ? { "--stat-accent": accent } : {}}>
      {icon && <span className="dash-stat-icon" aria-hidden>{icon}</span>}
      <div className="dash-stat-value">
        {fmtOverride ? fmtOverride(value) : <AnimatedNumber value={value} />}
      </div>
      <div className="dash-stat-label">{label}</div>
      {sub && <div className="dash-stat-sub">{sub}</div>}
    </div>
  );
}

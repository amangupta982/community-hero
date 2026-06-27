import { useId } from "react";

export default function TrendChart({ data = [], color = "#6366f1", criticalColor = "#ef4444" }) {
  const uid   = useId();
  const gradId = `tg${uid.replace(/:/g, "")}`;

  if (!data.length) return <div className="trend-empty">No data yet</div>;

  const W = 260, H = 72, P = 10;
  const max = Math.max(...data.map((d) => d.count), 1);

  const pts = data.map((d, i) => {
    const x = P + (i / Math.max(data.length - 1, 1)) * (W - P * 2);
    const y = H - P - (d.count / max) * (H - P * 2);
    return [x, y];
  });

  const polyline = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area     = `${P},${H - P} ${polyline} ${W - P},${H - P}`;

  return (
    <div className="trend-chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="trend-svg" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0"    />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#${gradId})`} />
        <polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {pts.map(([x, y], i) => (
          <circle
            key={i}
            cx={x} cy={y} r="4"
            fill="white"
            stroke={data[i].critical > 0 ? criticalColor : color}
            strokeWidth="2.5"
          >
            <title>{data[i].date}: {data[i].count} report{data[i].count !== 1 ? "s" : ""}{data[i].critical > 0 ? ` (${data[i].critical} critical)` : ""}</title>
          </circle>
        ))}
      </svg>
      <div className="trend-x-labels" aria-hidden="true">
        {data.map((d, i) => (
          <span key={i}>{d.date.split(" ")[1]}</span>
        ))}
      </div>
    </div>
  );
}

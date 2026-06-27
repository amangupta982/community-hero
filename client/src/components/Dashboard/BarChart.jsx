export default function BarChart({
  items    = [],
  labelKey = "ward",
  valueKey = "count",
  maxItems = 6,
  color    = "#6366f1",
}) {
  const visible = items.slice(0, maxItems);
  const maxVal  = Math.max(...visible.map((item) => item[valueKey] ?? 0), 1);

  return (
    <div className="bar-chart">
      {visible.map((item, i) => {
        const val = item[valueKey] ?? 0;
        const pct = Math.max((val / maxVal) * 100, 2);
        return (
          <div key={i} className="bar-row">
            <div className="bar-label" title={item[labelKey]}>{item[labelKey]}</div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${pct}%`,
                  background: color,
                  "--bar-delay": `${i * 55}ms`,
                }}
              />
            </div>
            <div className="bar-val">{val}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function PerformanceTrend({ values = [] }) {
  const safeValues = values.length ? values : [0];
  const first = safeValues[0] || 0;
  const last = safeValues[safeValues.length - 1] || 0;
  const trend = last >= first ? "Upward" : "Downward";

  return (
    <section className="premium-panel">
      <div className="section-heading-row">
        <div>
          <span className="result-eyebrow">Last 10 Attempts</span>
          <h2>Performance Trend</h2>
        </div>
        <span className={`trend-badge ${trend.toLowerCase()}`}>{trend}</span>
      </div>

      <div className="trend-chart" aria-label="Performance trend chart">
        {safeValues.map((value, index) => (
          <div key={`${value}-${index}`} className="trend-bar-wrap">
            <div className="trend-bar" style={{ height: `${Math.max(value, 4)}%` }} />
            <span>{value}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}
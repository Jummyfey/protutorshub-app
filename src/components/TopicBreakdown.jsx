const getPerformanceLabel = (percentage) => {
  if (percentage >= 80) return "Excellent";
  if (percentage >= 65) return "Good";
  if (percentage >= 50) return "Average";
  return "Weak";
};

export default function TopicBreakdown({ topics = [], mode = "results" }) {
  return (
    <section className="premium-panel">
      <div className="section-heading-row">
        <div>
          <span className="result-eyebrow">Topic Analysis</span>
          <h2>{mode === "mastery" ? "Topic Mastery Analysis" : "Topic Breakdown"}</h2>
        </div>
      </div>

      <div className="topic-breakdown-table">
        {topics.map((entry) => {
          const label =
            mode === "mastery"
              ? getMasteryLabel(entry.percentage)
              : getPerformanceLabel(entry.percentage);

          return (
            <div key={entry.topic} className="topic-breakdown-row">
              <div>
                <strong>{entry.topic}</strong>
                <span>
                  {entry.correct}/{entry.total} correct
                </span>
              </div>
              <div className="topic-progress-track">
                <div style={{ width: `${Math.min(entry.percentage, 100)}%` }} />
              </div>
              <strong>{entry.percentage}%</strong>
              <span className={`performance-pill ${label.toLowerCase().replace(" ", "-")}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function getMasteryLabel(percentage) {
  if (percentage >= 80) return "Strong";
  if (percentage >= 65) return "Improving";
  if (percentage >= 45) return "Needs Attention";
  return "Weak";
}
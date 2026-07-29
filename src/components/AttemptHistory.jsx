const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "No date";

const formatDuration = (seconds = 0) => {
  const safe = Math.max(0, Number(seconds) || 0);
  return `${Math.floor(safe / 60)}m`;
};

export default function AttemptHistory({ attempts = [] }) {
  return (
    <section className="premium-panel">
      <div className="section-heading-row">
        <div>
          <span className="result-eyebrow">Recent Work</span>
          <h2>Attempt History</h2>
        </div>
      </div>

      <div className="attempt-history-list">
        {attempts.map((attempt) => (
          <div key={attempt.id} className="attempt-history-row">
            <span>{formatDate(attempt.completedAt)}</span>
            <strong>{attempt.testType}</strong>
            <span>{attempt.packageType || "free"}</span>
            <strong>{attempt.percentage}%</strong>
            <span>{formatDuration(attempt.timeUsedSeconds)}</span>
          </div>
        ))}

        {!attempts.length && (
          <p className="muted-panel-text">No completed attempts yet.</p>
        )}
      </div>
    </section>
  );
}
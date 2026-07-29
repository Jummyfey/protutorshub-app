const formatDate = (value) =>
  value ? new Date(value).toLocaleString() : "Not available";

const formatDuration = (seconds = 0) => {
  const safe = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${minutes}m ${String(remainder).padStart(2, "0")}s`;
};

const getGrade = (percentage = 0) => {
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "Needs Practice";
};

export default function ResultSummaryCard({ attempt }) {
  if (!attempt) return null;

  const percentage = Number(attempt.percentage) || 0;

  return (
    <section className="result-summary-card premium-panel">
      <div>
        <span className="result-eyebrow">{attempt.packageType || "free"} package</span>
        <h1>{attempt.testType || "Completed Test"}</h1>
        <p>{formatDate(attempt.completedAt)}</p>
      </div>

      <div className="result-score-orb">
        <strong>{percentage}%</strong>
        <span>Grade {attempt.grade || getGrade(percentage)}</span>
      </div>

      <div className="result-summary-grid">
        <div>
          <span>Score</span>
          <strong>{attempt.score}/{attempt.totalQuestions}</strong>
        </div>
        <div>
          <span>Time Used</span>
          <strong>{formatDuration(attempt.timeUsedSeconds)}</strong>
        </div>
        <div>
          <span>Completed</span>
          <strong>{formatDate(attempt.completedAt)}</strong>
        </div>
      </div>
    </section>
  );
}
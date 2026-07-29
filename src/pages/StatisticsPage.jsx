import React from "react";
import AttemptHistory from "../components/AttemptHistory";
import LockedFeatureCard from "../components/LockedFeatureCard";
import NeedTutorCard from "../components/NeedTutorCard";
import PerformanceTrend from "../components/PerformanceTrend";
import TopicBreakdown from "../components/TopicBreakdown";
import {
  calculateStatistics,
  canAccessFeature,
} from "../utils/resultsStorage";

const formatStudyTime = (seconds = 0) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
};

export default function StatisticsPage({
  HeaderComponent,
  attempts,
  userPackage,
  onBack,
  onPrevious,
  onNext,
  onPracticeTopic,
  onTutorHelp,
  parentMode = false,
}) {
  const stats = calculateStatistics(attempts);
  const standardAccess = canAccessFeature(userPackage, "topicBreakdown");
  const eliteAccess = canAccessFeature(userPackage, "eliteInsights");

  return (
    <main className="page-shell syllabus-page">
      {React.createElement(HeaderComponent, {
        title: "Statistics",
        onBack,
        onPrevious,
        onNext,
      })}

      <section className="stats-card-grid">
        <StatCard title="Total Tests" value={stats.totalTests} />
        <StatCard title="Best Score" value={`${stats.highestScore}%`} />
        <StatCard title="Last Score" value={`${stats.lastScore}%`} />
        <StatCard title="Average Score" value={`${stats.averageScore}%`} />
        {standardAccess && (
          <>
            <StatCard title="Mock Exams" value={stats.totalMockExams} />
            <StatCard title="Practice Tests" value={stats.totalPracticeTests} />
            <StatCard title="Lowest Score" value={`${stats.lowestScore}%`} />
            <StatCard title="Study Time" value={formatStudyTime(stats.totalStudySeconds)} />
            <StatCard title="Study Streak" value={`${stats.currentStudyStreak} days`} />
          </>
        )}
      </section>

      {standardAccess ? (
        <>
          <TopicBreakdown topics={stats.topicMastery} mode="mastery" />

          <section className="premium-panel">
            <div className="section-heading-row">
              <div>
                <span className="result-eyebrow">Priority Topics</span>
                <h2>Weak Areas</h2>
              </div>
            </div>

            <div className="weak-area-list">
              {stats.weakAreas.map((topic) => (
                <div key={topic.topic}>
                  <strong>{topic.topic}</strong>
                  <span>{100 - topic.percentage}% weakness</span>
                  {!parentMode && (
                    <button className="secondary-button compact-button" onClick={onPracticeTopic}>
                      Practice Topic
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <PerformanceTrend values={stats.trend} />
          <AttemptHistory attempts={stats.recentAttempts} />
        </>
      ) : (
        <LockedFeatureCard message="Upgrade to Standard to unlock detailed analysis." />
      )}

      {eliteAccess ? (
        <section className="elite-insight-grid">
          <InsightCard title="Parent Monitoring" value="Dashboard placeholder" />
          <InsightCard title="Weekly Report" value="Ready for email export" />
          <InsightCard title="Consistency Score" value={`${getConsistencyScore(stats)}%`} />
          <InsightCard title="Readiness Score" value={`${getReadinessScore(stats)}%`} />
          <InsightCard title="Leaderboard" value="Coming with Supabase" />
        </section>
      ) : (
        standardAccess && (
          <LockedFeatureCard
            title="Elite Statistics Locked"
            message="Upgrade to Elite to unlock parent dashboard placeholders, readiness system, and consistency score."
          />
        )
      )}

      {onTutorHelp && <NeedTutorCard onClick={onTutorHelp} parentMode={parentMode} />}
    </main>
  );
}

function StatCard({ title, value }) {
  return (
    <article className="stat-card premium-panel">
      <span>{title}</span>
      <strong>{value}</strong>
    </article>
  );
}

function InsightCard({ title, value }) {
  return (
    <article className="premium-panel insight-card">
      <span>{title}</span>
      <strong>{value}</strong>
    </article>
  );
}

function getConsistencyScore(stats) {
  return Math.min(100, stats.currentStudyStreak * 18 + stats.totalTests * 4);
}

function getReadinessScore(stats) {
  return Math.min(100, Math.round(stats.averageScore * 0.75 + stats.currentStudyStreak * 4));
}
import React, { useMemo } from "react";
import LockedFeatureCard from "../components/LockedFeatureCard";
import NeedTutorCard from "../components/NeedTutorCard";
import {
  calculateStatistics,
  calculateWeeklyImprovement,
  canAccessFeature,
  generateSuccessRecommendations,
  getAchievementBadges,
  getExamPrediction,
  getReadinessLevel,
  getRecentAttempts,
  getStrongestTopics,
  getWeakestTopics,
} from "../utils/resultsStorage";
import { getStudyGuideProgress, getStudyPlan } from "../utils/studyPlanStorage";

export default function SuccessTrackPage({
  HeaderComponent,
  attempts,
  syllabusTopics = [],
  userPackage,
  onBack,
  onPrevious,
  onPracticeTopic,
  onStudyGuide,
  onStartMock,
  onTutorHelp,
  parentMode = false,
}) {
  const stats = useMemo(() => calculateStatistics(attempts), [attempts]);
  const readinessProfile = useMemo(
    () => calculateSyllabusReadiness(attempts, syllabusTopics),
    [attempts, syllabusTopics]
  );
  const readinessScore = readinessProfile.score;
  const readinessLevel = getReadinessLevel(readinessScore);
  const weeklyImprovement = calculateWeeklyImprovement(attempts);
  const strongestTopics = getStrongestTopics(3, attempts);
  const weakestTopics = getWeakestTopics(3, attempts);
  const prediction = getCoverageAwarePrediction(readinessProfile, attempts, userPackage);
  const recommendations = generateSuccessRecommendations(attempts);
  const badges = getAchievementBadges(attempts);
  const recentAttempts = getRecentAttempts(10, attempts);
  const studyPlan = getStudyPlan();
  const standardAccess = canAccessFeature("performanceTrends", userPackage);
  const eliteAccess = canAccessFeature("eliteInsights", userPackage);
  const topicCoveragePercent = readinessProfile.practiceCoveragePercent;
  const mockCount = attempts.filter((attempt) => attempt.testType === "Timed Mock").length;
  const eliteReadinessReady = topicCoveragePercent >= 70 && mockCount >= 2 && stats.averageScore >= 75;
  const eliteReadinessScore = eliteReadinessReady
    ? Math.min(100, Math.round(readinessScore * 0.7 + stats.averageScore * 0.3))
    : "Not enough data";

  return (
    <main className="page-shell syllabus-page">
      {React.createElement(HeaderComponent, {
        title: "Success Track",
        onBack,
        onPrevious,
      })}

      {!attempts.length ? (
        <section className="premium-panel empty-results-card">
          <span className="result-eyebrow">Success Track</span>
          <h1>Complete practice tests or timed mocks to generate your Success Track.</h1>
          <p>Your smart success coach will appear here after your first completed attempt.</p>
        </section>
      ) : (
        <>
          <section className="success-dashboard-grid">
            <SuccessMetric title="Current Readiness" value={`${readinessScore}%`} />
            <SuccessMetric title="Target Exam / School" value={studyPlan.targetSchool || studyPlan.targetExam} />
            <SuccessMetric title="Performance Level" value={readinessLevel} />
            <SuccessMetric title="Weekly Improvement" value={`${weeklyImprovement >= 0 ? "+" : ""}${weeklyImprovement}%`} />
            <SuccessMetric title="Strongest Topic" value={strongestTopics[0]?.topic || "Not enough data"} />
            <SuccessMetric title="Weakest Topic" value={weakestTopics[0]?.topic || "Not enough data"} />
          </section>

          <section className="premium-panel success-meter-card">
            <div>
              <span className="result-eyebrow">Readiness Meter</span>
              <h1>{readinessLevel}</h1>
              <p>
                {readinessScore}% readiness from Study Guide coverage, practice completion,
                scores, mock completion and consistency.
              </p>
            </div>
            <div className="readiness-gauge" style={{ "--readiness": `${readinessScore}%` }}>
              <strong>{readinessScore}%</strong>
            </div>
          </section>

          <section className="premium-panel">
            <span className="result-eyebrow">Exam Prediction</span>
            <h2>Smart Success Forecast</h2>
            <p className="success-prediction-text">{prediction}</p>
            {userPackage === "free" && (
              <LockedFeatureCard
                title="Detailed Prediction Locked"
                message="Upgrade to Standard to unlock detailed success tracking."
              />
            )}
            {!eliteAccess && (
              <LockedFeatureCard
                title="Elite Readiness Locked"
                message="Upgrade to Elite to unlock readiness scoring and parent insights."
              />
            )}
          </section>

          {standardAccess ? (
            <>
              <section className="premium-panel">
                <span className="result-eyebrow">Success Journey</span>
                <h2>Recent Progress Timeline</h2>
                <div className="success-timeline">
                  {recentAttempts.map((attempt, index) => (
                    <article key={attempt.id} className="success-timeline-card">
                      <span>{new Date(attempt.completedAt).toLocaleDateString()}</span>
                      <strong>{attempt.percentage}%</strong>
                      <p>{attempt.testType}</p>
                      <small>{getDirection(recentAttempts, index)}</small>
                    </article>
                  ))}
                </div>
              </section>

              <section className="study-plan-columns">
                <TopicList
                  title="Strongest Areas"
                  topics={strongestTopics}
                  emptyText="Complete more attempts to detect strong topics."
                />
                <TopicList
                  title="Weak Areas"
                  topics={weakestTopics}
                  emptyText="Complete more attempts to detect weak topics."
                  onPracticeTopic={onPracticeTopic}
                  onStudyGuide={onStudyGuide}
                />
              </section>

              <section className="premium-panel">
                <span className="result-eyebrow">Achievements</span>
                <h2>Success Badges</h2>
                <div className="achievement-grid">
                  {badges.map((badge) => (
                    <article key={badge.title} className={`achievement-badge ${badge.unlocked ? "unlocked" : ""}`}>
                      <strong>{badge.title}</strong>
                      <span>{badge.unlocked ? "Unlocked" : "Locked"}</span>
                    </article>
                  ))}
                </div>
              </section>

              <section className="premium-panel">
                <span className="result-eyebrow">Next Actions</span>
                <h2>Success Recommendations</h2>
                <div className="recommendation-list">
                  {recommendations.map((recommendation) => (
                    <div key={recommendation}>{recommendation}</div>
                  ))}
                </div>
                {!parentMode && (
                  <div className="result-action-row">
                    <button className="primary-button" onClick={onPracticeTopic}>Practice Now</button>
                    <button className="secondary-button" onClick={onStartMock}>Take Timed Mock</button>
                  </div>
                )}
              </section>
            </>
          ) : (
            <LockedFeatureCard
              title="Success Journey Locked"
              message="Upgrade to Standard to unlock timeline, achievements, topic insights and detailed recommendations."
            />
          )}

          {eliteAccess ? (
            <section className="elite-insight-grid">
              <SuccessMetric title="Exam Readiness" value={eliteReadinessReady ? `${eliteReadinessScore}%` : eliteReadinessScore} />
              <SuccessMetric title="Coverage Check" value={`${topicCoveragePercent}% practice subtopics completed`} />
              <SuccessMetric title="Weekly Readiness Report" value={`${mockCount} mocks completed`} />
              <SuccessMetric title="Consistency Score" value={`${Math.min(100, stats.currentStudyStreak * 14 + stats.totalTests * 3)}%`} />
              <SuccessMetric title="Prediction Status" value={eliteReadinessReady ? "Reliable estimate active" : "Complete wider syllabus first"} />
              <SuccessMetric title="Advanced Recommendation" value={topicCoveragePercent < 30 ? "Study and practise more syllabus areas" : weakestTopics[0]?.topic || "Maintain pace"} />
            </section>
          ) : null}
        </>
      )}

      {onTutorHelp && <NeedTutorCard onClick={onTutorHelp} parentMode={parentMode} />}
    </main>
  );
}

function SuccessMetric({ title, value }) {
  return (
    <article className="premium-panel success-metric-card">
      <span>{title}</span>
      <strong>{value}</strong>
    </article>
  );
}

function TopicList({ title, topics, emptyText, onPracticeTopic, onStudyGuide }) {
  return (
    <section className="premium-panel success-topic-panel">
      <span className="result-eyebrow">{title}</span>
      <h2>{title}</h2>
      <div className="weak-area-list">
        {topics.length ? topics.map((topic) => (
          <div key={topic.topic} className="success-topic-row">
            <strong>{topic.topic}</strong>
            <span>{topic.percentage}% mastery</span>
            {(onPracticeTopic || onStudyGuide) && (
              <div className="success-topic-actions">
                {onPracticeTopic && (
                  <button className="secondary-button compact-button" onClick={onPracticeTopic}>
                    Practice Now
                  </button>
                )}
                {onStudyGuide && (
                  <button className="secondary-button compact-button" onClick={onStudyGuide}>
                    Review Study Guide
                  </button>
                )}
              </div>
            )}
          </div>
        )) : <p className="muted-panel-text">{emptyText}</p>}
      </div>
    </section>
  );
}

function getDirection(attempts, index) {
  const current = Number(attempts[index]?.percentage) || 0;
  const next = Number(attempts[index + 1]?.percentage) || current;
  if (current > next) return "Improved";
  if (current < next) return "Needs recovery";
  return "Steady";
}

function calculateSyllabusReadiness(attempts = [], syllabusTopics = []) {
  const lessonKeys = syllabusTopics.flatMap((topic) =>
    (topic.lessons || []).map((lesson) => `${topic.title}::${lesson}`)
  );
  const knownLessons = new Set(lessonKeys);
  const totalLessons = Math.max(lessonKeys.length, 1);
  const studyProgress = getStudyGuideProgress();
  const studiedLessonCount = new Set(
    (studyProgress.studiedLessons || []).filter((lessonKey) => knownLessons.has(lessonKey))
  ).size;
  const practisedLessonCount = new Set(
    attempts
      .filter((attempt) => attempt.testType === "Practice Test")
      .map((attempt) => (attempt.topic && attempt.lesson ? `${attempt.topic}::${attempt.lesson}` : ""))
      .filter((lessonKey) => knownLessons.has(lessonKey))
  ).size;
  const practiceAttempts = attempts.filter((attempt) => attempt.testType === "Practice Test");
  const mockAttempts = attempts.filter((attempt) => attempt.testType === "Timed Mock");
  const studyCoverage = studiedLessonCount / totalLessons;
  const practiceCoverage = practisedLessonCount / totalLessons;
  const combinedCoverage = (studyCoverage + practiceCoverage) / 2;
  const practiceAverage = averageAttemptScore(practiceAttempts);
  const mockAverage = averageAttemptScore(mockAttempts);
  const consistency = Math.min(new Set(
    attempts.map((attempt) => new Date(attempt.completedAt).toDateString())
  ).size / 7, 1);
  const mockDepth = Math.min(mockAttempts.length / 2, 1);
  const rawScore =
    studyCoverage * 20 +
    practiceCoverage * 35 +
    (practiceAverage / 100) * 15 +
    mockDepth * 15 +
    (mockAverage / 100) * 10 +
    consistency * 5;
  const coverageCap =
    combinedCoverage < 0.05 ? 5 :
      combinedCoverage < 0.12 ? 8 :
        combinedCoverage < 0.25 ? 15 :
          combinedCoverage < 0.5 ? 35 :
            100;

  return {
    score: Math.min(coverageCap, Math.round(rawScore)),
    studyCoveragePercent: Math.round(studyCoverage * 100),
    practiceCoveragePercent: Math.round(practiceCoverage * 100),
    totalLessons,
    studiedLessonCount,
    practisedLessonCount,
  };
}

function getCoverageAwarePrediction(readinessProfile, attempts, userPackage) {
  const prediction = getExamPrediction(attempts, userPackage);

  if (readinessProfile.practiceCoveragePercent < 20) {
    return `Not enough syllabus coverage yet. The learner has completed ${readinessProfile.practisedLessonCount}/${readinessProfile.totalLessons} practice subtopics, so readiness is still early even if some scores improve.`;
  }

  if (readinessProfile.practiceCoveragePercent < 50) {
    return `Prediction is still developing. Complete more practice across the full syllabus before relying on exam-readiness estimates. ${prediction}`;
  }

  return prediction;
}

function averageAttemptScore(attempts = []) {
  if (!attempts.length) return 0;

  return attempts.reduce((sum, attempt) => sum + (Number(attempt.percentage) || 0), 0) / attempts.length;
}

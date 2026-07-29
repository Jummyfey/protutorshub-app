import React from "react";
import ResultSummaryCard from "../components/ResultSummaryCard";
import TopicBreakdown from "../components/TopicBreakdown";
import LockedFeatureCard from "../components/LockedFeatureCard";
import AttemptHistory from "../components/AttemptHistory";
import NeedTutorCard from "../components/NeedTutorCard";
import {
  canAccessFeature,
  getRecentAttempts,
  getWeakestTopics,
} from "../utils/resultsStorage";

export default function ResultsPage({
  HeaderComponent,
  attempts,
  userPackage,
  onBack,
  onPrevious,
  onNext,
  onRetake,
  onNewMock,
  onPracticeWeakAreas,
  onDashboard,
  onTutorHelp,
  parentMode = false,
}) {
  const latestAttempt = attempts[0];
  const canSeeDetails = canAccessFeature(userPackage, "topicBreakdown");
  const canSeeExplanations = canAccessFeature(userPackage, "explanations");
  const canSeeElite = canAccessFeature(userPackage, "eliteInsights");
  const weakAreas = getWeakestTopics(3, attempts);

  return (
    <main className="page-shell syllabus-page">
      {React.createElement(HeaderComponent, {
        title: "Results",
        onBack,
        onPrevious,
        onNext,
      })}

      {!latestAttempt ? (
        <section className="premium-panel empty-results-card">
          <span className="result-eyebrow">No Result Yet</span>
          <h1>No completed test yet.</h1>
          <p>Complete a practice test or timed mock to see your results.</p>
        </section>
      ) : (
        <>
          <ResultSummaryCard attempt={latestAttempt} />

          {canSeeDetails ? (
            <TopicBreakdown topics={latestAttempt.topicBreakdown} />
          ) : (
            <LockedFeatureCard message="Upgrade to Standard to unlock detailed analysis." />
          )}

          {canAccessFeature(userPackage, "weakRecommendations") ? (
            <section className="premium-panel weak-area-card">
              <span className="result-eyebrow">Recommended Focus</span>
              <h2>Practice Weak Areas</h2>
              <div className="weak-area-list">
                {weakAreas.map((topic) => (
                  <div key={topic.topic}>
                    <strong>{topic.topic}</strong>
                    <span>{topic.percentage}% mastery</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {canSeeExplanations ? (
            <section className="premium-panel">
              <div className="section-heading-row">
                <div>
                  <span className="result-eyebrow">Question Review</span>
                  <h2>Answers and Explanations</h2>
                </div>
              </div>
              <div className="question-review-list">
                {latestAttempt.answers.map((answer, index) => (
                  <article
                    key={`${answer.questionId}-${index}`}
                    className={`question-review-card ${answer.isCorrect ? "correct" : "wrong"}`}
                  >
                    <div className="question-review-top">
                      <strong>Question {index + 1}</strong>
                      <span>{answer.isCorrect ? "Correct" : "Wrong"}</span>
                    </div>
                    <p>{answer.questionText}</p>
                    <div className="answer-grid">
                      <div>
                        <span>Selected Answer</span>
                        <strong>{answer.selectedAnswer || "No answer"}</strong>
                      </div>
                      <div>
                        <span>Correct Answer</span>
                        <strong>{answer.correctAnswer}</strong>
                      </div>
                    </div>
                    <div className="explanation-box">
                      <span>Explanation</span>
                      <p>{answer.explanation || "No explanation saved."}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : (
            <LockedFeatureCard
              title="Detailed Review Locked"
              message="Upgrade to Standard to unlock explanations and question-by-question review."
            />
          )}

          {canAccessFeature(userPackage, "recentHistory") ? (
            <AttemptHistory attempts={getRecentAttempts(5, attempts)} />
          ) : null}

          {canSeeElite ? (
            <section className="elite-insight-grid">
              <InsightCard title="Elite Readiness Score" value={`${getReadinessScore(latestAttempt)}%`} />
              <InsightCard title="Performance Prediction" value={getPrediction(latestAttempt)} />
              <InsightCard title="Parent Monitoring" value="Ready for Supabase" />
            </section>
          ) : (
            <LockedFeatureCard
              title="Elite Analytics Locked"
              message="Upgrade to Elite to unlock parent tracking, readiness score, and advanced predictions."
            />
          )}

          {!parentMode && (
            <section className="result-action-row">
              <button className="primary-button" onClick={onRetake}>Retake Test</button>
              <button className="primary-button" onClick={onNewMock}>New Random Mock</button>
              <button className="secondary-button" onClick={onPracticeWeakAreas}>Practice Weak Areas</button>
              <button className="secondary-button" onClick={onDashboard}>Back to Dashboard</button>
            </section>
          )}
        </>
      )}

      {onTutorHelp && <NeedTutorCard onClick={onTutorHelp} parentMode={parentMode} />}
    </main>
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

function getReadinessScore(attempt) {
  return Math.min(100, Math.round((Number(attempt.percentage) || 0) * 0.82 + 12));
}

function getPrediction(attempt) {
  const percentage = Number(attempt.percentage) || 0;
  if (percentage >= 80) return "Likely Distinction";
  if (percentage >= 65) return "Strong Pass";
  if (percentage >= 50) return "Improving";
  return "Needs Support";
}
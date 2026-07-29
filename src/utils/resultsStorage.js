import { syncAttemptToBackend, syncUserPackageToBackend } from "../services/backendSync";

export const ATTEMPTS_STORAGE_KEY = "proTutorsHub_attempts";
export const USER_PACKAGE_STORAGE_KEY = "proTutorsHub_userPackage";

export const PACKAGE_TYPES = ["free", "standard", "elite"];

export const TOPIC_LABELS = {
  number: "Number & Numeration",
  "number-numeration": "Number & Numeration",
  fractions: "Fractions, Decimals & Percentages",
  ratio: "Ratio, Proportion & Word Problems",
  algebra: "Algebra",
  measurement: "Measurement & Mensuration",
  geometry: "Geometry",
  data: "Data Handling & Statistics",
  statistics: "Data Handling & Statistics",
  commercial: "Commercial Mathematics",
  mixedWord: "Mixed Word Problems",
  "word-problems": "Mixed Word Problems",
  quantitative: "Quantitative Reasoning",
};

export const TOPIC_NAMES = [
  "Number & Numeration",
  "Fractions, Decimals & Percentages",
  "Ratio, Proportion & Word Problems",
  "Algebra",
  "Measurement & Mensuration",
  "Geometry",
  "Data Handling & Statistics",
  "Commercial Mathematics",
  "Mixed Word Problems",
  "Quantitative Reasoning",
];

const FEATURE_ACCESS = {
  basicResults: ["free", "standard", "elite"],
  explanations: ["standard", "elite"],
  topicBreakdown: ["standard", "elite"],
  weakRecommendations: ["standard", "elite"],
  recentHistory: ["standard", "elite"],
  performanceTrends: ["standard", "elite"],
  studyTime: ["standard", "elite"],
  studyStreak: ["standard", "elite"],
  eliteInsights: ["elite"],
  parentTracking: ["elite"],
  readinessScore: ["elite"],
  advancedPrediction: ["elite"],
  standardPractice: ["standard", "elite"],
  elitePractice: ["elite"],
  fullMockReview: ["standard", "elite"],
};

const MOCK_CONFIGS = {
  free: {
    packageType: "free",
    title: "Free Timed Mock",
    subtitle: "50 questions, 50 minutes, 2 monthly attempts.",
    totalQuestions: 50,
    timeLimitMinutes: 50,
    maxAttempts: 2,
    distribution: {
      number: 8,
      fractions: 6,
      ratio: 5,
      algebra: 5,
      measurement: 5,
      geometry: 5,
      data: 3,
      commercial: 3,
      mixedWord: 6,
      quantitative: 4,
    },
  },
  standard: {
    packageType: "standard",
    title: "Standard Timed Mock",
    subtitle: "50 questions, 50 minutes, 10 monthly attempts.",
    totalQuestions: 50,
    timeLimitMinutes: 50,
    maxAttempts: 10,
    distribution: {
      number: 8,
      fractions: 6,
      ratio: 5,
      algebra: 6,
      measurement: 5,
      geometry: 5,
      data: 3,
      commercial: 3,
      mixedWord: 5,
      quantitative: 4,
    },
  },
  elite: {
    packageType: "elite",
    title: "Elite Timed Mock",
    subtitle: "60 questions, 60 minutes, unlimited attempts.",
    totalQuestions: 60,
    timeLimitMinutes: 60,
    maxAttempts: null,
    distribution: {
      number: 10,
      fractions: 7,
      ratio: 6,
      algebra: 7,
      measurement: 6,
      geometry: 6,
      data: 4,
      commercial: 4,
      mixedWord: 6,
      quantitative: 4,
    },
  },
};

const PRACTICE_ACCESS_CONFIGS = {
  free: {
    packageType: "free",
    title: "Free Practice",
    packIds: ["free"],
    lessonLimit: 3,
    fullSolutions: true,
    progressTracking: false,
  },
  standard: {
    packageType: "standard",
    title: "Standard Practice",
    packIds: ["free", "standard"],
    lessonLimit: null,
    fullSolutions: true,
    progressTracking: true,
  },
  elite: {
    packageType: "elite",
    title: "Elite Practice",
    packIds: ["free", "standard", "elite"],
    lessonLimit: null,
    fullSolutions: true,
    progressTracking: true,
  },
};

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export function getUserPackage() {
  if (typeof window === "undefined") return "free";

  const storedPackage = window.localStorage.getItem(USER_PACKAGE_STORAGE_KEY);
  return PACKAGE_TYPES.includes(storedPackage) ? storedPackage : "free";
}

export function setUserPackage(packageType, options = {}) {
  if (typeof window === "undefined") return "free";

  const safePackage = PACKAGE_TYPES.includes(packageType) ? packageType : "free";
  window.localStorage.setItem(USER_PACKAGE_STORAGE_KEY, safePackage);
  if (options.sync !== false) {
    syncUserPackageToBackend(safePackage);
  }
  return safePackage;
}

export function canAccessFeature(featureName, userPackage = getUserPackage()) {
  const feature = FEATURE_ACCESS[featureName] ? featureName : userPackage;
  const packageType = FEATURE_ACCESS[featureName] ? userPackage : featureName;
  const safePackage = PACKAGE_TYPES.includes(packageType) ? packageType : "free";
  return (FEATURE_ACCESS[feature] || []).includes(safePackage);
}

export function getMockConfig(userPackage = getUserPackage()) {
  return MOCK_CONFIGS[userPackage] || MOCK_CONFIGS.free;
}

export function getPracticeAccessConfig(userPackage = getUserPackage()) {
  return PRACTICE_ACCESS_CONFIGS[userPackage] || PRACTICE_ACCESS_CONFIGS.free;
}

export function getAttemptLimit(userPackage = getUserPackage()) {
  return getMockConfig(userPackage).maxAttempts;
}

export function hasReachedAttemptLimit(userPackage = getUserPackage(), attempts = getAttempts()) {
  const limit = getAttemptLimit(userPackage);
  if (limit === null) return false;

  return getCurrentMonthMockAttempts(userPackage, attempts).length >= limit;
}

export function getCurrentMonthMockAttempts(userPackage = getUserPackage(), attempts = getAttempts()) {
  const now = new Date();

  return attempts.filter((attempt) => {
    const completedAt = new Date(attempt.completedAt || attempt.submittedAt);

    return (
      attempt.testType === "Timed Mock" &&
      attempt.packageType === userPackage &&
      completedAt.getFullYear() === now.getFullYear() &&
      completedAt.getMonth() === now.getMonth()
    );
  });
}

export function generateMockForPackage() {
  throw new Error("generateMockForPackage must be connected to the app question bank.");
}

export function generatePracticeSetForPackage() {
  throw new Error("generatePracticeSetForPackage must be connected to the app question bank.");
}

export function getAttempts() {
  if (typeof window === "undefined") return [];

  return safeParse(window.localStorage.getItem(ATTEMPTS_STORAGE_KEY), []);
}

export function saveAttempt(attempt) {
  if (typeof window === "undefined") return attempt;

  const attempts = getAttempts();
  const normalizedAttempt = {
    ...attempt,
    id: attempt.id || `attempt-${Date.now()}`,
    completedAt: attempt.completedAt || new Date().toISOString(),
    topicBreakdown: attempt.topicBreakdown || [],
    answers: attempt.answers || [],
  };

  window.localStorage.setItem(
    ATTEMPTS_STORAGE_KEY,
    JSON.stringify([normalizedAttempt, ...attempts])
  );

  syncAttemptToBackend(normalizedAttempt);

  return normalizedAttempt;
}

export function getRecentAttempts(limit = 8, attempts = getAttempts()) {
  return attempts
    .slice()
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, limit);
}

export function getWeakestTopics(limit = 3, attempts = getAttempts()) {
  const topicTotals = calculateTopicAverages(attempts);

  return topicTotals
    .filter((topic) => topic.total > 0)
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, limit);
}

export function getStrongestTopics(limit = 3, attempts = getAttempts()) {
  const topicTotals = calculateTopicAverages(attempts);

  return topicTotals
    .filter((topic) => topic.total > 0)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, limit);
}

export function calculateTopicAverages(attempts = getAttempts()) {
  const totals = new Map(
    TOPIC_NAMES.map((topic) => [topic, { topic, correct: 0, total: 0 }])
  );

  attempts.forEach((attempt) => {
    (attempt.topicBreakdown || []).forEach((entry) => {
      const topic = TOPIC_LABELS[entry.topic] || entry.topic;
      const current = totals.get(topic) || { topic, correct: 0, total: 0 };
      current.correct += Number(entry.correct) || 0;
      current.total += Number(entry.total) || 0;
      totals.set(topic, current);
    });
  });

  return Array.from(totals.values()).map((entry) => ({
    ...entry,
    percentage: entry.total ? Math.round((entry.correct / entry.total) * 100) : 0,
  }));
}

export function calculateStatistics(attempts = getAttempts()) {
  const percentages = attempts.map((attempt) => Number(attempt.percentage) || 0);
  const totalStudySeconds = attempts.reduce(
    (sum, attempt) => sum + (Number(attempt.timeUsedSeconds) || 0),
    0
  );
  const mockAttempts = attempts.filter((attempt) => attempt.testType === "Timed Mock");
  const practiceAttempts = attempts.filter((attempt) => attempt.testType === "Practice Test");
  const recentAttempts = getRecentAttempts(10, attempts);

  return {
    totalTests: attempts.length,
    totalMockExams: mockAttempts.length,
    totalPracticeTests: practiceAttempts.length,
    averageScore: percentages.length
      ? Math.round(percentages.reduce((sum, score) => sum + score, 0) / percentages.length)
      : 0,
    highestScore: percentages.length ? Math.max(...percentages) : 0,
    lowestScore: percentages.length ? Math.min(...percentages) : 0,
    lastScore: percentages.length ? percentages[0] : 0,
    totalStudySeconds,
    currentStudyStreak: calculateStudyStreak(attempts),
    topicMastery: calculateTopicAverages(attempts),
    weakAreas: getWeakestTopics(3, attempts),
    recentAttempts,
    trend: recentAttempts.slice().reverse().map((attempt) => Number(attempt.percentage) || 0),
  };
}

export function calculateReadinessScore(attempts = getAttempts()) {
  if (!attempts.length) return 0;

  const topicCoverage = new Set(
    attempts.flatMap((attempt) =>
      (attempt.topicBreakdown || []).map((entry) => entry.topic).filter(Boolean)
    )
  ).size / TOPIC_NAMES.length;
  const practiceAttempts = attempts.filter((attempt) => attempt.testType === "Practice Test");
  const mockAttempts = attempts.filter((attempt) => attempt.testType === "Timed Mock");
  const recentAttempts = getRecentAttempts(8, attempts);
  const recentAverage =
    recentAttempts.reduce((sum, attempt) => sum + (Number(attempt.percentage) || 0), 0) /
    Math.max(recentAttempts.length, 1);
  const practiceAverage =
    practiceAttempts.reduce((sum, attempt) => sum + (Number(attempt.percentage) || 0), 0) /
    Math.max(practiceAttempts.length, 1);
  const mockAverage =
    mockAttempts.reduce((sum, attempt) => sum + (Number(attempt.percentage) || 0), 0) /
    Math.max(mockAttempts.length, 1);
  const practiceDepth = Math.min(practiceAttempts.length / 40, 1);
  const mockDepth = Math.min(mockAttempts.length / 2, 1);
  const consistency = Math.min(calculateStudyStreak(attempts) / 7, 1);
  const rawScore =
    topicCoverage * 25 +
    practiceDepth * 20 +
    (practiceAverage / 100) * 20 +
    mockDepth * 15 +
    (mockAverage / 100) * 12 +
    (recentAverage / 100) * 5 +
    consistency * 3;

  const coverageCap =
    topicCoverage < 0.12 ? 8 :
      topicCoverage < 0.25 ? 15 :
        topicCoverage < 0.5 ? 35 :
          100;

  return Math.min(coverageCap, 100, Math.round(rawScore));
}

export function getReadinessLevel(score = 0) {
  if (score >= 92) return "Elite Performer";
  if (score >= 84) return "High Readiness";
  if (score >= 75) return "Exam Ready";
  if (score >= 62) return "Competitive";
  if (score >= 40) return "Improving";
  return "Beginner";
}

export function calculateWeeklyImprovement(attempts = getAttempts()) {
  const recent = getRecentAttempts(10, attempts).slice().reverse();
  if (recent.length < 2) return 0;

  const midpoint = Math.max(1, Math.floor(recent.length / 2));
  const older = recent.slice(0, midpoint);
  const newer = recent.slice(midpoint);
  const average = (items) =>
    Math.round(items.reduce((sum, item) => sum + (Number(item.percentage) || 0), 0) / items.length);

  return average(newer) - average(older);
}

export function generateSuccessRecommendations(attempts = getAttempts()) {
  const weakest = getWeakestTopics(3, attempts);
  const recent = getRecentAttempts(3, attempts);
  const latestScore = Number(recent[0]?.percentage) || 0;
  const recommendations = weakest.map((topic) => `Practise ${topic.topic} twice this week.`);

  if (weakest[0]) {
    recommendations.push(`Review ${weakest[0].topic} explanations before the next mock.`);
  }

  if (latestScore < 70) {
    recommendations.push("Take one full timed mock this weekend and review every missed question.");
  } else {
    recommendations.push("Focus on speed and accuracy to protect strong scores.");
  }

  return recommendations.slice(0, 4);
}

export function getAchievementBadges(attempts = getAttempts()) {
  const stats = calculateStatistics(attempts);
  const strongest = getStrongestTopics(5, attempts);
  const badges = [
    {
      title: "First Mock Completed",
      unlocked: stats.totalMockExams >= 1,
    },
    {
      title: "5 Tests Completed",
      unlocked: stats.totalTests >= 5,
    },
    {
      title: "80% Score Achiever",
      unlocked: stats.highestScore >= 80,
    },
    {
      title: "Algebra Master",
      unlocked: strongest.some((topic) => topic.topic === "Algebra" && topic.percentage >= 80),
    },
    {
      title: "Quantitative Challenger",
      unlocked: attempts.some((attempt) =>
        (attempt.topicBreakdown || []).some((topic) => topic.topic === "Quantitative Reasoning")
      ),
    },
    {
      title: "7-Day Streak",
      unlocked: stats.currentStudyStreak >= 7,
    },
    {
      title: "Speed Genius",
      unlocked: attempts.some((attempt) => attempt.percentage >= 75 && attempt.timeUsedSeconds <= 1800),
    },
    {
      title: "Elite Performer",
      unlocked: calculateReadinessScore(attempts) >= 92,
    },
  ];

  return badges;
}

export function getExamPrediction(attempts = getAttempts(), userPackage = getUserPackage()) {
  if (!attempts.length) {
    return "Complete practice tests or timed mocks to generate your Success Track.";
  }

  const recent = getRecentAttempts(5, attempts);
  const average = Math.round(
    recent.reduce((sum, attempt) => sum + (Number(attempt.percentage) || 0), 0) /
      Math.max(recent.length, 1)
  );
  const low = Math.max(0, average - 4);
  const high = Math.min(100, average + 4);
  const weakest = getWeakestTopics(1, attempts)[0]?.topic || "speed and accuracy";
  const topicCoverage = new Set(
    attempts.flatMap((attempt) =>
      (attempt.topicBreakdown || []).map((entry) => entry.topic).filter(Boolean)
    )
  ).size / TOPIC_NAMES.length;

  if (userPackage === "elite") {
    if (topicCoverage < 0.3) {
      return `Too early for a reliable readiness prediction. Only ${Math.round(topicCoverage * 100)}% of syllabus areas have attempt data. Build coverage beyond one topic first.`;
    }

    return `Advanced prediction: likely ${low}% to ${high}%, with readiness improving when ${weakest} is strengthened.`;
  }

  if (userPackage === "standard") {
    return `Based on recent attempts, the learner is likely to score between ${low}% and ${high}%. Focus next on ${weakest}.`;
  }

  return `Basic prediction: likely score range is ${low}% to ${high}%.`;
}

function calculateStudyStreak(attempts) {
  const activeDays = new Set(
    attempts.map((attempt) => new Date(attempt.completedAt).toDateString())
  );
  let streak = 0;
  const cursor = new Date();

  while (activeDays.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

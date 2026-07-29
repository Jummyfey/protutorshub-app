import {
  calculateStatistics,
  getAttempts,
  getUserPackage,
  getWeakestTopics,
  TOPIC_NAMES,
} from "./resultsStorage";

export const STUDY_PLAN_STORAGE_KEY = "proTutorsHub_studyPlan";
export const PARENT_SCHEDULE_STORAGE_KEY = "proTutorsHub_parentSchedule";
export const STUDY_GUIDE_PROGRESS_STORAGE_KEY = "proTutorsHub_studyGuideProgress";

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const normalizeTopicList = (topics = []) =>
  Array.isArray(topics) ? topics.filter((topic) => TOPIC_NAMES.includes(topic)) : [];

export function getStudyGuideProgress() {
  if (typeof window === "undefined") {
    return {
      studiedTopics: [],
      studiedLessons: [],
      updatedAt: null,
    };
  }

  const progress = safeParse(window.localStorage.getItem(STUDY_GUIDE_PROGRESS_STORAGE_KEY), {});
  const confirmedStudiedLessons = Array.isArray(progress.confirmedStudiedLessons)
    ? progress.confirmedStudiedLessons
    : [];
  const confirmedStudiedTopics = Array.isArray(progress.confirmedStudiedTopics)
    ? progress.confirmedStudiedTopics
    : confirmedStudiedLessons
      .map((lessonKey) => String(lessonKey).split("::")[0])
      .filter(Boolean);

  return {
    studiedTopics: normalizeTopicList(confirmedStudiedTopics),
    studiedLessons: confirmedStudiedLessons,
    updatedAt: progress.updatedAt || null,
  };
}

export function markStudyGuideTopicStudied(topic, lesson = "") {
  if (!TOPIC_NAMES.includes(topic)) return getStudyGuideProgress();

  const currentProgress = getStudyGuideProgress();
  const studiedTopics = Array.from(new Set([...currentProgress.studiedTopics, topic]));
  const studiedLessons = Array.from(
    new Set([
      ...currentProgress.studiedLessons,
      lesson ? `${topic}::${lesson}` : topic,
    ])
  );
  const nextProgress = {
    studiedTopics,
    studiedLessons,
    confirmedStudiedTopics: studiedTopics,
    confirmedStudiedLessons: studiedLessons,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      STUDY_GUIDE_PROGRESS_STORAGE_KEY,
      JSON.stringify(nextProgress)
    );
  }

  return nextProgress;
}

export function buildDefaultDayTopicSchedule(
  studyDays = getDefaultStudyPlan().studyDays,
  dailyMinutes = getDefaultStudyPlan().dailyMinutes,
  preferredStartTime = getDefaultStudyPlan().preferredStartTime,
  reminderEnabled = getDefaultStudyPlan().reminderEnabled,
  reminderLeadMinutes = getDefaultStudyPlan().reminderLeadMinutes
) {
  return studyDays.map((day, index) => ({
    day,
    topics: [TOPIC_NAMES[index % TOPIC_NAMES.length]],
    duration: dailyMinutes,
    preferredStartTime,
    reminderEnabled,
    reminderLeadMinutes,
  }));
}

function normalizeDayTopicSchedule(plan) {
  const defaults = getDefaultStudyPlan();
  const studyDays = Array.isArray(plan.studyDays) && plan.studyDays.length
    ? plan.studyDays.filter((day) => WEEK_DAYS.includes(day))
    : defaults.studyDays;
  const existingSchedule = Array.isArray(plan.dayTopicSchedule) ? plan.dayTopicSchedule : [];
  const fallbackSchedule = buildDefaultDayTopicSchedule(
    studyDays,
    Number(plan.dailyMinutes) || defaults.dailyMinutes,
    plan.preferredStartTime || defaults.preferredStartTime,
    Boolean(plan.reminderEnabled),
    Number(plan.reminderLeadMinutes) || defaults.reminderLeadMinutes
  );

  return studyDays.map((day, index) => {
    const existing = existingSchedule.find((entry) => entry?.day === day);
    const fallback = fallbackSchedule[index];

    return {
      ...fallback,
      ...existing,
      day,
      topics: normalizeTopicList(existing?.topics).length
        ? normalizeTopicList(existing.topics)
        : normalizeTopicList(fallback.topics),
      duration: Number(existing?.duration || plan.dailyMinutes || defaults.dailyMinutes),
      preferredStartTime:
        existing?.preferredStartTime || plan.preferredStartTime || defaults.preferredStartTime,
      reminderEnabled:
        typeof existing?.reminderEnabled === "boolean"
          ? existing.reminderEnabled
          : Boolean(plan.reminderEnabled),
      reminderLeadMinutes: Number(
        existing?.reminderLeadMinutes || plan.reminderLeadMinutes || defaults.reminderLeadMinutes
      ),
    };
  });
}

export function normalizeStudyPlan(plan = {}) {
  const defaults = getDefaultStudyPlan();
  const mergedPlan = {
    ...defaults,
    ...plan,
    focusTopics: normalizeTopicList(plan.focusTopics || defaults.focusTopics),
  };

  mergedPlan.studyDays = Array.isArray(mergedPlan.studyDays) && mergedPlan.studyDays.length
    ? mergedPlan.studyDays.filter((day) => WEEK_DAYS.includes(day))
    : defaults.studyDays;
  mergedPlan.dayTopicSchedule = normalizeDayTopicSchedule(mergedPlan);

  return mergedPlan;
}

function normalizeParentSchedule(schedule = {}) {
  const defaults = getDefaultParentSchedule();
  const mergedSchedule = {
    ...defaults,
    ...schedule,
    targetTopics: normalizeTopicList(schedule.targetTopics || defaults.targetTopics),
    mandatoryTopics: normalizeTopicList(schedule.mandatoryTopics || defaults.mandatoryTopics),
  };

  mergedSchedule.studyDays = Array.isArray(mergedSchedule.studyDays) && mergedSchedule.studyDays.length
    ? mergedSchedule.studyDays.filter((day) => WEEK_DAYS.includes(day))
    : defaults.studyDays;
  mergedSchedule.dayTopicSchedule = normalizeDayTopicSchedule({
    ...getDefaultStudyPlan(),
    studyDays: mergedSchedule.studyDays,
    dailyMinutes: mergedSchedule.dailyMinutes,
    preferredStartTime: "17:00",
    reminderEnabled: false,
    dayTopicSchedule: mergedSchedule.dayTopicSchedule,
  });

  return mergedSchedule;
}

export function getStudyPlan() {
  if (typeof window === "undefined") return getDefaultStudyPlan();

  return normalizeStudyPlan(safeParse(window.localStorage.getItem(STUDY_PLAN_STORAGE_KEY), {}));
}

export function saveStudyPlan(plan) {
  const normalizedPlan = normalizeStudyPlan({
    ...plan,
    updatedAt: new Date().toISOString(),
  });

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STUDY_PLAN_STORAGE_KEY, JSON.stringify(normalizedPlan));
  }

  return normalizedPlan;
}

export function getDefaultStudyPlan() {
  return {
    targetExam: "Common Entrance Mathematics",
    targetSchool: "",
    studyDays: ["Monday", "Wednesday", "Friday", "Saturday"],
    dailyMinutes: 45,
    mockFrequencyPerWeek: 1,
    focusTopics: [],
    dayTopicSchedule: [
      {
        day: "Monday",
        topics: ["Number & Numeration"],
        duration: 45,
        preferredStartTime: "17:00",
        reminderEnabled: false,
        reminderLeadMinutes: 5,
      },
      {
        day: "Wednesday",
        topics: ["Fractions, Decimals & Percentages"],
        duration: 45,
        preferredStartTime: "17:00",
        reminderEnabled: false,
        reminderLeadMinutes: 5,
      },
      {
        day: "Friday",
        topics: ["Algebra"],
        duration: 45,
        preferredStartTime: "17:00",
        reminderEnabled: false,
        reminderLeadMinutes: 5,
      },
      {
        day: "Saturday",
        topics: ["Geometry"],
        duration: 45,
        preferredStartTime: "17:00",
        reminderEnabled: false,
        reminderLeadMinutes: 5,
      },
    ],
    preferredStartTime: "17:00",
    reminderEnabled: false,
    reminderLeadMinutes: 5,
    autoGeneratedPlan: [],
    customized: false,
    updatedAt: null,
  };
}

export function getDefaultParentSchedule() {
  return {
    enabled: true,
    studyDays: ["Monday", "Wednesday", "Friday"],
    dailyMinutes: 60,
    mockFrequencyPerWeek: 3,
    targetTopics: [],
    dayTopicSchedule: [
      {
        day: "Monday",
        topics: ["Number & Numeration"],
        duration: 60,
        preferredStartTime: "17:00",
        reminderEnabled: false,
        reminderLeadMinutes: 5,
      },
      {
        day: "Wednesday",
        topics: ["Algebra"],
        duration: 60,
        preferredStartTime: "17:00",
        reminderEnabled: false,
        reminderLeadMinutes: 5,
      },
      {
        day: "Friday",
        topics: ["Quantitative Reasoning"],
        duration: 60,
        preferredStartTime: "17:00",
        reminderEnabled: false,
        reminderLeadMinutes: 5,
      },
    ],
    targetSchool: "",
    allowedBreakMinutes: 15,
    weeklyTargetScore: 80,
    weeklyStudyHoursGoal: 6,
    parentApprovalRequired: true,
    minimumStudyDaysWeekly: 5,
    minimumDailyMinutes: 60,
    mandatoryTopics: ["Algebra", "Quantitative Reasoning"],
    alertParentOnMissedSession: true,
    readinessGoal: "Exam Ready",
    createdAt: "",
    updatedAt: "",
  };
}

export function getParentSchedule() {
  if (typeof window === "undefined") return getDefaultParentSchedule();

  return normalizeParentSchedule(safeParse(window.localStorage.getItem(PARENT_SCHEDULE_STORAGE_KEY), {}));
}

export function saveParentSchedule(schedule) {
  const now = new Date().toISOString();
  const normalizedSchedule = normalizeParentSchedule({
    ...schedule,
    createdAt: schedule.createdAt || now,
    updatedAt: now,
  });

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      PARENT_SCHEDULE_STORAGE_KEY,
      JSON.stringify(normalizedSchedule)
    );
  }

  return normalizedSchedule;
}

export function generateParentStudyRoadmap(schedule = getParentSchedule()) {
  const normalizedSchedule = normalizeParentSchedule(schedule);

  return [
    {
      rule: "Parent approval",
      value: normalizedSchedule.parentApprovalRequired ? "Required before schedule changes" : "Not required",
    },
    {
      rule: "Minimum study days",
      value: `${normalizedSchedule.minimumStudyDaysWeekly || 5} days weekly`,
    },
    {
      rule: "Minimum daily study",
      value: `${normalizedSchedule.minimumDailyMinutes || normalizedSchedule.dailyMinutes} minutes`,
    },
    {
      rule: "Mandatory topics",
      value: (normalizedSchedule.mandatoryTopics || []).join(", ") || "None selected",
    },
    {
      rule: "Missed session alert",
      value: normalizedSchedule.alertParentOnMissedSession ? "Enabled" : "Disabled",
    },
  ];
}

export function getEliteParentInsights(schedule = getParentSchedule(), attempts = getAttempts()) {
  const weeklyMocks = attempts.filter((attempt) => attempt.testType === "Timed Mock").length;
  const totalStudySeconds = attempts.reduce(
    (sum, attempt) => sum + (Number(attempt.timeUsedSeconds) || 0),
    0
  );
  const activeStudyMinutes = Math.round(totalStudySeconds / 60);

  return {
    childPresence: "Local placeholder: last active when this browser is used",
    activeStudyDuration: `${activeStudyMinutes} mins tracked locally`,
    inactivityDetection: "Prepared for Supabase realtime presence",
    missedSessionAlerts: schedule.alertParentOnMissedSession ? "Missed-session alerts enabled locally" : "Missed-session alerts off",
    weeklyParentReports: "Report placeholder ready",
    mockCompletionTracking: `${weeklyMocks}/${schedule.mockFrequencyPerWeek} mock target records`,
  };
}

export function getStudyPlanAccess(userPackage = getUserPackage()) {
  return {
    canCustomizeTarget: true,
    canCustomizeSchool: userPackage !== "free",
    canCustomizeDays: true,
    canCustomizeMinutes: userPackage !== "free",
    canCustomizeMockFrequency: userPackage !== "free",
    canCustomizeFocusTopics: userPackage !== "free",
    canUseWeakTopicPlanning: userPackage !== "free",
    canUseParentScheduling: userPackage === "elite",
    canUseEliteModes: userPackage === "elite",
  };
}

export function generateAutoStudyPlan(
  attempts = getAttempts(),
  statistics = calculateStatistics(attempts),
  userPackage = getUserPackage(),
  savedPreferences = getStudyPlan()
) {
  const access = getStudyPlanAccess(userPackage);
  const normalizedPreferences = normalizeStudyPlan(savedPreferences);
  const weakTopics = getWeakestTopics(4, attempts).map((topic) => topic.topic);
  const shouldUseAutomaticWeakPlan =
    userPackage === "free" && attempts.length > 0 && weakTopics.length > 0;
  const focusTopics =
    (access.canUseWeakTopicPlanning || shouldUseAutomaticWeakPlan) && weakTopics.length
      ? weakTopics
      : normalizedPreferences.focusTopics.length
        ? normalizedPreferences.focusTopics
        : TOPIC_NAMES;
  const dailyMinutes = access.canCustomizeMinutes ? normalizedPreferences.dailyMinutes : 35;
  const currentDay = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const packageTask =
    userPackage === "elite"
      ? "Study the guide, complete topic practice, then review every mistake."
      : userPackage === "standard"
        ? "Study the guide, complete topic practice, then review explanations."
        : "Read the lesson first, then complete a short practice session.";

  const scheduleSource = shouldUseAutomaticWeakPlan
    ? normalizedPreferences.studyDays.map((day, index) => ({
        day,
        topics: [focusTopics[index % focusTopics.length]],
        duration: normalizedPreferences.dailyMinutes,
        preferredStartTime: normalizedPreferences.preferredStartTime,
        reminderEnabled: normalizedPreferences.reminderEnabled,
        reminderLeadMinutes: normalizedPreferences.reminderLeadMinutes,
      }))
    : normalizedPreferences.dayTopicSchedule;

  return scheduleSource.map((entry, index) => {
    const topics = shouldUseAutomaticWeakPlan
      ? [focusTopics[index % focusTopics.length] || TOPIC_NAMES[index % TOPIC_NAMES.length]]
      : entry.topics.length
      ? entry.topics
      : [focusTopics[index % focusTopics.length] || TOPIC_NAMES[index % TOPIC_NAMES.length]];
    const duration = entry.duration || dailyMinutes;

    return {
      day: entry.day,
      topic: topics.join(", "),
      topics,
      duration,
      preferredStartTime: entry.preferredStartTime,
      reminderEnabled: entry.reminderEnabled,
      reminderLeadMinutes: entry.reminderLeadMinutes,
      task: packageTask,
      action: "Start Study Guide",
      secondaryAction: "Practice Topic",
      finalAction: "Review Mistakes",
      status: entry.day === currentDay ? "Today" : "Planned",
      flow: ["Study Guide", "Practice Topic", "Review Mistakes"],
      readinessNote: getReadinessNote(statistics.averageScore),
    };
  });
}

function getReadinessNote(averageScore) {
  if (averageScore >= 80) return "Exam-ready pace";
  if (averageScore >= 65) return "Strong, keep sharpening";
  if (averageScore >= 45) return "Improving with focused practice";
  return "Build foundations steadily";
}

export { WEEK_DAYS };

import { calculateStatistics, getAttempts, getWeakestTopics } from "../utils/resultsStorage";
import {
  getBackendUserId,
  isBackendConfigured,
  supabaseFunctionRequest,
  supabaseRequest,
} from "./supabaseRestClient";

export const PARENT_NOTIFICATION_STORAGE_KEY = "proTutorsHub_parentNotificationPreferences";
export const CHILD_ACTIVITY_STORAGE_KEY = "proTutorsHub_childActivityEvents";
export const PENDING_CHILD_ACTIVITY_STORAGE_KEY = "proTutorsHub_pendingChildActivityEvents";
export const STUDY_SESSIONS_STORAGE_KEY = "proTutorsHub_studySessions";
export const PARENT_ID_STORAGE_KEY = "proTutorsHub_parentId";
export const ACTIVE_STUDY_SESSION_STORAGE_KEY = "proTutorsHub_activeStudySession";
const ABANDONED_SESSION_MINUTES = 20;
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  "BJVEG6QnojaP0d4vNLl15J5GUwCSTYaq1OwaEBOvATi4Frh8ylnT1W8sUGw9w0uf1LmP8LzqQ0etnnsdVLKjJno";

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const firstRecord = (records) => (Array.isArray(records) && records.length ? records[0] : null);
const isPlaceholderChildName = (name) => {
  const normalized = String(name || "").trim().toLowerCase();
  return !normalized || normalized === "linked student" || normalized === "student";
};

const getStudentProfileName = (record) => (
  [record?.student_first_name, record?.student_last_name].filter(Boolean).join(" ").trim()
);

const safeRun = async (operation) => {
  if (!isBackendConfigured()) return null;

  try {
    return await operation();
  } catch (error) {
    console.warn(error.message);
    return null;
  }
};

export function getParentId() {
  if (typeof window === "undefined") return "server-parent";

  const existingId = window.localStorage.getItem(PARENT_ID_STORAGE_KEY);
  if (existingId) return existingId;

  const generatedId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `parent-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(PARENT_ID_STORAGE_KEY, generatedId);
  return generatedId;
}

export function getDefaultParentNotificationPreferences() {
  return {
    childId: getBackendUserId(),
    parentId: getParentId(),
    parentEmail: "",
    parentWhatsAppNumber: "",
    enableEmailAlerts: false,
    enableWhatsAppAlerts: false,
    enableParentDashboard: true,
    alertOnAppOpened: true,
    alertOnSessionStarted: true,
    alertOnSessionCompleted: true,
    alertOnSessionAbandoned: true,
    alertOnLateStart: false,
    alertOnMissedSession: true,
    receiveDailyReport: true,
    receiveWeeklyReport: false,
    updatedAt: null,
  };
}

export function getLocalParentNotificationPreferences() {
  if (typeof window === "undefined") return getDefaultParentNotificationPreferences();

  return {
    ...getDefaultParentNotificationPreferences(),
    ...safeParse(window.localStorage.getItem(PARENT_NOTIFICATION_STORAGE_KEY), {}),
  };
}

function mapParentPreferencesRecord(record) {
  return {
    childId: record.child_id,
    parentId: record.parent_id,
    parentEmail: record.parent_email || "",
    parentWhatsAppNumber: record.parent_whatsapp_number || "",
    enableEmailAlerts: Boolean(record.enable_email_alerts),
    enableWhatsAppAlerts: Boolean(record.enable_whatsapp_alerts),
    enableParentDashboard: Boolean(record.enable_parent_dashboard ?? true),
    alertOnAppOpened: Boolean(record.alert_on_app_opened),
    alertOnSessionStarted: Boolean(record.alert_on_session_started),
    alertOnSessionCompleted: Boolean(record.alert_on_session_completed),
    alertOnSessionAbandoned: false,
    alertOnLateStart: false,
    alertOnMissedSession: Boolean(record.alert_on_missed_session),
    receiveDailyReport: Boolean(record.receive_daily_report),
    receiveWeeklyReport: Boolean(record.receive_weekly_report),
    updatedAt: record.updated_at,
  };
}

export async function loadParentNotificationPreferences() {
  const backendPreferences = await safeRun(async () => {
    const records = await supabaseRequest(
      `parent_notification_preferences?child_id=eq.${encodeURIComponent(getBackendUserId())}&select=*&limit=1`
    );
    const record = firstRecord(records);
    if (!record) return null;

    return mapParentPreferencesRecord(record);
  });

  const preferences = backendPreferences || getLocalParentNotificationPreferences();

  if (typeof window !== "undefined") {
    window.localStorage.setItem(PARENT_NOTIFICATION_STORAGE_KEY, JSON.stringify(preferences));
  }

  return preferences;
}

export async function saveParentNotificationPreferences(preferences) {
  const normalizedPreferences = {
    ...getDefaultParentNotificationPreferences(),
    ...preferences,
    childId: getBackendUserId(),
    parentId: getParentId(),
    enableParentDashboard: preferences.enableParentDashboard ?? true,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      PARENT_NOTIFICATION_STORAGE_KEY,
      JSON.stringify(normalizedPreferences)
    );
  }

  await safeRun(async () => {
    await supabaseRequest("parent_child_links?on_conflict=child_id,parent_id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      body: {
        child_id: normalizedPreferences.childId,
        parent_id: normalizedPreferences.parentId,
        linked_at: new Date().toISOString(),
      },
    });

    return supabaseRequest("parent_notification_preferences?on_conflict=child_id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      body: {
        child_id: normalizedPreferences.childId,
        parent_id: normalizedPreferences.parentId,
        parent_email: normalizedPreferences.parentEmail,
        parent_whatsapp_number: normalizedPreferences.parentWhatsAppNumber,
        enable_email_alerts: normalizedPreferences.enableEmailAlerts,
        enable_whatsapp_alerts: normalizedPreferences.enableWhatsAppAlerts,
        enable_parent_dashboard: normalizedPreferences.enableParentDashboard,
        alert_on_app_opened: normalizedPreferences.alertOnAppOpened,
        alert_on_session_started: normalizedPreferences.alertOnSessionStarted,
        alert_on_session_completed: normalizedPreferences.alertOnSessionCompleted,
        alert_on_missed_session: normalizedPreferences.alertOnMissedSession,
        receive_daily_report: normalizedPreferences.receiveDailyReport,
        receive_weekly_report: normalizedPreferences.receiveWeeklyReport,
        updated_at: normalizedPreferences.updatedAt,
      },
    });
  });

  return normalizedPreferences;
}

const cacheActivityEvent = (event, pending = false) => {
  if (typeof window === "undefined") return;

  const events = safeParse(window.localStorage.getItem(CHILD_ACTIVITY_STORAGE_KEY), []);
  window.localStorage.setItem(CHILD_ACTIVITY_STORAGE_KEY, JSON.stringify([event, ...events].slice(0, 200)));
  if (pending) {
    const pendingEvents = safeParse(window.localStorage.getItem(PENDING_CHILD_ACTIVITY_STORAGE_KEY), []);
    window.localStorage.setItem(
      PENDING_CHILD_ACTIVITY_STORAGE_KEY,
      JSON.stringify([event, ...pendingEvents.filter((item) => item.id !== event.id)].slice(0, 300))
    );
  }
};

export function getCachedActivityEvents() {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(CHILD_ACTIVITY_STORAGE_KEY), []);
}

export function getParentDashboardInviteUrl() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("proTutorsHub_parentDashboardInviteUrl") || "";
}

export async function getOrCreateParentDashboardInvite(childName = "Student") {
  if (typeof window === "undefined") return null;

  const storageKey = "proTutorsHub_parentDashboardInviteToken";
  const existingToken = window.localStorage.getItem(storageKey);
  const inviteToken = existingToken ||
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `parent-link-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const parentId = getParentId();
  const childId = getBackendUserId();
  const inviteUrl = `${window.location.origin}${window.location.pathname}?parentLink=${encodeURIComponent(inviteToken)}`;

  window.localStorage.setItem(storageKey, inviteToken);
  window.localStorage.setItem("proTutorsHub_parentDashboardInviteUrl", inviteUrl);

  await safeRun(() =>
    supabaseRequest("parent_child_links?on_conflict=child_id,parent_id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      body: {
        child_id: childId,
        parent_id: parentId,
        child_name: childName,
        invite_token: inviteToken,
        linked_at: new Date().toISOString(),
      },
    })
  );

  return { inviteToken, inviteUrl, childId, parentId, childName };
}

export async function loadParentDashboardByInvite(inviteToken, limit = 100) {
  if (!inviteToken) return null;

  const link = await safeRun(async () => {
    const records = await supabaseRequest(
      `parent_child_links?invite_token=eq.${encodeURIComponent(inviteToken)}&select=*&limit=1`
    );
    return firstRecord(records);
  });
  if (!link) return null;

  const [events, liveStateRecords, sessions, timetableRecords, preferenceRecords, parentScheduleRecords, attemptRecords, profileRecords, studentProfileRecords] = await Promise.all([
    safeRun(() =>
      supabaseRequest(
        `child_activity_events?child_id=eq.${encodeURIComponent(link.child_id)}&select=*&order=event_timestamp.desc&limit=${limit}`
      )
    ),
    safeRun(() =>
      supabaseRequest(
        `child_live_activity_state?child_id=eq.${encodeURIComponent(link.child_id)}&select=*&limit=1`
      )
    ),
    safeRun(() =>
      supabaseRequest(
        `study_sessions?child_id=eq.${encodeURIComponent(link.child_id)}&select=*&order=last_active_at.desc&limit=20`
      )
    ),
    safeRun(() =>
      supabaseRequest(
        `parent_timetables?invite_token=eq.${encodeURIComponent(inviteToken)}&select=*&limit=1`
      )
    ),
    safeRun(() =>
      supabaseRequest(
        `parent_notification_preferences?child_id=eq.${encodeURIComponent(link.child_id)}&select=*&limit=1`
      )
    ),
    safeRun(() =>
      supabaseRequest(
        `parent_schedules?app_user_id=eq.${encodeURIComponent(link.child_id)}&select=schedule&limit=1`
      )
    ),
    safeRun(() =>
      supabaseRequest(
        `attempts?app_user_id=eq.${encodeURIComponent(link.child_id)}&select=attempt,completed_at&order=completed_at.desc&limit=200`
      )
    ),
    safeRun(() =>
      supabaseRequest(
        `user_profiles?app_user_id=eq.${encodeURIComponent(link.child_id)}&select=package_type,subscription_status,subscription_billing_cycle,subscription_started_at,subscription_expires_at&limit=1`
      )
    ),
    safeRun(() =>
      supabaseRequest(
        `student_profiles?or=(id.eq.${encodeURIComponent(link.child_id)},user_id.eq.${encodeURIComponent(link.child_id)})&select=student_first_name,student_last_name&limit=1`
      )
    ),
  ]);
  const timetableRecord = firstRecord(timetableRecords);
  const preferenceRecord = firstRecord(preferenceRecords);
  const liveStateRecord = firstRecord(liveStateRecords);
  const studentProfileName = getStudentProfileName(firstRecord(studentProfileRecords));
  const linkedChildName = isPlaceholderChildName(link.child_name) && studentProfileName
    ? studentProfileName
    : link.child_name;
  const liveStateEvent = liveStateRecord ? {
    id: `live-state-${liveStateRecord.child_id}`,
    childId: liveStateRecord.child_id,
    parentId: liveStateRecord.parent_id,
    eventType: liveStateRecord.current_event_type || "page_heartbeat",
    topics: liveStateRecord.topics || [],
    timestamp: liveStateRecord.last_seen_at || liveStateRecord.updated_at,
    duration: liveStateRecord.duration_seconds || 0,
    score: liveStateRecord.score,
    metadata: {
      ...(liveStateRecord.metadata || {}),
      childName: liveStateRecord.child_name,
      page: liveStateRecord.current_page,
      topic: liveStateRecord.current_topic,
      lesson: liveStateRecord.current_lesson,
      liveState: true,
    },
  } : null;

  return {
    link: {
      ...link,
      child_name: linkedChildName,
    },
    events: [
      ...(liveStateEvent ? [liveStateEvent] : []),
      ...(events || []).map((record) => ({
      id: record.id,
      childId: record.child_id,
      parentId: record.parent_id,
      eventType: record.event_type,
      topics: record.topics || [],
      timestamp: record.event_timestamp || record.occurred_at || record.created_at,
      duration: record.duration_seconds || 0,
      score: record.score,
      metadata: record.metadata || {},
      })),
    ],
    sessions: sessions || [],
    attempts: (attemptRecords || []).map((record) => record.attempt).filter(Boolean),
    childPackage: getActivePackage(firstRecord(profileRecords)),
    childSubscription: firstRecord(profileRecords) || null,
    timetable: timetableRecord?.timetable || [],
    reminderMinutes: timetableRecord?.reminder_minutes || 15,
    locked: Boolean(timetableRecord?.locked),
    preferences: preferenceRecord ? mapParentPreferencesRecord(preferenceRecord) : null,
    parentSchedule: firstRecord(parentScheduleRecords)?.schedule || null,
  };
}

function getActivePackage(profile) {
  if (!profile) return "free";
  if (
    profile.subscription_status === "active" &&
    profile.subscription_expires_at &&
    new Date(profile.subscription_expires_at).getTime() <= Date.now()
  ) {
    return "free";
  }
  return profile.package_type || "free";
}

export async function saveParentTimetable(inviteToken, timetable, reminderMinutes = 15, locked = false) {
  const dashboard = await loadParentDashboardByInvite(inviteToken, 1);
  if (!dashboard?.link) throw new Error("Parent dashboard link not found.");

  return safeRun(() =>
    supabaseRequest("parent_timetables?on_conflict=invite_token", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      body: {
        invite_token: inviteToken,
        child_id: dashboard.link.child_id,
        parent_id: dashboard.link.parent_id,
        timetable,
        reminder_minutes: Number(reminderMinutes) || 15,
        locked: Boolean(locked),
        updated_at: new Date().toISOString(),
      },
    })
  );
}

export async function saveParentControlsByInvite(inviteToken, parentSchedule = {}) {
  const dashboard = await loadParentDashboardByInvite(inviteToken, 1);
  if (!dashboard?.link) throw new Error("Parent dashboard link not found.");

  return safeRun(() =>
    supabaseRequest("parent_schedules?on_conflict=app_user_id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      body: {
        app_user_id: dashboard.link.child_id,
        schedule: {
          ...parentSchedule,
          updatedAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      },
    })
  );
}

export async function saveParentNotificationPreferencesByInvite(inviteToken, preferences = {}) {
  const dashboard = await loadParentDashboardByInvite(inviteToken, 1);
  if (!dashboard?.link) throw new Error("Parent dashboard link not found.");

  const normalizedPreferences = {
    ...getDefaultParentNotificationPreferences(),
    ...preferences,
    childId: dashboard.link.child_id,
    parentId: dashboard.link.parent_id || getParentId(),
    parentWhatsAppNumber: "",
    enableWhatsAppAlerts: false,
    enableParentDashboard: preferences.enableParentDashboard ?? true,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(PARENT_NOTIFICATION_STORAGE_KEY, JSON.stringify(normalizedPreferences));
  }

  return safeRun(() =>
    supabaseRequest("parent_notification_preferences?on_conflict=child_id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      body: {
        child_id: normalizedPreferences.childId,
        parent_id: normalizedPreferences.parentId,
        parent_email: normalizedPreferences.parentEmail,
        parent_whatsapp_number: "",
        enable_email_alerts: normalizedPreferences.enableEmailAlerts,
        enable_whatsapp_alerts: false,
        enable_parent_dashboard: normalizedPreferences.enableParentDashboard,
        alert_on_app_opened: normalizedPreferences.alertOnAppOpened,
        alert_on_session_started: normalizedPreferences.alertOnSessionStarted,
        alert_on_session_completed: normalizedPreferences.alertOnSessionCompleted,
        alert_on_missed_session: normalizedPreferences.alertOnMissedSession,
        receive_daily_report: normalizedPreferences.receiveDailyReport,
        receive_weekly_report: normalizedPreferences.receiveWeeklyReport,
        updated_at: normalizedPreferences.updatedAt,
      },
    })
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function canUsePushNotifications() {
  return Boolean(
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    VAPID_PUBLIC_KEY
  );
}

export async function saveParentPushSubscriptionByInvite(inviteToken) {
  if (!canUsePushNotifications()) {
    throw new Error("Push notifications are not available on this device yet.");
  }

  const dashboard = await loadParentDashboardByInvite(inviteToken, 1);
  if (!dashboard?.link) throw new Error("Parent dashboard link not found.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notifications were not allowed on this device.");
  }

  const registration = await navigator.serviceWorker.ready;
  const existingSubscription = await registration.pushManager.getSubscription();
  const subscription = existingSubscription || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
  const subscriptionJson = subscription.toJSON();

  await safeRun(() =>
    supabaseRequest("parent_push_subscriptions?on_conflict=endpoint", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      body: {
        child_id: dashboard.link.child_id,
        parent_id: dashboard.link.parent_id,
        invite_token: inviteToken,
        endpoint: subscription.endpoint,
        subscription: subscriptionJson,
        user_agent: navigator.userAgent,
        enabled: true,
        updated_at: new Date().toISOString(),
      },
    })
  );

  return subscriptionJson;
}

export async function loadParentTimetableForChild(childId = getBackendUserId()) {
  const links = await safeRun(() =>
    supabaseRequest(
      `parent_child_links?child_id=eq.${encodeURIComponent(childId)}&select=invite_token,child_name,parent_id&limit=1`
    )
  );
  const link = firstRecord(links);
  if (!link?.invite_token) return null;

  const timetableRecords = await safeRun(() =>
    supabaseRequest(
      `parent_timetables?invite_token=eq.${encodeURIComponent(link.invite_token)}&select=*&limit=1`
    )
  );
  const timetableRecord = firstRecord(timetableRecords);
  if (!timetableRecord) return null;

  return {
    link,
    timetable: timetableRecord.timetable || [],
    reminderMinutes: timetableRecord.reminder_minutes || 15,
    locked: Boolean(timetableRecord.locked),
    updatedAt: timetableRecord.updated_at,
  };
}

export function beginTrackedStudySession({ topics = [], childName = "Your child", sessionArea = "study" } = {}) {
  if (typeof window === "undefined") return null;

  const existingSession = safeParse(window.localStorage.getItem(ACTIVE_STUDY_SESSION_STORAGE_KEY), null);
  const now = new Date().toISOString();
  const session = {
    id: existingSession?.id ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `study-session-${Date.now()}-${Math.random().toString(16).slice(2)}`),
    topics: Array.isArray(topics) ? topics.filter(Boolean) : [],
    childName,
    sessionArea,
    status: "active",
    startedAt: existingSession?.startedAt || now,
    lastActiveAt: now,
    pausedAt: null,
    abandonedAt: null,
  };

  window.localStorage.setItem(ACTIVE_STUDY_SESSION_STORAGE_KEY, JSON.stringify(session));
  saveStudySession({
    ...session,
    metadata: { childName, sessionArea },
  });
  return session;
}

export function pauseActiveStudySession(reason = "left_app") {
  if (typeof window === "undefined") return null;

  const session = safeParse(window.localStorage.getItem(ACTIVE_STUDY_SESSION_STORAGE_KEY), null);
  if (!session || session.status === "abandoned") return session;

  const pausedSession = {
    ...session,
    status: "paused",
    pausedReason: reason,
    pausedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };

  window.localStorage.setItem(ACTIVE_STUDY_SESSION_STORAGE_KEY, JSON.stringify(pausedSession));
  saveStudySession({
    ...pausedSession,
    metadata: {
      childName: pausedSession.childName,
      sessionArea: pausedSession.sessionArea,
      pausedReason: reason,
    },
  });
  trackChildActivityEvent("session_paused", {
    topics: pausedSession.topics || [],
    metadata: {
      childName: pausedSession.childName,
      sessionArea: pausedSession.sessionArea,
      pausedReason: reason,
    },
  });
  return pausedSession;
}

export function resumeActiveStudySession() {
  if (typeof window === "undefined") return null;

  const session = safeParse(window.localStorage.getItem(ACTIVE_STUDY_SESSION_STORAGE_KEY), null);
  if (!session || session.status === "abandoned") return session;

  const resumedSession = {
    ...session,
    status: "active",
    lastActiveAt: new Date().toISOString(),
  };

  window.localStorage.setItem(ACTIVE_STUDY_SESSION_STORAGE_KEY, JSON.stringify(resumedSession));
  saveStudySession({
    ...resumedSession,
    metadata: {
      childName: resumedSession.childName,
      sessionArea: resumedSession.sessionArea,
    },
  });
  trackChildActivityEvent("session_resumed", {
    topics: resumedSession.topics || [],
    metadata: {
      childName: resumedSession.childName,
      sessionArea: resumedSession.sessionArea,
    },
  });
  return resumedSession;
}

export function updateActiveStudySessionHeartbeat() {
  if (typeof window === "undefined") return null;

  const session = safeParse(window.localStorage.getItem(ACTIVE_STUDY_SESSION_STORAGE_KEY), null);
  if (!session || session.status === "abandoned") return session;

  const activeSession = {
    ...session,
    status: "active",
    lastActiveAt: new Date().toISOString(),
  };

  window.localStorage.setItem(ACTIVE_STUDY_SESSION_STORAGE_KEY, JSON.stringify(activeSession));
  saveStudySession({
    ...activeSession,
    metadata: {
      childName: activeSession.childName,
      sessionArea: activeSession.sessionArea,
    },
  });

  return activeSession;
}

export function completeActiveStudySession({ duration = 0, score = null } = {}) {
  if (typeof window === "undefined") return null;

  const session = safeParse(window.localStorage.getItem(ACTIVE_STUDY_SESSION_STORAGE_KEY), null);
  if (!session) return null;

  const completedSession = {
    ...session,
    status: "completed",
    completedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    duration,
    score,
  };

  window.localStorage.setItem(ACTIVE_STUDY_SESSION_STORAGE_KEY, JSON.stringify(completedSession));
  saveStudySession({
    ...completedSession,
    metadata: {
      childName: completedSession.childName,
      sessionArea: completedSession.sessionArea,
    },
  });

  return completedSession;
}

export async function sendAbandonedStudySessionIfNeeded(childName = "Your child") {
  if (typeof window === "undefined") return null;

  const session = safeParse(window.localStorage.getItem(ACTIVE_STUDY_SESSION_STORAGE_KEY), null);
  if (!session || session.status !== "paused" || session.abandonedAt) return null;

  const pausedAt = new Date(session.pausedAt || session.lastActiveAt || session.startedAt);
  const awayMinutes = Math.floor((Date.now() - pausedAt.getTime()) / 60000);
  if (awayMinutes < ABANDONED_SESSION_MINUTES) return null;

  const abandonedSession = {
    ...session,
    status: "abandoned",
    abandonedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(ACTIVE_STUDY_SESSION_STORAGE_KEY, JSON.stringify(abandonedSession));

  return trackChildActivityEvent("session_abandoned", {
    topics: session.topics || [],
    metadata: {
      childName: session.childName || childName,
      awayMinutes,
      pausedReason: session.pausedReason || "left_app",
    },
  });
}

export async function trackChildActivityEvent(eventType, details = {}) {
  const preferences = getLocalParentNotificationPreferences();
  const event = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `event-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    childId: getBackendUserId(),
    parentId: preferences.parentId || getParentId(),
    eventType,
    topics: Array.isArray(details.topics) ? details.topics.filter(Boolean) : [],
    timestamp: new Date().toISOString(),
    duration: Number(details.duration) || 0,
    score: typeof details.score === "number" ? details.score : null,
    metadata: details.metadata || {},
  };

  cacheActivityEvent(event, true);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("proTutorsHub:childActivityEvent", { detail: event }));
  }

  const saved = await safeRun(() =>
    supabaseRequest("child_activity_events", {
      method: "POST",
      body: {
        app_user_id: event.childId,
        child_id: event.childId,
        parent_id: event.parentId,
        event_type: event.eventType,
        topics: event.topics,
        event_timestamp: event.timestamp,
        duration_seconds: event.duration,
        score: event.score,
        metadata: event.metadata,
      },
    })
  );
  await saveLiveActivityState(event);
  if (saved && typeof window !== "undefined") {
    const pendingEvents = safeParse(window.localStorage.getItem(PENDING_CHILD_ACTIVITY_STORAGE_KEY), []);
    window.localStorage.setItem(
      PENDING_CHILD_ACTIVITY_STORAGE_KEY,
      JSON.stringify(pendingEvents.filter((item) => item.id !== event.id))
    );
  }

  await queueParentAlertsForEvent(event);
  return event;
}

async function saveLiveActivityState(event) {
  const page = event.metadata?.page || event.metadata?.subject || event.metadata?.sessionArea || "";
  const topic = event.metadata?.topic || event.topics?.filter(Boolean).join(", ") || event.metadata?.title || "";
  const offline = ["logged_out", "session_abandoned"].includes(event.eventType);

  return safeRun(() =>
    supabaseRequest("child_live_activity_state?on_conflict=child_id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      body: {
        child_id: event.childId,
        parent_id: event.parentId,
        child_name: event.metadata?.childName || null,
        current_event_type: event.eventType,
        current_page: offline ? null : page || null,
        current_topic: offline ? null : topic || null,
        current_lesson: offline ? null : event.metadata?.lesson || null,
        topics: event.topics || [],
        duration_seconds: event.duration || 0,
        score: event.score,
        metadata: event.metadata || {},
        last_seen_at: event.timestamp,
        updated_at: new Date().toISOString(),
      },
    })
  );
}

export async function syncPendingChildActivityEvents() {
  if (typeof window === "undefined" || !isBackendConfigured()) return [];
  const pendingEvents = safeParse(window.localStorage.getItem(PENDING_CHILD_ACTIVITY_STORAGE_KEY), []);
  if (!pendingEvents.length) return [];
  const syncedIds = [];
  for (const event of pendingEvents) {
    const childId = event.childId || getBackendUserId();
    if (!childId) continue;
    const syncedEvent = { ...event, childId };
    const saved = await safeRun(() =>
      supabaseRequest("child_activity_events", {
        method: "POST",
        body: {
          app_user_id: childId,
          child_id: childId,
          parent_id: event.parentId,
          event_type: event.eventType,
          topics: event.topics || [],
          event_timestamp: event.timestamp,
          duration_seconds: event.duration || 0,
          score: event.score,
          metadata: event.metadata || {},
        },
      })
    );
    if (saved) syncedIds.push(event.id);
    if (saved) await saveLiveActivityState(syncedEvent);
  }
  if (syncedIds.length) {
    window.localStorage.setItem(
      PENDING_CHILD_ACTIVITY_STORAGE_KEY,
      JSON.stringify(pendingEvents.filter((event) => !syncedIds.includes(event.id)))
    );
  }
  return syncedIds;
}

async function queueParentAlertsForEvent(event) {
  const preferences = await loadParentNotificationPreferences();
  if (!preferences?.enableParentDashboard) return [];

  const eventPreferenceMap = {
    parent_lesson_reminder_due: "alertOnSessionStarted",
    parent_lesson_inactivity: "alertOnSessionAbandoned",
    session_missed: "alertOnMissedSession",
  };
  const preferenceKey = eventPreferenceMap[event.eventType];
  if (!preferenceKey || !preferences[preferenceKey]) return [];

  const eventLabel = getParentPushEventLabel(event.eventType);
  const topic = event.topics?.join(", ") || event.metadata?.topic || event.metadata?.title || "Mathematics";
  const childName = event.metadata?.childName || "Your child";
  const message = `${childName} ${eventLabel}${topic ? `: ${topic}` : ""}.`;

  const savedNotifications = await safeRun(() =>
    supabaseRequest("parent_alert_notifications?on_conflict=event_id,channel,recipient", {
      method: "POST",
      prefer: "resolution=ignore-duplicates,return=representation",
      body: {
        child_id: event.childId,
        parent_id: preferences.parentId || event.parentId,
        event_id: `${event.eventType}-${event.id}`,
        channel: "dashboard",
        recipient: preferences.parentId || event.parentId || event.childId,
        message,
        status: "visible",
        created_at: new Date().toISOString(),
      },
    })
  );

  const notifications = Array.isArray(savedNotifications) ? savedNotifications : [];
  if (!notifications.length) return [];

  return safeRun(() =>
    supabaseFunctionRequest("send-parent-alert", {
      body: {
        notifications,
      },
    })
  );
}

function getParentPushEventLabel(eventType) {
  if (eventType === "parent_lesson_reminder_due") return "has a scheduled lesson starting now";
  if (eventType === "parent_lesson_inactivity") return "has been inactive during a scheduled lesson";
  if (eventType === "session_missed") return "missed a scheduled session";
  return "has an important study update";
}

export async function loadChildActivityEvents(limit = 50) {
  const cachedEvents = getCachedActivityEvents();
  const records = await safeRun(() =>
    supabaseRequest(
      `child_activity_events?child_id=eq.${encodeURIComponent(getBackendUserId())}&select=*&order=event_timestamp.desc&limit=${limit}`
    )
  );

  if (!records) return cachedEvents.slice(0, limit);

  const backendEvents = records.map((record) => ({
    id: record.id,
    childId: record.child_id,
    parentId: record.parent_id,
    eventType: record.event_type,
    topics: record.topics || [],
    timestamp: record.event_timestamp || record.occurred_at || record.created_at,
    duration: record.duration_seconds || 0,
    score: record.score,
    metadata: record.metadata || {},
  }));
  const eventMap = new Map();
  [...backendEvents, ...cachedEvents].forEach((event) => {
    if (!event?.id) return;
    eventMap.set(event.id, event);
  });
  return [...eventMap.values()]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export async function saveStudySession(session) {
  const normalizedSession = {
    id: session.id || `session-${Date.now()}`,
    childId: getBackendUserId(),
    parentId: session.parentId || getParentId(),
    status: session.status || "started",
    topics: session.topics || [],
    startedAt: session.startedAt || new Date().toISOString(),
    lastActiveAt: session.lastActiveAt || new Date().toISOString(),
    abandonedAt: session.abandonedAt || null,
    abandonedAlertSent: Boolean(session.abandonedAlertSent),
    completedAt: session.completedAt || null,
    duration: Number(session.duration) || 0,
    score: typeof session.score === "number" ? session.score : null,
    metadata: session.metadata || {},
  };

  if (typeof window !== "undefined") {
    const sessions = safeParse(window.localStorage.getItem(STUDY_SESSIONS_STORAGE_KEY), []);
    window.localStorage.setItem(
      STUDY_SESSIONS_STORAGE_KEY,
      JSON.stringify([normalizedSession, ...sessions.filter((item) => item.id !== normalizedSession.id)].slice(0, 100))
    );
  }

  await safeRun(() =>
    supabaseRequest("study_sessions?on_conflict=session_id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      body: {
        session_id: normalizedSession.id,
        child_id: normalizedSession.childId,
        parent_id: normalizedSession.parentId,
        status: normalizedSession.status,
        topics: normalizedSession.topics,
        started_at: normalizedSession.startedAt,
        last_active_at: normalizedSession.lastActiveAt,
        abandoned_at: normalizedSession.abandonedAt,
        abandoned_alert_sent: normalizedSession.abandonedAlertSent,
        completed_at: normalizedSession.completedAt,
        duration_seconds: normalizedSession.duration,
        score: normalizedSession.score,
        metadata: normalizedSession.metadata,
      },
    })
  );

  return normalizedSession;
}

export function generateDailyReport(attempts = getAttempts(), events = getCachedActivityEvents()) {
  const today = new Date().toDateString();
  const todayAttempts = attempts.filter((attempt) => new Date(attempt.completedAt).toDateString() === today);
  const todayEvents = events.filter((event) => new Date(event.timestamp).toDateString() === today);
  const totalStudySeconds = todayEvents.reduce((sum, event) => sum + (Number(event.duration) || 0), 0);
  const topics = Array.from(new Set(todayEvents.flatMap((event) => event.topics || [])));

  return {
    date: today,
    completedSessions: todayEvents.filter((event) => event.eventType === "session_completed").length,
    topics,
    timeSpentMinutes: Math.round(totalStudySeconds / 60),
    scores: todayAttempts.map((attempt) => attempt.percentage),
    weakAreas: getWeakestTopics(3, attempts),
  };
}

export function generateWeeklyReport(attempts = getAttempts(), events = getCachedActivityEvents()) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyAttempts = attempts.filter((attempt) => new Date(attempt.completedAt).getTime() >= weekAgo);
  const weeklyEvents = events.filter((event) => new Date(event.timestamp).getTime() >= weekAgo);
  const statistics = calculateStatistics(weeklyAttempts);

  return {
    completedSessions: weeklyEvents.filter((event) => event.eventType === "session_completed").length,
    missedSessions: weeklyEvents.filter((event) => event.eventType === "session_missed").length,
    averageScore: statistics.averageScore,
    strongestTopics: statistics.topicMastery.slice(0, 3),
    weakTopics: getWeakestTopics(3, weeklyAttempts),
    mockReadiness: statistics.averageScore,
  };
}

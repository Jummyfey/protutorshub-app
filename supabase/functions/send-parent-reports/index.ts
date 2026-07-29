const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type TimetableRecord = {
  invite_token: string;
  child_id: string;
  parent_id?: string;
  timetable?: Array<{
    day: string;
    enabled?: boolean;
    topics?: string[];
    startTime?: string;
  }>;
};

type ParentPreferences = {
  child_id: string;
  parent_id?: string;
  parent_email?: string;
  enable_email_alerts?: boolean;
  enable_parent_dashboard?: boolean;
  receive_daily_report?: boolean;
  receive_weekly_report?: boolean;
};

type ChildEvent = {
  event_type: string;
  topics?: string[];
  event_timestamp?: string;
  duration_seconds?: number;
  score?: number;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Supabase service configuration is missing." }, 500);
  }

  const now = getLagosNow();
  const timetables = await fetchJson<TimetableRecord[]>("/rest/v1/parent_timetables?select=*");
  const sent = [];

  for (const timetable of timetables) {
    const preferences = await loadPreferences(timetable.child_id);
    if (!preferences) continue;

    const scheduledToday = isScheduledToday(timetable, now.weekday);
    if (scheduledToday && preferences.receive_daily_report && now.hour >= 19) {
      const eventId = `daily-report-${timetable.child_id}-${now.dateKey}`;
      if (!await notificationAlreadyExists(eventId)) {
        const events = await loadEventsSince(timetable.child_id, now.startOfDayIso);
        const message = buildDailyReportMessage(events, now.weekday);
        const notifications = await insertNotifications(timetable, preferences, eventId, message);
        await sendNotifications(notifications);
        sent.push({ type: "daily", childId: timetable.child_id, notifications: notifications.length });
      }
    }

    if (preferences.receive_weekly_report && now.weekday === "Sunday" && now.hour >= 18) {
      const eventId = `weekly-report-${timetable.child_id}-${now.weekKey}`;
      if (!await notificationAlreadyExists(eventId)) {
        const events = await loadEventsSince(timetable.child_id, now.weekStartIso);
        const message = buildWeeklyReportMessage(events);
        const notifications = await insertNotifications(timetable, preferences, eventId, message);
        await sendNotifications(notifications);
        sent.push({ type: "weekly", childId: timetable.child_id, notifications: notifications.length });
      }
    }
  }

  return jsonResponse({ checked: timetables.length, sent });
});

function getLagosNow() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  const lagosDate = `${value("year")}-${value("month")}-${value("day")}`;
  const startOfDayIso = new Date(`${lagosDate}T00:00:00+01:00`).toISOString();
  const weekStart = new Date(`${lagosDate}T00:00:00+01:00`);
  const dayOffset = weekStart.getUTCDay();
  weekStart.setUTCDate(weekStart.getUTCDate() - dayOffset);

  return {
    weekday: value("weekday"),
    dateKey: lagosDate,
    weekKey: weekStart.toISOString().slice(0, 10),
    hour: Number(value("hour")),
    startOfDayIso,
    weekStartIso: weekStart.toISOString(),
  };
}

function isScheduledToday(timetable: TimetableRecord, weekday: string) {
  return (timetable.timetable || []).some((row) => row.enabled !== false && row.day === weekday);
}

async function loadPreferences(childId: string) {
  const records = await fetchJson<ParentPreferences[]>(
    `/rest/v1/parent_notification_preferences?child_id=eq.${encodeURIComponent(childId)}&select=*&limit=1`
  );
  return records[0] || null;
}

async function loadEventsSince(childId: string, isoDate: string) {
  return fetchJson<ChildEvent[]>(
    `/rest/v1/child_activity_events?child_id=eq.${encodeURIComponent(childId)}&event_timestamp=gte.${encodeURIComponent(isoDate)}&select=*&order=event_timestamp.asc`
  );
}

async function notificationAlreadyExists(eventId: string) {
  const records = await fetchJson<unknown[]>(
    `/rest/v1/parent_alert_notifications?event_id=eq.${encodeURIComponent(eventId)}&select=id&limit=1`
  );
  return records.length > 0;
}

function buildDailyReportMessage(events: ChildEvent[], weekday: string) {
  const completed = events.filter((event) => event.event_type === "session_completed").length;
  const started = events.filter((event) => event.event_type === "session_started").length;
  const abandoned = events.filter((event) => event.event_type === "session_abandoned").length;
  const breaks = events.filter((event) => event.event_type === "session_paused").length;
  const minutes = Math.round(events.reduce((sum, event) => sum + (Number(event.duration_seconds) || 0), 0) / 60);
  const topics = Array.from(new Set(events.flatMap((event) => event.topics || []))).slice(0, 5);

  return `Daily scheduled study report for ${weekday}: ${started} session(s) started, ${breaks} break(s) taken, ${completed} completed, ${abandoned} abandoned, ${minutes} minutes tracked. Topics: ${topics.join(", ") || "No topic activity recorded"}.`;
}

function buildWeeklyReportMessage(events: ChildEvent[]) {
  const completed = events.filter((event) => event.event_type === "session_completed").length;
  const started = events.filter((event) => event.event_type === "session_started").length;
  const abandoned = events.filter((event) => event.event_type === "session_abandoned").length;
  const breaks = events.filter((event) => event.event_type === "session_paused").length;
  const reminders = events.filter((event) =>
    ["parent_lesson_reminder_due", "student_lesson_reminder_due", "study_reminder_due"].includes(event.event_type)
  ).length;
  const minutes = Math.round(events.reduce((sum, event) => sum + (Number(event.duration_seconds) || 0), 0) / 60);
  const scores = events.map((event) => event.score).filter((score) => typeof score === "number") as number[];
  const averageScore = scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : null;

  return `Weekly parent report: ${started} session(s) started, ${breaks} break(s) taken, ${completed} completed, ${abandoned} abandoned, ${reminders} reminder(s), ${minutes} minutes tracked.${averageScore === null ? "" : ` Average score: ${averageScore}%.`}`;
}

async function insertNotifications(
  timetable: TimetableRecord,
  preferences: ParentPreferences,
  eventId: string,
  message: string
) {
  const notifications = [];
  if (preferences.enable_email_alerts && preferences.parent_email) {
    notifications.push(makeNotification(timetable, preferences, eventId, "email", preferences.parent_email, message));
  }
  notifications.push(makeNotification(timetable, preferences, eventId, "dashboard", preferences.parent_id || timetable.parent_id || timetable.child_id, message));

  const savedNotifications = await fetchJson<Array<{ channel: string }>>(
    "/rest/v1/parent_alert_notifications?on_conflict=event_id,channel,recipient",
    {
    method: "POST",
    prefer: "resolution=ignore-duplicates,return=representation",
    body: notifications,
    }
  );

  return savedNotifications.filter((notification) => notification.channel === "email");
}

function makeNotification(
  timetable: TimetableRecord,
  preferences: ParentPreferences,
  eventId: string,
  channel: "email" | "dashboard",
  recipient: string,
  message: string
) {
  return {
    child_id: timetable.child_id,
    parent_id: preferences.parent_id || timetable.parent_id,
    event_id: eventId,
    channel,
    recipient,
    message,
    status: channel === "dashboard" ? "visible" : "pending",
    created_at: new Date().toISOString(),
  };
}

async function sendNotifications(notifications: unknown[]) {
  if (!notifications.length) return;

  await fetch(`${supabaseUrl}/functions/v1/send-parent-alert`, {
    method: "POST",
    headers: serviceHeaders(),
    body: JSON.stringify({ notifications }),
  });
}

async function fetchJson<T>(path: string, options: {
  method?: string;
  prefer?: string;
  body?: unknown;
} = {}): Promise<T> {
  const response = await fetch(`${supabaseUrl}${path}`, {
    method: options.method || "GET",
    headers: serviceHeaders(options.prefer),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  if (response.status === 204) return null as T;
  return response.json();
}

function serviceHeaders(prefer = "return=representation") {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    Prefer: prefer,
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

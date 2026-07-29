const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type StudySession = {
  session_id: string;
  child_id: string;
  parent_id?: string;
  status: string;
  topics?: string[];
  last_active_at: string;
  metadata?: {
    childName?: string;
    sessionArea?: string;
  };
};

type ParentTimetableRecord = {
  invite_token: string;
  child_id: string;
  parent_id?: string;
  timetable?: TimetableRow[];
};

type TimetableRow = {
  day: string;
  startTime?: string;
  duration?: number;
  topics?: string[];
  enabled?: boolean;
};

type ParentPreferences = {
  child_id: string;
  parent_id?: string;
  parent_email?: string;
  enable_email_alerts?: boolean;
  enable_parent_dashboard?: boolean;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const abandonAfterMinutes = Number(Deno.env.get("ABANDONED_SESSION_MINUTES") || 20);

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

  const cutoff = new Date(Date.now() - abandonAfterMinutes * 60 * 1000).toISOString();
  const sessions = await fetchJson<StudySession[]>(
    `/rest/v1/study_sessions?status=in.(active,paused)&abandoned_alert_sent=eq.false&last_active_at=lt.${encodeURIComponent(cutoff)}&select=*`
  );
  const results = [];

  for (const session of sessions) {
    const activeLesson = await getActiveScheduledLesson(session.child_id);
    if (!activeLesson) continue;

    const childName = session.metadata?.childName || "Your child";
    const awayMinutes = Math.max(
      abandonAfterMinutes,
      Math.floor((Date.now() - new Date(session.last_active_at).getTime()) / 60000)
    );
    const eventId = `parent-lesson-inactivity-${session.child_id}-${activeLesson.dateKey}-${activeLesson.row.day}-${activeLesson.row.startTime}-${new Date(session.last_active_at).getTime()}`;
    if (await notificationAlreadyExists(eventId)) continue;

    await insertActivityEvent(session, awayMinutes, childName, activeLesson.row);
    const notifications = await insertParentNotifications(session, activeLesson.record, activeLesson.row, eventId, awayMinutes, childName);
    if (notifications.length) {
      await fetch(`${supabaseUrl}/functions/v1/send-parent-alert`, {
        method: "POST",
        headers: serviceHeaders(),
        body: JSON.stringify({ notifications }),
      });
    }
    await markSessionAbandoned(session);

    results.push({
      sessionId: session.session_id,
      childId: session.child_id,
      notifications: notifications.length,
    });
  }

  return jsonResponse({ checked: sessions.length, abandoned: results });
});

async function insertActivityEvent(session: StudySession, awayMinutes: number, childName: string, row: TimetableRow) {
  await fetchJson("/rest/v1/child_activity_events", {
    method: "POST",
    body: {
      child_id: session.child_id,
      parent_id: session.parent_id,
      event_type: "parent_lesson_inactivity",
      topics: row.topics?.length ? row.topics : session.topics || [],
      event_timestamp: new Date().toISOString(),
      duration_seconds: 0,
      metadata: {
        childName,
        awayMinutes,
        audience: "parent",
        startTime: row.startTime,
        sessionArea: session.metadata?.sessionArea || "study",
        source: "server-check",
      },
    },
  });
}

async function getActiveScheduledLesson(childId: string) {
  const records = await fetchJson<ParentTimetableRecord[]>(
    `/rest/v1/parent_timetables?child_id=eq.${encodeURIComponent(childId)}&select=*&limit=1`
  );
  const record = records[0];
  if (!record) return null;

  const now = getLagosNow();
  const row = (record.timetable || []).find((item) => isWithinScheduledLesson(item, now));
  return row ? { record, row, dateKey: now.dateKey } : null;
}

function getLagosNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  const hour = Number(value("hour"));
  const minute = Number(value("minute"));

  return {
    weekday: value("weekday"),
    dateKey: `${value("year")}-${value("month")}-${value("day")}`,
    minutes: hour * 60 + minute,
  };
}

function isWithinScheduledLesson(row: TimetableRow, now: ReturnType<typeof getLagosNow>) {
  if (!row || row.enabled === false || row.day !== now.weekday || !row.startTime) return false;
  const [hours, minutes] = row.startTime.split(":").map(Number);
  const startMinutes = (hours || 0) * 60 + (minutes || 0);
  const endMinutes = startMinutes + Number(row.duration || 60);
  return now.minutes >= startMinutes && now.minutes <= endMinutes;
}

async function notificationAlreadyExists(eventId: string) {
  const records = await fetchJson<unknown[]>(
    `/rest/v1/parent_alert_notifications?event_id=eq.${encodeURIComponent(eventId)}&select=id&limit=1`
  );
  return records.length > 0;
}

async function loadPreferences(childId: string): Promise<ParentPreferences | null> {
  const records = await fetchJson<ParentPreferences[]>(
    `/rest/v1/parent_notification_preferences?child_id=eq.${encodeURIComponent(childId)}&select=*&limit=1`
  );
  return records[0] || null;
}

async function insertParentNotifications(
  session: StudySession,
  record: ParentTimetableRecord,
  row: TimetableRow,
  eventId: string,
  awayMinutes: number,
  childName: string
) {
  const preferences = await loadPreferences(session.child_id);
  if (!preferences?.enable_parent_dashboard) return [];

  const topics = row.topics?.length ? row.topics.join(" and ") : "study";
  const message = `${childName} has been inactive for ${awayMinutes} minutes during the scheduled ${topics} session.`;
  const notifications = [{
    child_id: session.child_id,
    parent_id: preferences.parent_id || record.parent_id || session.parent_id,
    event_id: eventId,
    channel: "dashboard",
    recipient: preferences.parent_id || record.parent_id || session.parent_id || session.child_id,
    message,
    status: "visible",
    created_at: new Date().toISOString(),
  }];

  if (preferences.enable_email_alerts && preferences.parent_email) {
    notifications.push({
      ...notifications[0],
      channel: "email",
      recipient: preferences.parent_email,
      status: "pending",
    });
  }

  return fetchJson<Array<{ channel: string }>>(
    "/rest/v1/parent_alert_notifications?on_conflict=event_id,channel,recipient",
    {
      method: "POST",
      prefer: "resolution=ignore-duplicates,return=representation",
      body: notifications,
    }
  );
}

async function markSessionAbandoned(session: StudySession) {
  await fetchJson(`/rest/v1/study_sessions?session_id=eq.${encodeURIComponent(session.session_id)}`, {
    method: "PATCH",
    prefer: "return=minimal",
    body: {
      status: "abandoned",
      abandoned_at: new Date().toISOString(),
      abandoned_alert_sent: true,
    },
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

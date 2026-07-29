const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ParentTimetableRecord = {
  invite_token: string;
  child_id: string;
  parent_id?: string;
  timetable?: TimetableRow[];
  reminder_minutes?: number;
};

type TimetableRow = {
  day: string;
  startTime?: string;
  topics?: string[];
  enabled?: boolean;
};

type ParentLink = {
  invite_token: string;
  child_id: string;
  parent_id?: string;
  child_name?: string;
};

type ParentPreferences = {
  child_id: string;
  parent_id?: string;
  parent_email?: string;
  enable_email_alerts?: boolean;
  enable_parent_dashboard?: boolean;
};

type StudyPlanRecord = {
  app_user_id: string;
  plan?: {
    studyDays?: string[];
    dayTopicSchedule?: Array<{
      day: string;
      topics?: string[];
      duration?: number;
      preferredStartTime?: string;
      reminderEnabled?: boolean;
      reminderLeadMinutes?: number;
    }>;
    reminderEnabled?: boolean;
    reminderLeadMinutes?: number;
  };
};

type UserProfile = {
  app_user_id: string;
  package_type?: string;
};

type StudentProfile = {
  user_id?: string;
  student_first_name?: string;
  student_last_name?: string;
  parent_email?: string;
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
  const timetables = await fetchJson<ParentTimetableRecord[]>(
    "/rest/v1/parent_timetables?select=*"
  );
  const studyPlans = await fetchJson<StudyPlanRecord[]>(
    "/rest/v1/study_plans?select=app_user_id,plan"
  );
  const sent = [];

  for (const record of timetables) {
    const reminderMinutes = Number(record.reminder_minutes) || 15;
    const rows = Array.isArray(record.timetable) ? record.timetable : [];
    const dueRows = rows.filter((row) => isReminderDue(row, now, reminderMinutes));

    for (const row of dueRows) {
      const eventId = `parent-lesson-start-${record.child_id}-${now.dateKey}-${row.day}-${row.startTime}`;
      if (await notificationAlreadyExists(eventId)) continue;

      const [preferences, link] = await Promise.all([
        loadPreferences(record.child_id),
        loadParentLink(record.invite_token),
      ]);
      const childName = link?.child_name || "Your child";
      const topics = row.topics?.length ? row.topics : ["today's study plan"];
      const message = `Lesson reminder: ${childName}'s scheduled ${topics.join(" and ")} session has begun.`;

      await insertActivityEvent(record, row, childName, reminderMinutes);
      const notifications = await insertNotifications(record, preferences, eventId, message);
      if (notifications.length) {
        await fetch(`${supabaseUrl}/functions/v1/send-parent-alert`, {
          method: "POST",
          headers: serviceHeaders(),
          body: JSON.stringify({ notifications }),
        });
      }

      sent.push({
        childId: record.child_id,
        time: row.startTime,
        topics,
        notifications: notifications.length,
      });
    }
  }

  for (const record of studyPlans) {
    const profile = await loadUserProfile(record.app_user_id);
    if (profile?.package_type !== "standard") continue;

    const student = await loadStudentProfile(record.app_user_id);
    if (!student?.parent_email) continue;

    const rows = normalizeStudyPlanRows(record);
    const dueRows = rows.filter((row) => isReminderDue(row, now, Number(row.reminderMinutes) || 5));
    for (const row of dueRows) {
      const eventId = `timetable-reminder-student-${record.app_user_id}-${now.dateKey}-${row.day}-${row.startTime}`;
      if (await notificationAlreadyExists(eventId)) continue;

      const childName = [student.student_first_name, student.student_last_name].filter(Boolean).join(" ") || "Your child";
      const topics = row.topics?.length ? row.topics : ["today's study plan"];
      const message = `Lesson reminder: ${childName} has ${topics.join(" and ")} at ${row.startTime}. Start with the Study Guide.`;
      const notifications = await insertStudentPlanNotifications(record, student, eventId, message);
      if (notifications.length) {
        await fetch(`${supabaseUrl}/functions/v1/send-parent-alert`, {
          method: "POST",
          headers: serviceHeaders(),
          body: JSON.stringify({ notifications }),
        });
      }

      sent.push({
        childId: record.app_user_id,
        time: row.startTime,
        topics,
        notifications: notifications.length,
        source: "student-study-plan",
      });
    }
  }

  return jsonResponse({ checked: timetables.length, sent });
});

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

function isReminderDue(row: TimetableRow, now: ReturnType<typeof getLagosNow>, reminderMinutes: number) {
  if (!row || row.enabled === false || row.day !== now.weekday || !row.startTime) return false;

  const [hours, minutes] = row.startTime.split(":").map(Number);
  const startMinutes = (hours || 0) * 60 + (minutes || 0);
  return now.minutes === startMinutes;
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

async function loadParentLink(inviteToken: string): Promise<ParentLink | null> {
  const records = await fetchJson<ParentLink[]>(
    `/rest/v1/parent_child_links?invite_token=eq.${encodeURIComponent(inviteToken)}&select=*&limit=1`
  );
  return records[0] || null;
}

async function loadUserProfile(appUserId: string): Promise<UserProfile | null> {
  const records = await fetchJson<UserProfile[]>(
    `/rest/v1/user_profiles?app_user_id=eq.${encodeURIComponent(appUserId)}&select=app_user_id,package_type&limit=1`
  );
  return records[0] || null;
}

async function loadStudentProfile(appUserId: string): Promise<StudentProfile | null> {
  const records = await fetchJson<StudentProfile[]>(
    `/rest/v1/student_profiles?user_id=eq.${encodeURIComponent(appUserId)}&select=user_id,student_first_name,student_last_name,parent_email&limit=1`
  );
  return records[0] || null;
}

function normalizeStudyPlanRows(record: StudyPlanRecord) {
  const plan = record.plan || {};
  const studyDays = Array.isArray(plan.studyDays) ? plan.studyDays : [];
  const rows = Array.isArray(plan.dayTopicSchedule) ? plan.dayTopicSchedule : [];

  return rows
    .filter((row) => studyDays.includes(row.day))
    .map((row) => ({
      day: row.day,
      startTime: row.preferredStartTime,
      topics: row.topics || [],
      enabled: row.reminderEnabled ?? plan.reminderEnabled ?? true,
      reminderMinutes: Number(row.reminderLeadMinutes ?? plan.reminderLeadMinutes ?? 5),
    }));
}

async function insertActivityEvent(
  record: ParentTimetableRecord,
  row: TimetableRow,
  childName: string,
  reminderMinutes: number
) {
  await fetchJson("/rest/v1/child_activity_events", {
    method: "POST",
    body: {
      child_id: record.child_id,
      parent_id: record.parent_id,
      event_type: "parent_lesson_reminder_due",
      topics: row.topics || [],
      event_timestamp: new Date().toISOString(),
      duration_seconds: 0,
      metadata: {
        childName,
        startTime: row.startTime,
        reminderMinutes,
        audience: "parent",
        source: "server-timetable",
      },
    },
  });
}

async function insertStudentPlanNotifications(
  record: StudyPlanRecord,
  student: StudentProfile,
  eventId: string,
  message: string
) {
  const notifications = [{
    child_id: record.app_user_id,
    parent_id: record.app_user_id,
    event_id: eventId,
    channel: "email",
    recipient: student.parent_email,
    message,
    status: "pending",
    created_at: new Date().toISOString(),
  }];

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

async function insertNotifications(
  record: ParentTimetableRecord,
  preferences: ParentPreferences | null,
  eventId: string,
  message: string
) {
  const notifications = [];
  if (preferences?.enable_email_alerts && preferences.parent_email) {
    notifications.push(makeNotification(record, preferences, eventId, "email", preferences.parent_email, message));
  }
  notifications.push(makeNotification(record, preferences, eventId, "dashboard", preferences?.parent_id || record.parent_id || record.child_id, message));

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
  record: ParentTimetableRecord,
  preferences: ParentPreferences | null,
  eventId: string,
  channel: "email" | "dashboard",
  recipient: string,
  message: string
) {
  return {
    child_id: record.child_id,
    parent_id: preferences?.parent_id || record.parent_id,
    event_id: eventId,
    channel,
    recipient,
    message,
    status: channel === "dashboard" ? "visible" : "pending",
    created_at: new Date().toISOString(),
  };
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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type UserProfile = {
  app_user_id: string;
  package_type: "free" | "standard" | "elite";
  subscription_status?: string;
  subscription_billing_cycle?: "monthly" | "yearly";
  subscription_started_at?: string;
  subscription_expires_at?: string;
  subscription_renewal_reminder_sent_at?: string;
  subscription_expired_email_sent_at?: string;
};

type StudentProfile = {
  user_id: string;
  student_first_name: string;
  student_last_name?: string;
  parent_email: string;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);
  if (!supabaseUrl || !serviceRoleKey) return jsonResponse({ error: "Subscription service is not configured." }, 500);

  const profiles = await fetchJson<UserProfile[]>(
    "/rest/v1/user_profiles?subscription_status=eq.active&package_type=neq.free&select=*"
  );
  const results = [];

  for (const profile of profiles) {
    const now = Date.now();
    const startedAt = profile.subscription_started_at ? new Date(profile.subscription_started_at).getTime() : 0;
    const expiresAt = profile.subscription_expires_at ? new Date(profile.subscription_expires_at).getTime() : 0;
    if (!startedAt || !expiresAt) continue;

    const cycle = profile.subscription_billing_cycle === "yearly" ? "yearly" : "monthly";
    const reminderAt = startedAt + (cycle === "yearly" ? 365 : 31) * 24 * 60 * 60 * 1000;
    const student = await loadStudentProfile(profile.app_user_id);

    if (now >= reminderAt && !profile.subscription_renewal_reminder_sent_at) {
      if (student?.parent_email) {
        await sendRenewalEmail(profile, student, cycle);
      }
      await patchUserProfile(profile.app_user_id, {
        subscription_renewal_reminder_sent_at: new Date().toISOString(),
      });
      results.push({ appUserId: profile.app_user_id, action: "renewal-reminder" });
    }

    if (now >= expiresAt) {
      if (student?.parent_email && !profile.subscription_expired_email_sent_at) {
        await sendExpiredEmail(profile, student);
      }
      await patchUserProfile(profile.app_user_id, {
        package_type: "free",
        subscription_status: "expired",
        subscription_expired_email_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      results.push({ appUserId: profile.app_user_id, action: "expired-to-free" });
    }
  }

  return jsonResponse({ checked: profiles.length, results });
});

async function loadStudentProfile(appUserId: string) {
  const records = await fetchJson<StudentProfile[]>(
    `/rest/v1/student_profiles?user_id=eq.${encodeURIComponent(appUserId)}&select=user_id,student_first_name,student_last_name,parent_email&limit=1`
  );
  return records[0] || null;
}

async function sendRenewalEmail(profile: UserProfile, student: StudentProfile, cycle: "monthly" | "yearly") {
  const studentName = [student.student_first_name, student.student_last_name].filter(Boolean).join(" ") || "your child";
  const packageName = profile.package_type === "elite" ? "Elite" : "Standard";
  const message = cycle === "yearly"
    ? `Dear Parent,\n\n${studentName}'s Pro Tutors Hub ${packageName} yearly subscription is approaching expiry. If it is not renewed within 7 days, premium access for both the student app and parent portal will be deactivated and the account will return to Free access.\n\nKind regards,\nThe Pro Tutors Hub Team`
    : `Dear Parent,\n\n${studentName}'s Pro Tutors Hub ${packageName} monthly subscription is approaching expiry. If it is not renewed, premium access for both the student app and parent portal will be deactivated and the account will return to Free access.\n\nKind regards,\nThe Pro Tutors Hub Team`;

  await sendEmail(student.parent_email, `Renew ${student.student_first_name}'s Pro Tutors Hub subscription`, message);
}

async function sendExpiredEmail(profile: UserProfile, student: StudentProfile) {
  const studentName = [student.student_first_name, student.student_last_name].filter(Boolean).join(" ") || "your child";
  const packageName = profile.package_type === "elite" ? "Elite" : "Standard";
  const message = `Dear Parent,\n\n${studentName}'s Pro Tutors Hub ${packageName} subscription has expired. Premium access has been deactivated for both the student app and parent portal, and the account has been returned to Free access.\n\nYou can renew from the account subscription page at any time.\n\nKind regards,\nThe Pro Tutors Hub Team`;
  await sendEmail(student.parent_email, `${student.student_first_name}'s Pro Tutors Hub subscription has expired`, message);
}

async function sendEmail(recipient: string, subject: string, message: string) {
  await fetch(`${supabaseUrl}/functions/v1/send-parent-alert`, {
    method: "POST",
    headers: serviceHeaders(),
    body: JSON.stringify({
      notifications: [{
        channel: "email",
        recipient,
        subject,
        message,
        html: `<p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>`,
      }],
    }),
  });
}

async function patchUserProfile(appUserId: string, body: Record<string, unknown>) {
  await fetchJson(`/rest/v1/user_profiles?app_user_id=eq.${encodeURIComponent(appUserId)}`, {
    method: "PATCH",
    body,
  });
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function fetchJson<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(`${supabaseUrl}${path}`, {
    method: options.method || "GET",
    headers: serviceHeaders(),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!response.ok) throw new Error(await response.text());
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
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
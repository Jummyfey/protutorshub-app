const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type StudentProfile = {
  id: string;
  user_id: string;
  username: string;
  student_first_name: string;
  student_last_name?: string;
  parent_email: string;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  try {
    const { username, origin } = await request.json();
    const normalizedUsername = String(username || "").trim().toLowerCase().replace(/\s+/g, "");
    if (!normalizedUsername) return jsonResponse({ error: "Student username is required." }, 400);
    if (!supabaseUrl || !serviceRoleKey) return jsonResponse({ error: "Reset service is not configured." }, 500);

    const profile = await loadStudentProfile(normalizedUsername);
    if (!profile) {
      return jsonResponse({ message: "If the account exists, a reset link will be sent to the parent email." });
    }

    const token = makeToken();
    const tokenHash = await sha256(token);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const appOrigin = sanitizeOrigin(origin) || "https://math.protutorshub.com";
    const resetUrl = `${appOrigin}/?resetToken=${encodeURIComponent(token)}`;
    const studentName = [profile.student_first_name, profile.student_last_name].filter(Boolean).join(" ") || profile.username;
    const message = [
      "Dear Parent,",
      "",
      `A password reset was requested for ${studentName}'s Pro Tutors Hub account.`,
      "",
      "For security, please use the link below within 30 minutes. The link can be used only once.",
      resetUrl,
      "",
      "If you did not request this reset, you can safely ignore this email. The current password will remain unchanged.",
      "",
      "Kind regards,",
      "The Pro Tutors Hub Team",
    ].join("\n");
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#24123a">
        <p>Dear Parent,</p>
        <p>A password reset was requested for <strong>${escapeHtml(studentName)}</strong>'s Pro Tutors Hub account.</p>
        <p>For security, please use this link within <strong>30 minutes</strong>. The link can be used only once.</p>
        <p><a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#f8d96c;color:#35145f;padding:12px 18px;border-radius:8px;font-weight:700;text-decoration:none">Reset Password</a></p>
        <p>If you did not request this reset, you can safely ignore this email. The current password will remain unchanged.</p>
        <p>Kind regards,<br />The Pro Tutors Hub Team</p>
      </div>
    `;

    await insertResetRequest(profile, tokenHash, expiresAt, message);
    await sendEmail(profile.parent_email, `Reset ${profile.student_first_name}'s Pro Tutors Hub password`, message, html);

    return jsonResponse({
      parentEmail: profile.parent_email,
      message: "A secure reset link has been sent to the parent email.",
    });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown reset error." }, 500);
  }
});

async function loadStudentProfile(username: string) {
  const records = await fetchJson<StudentProfile[]>(
    `/rest/v1/student_profiles?username=eq.${encodeURIComponent(username)}&select=*&limit=1`
  );
  return records[0] || null;
}

async function insertResetRequest(profile: StudentProfile, tokenHash: string, expiresAt: string, message: string) {
  await fetchJson("/rest/v1/student_password_recovery_requests", {
    method: "POST",
    body: {
      username: profile.username,
      user_id: profile.user_id || profile.id,
      parent_email: profile.parent_email,
      otp_code: "reset-link",
      reset_token_hash: tokenHash,
      expires_at: expiresAt,
      status: "pending_parent_reset",
      message,
    },
  });
}

async function sendEmail(recipient: string, subject: string, message: string, html: string) {
  await fetch(`${supabaseUrl}/functions/v1/send-parent-alert`, {
    method: "POST",
    headers: serviceHeaders(),
    body: JSON.stringify({
      notifications: [{ channel: "email", recipient, subject, message, html }],
    }),
  });
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function makeToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function sanitizeOrigin(origin: unknown) {
  const value = String(origin || "");
  return /^https?:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(value) ? value : "";
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
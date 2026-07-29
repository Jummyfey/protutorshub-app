const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ResetRequest = {
  id: string;
  username: string;
  user_id?: string;
  parent_email: string;
  expires_at: string;
  status: string;
  used_at?: string;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  try {
    const { token, password } = await request.json();
    const newPassword = String(password || "");
    if (!token || String(token).length < 40) return jsonResponse({ error: "Invalid reset link." }, 400);
    if (newPassword.length < 6) return jsonResponse({ error: "Password should be at least 6 characters." }, 400);
    if (!supabaseUrl || !serviceRoleKey) return jsonResponse({ error: "Reset service is not configured." }, 500);

    const tokenHash = await sha256(String(token));
    const resetRequest = await loadResetRequest(tokenHash);
    if (!resetRequest) return jsonResponse({ error: "This reset link is invalid or has already been used." }, 400);
    if (new Date(resetRequest.expires_at).getTime() <= Date.now()) {
      await markResetRequest(resetRequest.id, "expired");
      return jsonResponse({ error: "This reset link has expired. Please request a new one." }, 400);
    }

    const salt = makeToken();
    const passwordHash = await sha256(`${salt}:${newPassword}`);
    await updatePassword(resetRequest, salt, passwordHash);
    await markResetRequest(resetRequest.id, "used");

    return jsonResponse({ message: "Password reset successfully. You can now log in with the new password." });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown reset error." }, 500);
  }
});

async function loadResetRequest(tokenHash: string) {
  const records = await fetchJson<ResetRequest[]>(
    `/rest/v1/student_password_recovery_requests?reset_token_hash=eq.${encodeURIComponent(tokenHash)}&status=eq.pending_parent_reset&used_at=is.null&select=*&limit=1`
  );
  return records[0] || null;
}

async function updatePassword(resetRequest: ResetRequest, salt: string, passwordHash: string) {
  const filter = resetRequest.user_id
    ? `user_id=eq.${encodeURIComponent(resetRequest.user_id)}`
    : `username=eq.${encodeURIComponent(resetRequest.username)}`;
  await fetchJson(`/rest/v1/student_profiles?${filter}`, {
    method: "PATCH",
    body: {
      password_salt: salt,
      password_hash: passwordHash,
      updated_at: new Date().toISOString(),
    },
  });
}

async function markResetRequest(id: string, status: "used" | "expired") {
  await fetchJson(`/rest/v1/student_password_recovery_requests?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: {
      status: status === "used" ? "completed" : "expired",
      used_at: status === "used" ? new Date().toISOString() : null,
      verified_at: new Date().toISOString(),
    },
  });
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function makeToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
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
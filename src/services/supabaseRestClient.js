const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function isBackendConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export async function supabaseRequest(path, options = {}) {
  if (!isBackendConfigured()) return null;

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${detail}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function supabaseFunctionRequest(functionName, options = {}) {
  if (!isBackendConfigured()) return null;

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: options.method || "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase function failed (${response.status}): ${detail}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export function getSupabasePublicStorageUrl(bucket, objectPath) {
  if (!isBackendConfigured() || !bucket || !objectPath) return "";
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${objectPath}`;
}

export async function supabaseStorageUpload(bucket, objectPath, file, options = {}) {
  if (!isBackendConfigured()) return null;

  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${objectPath}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": options.contentType || file?.type || "application/octet-stream",
      "x-upsert": "true",
      ...(options.headers || {}),
    },
    body: file,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase storage upload failed (${response.status}): ${detail}`);
  }

  return {
    ...(response.status === 200 ? await response.json().catch(() => ({})) : {}),
    publicUrl: getSupabasePublicStorageUrl(bucket, objectPath),
  };
}

export function getBackendUserId() {
  if (typeof window === "undefined") return "server-user";

  const key = "proTutorsHub_backendUserId";
  const existingId = window.localStorage.getItem(key);
  if (existingId) return existingId;

  const generatedId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(key, generatedId);
  return generatedId;
}

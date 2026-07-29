import { getBackendUserId, supabaseFunctionRequest, supabaseRequest } from "./supabaseRestClient";

export const STUDENT_SESSION_STORAGE_KEY = "proTutorsHub_studentSession";
export const KNOWN_STUDENT_STORAGE_KEY = "proTutorsHub_knownStudentUsername";
const LOCAL_STUDENT_PROFILE_KEY = "proTutorsHub_studentProfileFallback";

const SESSION_DAYS = 30;

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());

const normalizeUsername = (username) =>
  String(username || "").trim().toLowerCase().replace(/\s+/g, "");

export const normalizeStudentUsername = normalizeUsername;

const hashPassword = async (password, salt) => {
  const payload = `${salt}:${password}`;

  if (crypto?.subtle) {
    const encoded = new TextEncoder().encode(payload);
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  let hash = 0;
  for (let index = 0; index < payload.length; index += 1) {
    hash = (hash << 5) - hash + payload.charCodeAt(index);
    hash |= 0;
  }
  return String(hash);
};

const makeSalt = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `salt-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const firstRecord = (records) => (Array.isArray(records) && records.length ? records[0] : null);

const toStudentProfile = (record) => ({
  id: record.id || record.user_id || getBackendUserId(),
  userId: record.user_id || record.id || getBackendUserId(),
  studentFirstName: record.student_first_name,
  studentLastName: record.student_last_name || "",
  age: record.age,
  username: record.username,
  parentEmail: record.parent_email,
  parentWhatsAppNumber: record.parent_whatsapp_number || "",
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

const saveLocalProfileFallback = (profile) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_STUDENT_PROFILE_KEY, JSON.stringify(profile));
};

const getLocalProfileFallback = (username) => {
  if (typeof window === "undefined") return null;
  const profile = safeParse(window.localStorage.getItem(LOCAL_STUDENT_PROFILE_KEY), null);
  if (!profile) return null;
  return normalizeUsername(profile.username) === normalizeUsername(username) ? profile : null;
};

export function getCurrentStudentSession() {
  if (typeof window === "undefined") return null;

  const session = safeParse(window.localStorage.getItem(STUDENT_SESSION_STORAGE_KEY), null);
  if (!session?.expiresAt || new Date(session.expiresAt).getTime() <= Date.now()) {
    window.localStorage.removeItem(STUDENT_SESSION_STORAGE_KEY);
    return null;
  }

  return session;
}

export function hasKnownStudentAccount() {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem(KNOWN_STUDENT_STORAGE_KEY));
}

export function clearStudentSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STUDENT_SESSION_STORAGE_KEY);
}

const saveStudentSession = (profile) => {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const session = {
    studentId: profile.userId || profile.id,
    username: profile.username,
    studentFirstName: profile.studentFirstName,
    studentLastName: profile.studentLastName || "",
    parentEmail: profile.parentEmail,
    expiresAt,
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STUDENT_SESSION_STORAGE_KEY, JSON.stringify(session));
    window.localStorage.setItem(KNOWN_STUDENT_STORAGE_KEY, profile.username);
  }

  return session;
};

export async function createStudentAccount(form) {
  const studentFirstName = String(form.studentFirstName || "").trim();
  const studentLastName = String(form.studentLastName || "").trim();
  const username = normalizeUsername(form.username);
  const password = String(form.password || "");
  const parentEmail = String(form.parentEmail || "").trim().toLowerCase();
  const parentWhatsAppNumber = String(form.parentWhatsAppNumber || "").trim();
  const age = Number(form.age);

  if (!studentFirstName) throw new Error("Please enter the student's first name.");
  if (!studentLastName) throw new Error("Please enter the student's last name.");
  if (!age || age < 3 || age > 20) throw new Error("Please enter a valid age.");
  if (username.length < 3) throw new Error("Username should be at least 3 characters.");
  if (password.length < 6) throw new Error("Password should be at least 6 characters.");
  if (!isValidEmail(parentEmail)) throw new Error("Please enter a valid parent email.");

  const existing = await findStudentProfile(username);
  if (existing) {
    const suggestions = generateUsernameSuggestions(studentFirstName, studentLastName, age, username);
    const error = new Error("That username is already taken. Please choose another one.");
    error.code = "USERNAME_TAKEN";
    error.suggestions = suggestions;
    throw error;
  }

  const salt = makeSalt();
  const passwordHash = await hashPassword(password, salt);
  const now = new Date().toISOString();
  const profileRecord = {
    id: getBackendUserId(),
    user_id: getBackendUserId(),
    student_first_name: studentFirstName,
    student_last_name: studentLastName,
    age,
    username,
    parent_email: parentEmail,
    parent_whatsapp_number: parentWhatsAppNumber,
    password_salt: salt,
    password_hash: passwordHash,
    created_at: now,
    updated_at: now,
  };

  await supabaseRequest("student_profiles?on_conflict=username", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=representation",
    body: profileRecord,
  });

  saveLocalProfileFallback(profileRecord);
  const profile = toStudentProfile(profileRecord);
  const session = saveStudentSession(profile);
  await sendSignupWelcomeEmail(profile);

  return { profile, session };
}

async function sendSignupWelcomeEmail(profile) {
  if (!profile?.parentEmail) return null;

  const studentName = [profile.studentFirstName, profile.studentLastName].filter(Boolean).join(" ") || "your child";
  const subject = `Welcome to Pro Tutors Hub, ${profile.studentFirstName}'s parent`;
  const message = [
    `Dear Parent,`,
    ``,
    `Welcome to Pro Tutors Hub. ${studentName}'s mathematics learning account has been created successfully.`,
    ``,
    `With this account, ${profile.studentFirstName} can study Common Entrance mathematics topics, practise by topic, take mock exams, and build a clear record of results, statistics, progress and success readiness.`,
    ``,
    `You can use the parent tools to monitor progress, manage the timetable, receive lesson reminders, and review daily or weekly reports based on the options you choose.`,
    ``,
    `Student username: ${profile.username}`,
    ``,
    `Thank you for trusting Pro Tutors Hub to support ${profile.studentFirstName}'s preparation.`,
    ``,
    `Kind regards,`,
    `The Pro Tutors Hub Team`,
  ].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#24123a">
      <p>Dear Parent,</p>
      <p>Welcome to <strong>Pro Tutors Hub</strong>. ${escapeHtml(studentName)}'s mathematics learning account has been created successfully.</p>
      <p>With this account, ${escapeHtml(profile.studentFirstName)} can study Common Entrance mathematics topics, practise by topic, take mock exams, and build a clear record of results, statistics, progress and success readiness.</p>
      <p>You can use the parent tools to monitor progress, manage the timetable, receive lesson reminders, and review daily or weekly reports based on the options you choose.</p>
      <p><strong>Student username:</strong> ${escapeHtml(profile.username)}</p>
      <p>Thank you for trusting Pro Tutors Hub to support ${escapeHtml(profile.studentFirstName)}'s preparation.</p>
      <p>Kind regards,<br />The Pro Tutors Hub Team</p>
    </div>
  `;

  try {
    return await supabaseFunctionRequest("send-parent-alert", {
      body: {
        notifications: [
          {
            channel: "email",
            recipient: profile.parentEmail,
            subject,
            message,
            html,
          },
        ],
      },
    });
  } catch (error) {
    console.warn(error.message);
    return null;
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function generateUsernameSuggestions(firstName, lastName, age, currentUsername = "") {
  const first = normalizeUsername(firstName).replace(/[^a-z0-9]/g, "");
  const last = normalizeUsername(lastName).replace(/[^a-z0-9]/g, "");
  const ageText = String(age || "").replace(/\D/g, "");
  const randomTwoDigits = String(Math.floor(10 + Math.random() * 90));
  const base = first || "student";
  const candidates = [
    `${base}${last}${ageText}`,
    `${base}${ageText}${randomTwoDigits}`,
    `${base}${last.slice(0, 1)}${ageText}`,
    `${base}${Date.now().toString().slice(-4)}`,
  ]
    .map(normalizeUsername)
    .filter((item) => item && item !== currentUsername);

  return Array.from(new Set(candidates)).slice(0, 3);
}

async function findStudentProfile(username) {
  const normalizedUsername = normalizeUsername(username);
  const localProfile = getLocalProfileFallback(normalizedUsername);

  const records = await supabaseRequest(
    `student_profiles?username=eq.${encodeURIComponent(normalizedUsername)}&select=*&limit=1`
  );

  return firstRecord(records) || localProfile;
}

export async function loginStudent(form) {
  const username = normalizeUsername(form.username);
  const password = String(form.password || "");

  if (!username || !password) throw new Error("Please enter username and password.");

  const profileRecord = await findStudentProfile(username);
  if (!profileRecord) throw new Error("We could not find that student account.");

  const passwordHash = await hashPassword(password, profileRecord.password_salt);
  if (passwordHash !== profileRecord.password_hash) {
    throw new Error("The password is not correct.");
  }

  const profile = toStudentProfile(profileRecord);
  const session = saveStudentSession(profile);
  return { profile, session };
}

export async function requestParentPasswordReset(username) {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) throw new Error("Please enter the student username.");

  const result = await supabaseFunctionRequest("request-password-reset", {
    body: {
      username: normalizedUsername,
      origin: typeof window !== "undefined" ? window.location.origin : "https://math.protutorshub.com",
    },
  });

  return result || {
    parentEmail: "",
    message: "If the account exists, a reset link will be sent to the parent email.",
  };
}

export async function completeParentPasswordReset(token, password) {
  const result = await supabaseFunctionRequest("complete-password-reset", {
    body: { token, password },
  });

  return result || { message: "Password reset successfully." };
}
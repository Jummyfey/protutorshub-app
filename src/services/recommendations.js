import { supabaseFunctionRequest } from "./supabaseRestClient";

const OWNER_EMAIL = "info@protutorshub.com";

export async function sendOwnerRecommendation({
  name,
  role,
  email,
  message,
  pageContext,
}) {
  const cleanMessage = String(message || "").trim();
  if (cleanMessage.length < 10) {
    throw new Error("Please enter a recommendation with at least 10 characters.");
  }

  const senderName = String(name || "App user").trim();
  const senderRole = String(role || "User").trim();
  const senderEmail = String(email || "").trim();
  const context = String(pageContext || "General").trim();
  const subject = `Pro Tutors Hub recommendation from ${senderRole}`;
  const text = [
    `New Pro Tutors Hub recommendation`,
    ``,
    `From: ${senderName}`,
    `Role: ${senderRole}`,
    senderEmail ? `Email: ${senderEmail}` : null,
    `Context: ${context}`,
    ``,
    cleanMessage,
  ].filter(Boolean).join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#24123a">
      <h2>New Pro Tutors Hub recommendation</h2>
      <p><strong>From:</strong> ${escapeHtml(senderName)}</p>
      <p><strong>Role:</strong> ${escapeHtml(senderRole)}</p>
      ${senderEmail ? `<p><strong>Email:</strong> ${escapeHtml(senderEmail)}</p>` : ""}
      <p><strong>Context:</strong> ${escapeHtml(context)}</p>
      <p>${escapeHtml(cleanMessage).replace(/\n/g, "<br />")}</p>
    </div>
  `;

  const result = await supabaseFunctionRequest("send-parent-alert", {
    body: {
      notifications: [
        {
          channel: "email",
          recipient: OWNER_EMAIL,
          subject,
          message: text,
          html,
        },
      ],
    },
  });

  if (!result) {
    throw new Error("Recommendation sending is not configured yet.");
  }

  return result;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
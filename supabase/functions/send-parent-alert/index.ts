import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ParentNotification = {
  id?: string;
  child_id?: string;
  parent_id?: string;
  event_id?: string;
  channel: "email" | "whatsapp" | "dashboard";
  recipient?: string;
  subject?: string;
  message: string;
  html?: string;
};

type PushSubscriptionRecord = {
  id: string;
  child_id: string;
  parent_id?: string;
  invite_token?: string;
  endpoint: string;
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
};

type SendResult = {
  id?: string;
  channel: string;
  recipient?: string;
  status: "sent" | "failed" | "skipped";
  detail?: string;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "";
const whatsappAccessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN") || "";
const whatsappPhoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") || "";
const whatsappTemplateName = Deno.env.get("WHATSAPP_TEMPLATE_NAME") || "";
const whatsappTemplateLanguage = Deno.env.get("WHATSAPP_TEMPLATE_LANGUAGE") || "en";
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:info@protutorshub.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await request.json();
    const notifications: ParentNotification[] = Array.isArray(body.notifications)
      ? body.notifications
      : [];

    const results: SendResult[] = [];
    for (const notification of notifications) {
      if (notification.channel === "email") {
        results.push(await sendEmailAlert(notification));
      } else if (notification.channel === "whatsapp") {
        results.push(await sendWhatsAppAlert(notification));
      } else if (notification.channel === "dashboard") {
        results.push(await sendDashboardPushAlert(notification));
      } else {
        results.push({
          id: notification.id,
          channel: notification.channel,
          recipient: notification.recipient,
          status: "skipped",
          detail: "Dashboard notifications are shown inside the app.",
        });
      }
    }

    return jsonResponse({ results });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

async function sendEmailAlert(notification: ParentNotification): Promise<SendResult> {
  if (!notification.recipient) {
    return finishNotification(notification, "failed", "No email address was provided.");
  }

  if (isChildStudyEmail(notification) && !isAllowedParentStudyEmail(notification)) {
    return finishNotification(notification, "skipped", "Child study emails are limited to timetable reminders and daily summaries.");
  }

  if (isScheduledParentEmail(notification)) {
    const existingStatus = notification.id ? await getNotificationStatus(notification.id) : "";
    if (existingStatus && existingStatus !== "pending") {
      return finishNotification(notification, "skipped", "Scheduled email was already processed.");
    }
  }

  if (isDailyScheduledParentEmail(notification)) {
    const sentToday = await countScheduledEmailsSentToday(notification);
    if (sentToday >= 2) {
      return finishNotification(notification, "skipped", "Daily scheduled email limit reached.");
    }
  }

  if (!resendApiKey || !resendFromEmail) {
    return finishNotification(notification, "failed", "Email sender is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [notification.recipient],
      subject: notification.subject || "Pro Tutors Hub Study Alert",
      text: notification.message,
      html: notification.html || `<p>${escapeHtml(notification.message)}</p>`,
    }),
  });

  if (!response.ok) {
    return finishNotification(notification, "failed", await response.text());
  }

  return finishNotification(notification, "sent", "Email alert sent.");
}

function isChildStudyEmail(notification: ParentNotification) {
  return notification.channel === "email" && Boolean(notification.child_id || notification.event_id);
}

function isAllowedParentStudyEmail(notification: ParentNotification) {
  if (notification.channel !== "email" || !notification.event_id) return false;
  return /^(timetable-reminder|parent-lesson-start|parent-lesson-inactivity|daily-report|weekly-report)-/.test(notification.event_id);
}

function isScheduledParentEmail(notification: ParentNotification) {
  if (notification.channel !== "email" || !notification.child_id || !notification.recipient || !notification.event_id) {
    return false;
  }

  return isAllowedParentStudyEmail(notification);
}

function isDailyScheduledParentEmail(notification: ParentNotification) {
  if (notification.channel !== "email" || !notification.child_id || !notification.recipient || !notification.event_id) {
    return false;
  }

  return /^(timetable-reminder|parent-lesson-start|parent-lesson-inactivity|daily-report)-/.test(notification.event_id);
}

async function getNotificationStatus(id: string) {
  if (!supabaseUrl || !serviceRoleKey) return "";

  const rows = await fetchJson<Array<{ status?: string }>>(
    `/rest/v1/parent_alert_notifications?id=eq.${encodeURIComponent(id)}&select=status&limit=1`
  );
  return rows[0]?.status || "";
}

async function countScheduledEmailsSentToday(notification: ParentNotification) {
  if (!supabaseUrl || !serviceRoleKey || !notification.child_id || !notification.recipient) return 0;

  const startOfDayIso = getLagosStartOfDayIso();
  const rows = await fetchJson<Array<{ id: string }>>(
    `/rest/v1/parent_alert_notifications?child_id=eq.${encodeURIComponent(notification.child_id)}&channel=eq.email&recipient=eq.${encodeURIComponent(notification.recipient)}&status=eq.sent&created_at=gte.${encodeURIComponent(startOfDayIso)}&or=(event_id.like.timetable-reminder-*,event_id.like.parent-lesson-start-*,event_id.like.parent-lesson-inactivity-*,event_id.like.daily-report-*)&select=id`
  );

  return rows.length;
}

function getLagosStartOfDayIso() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return new Date(`${value("year")}-${value("month")}-${value("day")}T00:00:00+01:00`).toISOString();
}

async function sendDashboardPushAlert(notification: ParentNotification): Promise<SendResult> {
  if (!notification.child_id) {
    return finishNotification(notification, "skipped", "Dashboard alert saved. No child profile was attached for phone push.");
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return finishNotification(notification, "skipped", "Dashboard alert saved. Phone notifications are not configured yet.");
  }

  const parentFilter = notification.parent_id
    ? `&parent_id=eq.${encodeURIComponent(notification.parent_id)}`
    : "";
  const subscriptions = await fetchJson<PushSubscriptionRecord[]>(
    `/rest/v1/parent_push_subscriptions?child_id=eq.${encodeURIComponent(notification.child_id)}${parentFilter}&enabled=eq.true&select=*`
  );

  if (!subscriptions.length) {
    return finishNotification(notification, "skipped", "Dashboard alert saved. No parent device has enabled phone notifications yet.");
  }

  let sentCount = 0;
  let lastDetail = "";
  for (const record of subscriptions) {
    try {
      await webpush.sendNotification(record.subscription, JSON.stringify({
        title: "Pro Tutors Hub Parent Alert",
        body: notification.message,
        url: record.invite_token
          ? `https://math.protutorshub.com/?parentLink=${encodeURIComponent(record.invite_token)}`
          : "https://math.protutorshub.com/",
      }));
      sentCount += 1;
    } catch (error) {
      lastDetail = error instanceof Error ? error.message : "Push delivery failed.";
      await disablePushSubscription(record.endpoint);
    }
  }

  return finishNotification(
    notification,
    sentCount > 0 ? "sent" : "failed",
    sentCount > 0 ? `Phone notification sent to ${sentCount} device(s).` : lastDetail || "Push delivery failed."
  );
}

async function sendWhatsAppAlert(notification: ParentNotification): Promise<SendResult> {
  if (!notification.recipient) {
    return finishNotification(notification, "failed", "No WhatsApp number was provided.");
  }

  if (!whatsappAccessToken || !whatsappPhoneNumberId) {
    return finishNotification(notification, "failed", "WhatsApp sender is not configured.");
  }

  const to = notification.recipient.replace(/\D/g, "");
  const payload = whatsappTemplateName
    ? {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: whatsappTemplateName,
          language: { code: whatsappTemplateLanguage },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: notification.message }],
            },
          ],
        },
      }
    : {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: {
          preview_url: false,
          body: notification.message,
        },
      };

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${whatsappPhoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${whatsappAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    return finishNotification(notification, "failed", await response.text());
  }

  return finishNotification(notification, "sent", "WhatsApp alert sent.");
}

async function finishNotification(
  notification: ParentNotification,
  status: "sent" | "failed" | "skipped",
  detail: string
): Promise<SendResult> {
  if (notification.id && supabaseUrl && serviceRoleKey) {
    await fetch(`${supabaseUrl}/rest/v1/parent_alert_notifications?id=eq.${notification.id}`, {
      method: "PATCH",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        status,
        sent_at: status === "sent" ? new Date().toISOString() : null,
        provider_response: { detail },
      }),
    });
  }

  return {
    id: notification.id,
    channel: notification.channel,
    recipient: notification.recipient,
    status,
    detail,
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

async function disablePushSubscription(endpoint: string) {
  if (!supabaseUrl || !serviceRoleKey) return;

  await fetch(`${supabaseUrl}/rest/v1/parent_push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, {
    method: "PATCH",
    headers: serviceHeaders("return=minimal"),
    body: JSON.stringify({
      enabled: false,
      updated_at: new Date().toISOString(),
    }),
  });
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

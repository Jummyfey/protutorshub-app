import {
  getBackendUserId,
  isBackendConfigured,
  supabaseFunctionRequest,
  supabaseRequest,
} from "./supabaseRestClient";

const safeRun = async (operation) => {
  if (!isBackendConfigured()) return null;

  try {
    return await operation();
  } catch (error) {
    console.warn(error.message);
    return null;
  }
};

const firstRecord = (records) => (Array.isArray(records) && records.length ? records[0] : null);

async function ensureBackendProfile(packageType = "free") {
  return supabaseRequest("user_profiles?on_conflict=app_user_id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=representation",
    body: {
      app_user_id: getBackendUserId(),
      package_type: packageType,
      updated_at: new Date().toISOString(),
    },
  });
}

export function backendAvailable() {
  return isBackendConfigured();
}

export async function syncUserPackageToBackend(packageType) {
  return safeRun(() => ensureBackendProfile(packageType));
}

export async function verifyFlutterwaveSubscriptionPayment(payment) {
  return safeRun(() =>
    supabaseFunctionRequest("verify-flutterwave-payment", {
      body: {
        ...payment,
        appUserId: getBackendUserId(),
      },
    })
  );
}

export async function verifyFlutterwaveSubscriptionPaymentForUser(appUserId, payment) {
  return safeRun(() =>
    supabaseFunctionRequest("verify-flutterwave-payment", {
      body: {
        ...payment,
        appUserId,
      },
    })
  );
}

export async function verifyFlutterwaveCoinPackPayment(payment) {
  return safeRun(() =>
    supabaseFunctionRequest("verify-flutterwave-payment", {
      body: {
        ...payment,
        paymentPurpose: "coin_pack",
        appUserId: getBackendUserId(),
      },
    })
  );
}

export async function loadUserPackageFromBackend() {
  return safeRun(async () => {
    const records = await supabaseRequest(
      `user_profiles?app_user_id=eq.${encodeURIComponent(getBackendUserId())}&select=package_type,subscription_status,subscription_expires_at&limit=1`
    );
    const profile = firstRecord(records);
    if (!profile) return null;
    const packageType = profile.package_type || "free";
    if (packageType === "free") return "free";

    if (profile.subscription_status !== "active") {
      return "free";
    }

    if (profile.subscription_expires_at && new Date(profile.subscription_expires_at).getTime() <= Date.now()) {
      return "free";
    }

    return packageType;
  });
}

export async function loadSubscriptionStateFromBackend(appUserId = getBackendUserId()) {
  return safeRun(async () => {
    const records = await supabaseRequest(
      `user_profiles?app_user_id=eq.${encodeURIComponent(appUserId)}&select=package_type,subscription_status,subscription_billing_cycle,subscription_started_at,subscription_expires_at&limit=1`
    );
    return firstRecord(records) || null;
  });
}

export async function syncStudyPlanToBackend(plan) {
  return safeRun(async () => {
    await ensureBackendProfile();
    return supabaseRequest("study_plans?on_conflict=app_user_id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      body: {
        app_user_id: getBackendUserId(),
        plan,
        updated_at: new Date().toISOString(),
      },
    });
  });
}

export async function loadStudyPlanFromBackend() {
  return safeRun(async () => {
    const records = await supabaseRequest(
      `study_plans?app_user_id=eq.${encodeURIComponent(getBackendUserId())}&select=plan&limit=1`
    );
    return firstRecord(records)?.plan || null;
  });
}

export async function syncParentScheduleToBackend(schedule) {
  return safeRun(async () => {
    await ensureBackendProfile();
    return supabaseRequest("parent_schedules?on_conflict=app_user_id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      body: {
        app_user_id: getBackendUserId(),
        schedule,
        updated_at: new Date().toISOString(),
      },
    });
  });
}

export async function loadParentScheduleFromBackend() {
  return safeRun(async () => {
    const records = await supabaseRequest(
      `parent_schedules?app_user_id=eq.${encodeURIComponent(getBackendUserId())}&select=schedule&limit=1`
    );
    return firstRecord(records)?.schedule || null;
  });
}

export async function syncAttemptToBackend(attempt) {
  return safeRun(async () => {
    await ensureBackendProfile(attempt.packageType);
    return supabaseRequest("attempts?on_conflict=app_user_id,attempt_id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      body: {
        app_user_id: getBackendUserId(),
        attempt_id: attempt.id,
        test_type: attempt.testType,
        package_type: attempt.packageType,
        percentage: Number(attempt.percentage) || 0,
        completed_at: attempt.completedAt || new Date().toISOString(),
        attempt,
      },
    });
  });
}

export async function syncChildActivityEvent(eventType, metadata = {}) {
  return safeRun(async () => {
    await ensureBackendProfile();
    return supabaseRequest("child_activity_events", {
      method: "POST",
      body: {
        app_user_id: getBackendUserId(),
        event_type: eventType,
        metadata,
        occurred_at: new Date().toISOString(),
      },
    });
  });
}

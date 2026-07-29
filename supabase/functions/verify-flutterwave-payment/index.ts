const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type VerifyRequest = {
  paymentPurpose?: "subscription" | "coin_pack";
  appUserId?: string;
  transactionId?: string | number;
  txRef?: string;
  packageType?: "standard" | "elite";
  billingCycle?: "monthly" | "yearly";
  coinPackId?: "starter" | "value" | "family";
  expectedAmount?: number;
  expectedCoins?: number;
  currency?: string;
  customerEmail?: string;
};

const PACKAGE_AMOUNTS = {
  standard: {
    monthly: 5000,
    yearly: 50000,
  },
  elite: {
    monthly: 7500,
    yearly: 75000,
  },
};

const COIN_PACKS = {
  starter: {
    amount: 500,
    coins: 100,
  },
  value: {
    amount: 1000,
    coins: 230,
  },
  family: {
    amount: 2000,
    coins: 520,
  },
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const flutterwaveSecretKey = Deno.env.get("FLUTTERWAVE_SECRET_KEY") || Deno.env.get("FLW_SECRET_KEY") || "";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ ok: false, message: "Method not allowed." }, 405);
  }

  try {
    const payload = await request.json() as VerifyRequest;
    payload.paymentPurpose = payload.paymentPurpose || "subscription";
    const validation = validatePayload(payload);
    if (!validation.ok) return jsonResponse(validation, 400);

    if (!flutterwaveSecretKey) {
      return jsonResponse({
        ok: false,
        message: "Payment verification is not configured yet.",
      }, 500);
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({
        ok: false,
        message: "Subscription storage is not configured yet.",
      }, 500);
    }

    const verifyResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/${payload.transactionId}/verify`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${flutterwaveSecretKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    const verifyResult = await verifyResponse.json();

    if (!verifyResponse.ok || verifyResult.status !== "success" || !verifyResult.data) {
      return jsonResponse({
        ok: false,
        message: verifyResult.message || "Flutterwave could not verify this payment.",
      }, 400);
    }

    const transaction = verifyResult.data;
    const expectedAmount = getExpectedAmount(payload);
    const paidAmount = Number(transaction.amount);
    const transactionStatus = String(transaction.status || "").toLowerCase();
    const transactionCurrency = String(transaction.currency || "").toUpperCase();
    const txRefMatches = String(transaction.tx_ref || "") === payload.txRef;
    const amountMatches = paidAmount >= expectedAmount;
    const currencyMatches = transactionCurrency === String(payload.currency || "NGN").toUpperCase();
    const statusMatches = transactionStatus === "successful";

    if (!statusMatches || !txRefMatches || !amountMatches || !currencyMatches) {
      if (payload.paymentPurpose === "coin_pack") {
        await ensureUserProfile(payload.appUserId!);
        await saveCoinPurchaseAudit(payload, transaction, "rejected");
      } else {
        await savePaymentAudit(payload, transaction, "rejected");
      }
      return jsonResponse({
        ok: false,
        message: "Payment verification failed. The amount, status, currency or reference did not match.",
      }, 400);
    }

    if (payload.paymentPurpose === "coin_pack") {
      const pack = getCoinPack(payload.coinPackId!);
      await ensureUserProfile(payload.appUserId!);
      const existingPurchase = await getExistingCoinPurchase(payload.txRef!);
      if (existingPurchase?.flutterwave_status === "verified") {
        return jsonResponse({
          ok: true,
          paymentPurpose: "coin_pack",
          packId: payload.coinPackId,
          coins: pack.coins,
          coinBalance: await getGameWalletBalance(payload.appUserId!),
          duplicate: true,
          message: "Payment was already verified and coins were already credited.",
        });
      }

      await saveCoinPurchaseAudit(payload, transaction, "verified");
      const balance = await creditGameWallet(payload.appUserId!, pack.coins);

      return jsonResponse({
        ok: true,
        paymentPurpose: "coin_pack",
        packId: payload.coinPackId,
        coins: pack.coins,
        coinBalance: balance,
        message: "Payment verified and coins credited.",
      });
    }

    const now = new Date();
    const expiresAt = new Date(now);
    if (payload.billingCycle === "yearly") {
      expiresAt.setDate(expiresAt.getDate() + 372);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 34);
    }

    await upsertUserProfile(payload, now, expiresAt);
    await savePaymentAudit(payload, transaction, "verified");

    return jsonResponse({
      ok: true,
      packageType: payload.packageType,
      billingCycle: payload.billingCycle,
      expiresAt: expiresAt.toISOString(),
      message: "Payment verified and subscription activated.",
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      message: error instanceof Error ? error.message : "Unknown verification error.",
    }, 500);
  }
});

function validatePayload(payload: VerifyRequest) {
  if (!payload.appUserId) return { ok: false, message: "Missing user profile." };
  if (!payload.transactionId) return { ok: false, message: "Missing Flutterwave transaction ID." };
  if (!payload.txRef) return { ok: false, message: "Missing payment reference." };
  if (payload.paymentPurpose !== "subscription" && payload.paymentPurpose !== "coin_pack") {
    return { ok: false, message: "Invalid payment purpose." };
  }

  if (payload.paymentPurpose === "coin_pack") {
    if (!payload.coinPackId || !COIN_PACKS[payload.coinPackId]) {
      return { ok: false, message: "Invalid coin pack." };
    }

    const pack = getCoinPack(payload.coinPackId);
    if (Number(payload.expectedAmount) !== pack.amount) {
      return { ok: false, message: "Unexpected coin pack amount." };
    }

    if (Number(payload.expectedCoins) !== pack.coins) {
      return { ok: false, message: "Unexpected coin pack value." };
    }

    return { ok: true };
  }

  if (payload.packageType !== "standard" && payload.packageType !== "elite") {
    return { ok: false, message: "Invalid subscription package." };
  }
  if (payload.billingCycle !== "monthly" && payload.billingCycle !== "yearly") {
    return { ok: false, message: "Invalid billing cycle." };
  }

  const expectedAmount = getSubscriptionAmount(payload.packageType, payload.billingCycle);
  if (Number(payload.expectedAmount) !== expectedAmount) {
    return { ok: false, message: "Unexpected subscription amount." };
  }

  return { ok: true };
}

function getExpectedAmount(payload: VerifyRequest) {
  if (payload.paymentPurpose === "coin_pack") {
    return getCoinPack(payload.coinPackId!).amount;
  }

  return getSubscriptionAmount(payload.packageType!, payload.billingCycle!);
}

function getSubscriptionAmount(packageType: "standard" | "elite", billingCycle: "monthly" | "yearly") {
  return PACKAGE_AMOUNTS[packageType][billingCycle];
}

function getCoinPack(packId: "starter" | "value" | "family") {
  return COIN_PACKS[packId];
}

async function ensureUserProfile(appUserId: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/user_profiles?on_conflict=app_user_id`, {
    method: "POST",
    headers: serviceHeaders("resolution=merge-duplicates,return=representation"),
    body: JSON.stringify({
      app_user_id: appUserId,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

async function upsertUserProfile(payload: VerifyRequest, now: Date, expiresAt: Date) {
  const response = await fetch(`${supabaseUrl}/rest/v1/user_profiles?on_conflict=app_user_id`, {
    method: "POST",
    headers: serviceHeaders("resolution=merge-duplicates,return=representation"),
    body: JSON.stringify({
      app_user_id: payload.appUserId,
      package_type: payload.packageType,
      subscription_status: "active",
      subscription_billing_cycle: payload.billingCycle,
      subscription_started_at: now.toISOString(),
      subscription_expires_at: expiresAt.toISOString(),
      subscription_renewal_reminder_sent_at: null,
      subscription_expired_email_sent_at: null,
      last_payment_tx_ref: payload.txRef,
      updated_at: now.toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

async function creditGameWallet(appUserId: string, coins: number) {
  const currentBalance = await getGameWalletBalance(appUserId);
  const nextBalance = currentBalance + coins;

  const walletResponse = await fetch(`${supabaseUrl}/rest/v1/game_wallets?on_conflict=app_user_id`, {
    method: "POST",
    headers: serviceHeaders("resolution=merge-duplicates,return=representation"),
    body: JSON.stringify({
      app_user_id: appUserId,
      coin_balance: nextBalance,
    }),
  });

  if (!walletResponse.ok) {
    throw new Error(await walletResponse.text());
  }

  return nextBalance;
}

async function getGameWalletBalance(appUserId: string) {
  const existingResponse = await fetch(
    `${supabaseUrl}/rest/v1/game_wallets?app_user_id=eq.${encodeURIComponent(appUserId)}&select=coin_balance&limit=1`,
    {
      method: "GET",
      headers: serviceHeaders(),
    }
  );

  if (!existingResponse.ok) {
    throw new Error(await existingResponse.text());
  }

  const existing = await existingResponse.json();
  return Array.isArray(existing) && existing[0] ? Number(existing[0].coin_balance || 0) : 0;
}

async function getExistingCoinPurchase(txRef: string) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/game_coin_purchases?tx_ref=eq.${encodeURIComponent(txRef)}&select=flutterwave_status&limit=1`,
    {
      method: "GET",
      headers: serviceHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const records = await response.json();
  return Array.isArray(records) && records[0] ? records[0] : null;
}

async function saveCoinPurchaseAudit(payload: VerifyRequest, transaction: Record<string, unknown>, status: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/game_coin_purchases?on_conflict=tx_ref`, {
    method: "POST",
    headers: serviceHeaders("resolution=merge-duplicates,return=representation"),
    body: JSON.stringify({
      app_user_id: payload.appUserId,
      pack_id: payload.coinPackId,
      coins: Number(payload.expectedCoins || getCoinPack(payload.coinPackId!).coins),
      amount: Number(transaction.amount || payload.expectedAmount || 0),
      currency: String(transaction.currency || payload.currency || "NGN"),
      tx_ref: payload.txRef,
      flutterwave_transaction_id: String(transaction.id || payload.transactionId),
      flutterwave_status: status,
      provider_response: transaction,
      verified_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

async function savePaymentAudit(payload: VerifyRequest, transaction: Record<string, unknown>, status: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/subscription_payments?on_conflict=tx_ref`, {
    method: "POST",
    headers: serviceHeaders("resolution=merge-duplicates,return=representation"),
    body: JSON.stringify({
      app_user_id: payload.appUserId,
      package_type: payload.packageType,
      billing_cycle: payload.billingCycle,
      amount: Number(transaction.amount || payload.expectedAmount || 0),
      currency: String(transaction.currency || payload.currency || "NGN"),
      tx_ref: payload.txRef,
      flutterwave_transaction_id: String(transaction.id || payload.transactionId),
      flutterwave_status: status,
      provider_response: transaction,
      verified_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
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

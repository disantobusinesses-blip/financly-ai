import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const normalizeBase = (url) => String(url || "").replace(/\/$/, "");
const toFiskilV1Base = (base) => {
  const resolved = normalizeBase(base || "https://api.fiskil.com");
  return /\/v1$/i.test(resolved) ? resolved : `${resolved}/v1`;
};

const FISKIL_BASE_URL = toFiskilV1Base(process.env.FISKIL_BASE_URL);
const FISKIL_CLIENT_ID = process.env.FISKIL_CLIENT_ID;
const FISKIL_CLIENT_SECRET = process.env.FISKIL_CLIENT_SECRET;

function json(res, status, body) {
  res.status(status);
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function getFiskilAccessToken() {
  const tokenRes = await fetch(`${FISKIL_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: FISKIL_CLIENT_ID,
      client_secret: FISKIL_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Fiskil token error: ${text || tokenRes.status}`);
  }

  const tokenData = await tokenRes.json();
  if (!tokenData?.access_token) throw new Error("Fiskil token missing access_token");
  return tokenData.access_token;
}

async function fiskilGet(path, token) {
  const url = `${FISKIL_BASE_URL}${path}`;
  const r = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });

  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Fiskil GET ${path} failed: ${text || r.status}`);
  }

  return r.json();
}

function computeSyncStatus({ connected, accountCount, txCount }) {
  if (!connected) {
    return { stage: "no_connection", progress: 0, message: "Bank not connected yet." };
  }

  if (accountCount === 0) {
    return {
      stage: "awaiting_accounts",
      progress: 35,
      message: "Waiting for bank accounts to be available from Fiskil…",
    };
  }

  if (txCount === 0) {
    return {
      stage: "awaiting_transactions",
      progress: 60,
      message: "Accounts found. Waiting for transactions to be available…",
    };
  }

  return { stage: "ready", progress: 100, message: "Bank data loaded." };
}

export default async function handler(req, res) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json(res, 500, { error: "Missing Supabase env vars" });
    }
    if (!FISKIL_BASE_URL || !FISKIL_CLIENT_ID || !FISKIL_CLIENT_SECRET) {
      return json(res, 500, { error: "Missing Fiskil env vars" });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return json(res, 401, { error: "Missing Authorization header" });
    }

    const accessToken = authHeader.slice("Bearer ".length);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Validate user
    const { data: userData, error: userErr } = await supabase.auth.getUser(accessToken);
    if (userErr || !userData?.user) {
      return json(res, 401, { error: "Invalid session" });
    }

    const appUserId = userData.user.id;

    // Load Fiskil end_user_id from profile
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("fiskil_user_id, bank_connected")
      .eq("id", appUserId)
      .maybeSingle();

    if (profileErr) {
      return json(res, 500, { error: profileErr.message });
    }

    const endUserId = profile?.fiskil_user_id || null;
    const connected = Boolean(profile?.bank_connected && endUserId);

    if (!connected) {
      const syncStatus = computeSyncStatus({ connected: false, accountCount: 0, txCount: 0 });
      return json(res, 200, {
        connected: false,
        accounts: [],
        transactions: [],
        last_updated: new Date().toISOString(),
        syncStatus,
        debug: { appUserId, endUserId },
      });
    }

    // Fetch from Fiskil: accounts first, then transactions per account
    const fiskilToken = await getFiskilAccessToken();

    const accountsPayload = await fiskilGet(
      `/banking/accounts?end_user_id=${encodeURIComponent(endUserId)}`,
      fiskilToken
    );

    const accounts = Array.isArray(accountsPayload?.data) ? accountsPayload.data : [];
    const accountIds = accounts.map((a) => a?.id).filter(Boolean);

    let allTransactions = [];
    for (const accountId of accountIds) {
      try {
        const txPayload = await fiskilGet(`/banking/accounts/${accountId}/transactions`, fiskilToken);
        const tx = Array.isArray(txPayload?.data) ? txPayload.data : [];
        allTransactions = allTransactions.concat(tx);
      } catch (e) {
        // If one account fails, still return what we have for the others
        console.warn("Fiskil transactions fetch failed for account", accountId, String(e?.message || e));
      }
    }

    const syncStatus = computeSyncStatus({
      connected: true,
      accountCount: accounts.length,
      txCount: allTransactions.length,
    });

    return json(res, 200, {
      connected: true,
      accounts,
      transactions: allTransactions,
      last_updated: new Date().toISOString(),
      syncStatus,
      debug: {
        appUserId,
        endUserId,
        accountCount: accounts.length,
        txCount: allTransactions.length,
      },
    });
  } catch (err) {
    console.error("fiskil-data error:", err);
    return json(res, 500, { error: err?.message || "Unknown server error" });
  }
}

const FISKIL_BASE_URL = (process.env.FISKIL_API_URL || "https://api.fiskil.com/v1").replace(/\/$/, "");
const FISKIL_CLIENT_ID = process.env.FISKIL_CLIENT_ID;
const FISKIL_CLIENT_SECRET = process.env.FISKIL_CLIENT_SECRET;

let cachedToken: string | null = null;
let cachedExpiry = 0;

function ensureFiskilConfig() {
  if (!FISKIL_CLIENT_ID || !FISKIL_CLIENT_SECRET) {
    throw new Error("Fiskil configuration missing on server");
  }
}

async function getFiskilAccessToken(): Promise<string> {
  ensureFiskilConfig();
  const now = Date.now();
  if (cachedToken && cachedExpiry > now + 5000) return cachedToken;

  const res = await fetch(`${FISKIL_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${FISKIL_CLIENT_ID}:${FISKIL_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(`Fiskil token request failed (${res.status}): ${message}`);
  }

  const json = await res.json();
  cachedToken = json.access_token;
  cachedExpiry = now + (json.expires_in ? json.expires_in * 1000 : 0);
  return cachedToken as string;
}

export async function fiskilRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getFiskilAccessToken();
  const url = `${FISKIL_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(`Fiskil request failed (${res.status}): ${message}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  // Fallback for non-JSON responses
  return (await res.text()) as unknown as T;
}

export async function fetchUserAccounts(userId: string) {
  return fiskilRequest(`/banking/v2/users/${encodeURIComponent(userId)}/accounts`, {
    method: "GET",
  });
}

export async function fetchUserTransactions(userId: string, since?: string) {
  const query = new URLSearchParams();
  if (since) query.set("from", since);
  const suffix = query.size ? `?${query.toString()}` : "";
  return fiskilRequest(`/banking/v2/users/${encodeURIComponent(userId)}/transactions${suffix}`, {
    method: "GET",
  });
}

export async function createFiskilUser(email: string) {
  return fiskilRequest(`/banking/v2/users`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function createFiskilLinkToken(userId: string) {
  return fiskilRequest(`/link/token`, {
    method: "POST",
    body: JSON.stringify({
      userId,
      products: ["banking"],
    }),
  });
}

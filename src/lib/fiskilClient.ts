const FISKIL_BASE_URL =
  import.meta.env.VITE_FISKIL_BASE_URL?.replace(/\/$/, "") || "https://api.fiskil.com";
const FISKIL_API_KEY = import.meta.env.VITE_FISKIL_API_KEY || "";

export async function fiskilRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${FISKIL_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(FISKIL_API_KEY ? { Authorization: `Bearer ${FISKIL_API_KEY}` } : {}),
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
  return fiskilRequest(
    `/banking/v2/users/${encodeURIComponent(userId)}/transactions${suffix}`,
    {
      method: "GET",
    }
  );
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

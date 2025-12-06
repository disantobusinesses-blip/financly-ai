const FISKIL_API_URL =
  process.env.FISKIL_API_URL ||
  (typeof window === "undefined" ? undefined : (window as any).VITE_FISKIL_API_URL) ||
  "https://api.fiskil.com/v2";

const FISKIL_API_KEY =
  process.env.FISKIL_API_KEY ||
  process.env.FISKIL_SECRET_KEY ||
  (typeof window === "undefined" ? undefined : (window as any).VITE_FISKIL_API_KEY);

if (!FISKIL_API_KEY) {
  console.warn("Fiskil API key is not set. Banking requests will fail.");
}

const resolveUrl = (path: string): string => {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${FISKIL_API_URL?.replace(/\/$/, "") || ""}${path.startsWith("/") ? path : `/${path}`}`;
};

export async function fiskilRequest<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  if (!FISKIL_API_KEY) throw new Error("Missing FISKIL_API_KEY or FISKIL_SECRET_KEY env var");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${FISKIL_API_KEY}`,
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  const response = await fetch(resolveUrl(path), { ...init, headers });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Fiskil request failed (${response.status}): ${text}`);
  }

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

export async function createFiskilCustomer(email: string): Promise<{ id: string }> {
  const data = await fiskilRequest<{ id?: string; customer?: { id?: string } }>(
    "/banking/customers",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    }
  );

  const id = data?.id || data?.customer?.id;
  if (!id) throw new Error("Unable to create Fiskil customer");
  return { id };
}

export async function createFiskilLinkSession(
  customerId: string,
  redirectUrl?: string
): Promise<{ url: string; token?: string }> {
  const payload: Record<string, any> = {
    customerId,
    products: ["banking"],
  };

  if (redirectUrl) payload.redirectUrl = redirectUrl;

  const data = await fiskilRequest<{ url?: string; link_url?: string; token?: string; linkToken?: string }>(
    "/link/token",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  const url = data.url || (data as any).link_url;
  if (!url) throw new Error("Fiskil link session missing URL");

  return { url, token: data.token || (data as any).linkToken };
}

export async function fetchUserAccounts(customerId: string): Promise<any[]> {
  const data = await fiskilRequest<{ data?: any[]; accounts?: any[] }>(
    `/banking/customers/${encodeURIComponent(customerId)}/accounts`
  );
  return Array.isArray(data?.data) ? data.data : Array.isArray(data?.accounts) ? data.accounts : [];
}

export async function fetchUserTransactions(customerId: string, from?: string): Promise<any[]> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);

  const data = await fiskilRequest<{ data?: any[]; transactions?: any[] }>(
    `/banking/customers/${encodeURIComponent(customerId)}/transactions${
      params.size ? `?${params.toString()}` : ""
    }`
  );
  return Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.transactions)
    ? data.transactions
    : [];
}

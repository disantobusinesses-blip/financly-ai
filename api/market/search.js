/**
 * GET /api/market/search?q=...&assetClass=stock|etf|crypto
 *
 * Provider: Finnhub symbol search
 * Docs: https://finnhub.io/docs/api/symbol-search :contentReference[oaicite:5]{index=5}
 */
module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const token = process.env.FINNHUB_API_KEY;
  if (!token) {
    return res.status(500).json({
      ok: false,
      error: "Server misconfigured: missing FINNHUB_API_KEY",
    });
  }

  const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 80) : "";
  if (!q) {
    return res.status(400).json({ ok: false, error: "Missing query param: q" });
  }

  const assetClassParam = typeof req.query.assetClass === "string" ? req.query.assetClass.toLowerCase() : "stock";
  const assetClass = assetClassParam === "crypto" || assetClassParam === "etf" || assetClassParam === "stock"
    ? assetClassParam
    : "stock";

  try {
    const url =
      "https://finnhub.io/api/v1/search?q=" +
      encodeURIComponent(q) +
      "&token=" +
      encodeURIComponent(token);

    const upstream = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      return res.status(502).json({
        ok: false,
        error:
          "Upstream error (finnhub): " +
          upstream.status +
          " " +
          upstream.statusText +
          (text ? " - " + text : ""),
      });
    }

    const data = await upstream.json();
    const raw = Array.isArray(data?.result) ? data.result : [];

    // Best-effort inference; Finnhub’s search type varies by market/instrument.
    const infer = (type) => {
      const t = String(type || "").toLowerCase();
      if (t.includes("crypto")) return "crypto";
      if (t.includes("etf")) return "etf";
      return "stock";
    };

    const results = raw
      .map((r) => {
        const providerSymbol = String(r?.symbol || "").trim();
        const displaySymbol = String(r?.displaySymbol || "").trim();
        const name = String(r?.description || "").trim();
        const inferred = infer(r?.type);

        if (!providerSymbol || !name) return null;

        return {
          provider: "finnhub",
          assetClass: inferred,
          symbol: displaySymbol || providerSymbol,
          providerSymbol,
          name,
        };
      })
      .filter(Boolean)
      .filter((x) => (assetClass ? x.assetClass === assetClass : true))
      .slice(0, 20);

    // Cache to reduce rate/latency (safe: search results don’t need realtime)
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({ ok: true, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ ok: false, error: message });
  }
};

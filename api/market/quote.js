/**
 * GET /api/market/quote?providerSymbol=...&symbol=...&assetClass=stock|etf|crypto
 *
 * Normalized response for Portfolio Tracker (read-only market data).
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

  const providerSymbol =
    typeof req.query.providerSymbol === "string" ? req.query.providerSymbol.trim().slice(0, 32) : "";
  const symbol = typeof req.query.symbol === "string" ? req.query.symbol.trim().slice(0, 32) : providerSymbol;

  if (!providerSymbol) {
    return res.status(400).json({ ok: false, error: "Missing query param: providerSymbol" });
  }

  const assetClassParam =
    typeof req.query.assetClass === "string" ? req.query.assetClass.toLowerCase() : "stock";
  const assetClass = assetClassParam === "crypto" || assetClassParam === "etf" || assetClassParam === "stock"
    ? assetClassParam
    : "stock";

  try {
    // Finnhub Quote endpoint:
    // https://finnhub.io/docs/api/quote 
    const url =
      "https://finnhub.io/api/v1/quote?symbol=" +
      encodeURIComponent(providerSymbol) +
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

    // Finnhub quote shape commonly returns:
    // c: current, d: change, dp: percent change, h/l/o: highs/lows/open, pc: prev close, t: unix seconds
    const price = Number(data?.c);
    const change = Number(data?.d);
    const changePct = Number(data?.dp);
    const ts = Number(data?.t);

    // Validate
    if (!Number.isFinite(price) || price <= 0) {
      return res.status(404).json({
        ok: false,
        error: "No quote available for symbol",
      });
    }

    const asOf = Number.isFinite(ts) && ts > 0 ? new Date(ts * 1000).toISOString() : new Date().toISOString();

    // Cache briefly (quotes can be refreshed often, but we still want to reduce rate pressure)
    res.setHeader("Cache-Control", "s-maxage=15, stale-while-revalidate=60");

    return res.status(200).json({
      ok: true,
      quote: {
        provider: "finnhub",
        assetClass,
        symbol: symbol || providerSymbol,
        providerSymbol,
        // currency will be resolved later (Phase 2 refinement)
        price,
        change: Number.isFinite(change) ? change : 0,
        changePct: Number.isFinite(changePct) ? changePct : 0,
        asOf,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ ok: false, error: message });
  }
};

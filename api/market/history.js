/**
 * GET /api/market/history?providerSymbol=...&assetClass=stock|etf|crypto&resolution=1|5|15|30|60|D|W|M&range=1W|1M|3M|6M|1Y|5Y
 * Optional: &from=UNIX_SECONDS&to=UNIX_SECONDS  (overrides range)
 *
 * Provider: Finnhub stock candles endpoint.
 * Note: Crypto uses exchange-qualified symbols (e.g. BINANCE:BTCUSDT) returned from /api/market/search.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
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
    typeof req.query?.providerSymbol === "string" ? req.query.providerSymbol.trim().slice(0, 64) : "";

  if (!providerSymbol) {
    return res.status(400).json({ ok: false, error: "Missing query param: providerSymbol" });
  }

  const assetClassParam =
    typeof req.query?.assetClass === "string" ? req.query.assetClass.toLowerCase() : "stock";
  const assetClass = assetClassParam === "crypto" || assetClassParam === "etf" || assetClassParam === "stock"
    ? assetClassParam
    : "stock";

  const resolutionParam =
    typeof req.query?.resolution === "string" ? req.query.resolution.trim() : "D";

  // Finnhub supports: 1, 5, 15, 30, 60, D, W, M (we keep it strict)
  const allowedRes = new Set(["1", "5", "15", "30", "60", "D", "W", "M"]);
  const resolution = allowedRes.has(resolutionParam) ? resolutionParam : "D";

  const nowSec = Math.floor(Date.now() / 1000);

  const parseUnix = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    const i = Math.floor(n);
    if (i <= 0) return null;
    return i;
  };

  const rangeParam =
    typeof req.query?.range === "string" ? req.query.range.trim().toUpperCase() : "3M";

  const rangeToSeconds = (range) => {
    switch (range) {
      case "1W":
        return 7 * 24 * 60 * 60;
      case "1M":
        return 30 * 24 * 60 * 60;
      case "3M":
        return 90 * 24 * 60 * 60;
      case "6M":
        return 180 * 24 * 60 * 60;
      case "1Y":
        return 365 * 24 * 60 * 60;
      case "5Y":
        return 5 * 365 * 24 * 60 * 60;
      default:
        return 90 * 24 * 60 * 60; // default 3M
    }
  };

  const fromOverride = typeof req.query?.from === "string" ? parseUnix(req.query.from) : null;
  const toOverride = typeof req.query?.to === "string" ? parseUnix(req.query.to) : null;

  const to = toOverride ?? nowSec;
  const from = fromOverride ?? Math.max(0, to - rangeToSeconds(rangeParam));

  if (from >= to) {
    return res.status(400).json({ ok: false, error: "`from` must be < `to`" });
  }

  try {
    // Finnhub candles endpoint:
    // https://finnhub.io/docs/api/stock-candles
    const url =
      "https://finnhub.io/api/v1/stock/candle" +
      "?symbol=" +
      encodeURIComponent(providerSymbol) +
      "&resolution=" +
      encodeURIComponent(resolution) +
      "&from=" +
      encodeURIComponent(String(from)) +
      "&to=" +
      encodeURIComponent(String(to)) +
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

    // Finnhub returns:
    // { c:[], h:[], l:[], o:[], t:[], v:[], s:"ok"|"no_data" }
    const status = String(data?.s || "");
    if (status !== "ok") {
      return res.status(404).json({
        ok: false,
        error: status === "no_data" ? "No historical data for symbol" : "History unavailable",
      });
    }

    const t = Array.isArray(data?.t) ? data.t : [];
    const o = Array.isArray(data?.o) ? data.o : [];
    const h = Array.isArray(data?.h) ? data.h : [];
    const l = Array.isArray(data?.l) ? data.l : [];
    const c = Array.isArray(data?.c) ? data.c : [];
    const v = Array.isArray(data?.v) ? data.v : [];

    const n = Math.min(t.length, o.length, h.length, l.length, c.length, v.length);
    if (n <= 0) {
      return res.status(404).json({ ok: false, error: "No historical data for symbol" });
    }

    const candles = [];
    for (let i = 0; i < n; i++) {
      const ts = Number(t[i]);
      const open = Number(o[i]);
      const high = Number(h[i]);
      const low = Number(l[i]);
      const close = Number(c[i]);
      const vol = Number(v[i]);

      if (!Number.isFinite(ts) || !Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close)) {
        continue;
      }

      candles.push({
        t: ts,      // unix seconds
        o: open,
        h: high,
        l: low,
        c: close,
        v: Number.isFinite(vol) ? vol : 0,
      });
    }

    // Cache (history isn't second-by-second critical for educational charts)
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=1800");

    return res.status(200).json({
      ok: true,
      meta: {
        provider: "finnhub",
        assetClass,
        providerSymbol,
        resolution,
        from,
        to,
        points: candles.length,
      },
      candles,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ ok: false, error: message });
  }
}

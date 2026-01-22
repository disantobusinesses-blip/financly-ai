export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const providerSymbol =
    typeof req.query?.providerSymbol === "string"
      ? req.query.providerSymbol.trim()
      : "";

  const assetClass =
    typeof req.query?.assetClass === "string"
      ? req.query.assetClass.toLowerCase()
      : "stock";

  if (!providerSymbol) {
    return res.status(400).json({ ok: false, error: "Missing providerSymbol" });
  }

  const now = Math.floor(Date.now() / 1000);
  const from = now - 90 * 24 * 60 * 60; // 3 months default

  try {
    /* ===========================
       CRYPTO → BINANCE (FREE)
       =========================== */
    if (assetClass === "crypto") {
      // Expect providerSymbol like: BINANCE:BTCUSDT
      const symbol = providerSymbol.split(":")[1];
      if (!symbol) {
        return res.status(400).json({ ok: false, error: "Invalid crypto symbol" });
      }

      const url =
        `https://api.binance.com/api/v3/klines?` +
        `symbol=${encodeURIComponent(symbol)}` +
        `&interval=1d&limit=90`;

      const r = await fetch(url);
      if (!r.ok) {
        return res.status(502).json({ ok: false, error: "Binance error" });
      }

      const raw = await r.json();

      const candles = raw.map((k) => ({
        t: Math.floor(k[0] / 1000),
        o: Number(k[1]),
        h: Number(k[2]),
        l: Number(k[3]),
        c: Number(k[4]),
        v: Number(k[5]),
      }));

      return res.status(200).json({
        ok: true,
        meta: {
          provider: "binance",
          assetClass: "crypto",
          providerSymbol,
          points: candles.length,
        },
        candles,
      });
    }

    /* ===========================
       STOCKS / ETFs → FINNHUB
       =========================== */
    const token = process.env.FINNHUB_API_KEY;
    if (!token) {
      return res.status(500).json({ ok: false, error: "Missing FINNHUB_API_KEY" });
    }

    const url =
      `https://finnhub.io/api/v1/stock/candle?` +
      `symbol=${encodeURIComponent(providerSymbol)}` +
      `&resolution=D&from=${from}&to=${now}&token=${token}`;

    const r = await fetch(url);
    if (!r.ok) {
      return res.status(502).json({ ok: false, error: "Finnhub error" });
    }

    const data = await r.json();
    if (data.s !== "ok") {
      return res.status(404).json({ ok: false, error: "No stock data" });
    }

    const candles = data.t.map((t, i) => ({
      t,
      o: data.o[i],
      h: data.h[i],
      l: data.l[i],
      c: data.c[i],
      v: data.v[i],
    }));

    return res.status(200).json({
      ok: true,
      meta: {
        provider: "finnhub",
        assetClass,
        providerSymbol,
        points: candles.length,
      },
      candles,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Internal error" });
  }
}

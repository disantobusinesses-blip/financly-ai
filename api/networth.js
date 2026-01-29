export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  const fetch = global.fetch || (await import("node-fetch")).default;

  // Supabase / Fiskil config - reuse service role pattern used in api/sync-status.js
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

  function mustEnv(name, value) {
    if (!value) throw new Error(`Missing env var: ${name}`);
    return value;
  }

  // Lazily require supabase admin client
  const { createClient } = await import('@supabase/supabase-js');

  mustEnv('SUPABASE_URL', SUPABASE_URL);
  mustEnv('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY);

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // in-process price cache
  if (!global.__priceCache) global.__priceCache = new Map();

  async function getPriceForSymbol(symbol) {
    const now = Date.now();
    const TTL = 60_000; // 60s
    const key = String(symbol).toUpperCase();

    const cached = global.__priceCache.get(key);
    if (cached && now - cached.ts < TTL) return cached.price;

    if (!FINNHUB_API_KEY) return undefined;

    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(key)}&token=${encodeURIComponent(FINNHUB_API_KEY)}`;
      const qRes = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
      if (!qRes.ok) return undefined;
      const qJson = await qRes.json();
      const price = Number(qJson?.c ?? qJson?.currentPrice ?? qJson?.last);
      if (!Number.isFinite(price) || price <= 0) return undefined;
      global.__priceCache.set(key, { price, ts: now });
      return price;
    } catch (err) {
      console.warn('Finnhub fetch error for', key, err?.message || err);
      return undefined;
    }
  }

  try {
    // authenticate using Bearer token -> supabase admin getUser
    const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
    const token = typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : null;
    if (!token) return res.status(401).json({ ok: false, error: 'Missing auth token' });

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user?.id) return res.status(401).json({ ok: false, error: 'Invalid session' });
    const appUserId = userData.user.id;

    // read accounts and transactions from Supabase
    const [{ data: accounts = [] } = {}, { data: transactions = [] } = {}] = await Promise.all([
      supabaseAdmin.from('accounts').select('*').eq('user_id', appUserId),
      supabaseAdmin.from('transactions').select('*').eq('user_id', appUserId),
    ].map(p => p.catch ? p : p));

    // normalize balances
    const accountsNormalized = (accounts || []).map(a => ({ ...a, balance: Number(a?.balance ?? a?.current_balance ?? a?.available_balance ?? 0) || 0 }));
    const accountsTotal = accountsNormalized.reduce((s, a) => s + (Number(a.balance) || 0), 0);

    // attempt to get portfolio holdings from server-side table 'portfolios' or 'holdings'
    let portfolio = [];
    const tryTables = ['portfolios', 'holdings'];
    for (const t of tryTables) {
      try {
        const { data: rows, error: e } = await supabaseAdmin.from(t).select('*').eq('user_id', appUserId);
        if (!e && Array.isArray(rows) && rows.length > 0) {
          portfolio = rows;
          break;
        }
      } catch (e) {
        // ignore
      }
    }

    // fallback: call internal /api/portfolio if no table rows found
    if (portfolio.length === 0) {
      try {
        const baseUrl = (process.env.VERCEL_URL && process.env.VERCEL_URL.startsWith('http')) ? process.env.VERCEL_URL : '';
        const url = `/api/portfolio?userId=${encodeURIComponent(appUserId)}`;
        const pRes = await fetch(url, { method: 'GET' });
        if (pRes.ok) {
          const pjson = await pRes.json();
          portfolio = Array.isArray(pjson) ? pjson : pjson.holdings || pjson.portfolio || [];
        }
      } catch (e) {
        // ignore
      }
    }

    // collect unique symbols
    const symbols = Array.from(new Set(portfolio.map(h => (h?.symbol || h?.ticker || h?.code || '').toString().toUpperCase()).filter(Boolean)));

    // fetch prices with limited concurrency
    const MAX_CONCURRENT = 6;
    const priceMap = {};
    for (let i = 0; i < symbols.length; i += MAX_CONCURRENT) {
      const batch = symbols.slice(i, i + MAX_CONCURRENT);
      const resBatch = await Promise.all(batch.map(s => getPriceForSymbol(s).then(p => ({ s, p })))));
      resBatch.forEach(r => { if (r.p != null) priceMap[r.s] = r.p; });
    }

    // compute portfolio total
    let portfolioTotal = 0;
    for (const h of portfolio) {
      const sym = (h?.symbol || h?.ticker || h?.code || '').toString().toUpperCase();
      const qty = Number(h?.quantity ?? h?.shares ?? 0) || 0;
      const valueFromHolding = h?.value != null ? Number(h.value) : null;
      const price = Number(h?.currentPrice ?? h?.price ?? priceMap[sym]) || null;
      if (valueFromHolding != null && Number.isFinite(valueFromHolding)) {
        portfolioTotal += valueFromHolding;
      } else if (qty && price && Number.isFinite(price)) {
        portfolioTotal += qty * price;
      } else if (price && Number.isFinite(price)) {
        portfolioTotal += price;
      }
    }

    const netWorth = accountsTotal + portfolioTotal;

    // recent txns summary (30d)
    const recentCut = new Date();
    recentCut.setDate(recentCut.getDate() - 30);
    const recentTxns = (transactions || []).filter(t => {
      const d = new Date(t?.posted_at || t?.postedDate || t?.date || t?.transactionDate || null);
      return d && d >= recentCut;
    });
    const inflows = recentTxns.reduce((s, t) => s + (Number(t.amount) > 0 ? Number(t.amount) : 0), 0);
    const outflows = recentTxns.reduce((s, t) => s + (Number(t.amount) < 0 ? Number(t.amount) : 0), 0);

    return res.status(200).json({ ok: true, accountsTotal, portfolioTotal, netWorth, accounts: accountsNormalized, transactions, portfolio, prices: priceMap, recent: { inflows, outflows, count: recentTxns.length }, lastUpdated: new Date().toISOString() });
  } catch (err) {
    console.error('❌ /api/networth error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to compute net worth', details: String(err?.message || err) });
  }
}

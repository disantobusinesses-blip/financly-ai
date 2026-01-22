import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  BellIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/currency";

type AssetType = "stock" | "etf" | "crypto" | "cash";
type PropertyType = "house" | "apartment" | "unit" | "townhouse" | "land";

type MarketProvider = "finnhub";

type InvestmentHolding = {
  id: string;
  kind: "investment";
  assetType: AssetType;

  // display + identity
  symbol: string; // user-friendly display symbol (e.g. "AAPL", "BTC")
  name: string;

  // provider identifiers (important for crypto)
  provider?: MarketProvider;
  providerSymbol?: string; // e.g. "AAPL" or "BINANCE:BTCUSDT" from search results

  // position
  quantity: number;
  buyPrice: number;
  buyDate: string;

  // live pricing
  currentPrice?: number; // set by live quote refresh (or manual fallback)
  lastPriceAt?: number; // epoch ms
  priceSource?: "live" | "manual";

  currency?: "AUD" | "USD";
};

type PropertyHolding = {
  id: string;
  kind: "property";
  propertyType: PropertyType;
  name: string;
  purchasePrice: number;
  purchaseDate: string;
  deposit: number;
  interestRatePct: number;
  termYears: number;
  rentalIncomeMonthly: number;
  otherMonthlyCosts: number;
  currentValue?: number;
};

type Holding = InvestmentHolding | PropertyHolding;

type SearchResult = {
  provider: "finnhub";
  assetClass: "stock" | "etf" | "crypto";
  symbol: string; // display symbol
  providerSymbol: string; // used for quote/history (crypto often needs exchange prefix)
  name: string;
};

const pushAppRoute = (path: string) => {
  if (window.location.pathname !== path) {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
};

const uid = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const safeNumber = (v: unknown, fallback = 0) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const monthlyMortgagePayment = (loanAmount: number, annualRatePct: number, termYears: number) => {
  const principal = Math.max(0, loanAmount);
  const years = Math.max(0, termYears);
  if (principal <= 0 || years <= 0) return 0;

  const r = Math.max(0, annualRatePct) / 100 / 12;
  const n = years * 12;

  if (r === 0) return principal / n;

  const payment = (principal * r) / (1 - Math.pow(1 + r, -n));
  return Number.isFinite(payment) ? payment : 0;
};

const percent = (part: number, total: number) => {
  if (total <= 0) return 0;
  return (part / total) * 100;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

const categoryLabel = (t: AssetType) => {
  if (t === "stock") return "Stocks";
  if (t === "crypto") return "Crypto";
  if (t === "etf") return "ETFs";
  return "Cash";
};

const dotClassByCategory = (key: string) => {
  switch (key) {
    case "Stocks":
      return "bg-violet-400";
    case "Crypto":
      return "bg-emerald-400";
    case "ETFs":
      return "bg-sky-400";
    case "Cash":
      return "bg-slate-300";
    case "Property":
      return "bg-amber-300";
    default:
      return "bg-white/50";
  }
};

const STORAGE_KEY_BASE = "myaibank_portfolio_v1";

const isInvestment = (h: Holding): h is InvestmentHolding => h.kind === "investment";
const isProperty = (h: Holding): h is PropertyHolding => h.kind === "property";

const Portfolio: React.FC = () => {
  const { user } = useAuth();
  const region = user?.region ?? "AU";
  const storageKey = `${STORAGE_KEY_BASE}:${user?.id ?? "anon"}`;

  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"investment" | "property">("investment");

  // Investment form
  const [invAssetType, setInvAssetType] = useState<AssetType>("etf");
  const [invSymbol, setInvSymbol] = useState("");
  const [invName, setInvName] = useState("");
  const [invQty, setInvQty] = useState<string>("1");
  const [invBuyPrice, setInvBuyPrice] = useState<string>("");
  const [invBuyDate, setInvBuyDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [invCurrentPrice, setInvCurrentPrice] = useState<string>("");

  // Search in modal
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedSearch, setSelectedSearch] = useState<SearchResult | null>(null);

  // Live pricing
  const [quoteStatus, setQuoteStatus] = useState<"idle" | "updating" | "error">("idle");
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Sorting
  const [sortBy, setSortBy] = useState<"value" | "pnl" | "name" | "type">("value");

  const searchAbortRef = useRef<AbortController | null>(null);
  const quoteAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Holding[];
      if (Array.isArray(parsed)) setHoldings(parsed);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(holdings));
    } catch {
      // ignore
    }
  }, [holdings, storageKey]);

  const filteredHoldings = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = !q
      ? holdings
      : holdings.filter((h) => {
          if (h.kind === "investment") {
            return (
              h.symbol.toLowerCase().includes(q) ||
              h.name.toLowerCase().includes(q) ||
              h.assetType.toLowerCase().includes(q)
            );
          }
          return h.name.toLowerCase().includes(q) || h.propertyType.toLowerCase().includes(q);
        });

    const getInvValue = (h: InvestmentHolding) => {
      const px = typeof h.currentPrice === "number" ? h.currentPrice : h.buyPrice;
      return h.quantity * px;
    };
    const getInvPnl = (h: InvestmentHolding) => {
      const px = typeof h.currentPrice === "number" ? h.currentPrice : h.buyPrice;
      const value = h.quantity * px;
      const cost = h.quantity * h.buyPrice;
      return value - cost;
    };

    const sorted = [...base].sort((a, b) => {
      if (sortBy === "name") {
        const an = (a.kind === "investment" ? a.name : a.name).toLowerCase();
        const bn = (b.kind === "investment" ? b.name : b.name).toLowerCase();
        return an.localeCompare(bn);
      }
      if (sortBy === "type") {
        const ak = a.kind === "investment" ? `0_${a.assetType}` : "1_property";
        const bk = b.kind === "investment" ? `0_${b.assetType}` : "1_property";
        return ak.localeCompare(bk);
      }
      if (sortBy === "pnl") {
        const ap = a.kind === "investment" ? getInvPnl(a) : 0;
        const bp = b.kind === "investment" ? getInvPnl(b) : 0;
        return bp - ap;
      }
      // value
      const av = a.kind === "investment" ? getInvValue(a) : typeof a.currentValue === "number" ? a.currentValue : a.purchasePrice;
      const bv = b.kind === "investment" ? getInvValue(b) : typeof b.currentValue === "number" ? b.currentValue : b.purchasePrice;
      return bv - av;
    });

    return sorted;
  }, [holdings, query, sortBy]);

  const totals = useMemo(() => {
    const inv = holdings.filter(isInvestment);
    const props = holdings.filter(isProperty);

    const invCost = inv.reduce((sum, h) => sum + h.quantity * h.buyPrice, 0);
    const invValue = inv.reduce((sum, h) => {
      const px = typeof h.currentPrice === "number" ? h.currentPrice : h.buyPrice;
      return sum + h.quantity * px;
    }, 0);

    const propCost = props.reduce((sum, p) => sum + p.purchasePrice, 0);
    const propValue = props.reduce(
      (sum, p) => sum + (typeof p.currentValue === "number" ? p.currentValue : p.purchasePrice),
      0
    );

    const totalValue = invValue + propValue;
    const totalCost = invCost + propCost;

    const gain = totalValue - totalCost;
    const gainPct = totalCost > 0 ? (gain / totalCost) * 100 : 0;

    return {
      invCost,
      invValue,
      propCost,
      propValue,
      totalValue,
      totalCost,
      gain,
      gainPct,
    };
  }, [holdings]);

  const allocation = useMemo(() => {
    const inv = holdings.filter(isInvestment);
    const props = holdings.filter(isProperty);

    const byType: Record<string, number> = {
      Stocks: 0,
      Crypto: 0,
      ETFs: 0,
      Cash: 0,
      Property: 0,
    };

    for (const h of inv) {
      const px = typeof h.currentPrice === "number" ? h.currentPrice : h.buyPrice;
      const value = h.quantity * px;
      const key = categoryLabel(h.assetType);
      byType[key] += value;
    }

    for (const p of props) {
      const value = typeof p.currentValue === "number" ? p.currentValue : p.purchasePrice;
      byType.Property += value;
    }

    const total = Object.values(byType).reduce((s, v) => s + v, 0);

    const rows = Object.entries(byType)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ label: k, value: v, pct: percent(v, total) }))
      .sort((a, b) => b.value - a.value);

    return { total, rows };
  }, [holdings]);

  const chartSeries = useMemo(() => {
    // Placeholder “shape” until Finnhub history is available on your plan.
    const n = 24;
    const end = Math.max(0, totals.totalValue);
    const base = Math.max(0, end - totals.gain);
    const start = Math.max(0, base * 0.92);

    const points = Array.from({ length: n }, (_, i) => {
      const t = i / (n - 1);
      const wave = Math.sin(t * Math.PI * 2) * 0.012;
      const trend = start + (end - start) * (0.18 + 0.82 * t);
      return trend * (1 + wave);
    });

    return points;
  }, [totals.gain, totals.totalValue]);

  const donut = useMemo(() => {
    const radius = 44;
    const stroke = 10;
    const c = 2 * Math.PI * radius;

    const rows = allocation.rows.length ? allocation.rows : [{ label: "Cash", value: 1, pct: 100 }];
    let acc = 0;

    const segs = rows.map((r) => {
      const pctVal = clamp(r.pct, 0, 100);
      const len = (pctVal / 100) * c;
      const dash = `${len} ${c - len}`;
      const offset = (acc / 100) * c;
      acc += pctVal;
      return { ...r, dash, offset };
    });

    return { radius, stroke, c, segs };
  }, [allocation.rows]);

  const openModal = (tab: "investment" | "property") => {
    setFormError(null);
    setModalTab(tab);
    setModalOpen(true);

    // reset modal search state
    setSearchErr(null);
    setSearchResults([]);
    setSelectedSearch(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormError(null);
  };

  const resetInvestmentForm = () => {
    setInvAssetType("etf");
    setInvSymbol("");
    setInvName("");
    setInvQty("1");
    setInvBuyPrice("");
    setInvBuyDate(new Date().toISOString().slice(0, 10));
    setInvCurrentPrice("");
    setSearchErr(null);
    setSearchResults([]);
    setSelectedSearch(null);
  };

  const resetPropertyForm = () => {
    setPropType("house");
    setPropName("");
    setPropPurchasePrice("");
    setPropPurchaseDate(new Date().toISOString().slice(0, 10));
    setPropDeposit("");
    setPropRate("6.5");
    setPropTerm("30");
    setPropRentMonthly("");
    setPropOtherMonthly("0");
    setPropCurrentValue("");
  };

  // Property form
  const [propType, setPropType] = useState<PropertyType>("house");
  const [propName, setPropName] = useState("");
  const [propPurchasePrice, setPropPurchasePrice] = useState<string>("");
  const [propPurchaseDate, setPropPurchaseDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [propDeposit, setPropDeposit] = useState<string>("");
  const [propRate, setPropRate] = useState<string>("6.5");
  const [propTerm, setPropTerm] = useState<string>("30");
  const [propRentMonthly, setPropRentMonthly] = useState<string>("");
  const [propOtherMonthly, setPropOtherMonthly] = useState<string>("0");
  const [propCurrentValue, setPropCurrentValue] = useState<string>("");

  const [formError, setFormError] = useState<string | null>(null);

  // ---------- Modal search (Finnhub search endpoint) ----------
  useEffect(() => {
    if (!modalOpen || modalTab !== "investment") return;

    const term = invSymbol.trim();
    // only search once user typed enough to be meaningful
    if (term.length < 1) {
      setSearchErr(null);
      setSearchResults([]);
      setSelectedSearch(null);
      return;
    }

    const assetClass = invAssetType === "crypto" ? "crypto" : invAssetType === "stock" ? "stock" : "etf";

    const doSearch = async () => {
      setSearching(true);
      setSearchErr(null);

      // abort previous
      if (searchAbortRef.current) searchAbortRef.current.abort();
      const ac = new AbortController();
      searchAbortRef.current = ac;

      try {
        const url = `/api/market/search?q=${encodeURIComponent(term)}&assetClass=${encodeURIComponent(assetClass)}`;
        const r = await fetch(url, { signal: ac.signal });
        const json = await r.json().catch(() => null);

        if (!r.ok || !json?.ok) {
          const msg = (json && typeof json.error === "string" && json.error) || "Search failed";
          setSearchErr(msg);
          setSearchResults([]);
          setSelectedSearch(null);
          return;
        }

        const results: SearchResult[] = Array.isArray(json.results) ? json.results : [];
        setSearchResults(results.slice(0, 8));

        // auto-select if exact match
        const exact = results.find(
          (x) => x.providerSymbol.toLowerCase() === term.toLowerCase() || x.symbol.toLowerCase() === term.toLowerCase()
        );
        if (exact) {
          setSelectedSearch(exact);
          setInvName(exact.name || exact.symbol);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Search error";
        // ignore abort noise
        if (message.toLowerCase().includes("abort")) return;
        setSearchErr("Search error");
      } finally {
        setSearching(false);
      }
    };

    const t = window.setTimeout(doSearch, 250);
    return () => window.clearTimeout(t);
  }, [invSymbol, invAssetType, modalOpen, modalTab]);

  const applySearchSelection = (r: SearchResult) => {
    setSelectedSearch(r);
    setInvSymbol(r.symbol);
    setInvName(r.name || r.symbol);
  };

  // ---------- Live quotes (Finnhub free quote endpoint) ----------
  const refreshQuotes = async () => {
    const inv = holdings.filter(isInvestment);

    // only update holdings that can be quoted:
    // - stock/etf: providerSymbol OR symbol works
    // - crypto: providerSymbol strongly preferred (exchange-qualified)
    const quoteTargets = inv
      .map((h) => {
        const providerSymbol = (h.providerSymbol || h.symbol || "").trim();
        if (!providerSymbol) return null;
        if (h.assetType === "crypto" && !h.providerSymbol) return null; // avoid bad crypto symbols
        return { id: h.id, assetClass: h.assetType === "crypto" ? "crypto" : "stock", providerSymbol };
      })
      .filter(Boolean) as { id: string; assetClass: "stock" | "crypto"; providerSymbol: string }[];

    if (!quoteTargets.length) return;

    // abort previous quote
    if (quoteAbortRef.current) quoteAbortRef.current.abort();
    const ac = new AbortController();
    quoteAbortRef.current = ac;

    setQuoteStatus("updating");
    setQuoteError(null);

    try {
      // Do sequential to keep rate friendly on free tier.
      const updates: Record<string, { price?: number; ok: boolean }> = {};

      for (const t of quoteTargets) {
        const url = `/api/market/quote?providerSymbol=${encodeURIComponent(t.providerSymbol)}&assetClass=${encodeURIComponent(
          t.assetClass
        )}`;
        const r = await fetch(url, { signal: ac.signal });
        const json = await r.json().catch(() => null);

        if (!r.ok || !json?.ok) {
          updates[t.id] = { ok: false };
          continue;
        }

        const price = safeNumber(json?.quote?.price, NaN);
        if (!Number.isFinite(price) || price <= 0) {
          updates[t.id] = { ok: false };
          continue;
        }

        updates[t.id] = { ok: true, price };
      }

      const now = Date.now();
      setHoldings((prev) =>
        prev.map((h) => {
          if (h.kind !== "investment") return h;
          const u = updates[h.id];
          if (!u) return h;

          if (!u.ok) {
            return {
              ...h,
              // keep existing price, only mark timestamp if we have one
              lastPriceAt: h.lastPriceAt,
            };
          }

          return {
            ...h,
            currentPrice: u.price,
            lastPriceAt: now,
            priceSource: "live",
          };
        })
      );

      setQuoteStatus("idle");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Quote error";
      if (String(msg).toLowerCase().includes("abort")) return;
      setQuoteStatus("error");
      setQuoteError("Live pricing temporarily unavailable.");
    }
  };

  // initial + interval refresh
  useEffect(() => {
    refreshQuotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      refreshQuotes();
    }, 60_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdings]);

  const addInvestment = () => {
    setFormError(null);

    const symbol = invSymbol.trim();
    const name = invName.trim() || symbol || "Investment";
    const quantity = safeNumber(invQty, 0);
    const buyPrice = safeNumber(invBuyPrice, 0);
    const manualCurrent = invCurrentPrice.trim() ? safeNumber(invCurrentPrice, buyPrice) : undefined;

    if (!symbol) return setFormError("Enter a ticker/symbol.");
    if (quantity <= 0) return setFormError("Quantity must be greater than 0.");
    if (buyPrice <= 0) return setFormError("Buy price must be greater than 0.");
    if (!invBuyDate) return setFormError("Select a purchase date.");

    const providerSymbol = selectedSearch?.providerSymbol || (invAssetType !== "crypto" ? symbol : undefined);

    const next: InvestmentHolding = {
      id: uid(),
      kind: "investment",
      assetType: invAssetType,
      symbol,
      name,
      quantity,
      buyPrice,
      buyDate: invBuyDate,
      provider: "finnhub",
      providerSymbol,
      currentPrice: manualCurrent,
      priceSource: manualCurrent ? "manual" : undefined,
      lastPriceAt: manualCurrent ? Date.now() : undefined,
    };

    setHoldings((prev) => [next, ...prev]);
    resetInvestmentForm();
    closeModal();

    // refresh pricing shortly after adding
    window.setTimeout(() => {
      refreshQuotes();
    }, 250);
  };

  const addProperty = () => {
    setFormError(null);

    const name = propName.trim() || "Property";
    const purchasePrice = safeNumber(propPurchasePrice, 0);
    const deposit = safeNumber(propDeposit, 0);
    const rate = safeNumber(propRate, 0);
    const term = safeNumber(propTerm, 0);
    const rentMonthly = safeNumber(propRentMonthly, 0);
    const otherMonthly = safeNumber(propOtherMonthly, 0);
    const currentValue = propCurrentValue.trim() ? safeNumber(propCurrentValue, purchasePrice) : undefined;

    if (!name) return setFormError("Enter a property name.");
    if (purchasePrice <= 0) return setFormError("Purchase price must be greater than 0.");
    if (deposit < 0) return setFormError("Deposit cannot be negative.");
    if (!propPurchaseDate) return setFormError("Select a purchase date.");
    if (term <= 0) return setFormError("Term length must be greater than 0.");
    if (rate < 0) return setFormError("Interest rate cannot be negative.");

    const next: PropertyHolding = {
      id: uid(),
      kind: "property",
      propertyType: propType,
      name,
      purchasePrice,
      purchaseDate: propPurchaseDate,
      deposit,
      interestRatePct: rate,
      termYears: term,
      rentalIncomeMonthly: rentMonthly,
      otherMonthlyCosts: otherMonthly,
      currentValue,
    };

    setHoldings((prev) => [next, ...prev]);
    resetPropertyForm();
    closeModal();
  };

  const removeHolding = (id: string) => {
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  };

  const priceBadge = (h: InvestmentHolding) => {
    const ts = h.lastPriceAt;
    if (!ts || h.priceSource !== "live") return { label: "Manual", cls: "text-white/45 border-white/10 bg-white/5" };
    const ageMs = Date.now() - ts;
    if (ageMs <= 90_000) return { label: "Live", cls: "text-emerald-200 border-emerald-500/20 bg-emerald-500/10" };
    if (ageMs <= 5 * 60_000)
      return { label: "Stale", cls: "text-amber-200 border-amber-500/20 bg-amber-500/10" };
    return { label: "Old", cls: "text-white/50 border-white/10 bg-white/5" };
  };

  const HoldingRow: React.FC<{ holding: Holding }> = ({ holding }) => {
    if (holding.kind === "investment") {
      const px = typeof holding.currentPrice === "number" ? holding.currentPrice : holding.buyPrice;
      const value = holding.quantity * px;
      const cost = holding.quantity * holding.buyPrice;
      const gain = value - cost;
      const gainPct = cost > 0 ? (gain / cost) * 100 : 0;

      const initials = holding.symbol.slice(0, 2).toUpperCase();
      const badge = priceBadge(holding);

      return (
        <div className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-[#0b0b10] p-4 shadow-2xl shadow-black/40">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-sm font-semibold text-white/85">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{holding.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/55">
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                  {categoryLabel(holding.assetType)}
                </span>

                <span className={["rounded-full border px-2 py-0.5 text-[11px] font-semibold", badge.cls].join(" ")}>
                  {badge.label}
                </span>

                <span className="truncate">{holding.symbol}</span>
                <span className="text-white/35">•</span>
                <span>
                  {round2(holding.quantity)} @ {formatCurrency(holding.buyPrice, region)}
                </span>

                {typeof holding.currentPrice === "number" ? (
                  <>
                    <span className="text-white/35">•</span>
                    <span className="text-white/70">Price: {formatCurrency(holding.currentPrice, region)}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold text-white">{formatCurrency(value, region)}</p>
            <p className={["mt-1 text-xs font-semibold", gain >= 0 ? "text-emerald-300" : "text-red-300"].join(" ")}>
              {gain >= 0 ? "+" : ""}
              {formatCurrency(gain, region)} ({gainPct >= 0 ? "+" : ""}
              {round2(gainPct)}%)
            </p>

            <button
              type="button"
              onClick={() => removeHolding(holding.id)}
              className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35 transition hover:text-white/70"
            >
              Remove
            </button>
          </div>
        </div>
      );
    }

    // property
    const value = typeof holding.currentValue === "number" ? holding.currentValue : holding.purchasePrice;
    const loan = Math.max(0, holding.purchasePrice - Math.max(0, holding.deposit));
    const pmt = monthlyMortgagePayment(loan, holding.interestRatePct, holding.termYears);
    const netMonthly = holding.rentalIncomeMonthly - pmt - holding.otherMonthlyCosts;
    const equity = value - loan;

    return (
      <div className="rounded-3xl border border-white/10 bg-[#0b0b10] p-4 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{holding.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/55">
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">Property</span>
              <span className="capitalize">{holding.propertyType}</span>
              <span className="text-white/35">•</span>
              <span>
                Rate {round2(holding.interestRatePct)}% • {holding.termYears}y
              </span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold text-white">{formatCurrency(value, region)}</p>
            <p className="mt-1 text-xs text-white/55">Equity: {formatCurrency(equity, region)}</p>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/40">Rent</p>
            <p className="mt-1 text-sm font-semibold text-white">{formatCurrency(holding.rentalIncomeMonthly, region)}/mo</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/40">Mortgage</p>
            <p className="mt-1 text-sm font-semibold text-white">{formatCurrency(pmt, region)}/mo</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/40">Net Cashflow</p>
            <p className={["mt-1 text-sm font-semibold", netMonthly >= 0 ? "text-emerald-300" : "text-red-300"].join(" ")}>
              {formatCurrency(netMonthly, region)}/mo
            </p>
          </div>
        </div>

        <div className="mt-3 text-right">
          <button
            type="button"
            onClick={() => removeHolding(holding.id)}
            className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35 transition hover:text-white/70"
          >
            Remove
          </button>
        </div>
      </div>
    );
  };

  const TotalCard = () => {
    const isUp = totals.gain >= 0;
    const gainText = `${isUp ? "+" : ""}${formatCurrency(totals.gain, region)} (${isUp ? "+" : ""}${round2(
      totals.gainPct
    )}%)`;

    const w = 320;
    const h = 110;
    const pad = 10;
    const minV = Math.min(...chartSeries);
    const maxV = Math.max(...chartSeries);
    const span = Math.max(1e-9, maxV - minV);

    const pts = chartSeries.map((v, i) => {
      const x = pad + (i / (chartSeries.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (v - minV) / span) * (h - pad * 2);
      return { x, y };
    });

    const path = pts
      .map((p, i) => (i === 0 ? `M ${p.x.toFixed(2)} ${p.y.toFixed(2)}` : `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`))
      .join(" ");

    const area = `${path} L ${pts[pts.length - 1].x.toFixed(2)} ${(h - pad).toFixed(2)} L ${pts[0].x.toFixed(
      2
    )} ${(h - pad).toFixed(2)} Z`;

    return (
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b10] shadow-2xl shadow-black/50">
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#6d28d9]/25 blur-3xl" />
          <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-[#a855f7]/15 blur-3xl" />
        </div>

        <div className="relative p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/55">Total Balance</p>
              <p className="mt-2 text-3xl font-semibold text-white">{formatCurrency(totals.totalValue, region)}</p>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className={["font-semibold", isUp ? "text-emerald-300" : "text-red-300"].join(" ")}>{gainText}</span>
                <span className="text-white/35">All time</span>
                <span className="text-white/35">•</span>
                <span className="text-white/55">Finnhub free: live quotes</span>
              </div>

              {quoteStatus !== "idle" || quoteError ? (
                <div className="mt-2 text-xs text-white/55">
                  {quoteStatus === "updating" ? "Updating live prices…" : null}
                  {quoteError ? ` ${quoteError}` : null}
                </div>
              ) : null}
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
              <div className="h-5 w-5 rounded-md border border-white/20 bg-white/5" />
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-3">
            <svg viewBox={`0 0 ${w} ${h}`} className="h-[110px] w-full">
              <defs>
                <linearGradient id="mab_area" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(168,85,247,0.35)" />
                  <stop offset="100%" stopColor="rgba(168,85,247,0.0)" />
                </linearGradient>
              </defs>

              <path d={area} fill="url(#mab_area)" />
              <path d={path} fill="none" stroke="rgba(168,85,247,0.9)" strokeWidth="2.5" />
            </svg>
          </div>
        </div>
      </section>
    );
  };

  const AllocationCard = () => {
    return (
      <section className="rounded-3xl border border-white/10 bg-[#0b0b10] p-5 shadow-2xl shadow-black/40 sm:p-6">
        <h2 className="text-lg font-semibold text-white">Allocation</h2>

        <div className="mt-4 grid gap-6 sm:grid-cols-[140px_1fr] sm:items-center">
          <div className="flex items-center justify-center">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <g transform="translate(60,60)">
                <circle r={donut.radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={donut.stroke} />
              </g>

              <g transform="translate(60,60)">
                {donut.segs.map((s) => (
                  <g
                    key={`${s.label}-color`}
                    className={
                      s.label === "Stocks"
                        ? "text-violet-400"
                        : s.label === "Crypto"
                        ? "text-emerald-400"
                        : s.label === "ETFs"
                        ? "text-sky-400"
                        : s.label === "Cash"
                        ? "text-slate-300"
                        : "text-amber-300"
                    }
                  >
                    <circle
                      r={donut.radius}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={donut.stroke}
                      strokeLinecap="round"
                      strokeDasharray={s.dash}
                      strokeDashoffset={-s.offset}
                    />
                  </g>
                ))}
                <circle r={donut.radius - donut.stroke} fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.06)" />
              </g>
            </svg>
          </div>

          <div className="space-y-3">
            {allocation.rows.length ? (
              allocation.rows.map((r) => (
                <div key={r.label} className="flex items-center justify-between gap-4 text-sm">
                  <div className="flex items-center gap-3">
                    <span className={["h-2.5 w-2.5 rounded-full", dotClassByCategory(r.label)].join(" ")} />
                    <span className="font-semibold text-white/80">{r.label}</span>
                  </div>
                  <span className="font-semibold text-white/80">{round2(r.pct)}%</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-white/60">Add holdings to see allocation.</p>
            )}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="relative flex flex-col gap-6">
      {/* Top bar (page-local) */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => pushAppRoute("/app/dashboard")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#0b0b10] text-white/80 transition hover:border-white/20 hover:text-white"
            aria-label="Back"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>

          <div>
            <h1 className="text-2xl font-semibold text-white">Portfolio</h1>
            <p className="text-sm text-white/55">Performance &amp; Allocation</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#0b0b10] text-white/70 transition hover:border-white/20 hover:text-white"
            aria-label="Notifications"
          >
            <BellIcon className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => openModal("investment")}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
          >
            <PlusIcon className="h-5 w-5" />
            Add
          </button>
        </div>
      </div>

      {/* Total balance card */}
      <TotalCard />

      {/* Allocation */}
      <AllocationCard />

      {/* Holdings */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Holdings</h2>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <div className="relative flex-1 sm:w-[320px]">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search holdings…"
                className="h-11 w-full rounded-2xl border border-white/10 bg-[#0b0b10] pl-10 pr-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/20"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="h-11 rounded-2xl border border-white/10 bg-[#0b0b10] px-3 text-sm font-semibold text-white/80 outline-none transition focus:border-white/20"
            >
              <option value="value">Sort: Value</option>
              <option value="pnl">Sort: P&amp;L</option>
              <option value="name">Sort: Name</option>
              <option value="type">Sort: Type</option>
            </select>

            <button
              type="button"
              onClick={() => openModal("property")}
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-[#0b0b10] px-4 text-sm font-semibold text-white/80 transition hover:border-white/20 hover:text-white"
            >
              + Property
            </button>
          </div>
        </div>

        {filteredHoldings.length ? (
          <div className="grid gap-3">
            {filteredHoldings.map((h) => (
              <HoldingRow key={h.id} holding={h} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-[#0b0b10] p-6 text-sm text-white/60">
            No holdings yet. Add investments or properties to track your portfolio.
          </div>
        )}

        <div className="text-xs text-white/45">
          Educational tracking only. No recommendations. Live quotes are fetched server-side (Finnhub free plan).
        </div>
      </section>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70" onClick={closeModal} />
          <div className="absolute left-1/2 top-1/2 w-[min(680px,92vw)] -translate-x-1/2 -translate-y-1/2">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b10] shadow-2xl shadow-black/70">
              <div className="pointer-events-none absolute inset-0 opacity-80">
                <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#6d28d9]/20 blur-3xl" />
                <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-[#a855f7]/10 blur-3xl" />
              </div>

              <div className="relative p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">Add holding</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">
                      {modalTab === "investment" ? "Investment" : "Property"}
                    </h3>
                    <p className="mt-1 text-sm text-white/55">
                      {modalTab === "investment"
                        ? "Search and select a symbol for live pricing. Manual prices are optional."
                        : "Track purchase, loan terms, rent, and net monthly cashflow."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-white/75 transition hover:border-white/20 hover:text-white"
                    aria-label="Close"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalTab("investment")}
                    className={[
                      "rounded-2xl border px-4 py-2 text-sm font-semibold transition",
                      modalTab === "investment"
                        ? "border-white/10 bg-[#2a0f4d] text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
                    ].join(" ")}
                  >
                    Investment
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab("property")}
                    className={[
                      "rounded-2xl border px-4 py-2 text-sm font-semibold transition",
                      modalTab === "property"
                        ? "border-white/10 bg-[#2a0f4d] text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
                    ].join(" ")}
                  >
                    Property
                  </button>
                </div>

                {formError ? (
                  <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-200">
                    {formError}
                  </div>
                ) : null}

                {modalTab === "investment" ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <label className="text-sm text-white/70">
                      Asset type
                      <select
                        value={invAssetType}
                        onChange={(e) => {
                          setInvAssetType(e.target.value as AssetType);
                          setSelectedSearch(null);
                          setSearchResults([]);
                          setSearchErr(null);
                        }}
                        className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none transition focus:border-white/20"
                      >
                        <option value="stock">Stocks</option>
                        <option value="etf">ETFs</option>
                        <option value="crypto">Crypto</option>
                        <option value="cash">Cash</option>
                      </select>
                    </label>

                    <label className="text-sm text-white/70">
                      Ticker / Symbol
                      <input
                        value={invSymbol}
                        onChange={(e) => {
                          setInvSymbol(e.target.value);
                          setSelectedSearch(null);
                        }}
                        placeholder={invAssetType === "crypto" ? "e.g. BTC, ETH" : "e.g. VTS, AAPL"}
                        className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-white/20"
                      />
                    </label>

                    {/* search results */}
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Search</p>
                        <p className="text-xs text-white/45">{searching ? "Searching…" : null}</p>
                      </div>

                      {searchErr ? (
                        <div className="mt-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                          {searchErr}
                        </div>
                      ) : null}

                      {searchResults.length ? (
                        <div className="mt-2 grid gap-2">
                          {searchResults.map((r) => {
                            const active = selectedSearch?.providerSymbol === r.providerSymbol;
                            return (
                              <button
                                key={r.providerSymbol}
                                type="button"
                                onClick={() => applySearchSelection(r)}
                                className={[
                                  "flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-left text-sm transition",
                                  active
                                    ? "border-white/10 bg-[#2a0f4d] text-white"
                                    : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
                                ].join(" ")}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">{r.symbol}</span>
                                    <span className="text-xs text-white/45">{r.assetClass}</span>
                                  </div>
                                  <p className="truncate text-xs text-white/55">{r.name}</p>
                                </div>
                                <span className="text-xs text-white/45">Select</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-white/45">
                          Type a symbol to search (Finnhub). Select one result for best live pricing.
                        </p>
                      )}
                    </div>

                    <label className="text-sm text-white/70 sm:col-span-2">
                      Name
                      <input
                        value={invName}
                        onChange={(e) => setInvName(e.target.value)}
                        placeholder="Auto-fills when you select search result"
                        className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-white/20"
                      />
                    </label>

                    <label className="text-sm text-white/70">
                      Quantity
                      <input
                        value={invQty}
                        onChange={(e) => setInvQty(e.target.value)}
                        inputMode="decimal"
                        className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none transition focus:border-white/20"
                      />
                    </label>

                    <label className="text-sm text-white/70">
                      Buy price (per unit)
                      <input
                        value={invBuyPrice}
                        onChange={(e) => setInvBuyPrice(e.target.value)}
                        inputMode="decimal"
                        placeholder="e.g. 102.50"
                        className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-white/20"
                      />
                    </label>

                    <label className="text-sm text-white/70">
                      Buy date
                      <input
                        type="date"
                        value={invBuyDate}
                        onChange={(e) => setInvBuyDate(e.target.value)}
                        className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none transition focus:border-white/20"
                      />
                    </label>

                    <label className="text-sm text-white/70">
                      Current price (optional)
                      <input
                        value={invCurrentPrice}
                        onChange={(e) => setInvCurrentPrice(e.target.value)}
                        inputMode="decimal"
                        placeholder="Optional manual override"
                        className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-white/20"
                      />
                    </label>

                    <div className="mt-2 flex flex-wrap gap-2 sm:col-span-2">
                      <button
                        type="button"
                        onClick={addInvestment}
                        className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-[#2a0f4d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#36105f]"
                      >
                        Add investment
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          resetInvestmentForm();
                          closeModal();
                        }}
                        className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="sm:col-span-2 text-xs text-white/45">
                      Tip: For crypto, select a result like <span className="text-white/70">BINANCE:BTCUSDT</span> so live
                      pricing works reliably on Finnhub free.
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <label className="text-sm text-white/70">
                      Property type
                      <select
                        value={propType}
                        onChange={(e) => setPropType(e.target.value as PropertyType)}
                        className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none transition focus:border-white/20"
                      >
                        <option value="house">House</option>
                        <option value="apartment">Apartment</option>
                        <option value="unit">Unit</option>
                        <option value="townhouse">Townhouse</option>
                        <option value="land">Land</option>
                      </select>
                    </label>

                    <label className="text-sm text-white/70">
                      Name
                      <input
                        value={propName}
                        onChange={(e) => setPropName(e.target.value)}
                        placeholder="e.g. IP1 - Brisbane"
                        className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-white/20"
                      />
                    </label>

                    <label className="text-sm text-white/70">
                      Purchase price
                      <input
                        value={propPurchasePrice}
                        onChange={(e) => setPropPurchasePrice(e.target.value)}
                        inputMode="decimal"
                        placeholder="e.g. 650000"
                        className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-white/20"
                      />
                    </label>

                    <label className="text-sm text-white/70">
                      Deposit
                      <input
                        value={propDeposit}
                        onChange={(e) => setPropDeposit(e.target.value)}
                        inputMode="decimal"
                        placeholder="e.g. 130000"
                        className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-white/20"
                      />
                    </label>

                    <label className="text-sm text-white/70">
                      Interest rate (%)
                      <input
                        value={propRate}
                        onChange={(e) => setPropRate(e.target.value)}
                        inputMode="decimal"
                        className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none transition focus:border-white/20"
                      />
                    </label>

                    <label className="text-sm text-white/70">
                      Term (years)
                      <input
                        value={propTerm}
                        onChange={(e) => setPropTerm(e.target.value)}
                        inputMode="numeric"
                        className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none transition focus:border-white/20"
                      />
                    </label>

                    <label className="text-sm text-white/70">
                      Rental income (monthly)
                      <input
                        value={propRentMonthly}
                        onChange={(e) => setPropRentMonthly(e.target.value)}
                        inputMode="decimal"
                        placeholder="e.g. 2800"
                        className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-white/20"
                      />
                    </label>

                    <label className="text-sm text-white/70">
                      Other monthly costs
                      <input
                        value={propOtherMonthly}
                        onChange={(e) => setPropOtherMonthly(e.target.value)}
                        inputMode="decimal"
                        placeholder="insurance/maintenance"
                        className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-white/20"
                      />
                    </label>

                    <label className="text-sm text-white/70">
                      Purchase date
                      <input
                        type="date"
                        value={propPurchaseDate}
                        onChange={(e) => setPropPurchaseDate(e.target.value)}
                        className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none transition focus:border-white/20"
                      />
                    </label>

                    <label className="text-sm text-white/70">
                      Current value (optional)
                      <input
                        value={propCurrentValue}
                        onChange={(e) => setPropCurrentValue(e.target.value)}
                        inputMode="decimal"
                        placeholder="Manual estimate"
                        className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-white/20"
                      />
                    </label>

                    <div className="mt-2 flex flex-wrap gap-2 sm:col-span-2">
                      <button
                        type="button"
                        onClick={addProperty}
                        className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-[#2a0f4d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#36105f]"
                      >
                        Add property
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          resetPropertyForm();
                          closeModal();
                        }}
                        className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;

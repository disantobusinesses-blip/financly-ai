import express from "express";

export const router = express.Router();

router.get("/api/geo", (req, res) => {
  const headerCountry = (
    (req.headers["x-vercel-ip-country"] as string | undefined) ||
    (req.headers["cf-ipcountry"] as string | undefined) ||
    (req.headers["x-country"] as string | undefined) ||
    (req.headers["x-country-code"] as string | undefined)
  )?.toString();

  const queryCountry = typeof req.query.country === "string" ? req.query.country : undefined;

  const fallbackCountry =
    process.env.NODE_ENV === "production"
      ? process.env.DEFAULT_COUNTRY || "UNKNOWN"
      : process.env.DEFAULT_COUNTRY || "AU";

  const country = (queryCountry || headerCountry || fallbackCountry || "UNKNOWN").toUpperCase();

  res.json({
    country,
    source: queryCountry ? "query" : headerCountry ? "header" : "fallback",
  });
});

import express from "express";
import { categorizeMany } from "../../lib/categorize";
import type { Tx } from "../../lib/categorize";

export const router = express.Router();

router.post("/api/categorize", async (req, res) => {
  try {
    const txs: Tx[] = Array.isArray(req.body?.transactions)
      ? req.body.transactions
      : [];
    const result = await categorizeMany(txs);
    res.json({ items: result });
  } catch (error) {
    res
      .status(500)
      .json({ error: "categorization_failed", detail: (error as Error).message });
  }
});

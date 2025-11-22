import express from "express";
import { router as categorizeRouter } from "./routes/categorize";
import { router as geoRouter } from "./routes/geo";
import { router as plansRouter } from "./routes/plans";

export const app = express();

app.use(express.json());
app.use(categorizeRouter);
app.use(geoRouter);
app.use(plansRouter);

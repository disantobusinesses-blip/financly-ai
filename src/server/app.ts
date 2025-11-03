import express from "express";
import { router as categorizeRouter } from "./routes/categorize";

export const app = express();

app.use(express.json());
app.use(categorizeRouter);

import { promises as fs } from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "api", "_data", "ai-cache.json");

const defaultStore = () => ({ reports: [] });

async function readStore() {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return defaultStore();
    }
    throw error;
  }
}

async function writeStore(store) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(store, null, 2));
}

export async function getCachedReport(key) {
  const store = await readStore();
  return (
    store.reports.find(
      (report) =>
        report.userId === key.userId &&
        report.month === key.month &&
        report.year === key.year
    ) || null
  );
}

export async function saveReport(record) {
  const store = await readStore();
  const index = store.reports.findIndex(
    (report) =>
      report.userId === record.userId &&
      report.month === record.month &&
      report.year === record.year
  );

  if (index >= 0) {
    store.reports[index] = { ...store.reports[index], ...record };
  } else {
    store.reports.push(record);
  }

  await writeStore(store);
  return record;
}


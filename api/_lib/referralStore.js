import { promises as fs } from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "api", "_data", "referrals.json");

const defaultStore = () => ({ profiles: [], referrals: [] });

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
  await fs.writeFile(DATA_PATH, JSON.stringify(store, null, 2));
}

export async function upsertProfile(profile) {
  const store = await readStore();
  const idx = store.profiles.findIndex((item) => item.userId === profile.userId);
  const payload = { ...profile, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    store.profiles[idx] = { ...store.profiles[idx], ...payload };
  } else {
    store.profiles.push(payload);
  }
  await writeStore(store);
  return payload;
}

export async function getProfile(userId) {
  const store = await readStore();
  return store.profiles.find((item) => item.userId === userId) || null;
}

export async function listReferralsByReferrer(referrerId) {
  const store = await readStore();
  return store.referrals.filter((item) => item.referrerId === referrerId);
}

export async function findReferralByReferredUser(referredUserId) {
  const store = await readStore();
  return store.referrals.find((item) => item.referredUserId === referredUserId) || null;
}

export async function createOrGetReferral(payload) {
  const store = await readStore();
  const normalisedEmail = payload.referredEmail.toLowerCase();
  const existing = store.referrals.find(
    (item) =>
      item.referrerId === payload.referrerId &&
      item.referredEmail.toLowerCase() === normalisedEmail
  );

  if (existing) {
    if (!existing.referredUserId && payload.referredUserId) {
      existing.referredUserId = payload.referredUserId;
      existing.updatedAt = new Date().toISOString();
      await writeStore(store);
    }
    return existing;
  }

  const now = new Date().toISOString();
  const record = {
    id: `ref_${Date.now()}`,
    referrerId: payload.referrerId,
    referredEmail: normalisedEmail,
    referredUserId: payload.referredUserId,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  store.referrals.push(record);
  await writeStore(store);
  return record;
}

export async function markReferralStatus(id, status, extra = {}) {
  const store = await readStore();
  const idx = store.referrals.findIndex((item) => item.id === id);
  if (idx === -1) {
    return null;
  }
  const now = new Date().toISOString();
  store.referrals[idx] = {
    ...store.referrals[idx],
    status,
    updatedAt: now,
    ...(status === "rewarded" ? { rewardedAt: now } : {}),
    ...extra,
  };
  await writeStore(store);
  return store.referrals[idx];
}

export async function ensureStore() {
  try {
    await fs.access(DATA_PATH);
  } catch {
    await writeStore(defaultStore());
  }
}


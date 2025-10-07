// src/services/BankingService.ts
import { Account, Transaction } from "../types";

// ✅ Live only — no demo fallback
export class BankingService {
  static async getAccounts(userId: string): Promise<Account[]> {
    if (!userId) return [];
    const res = await fetch(`/api/basiq-data?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error(`Failed to fetch accounts: ${res.status}`);
    const data = await res.json();
    return data.accounts || [];
  }

  static async getTransactions(userId: string): Promise<Transaction[]> {
    if (!userId) return [];
    const res = await fetch(`/api/basiq-data?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.status}`);
    const data = await res.json();
    return data.transactions || [];
  }
}

// Still handles Basiq consent session
// src/services/BankingService.ts
export async function initiateBankConnection(email: string): Promise<{ consentUrl: string; userId: string }> {
  try {
    const res = await fetch("/api/create-consent-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // ✅ Ensure JSON body is sent
      body: JSON.stringify({ email }),
    });

    // ✅ Debug logs for Vercel runtime and frontend console
    console.log("Basiq Connect → Request sent:", res.status, res.statusText);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Backend returned ${res.status}: ${errText}`);
    }

    const data = await res.json();

    if (!data.consentUrl || !data.userId) {
      throw new Error("Invalid response from server. Missing consentUrl or userId.");
    }

    // ✅ Store userId so /api/basiq-data can use it later
    localStorage.setItem("basiqUserId", data.userId);

    // ✅ Open Basiq consent page
    window.location.href = data.consentUrl;
  } catch (err: any) {
    console.error("❌ initiateBankConnection failed:", err);
    alert("Unable to connect bank right now. Please try again later.");
    throw err;
  }
}

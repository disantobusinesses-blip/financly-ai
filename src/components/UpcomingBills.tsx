import { useMemo } from "react";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";

import Card from "./Card";
import { Transaction } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/currency";

interface UpcomingBillsProps {
  transactions: Transaction[];
}

interface BillEstimate {
  name: string;
  dueDate: string;
  amount: number;
}

const BILL_KEYWORDS = [/rent/i, /mortgage/i, /utility/i, /insurance/i, /bill/i, /loan/i];

export default function UpcomingBills({ transactions }: UpcomingBillsProps) {
  const { user } = useAuth();
  const region = user?.region ?? "AU";

  const bills = useMemo<BillEstimate[]>(() => {
    const grouped = new Map<string, { total: number; lastDate: Date }>();

    transactions.forEach((txn) => {
      if (txn.amount >= 0) return;
      const matchesKeyword = BILL_KEYWORDS.some((regex) => regex.test(txn.description));
      if (!matchesKeyword) return;

      const key = txn.description.trim().toLowerCase();
      const spend = Math.abs(txn.amount);
      const txnDate = new Date(txn.date);
      const entry = grouped.get(key);
      if (entry) {
        entry.total = Math.max(entry.total, spend);
        if (txnDate > entry.lastDate) {
          entry.lastDate = txnDate;
        }
      } else {
        grouped.set(key, { total: spend, lastDate: txnDate });
      }
    });

    return Array.from(grouped.entries())
      .map(([name, value]) => {
        const due = new Date(value.lastDate.getTime());
        due.setMonth(due.getMonth() + 1);
        return {
          name: name.replace(/\b[a-z]/g, (char) => char.toUpperCase()),
          amount: value.total,
          dueDate: due.toISOString(),
        };
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 6);
  }, [transactions]);

  const totalDue = bills.reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <Card
      title="Upcoming bills"
      subtitle="Stay on top of every direct debit and avoid late fees."
      icon={<CalendarDaysIcon className="h-6 w-6" />}
      insights={[
        { label: "Bills", value: String(bills.length) },
        { label: "Due soon", value: formatCurrency(totalDue, region) },
      ]}
    >
      {bills.length === 0 ? (
        <p className="text-sm text-slate-500">No upcoming bills detected.</p>
      ) : (
        <ul className="space-y-3 text-sm text-slate-600">
          {bills.map((bill) => {
            const date = new Date(bill.dueDate);
            const label = Number.isNaN(date.getTime())
              ? "Pending"
              : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

            return (
              <li
                key={`${bill.name}-${bill.dueDate}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{bill.name}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Due {label}</p>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {formatCurrency(bill.amount, region)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

import { Account } from "../types";
import Card from "./Card";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/currency";
import { formatTransactionDate } from "../utils/transactions";

interface UpcomingBillsProps {
  accounts: Account[];
}

export default function UpcomingBills({ accounts }: UpcomingBillsProps) {
  const linkedCount = accounts?.length ?? 0;
  const { user } = useAuth();
  const region = user?.region ?? "AU";
  const locale = region === "US" ? "en-US" : "en-AU";

  const mockBills = [
    { id: "1", name: "Electricity", due: "2025-09-25", amount: 120 },
    { id: "2", name: "Internet", due: "2025-09-28", amount: 80 },
    { id: "3", name: "Water", due: "2025-10-03", amount: 60 },
  ];

  const totalDue = mockBills.reduce((sum, bill) => sum + bill.amount, 0);
  const nextBill = mockBills[0];

  return (
    <Card
      title="Upcoming bills"
      subtitle="Plan ahead for the next wave of invoices so nothing surprises your cash flow."
      insights={[
        { label: "Linked", value: `${linkedCount} accounts` },
        {
          label: "Due this cycle",
          value: formatCurrency(totalDue, region),
          tone: "negative",
        },
        nextBill
          ? {
              label: "Next due",
              value: formatTransactionDate(nextBill.due, locale),
            }
          : { label: "Next due", value: "None" },
      ]}
    >
      <ul className="divide-y divide-white/10 text-sm">
        {mockBills.map((bill) => (
          <li
            key={bill.id}
            className="flex flex-wrap items-center justify-between gap-4 py-3"
          >
            <div>
              <p className="text-base font-semibold text-white">{bill.name}</p>
              <p className="text-xs uppercase tracking-wide text-white/60">
                Due {formatTransactionDate(bill.due, locale)}
              </p>
            </div>
            <span className="text-lg font-semibold text-rose-200">
              {formatCurrency(bill.amount, region)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

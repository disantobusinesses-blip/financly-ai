import { Account } from "../types";
import Card from "./Card";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/currency";
import { formatTransactionDate } from "../utils/transactions";

interface UpcomingBillsProps {
  accounts: Account[];
}

export default function UpcomingBills({ accounts }: UpcomingBillsProps) {
  const linkedCount = accounts?.length ?? 0; // uses the prop
  const { user } = useAuth();
  const region = user?.region ?? "AU";
  const locale = region === "US" ? "en-US" : "en-AU";

  // TODO: replace with real bills once available
  const mockBills = [
    { id: "1", name: "Electricity", due: "2025-09-25", amount: 120 },
    { id: "2", name: "Internet", due: "2025-09-28", amount: 80 },
  ];

  return (
    <Card title="Upcoming Bills">
      <p className="text-xs text-text-secondary mb-2">
        {linkedCount} linked account{linkedCount === 1 ? "" : "s"}
      </p>
      <ul className="divide-y text-sm">
        {mockBills.map((bill) => (
          <li key={bill.id} className="flex justify-between py-2">
            <span>
              <span className="block font-medium text-text-primary">
                {bill.name}
              </span>
              <span className="text-xs text-text-secondary">
                Due {formatTransactionDate(bill.due, locale)}
              </span>
            </span>
            <span className="font-bold text-red-500">
              {formatCurrency(-bill.amount, region)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

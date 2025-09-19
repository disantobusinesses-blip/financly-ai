import { Account } from "../types";
import Card from "./Card";

interface UpcomingBillsProps {
  accounts: Account[];
}

export default function UpcomingBills({ accounts }: UpcomingBillsProps) {
  const linkedCount = accounts?.length ?? 0; // uses the prop

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
            <span>{bill.name} (due {bill.due})</span>
            <span className="font-bold text-red-500">
              -${bill.amount.toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

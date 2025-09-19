import { Account } from "../types";
import Card from "./Card";

interface UpcomingBillsProps {
  accounts: Account[];
}

export default function UpcomingBills({ accounts }: UpcomingBillsProps) {
  // Example logic: bills come from negative balances or tagged accounts.
  // Replace with your own API once you store bill info.
  const mockBills = [
    { id: "1", name: "Electricity", due: "2025-09-25", amount: 120 },
    { id: "2", name: "Internet", due: "2025-09-28", amount: 80 },
  ];

  return (
    <Card title="Upcoming Bills">
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

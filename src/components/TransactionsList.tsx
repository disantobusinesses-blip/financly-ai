import { Transaction } from "../types";
import Card from "./Card";
import { formatCurrency } from "../utils/currency";
import { useAuth } from "../contexts/AuthContext";

// Simple category mapping helper
function mapCategory(txn: Transaction): string {
  const desc = txn.description?.toLowerCase() || "";
  if (desc.includes("salary")) return "Income";
  if (desc.includes("coles") || desc.includes("woolworth")) return "Groceries";
  if (desc.includes("afterpay")) return "Debt";
  if (desc.includes("spotify") || desc.includes("netflix")) return "Entertainment";
  if (desc.includes("rent") || desc.includes("mortgage")) return "Housing";
  if (desc.includes("uber") || desc.includes("fuel") || desc.includes("petrol")) return "Transport";
  return "Other";
}

export default function TransactionsList({ transactions }: { transactions: Transaction[] }) {
  const { user } = useAuth();
  const region = user?.region || "AU";

  // Sort directly — no useMemo needed
  const sortedTxns = [...transactions].sort(
    (a: Transaction, b: Transaction) => Date.parse(b.date) - Date.parse(a.date)
  );

  return (
    <Card title="Recent Transactions">
      <div className="overflow-y-auto max-h-96 divide-y divide-gray-800">
        {sortedTxns.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">
            No transactions yet.
          </p>
        ) : (
          sortedTxns.map((txn: Transaction) => {
            const category = mapCategory(txn);
            const amountColor = txn.amount < 0 ? "text-red-400" : "text-green-400";
            const dateObject = new Date(txn.date);
            const formattedDate = Number.isNaN(dateObject.getTime())
              ? "Date unavailable"
              : dateObject.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                });
            return (
              <div
                key={txn.id}
                className="flex justify-between items-center py-2 px-1 hover:bg-white/5 transition rounded-md"
              >
                <div>
                  <p className="text-white text-sm font-medium">
                    {txn.description || "Unnamed"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formattedDate} · {category}
                  </p>
                </div>
                <p className={`font-semibold ${amountColor}`}>
                  {formatCurrency(txn.amount, region)}
                </p>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
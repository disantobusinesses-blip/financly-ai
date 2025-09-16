import Card from "./Card";

export default function BalanceSummary() {
  const balances = [
    { name: "Checking", amt: 2143.19 },
    { name: "Savings", amt: 12157.42 },
    { name: "Credit", amt: -532.77 },
  ];
  const total = balances.reduce((s, b) => s + b.amt, 0);

  return (
    <Card title="Balances">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-semibold">${total.toFixed(2)}</div>
          <p className="text-xs text-gray-500">Total across accounts</p>
        </div>
        <ul className="text-xs text-right">
          {balances.map((b) => (
            <li key={b.name} className="text-gray-600">
              {b.name}:{" "}
              <span className={b.amt < 0 ? "text-red-600" : "text-gray-900"}>
                ${b.amt.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

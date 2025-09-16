import Card from "./Card";

const cats = [
  { name: "Groceries", amt: 412 },
  { name: "Rent", amt: 1800 },
  { name: "Transport", amt: 160 },
  { name: "Dining", amt: 235 },
];

export default function SpendingByCategory() {
  return (
    <Card title="Top categories (30d)">
      <ul className="space-y-1">
        {cats.map((c) => (
          <li key={c.name} className="flex justify-between text-sm">
            <span className="text-gray-600">{c.name}</span>
            <span className="font-medium">${c.amt.toFixed(0)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

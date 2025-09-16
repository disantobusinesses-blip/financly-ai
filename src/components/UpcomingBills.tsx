import Card from "./Card";

const bills = [
  { name: "Spotify", date: "20 Sep", amt: 12.99 },
  { name: "Electricity", date: "25 Sep", amt: 89.5 },
  { name: "Rent", date: "01 Oct", amt: 1800.0 },
];

export default function UpcomingBills() {
  return (
    <Card title="Upcoming bills">
      <ul className="space-y-1">
        {bills.map((b) => (
          <li key={b.name} className="flex justify-between text-sm">
            <div className="text-gray-700">{b.name}</div>
            <div className="text-right">
              <div className="font-medium">${b.amt.toFixed(2)}</div>
              <div className="text-xs text-gray-500">{b.date}</div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

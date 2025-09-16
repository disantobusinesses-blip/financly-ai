import Card from "./Card";

export default function SubscriptionCard() {
  const status = "Free"; // replace with real status

  return (
    <Card title="Subscription">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-base font-semibold">{status}</div>
          <p className="text-xs text-gray-500">Upgrade for Pro insights</p>
        </div>
        <a
          href="/upgrade"
          className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-medium"
        >
          Upgrade
        </a>
      </div>
    </Card>
  );
}

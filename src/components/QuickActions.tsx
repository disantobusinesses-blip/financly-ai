export default function QuickActions() {
  return (
    <div className="flex items-center gap-2">
      <a href="/connect" className="rounded-md border px-2 py-1 text-xs">Connect bank</a>
      <a href="/add" className="rounded-md border px-2 py-1 text-xs">Add txn</a>
    </div>
  );
}

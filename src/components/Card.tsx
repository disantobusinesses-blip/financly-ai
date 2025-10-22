export default function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-3">
      <h2 className="text-sm font-medium text-gray-700 mb-2">{title}</h2>
      {children}
    </div>
  );
}

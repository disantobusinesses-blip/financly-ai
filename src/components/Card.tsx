export default function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="futuristic-card rounded-2xl border border-white/10 p-5 text-white">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary-light">{title}</h2>
      {children}
    </div>
  );
}

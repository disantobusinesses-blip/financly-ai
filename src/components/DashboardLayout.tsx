import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-neutral-950">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>
    </div>
  );
}

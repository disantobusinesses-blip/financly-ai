import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar handles mobile collapse */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 bg-gray-50">
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}

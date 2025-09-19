import { useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { setIsUpgradeModalOpen } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    window.location.href = "/login";
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden p-2 m-2 rounded-md border hover:bg-gray-100 dark:hover:bg-neutral-800"
        onClick={() => setIsOpen(true)}
      >
        <Bars3Icon className="h-6 w-6 text-gray-700 dark:text-neutral-200" />
      </button>

      {/* Mobile sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <aside className="relative z-50 w-64 bg-white dark:bg-neutral-900 border-r min-h-screen p-4 space-y-4 shadow-lg">
            <button
              className="absolute top-4 right-4 p-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800"
              onClick={() => setIsOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-gray-700 dark:text-neutral-200" />
            </button>
            <h2 className="font-bold text-lg mb-6 text-neutral-900 dark:text-neutral-100">Menu</h2>

            <button
              className="w-full text-left p-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={() => { setIsUpgradeModalOpen(true); setIsOpen(false); }}
            >
              Upgrade to Pro
            </button>

            <button
              className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800"
              onClick={() => { window.location.href = "/create-user"; setIsOpen(false); }}
            >
              Create User
            </button>
            <button
              className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800"
              onClick={() => { window.location.href = "/subscriptions"; setIsOpen(false); }}
            >
              View Subscriptions
            </button>
            <button
              className="w-full text-left p-2 rounded text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
              onClick={handleLogout}
            >
              Logout
            </button>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 bg-white dark:bg-neutral-900 border-r min-h-screen p-4 space-y-4">
        <h2 className="font-bold text-lg mb-4 text-neutral-900 dark:text-neutral-100">Menu</h2>
        <button
          className="w-full text-left p-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
          onClick={() => setIsUpgradeModalOpen(true)}
        >
          Upgrade to Pro
        </button>
        <button
          className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800"
          onClick={() => (window.location.href = "/create-user")}
        >
          Create User
        </button>
        <button
          className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800"
          onClick={() => (window.location.href = "/subscriptions")}
        >
          View Subscriptions
        </button>
        <button
          className="w-full text-left p-2 rounded text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
          onClick={handleLogout}
        >
          Logout
        </button>
      </aside>
    </>
  );
}

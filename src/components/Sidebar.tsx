import { useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    window.location.href = "/login";
  };

  return (
    <>
      {/* Hamburger toggle (always visible) */}
      <button
        className="p-2 m-2 rounded-md border hover:bg-gray-100 dark:hover:bg-neutral-800 lg:hidden"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <Bars3Icon className="h-6 w-6 text-gray-700 dark:text-neutral-200" />
      </button>

      {/* Overlay + Sliding Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex">
          {/* Background overlay */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* Sidebar panel */}
          <aside className="relative z-50 w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 min-h-full p-4 space-y-4 shadow-lg transform transition-transform translate-x-0">
            <button
              className="absolute top-4 right-4 p-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <XMarkIcon className="h-6 w-6 text-gray-700 dark:text-neutral-200" />
            </button>

            <h2 className="font-bold text-lg mb-6 text-neutral-900 dark:text-neutral-100">
              Menu
            </h2>

            <button
              className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800"
              onClick={() => {
                window.location.href = "/create-user";
                setIsOpen(false);
              }}
            >
              Create User
            </button>

            <button
              className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800"
              onClick={() => {
                window.location.href = "/subscriptions";
                setIsOpen(false);
              }}
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

      {/* Desktop trigger: Show only hamburger, no persistent sidebar */}
      <div className="hidden lg:block">
        <button
          className="p-2 m-2 rounded-md border hover:bg-gray-100 dark:hover:bg-neutral-800"
          onClick={() => setIsOpen(true)}
        >
          <Bars3Icon className="h-6 w-6 text-gray-700 dark:text-neutral-200" />
        </button>
      </div>
    </>
  );
}

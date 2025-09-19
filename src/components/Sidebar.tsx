import { useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

interface SidebarProps {
  setActivePage: (page: "dashboard" | "subscriptions") => void;
}

export default function Sidebar({ setActivePage }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    window.location.href = "/login";
  };

  const NavButton = ({
    label,
    onClick,
    isDanger,
  }: {
    label: string;
    onClick: () => void;
    isDanger?: boolean;
  }) => (
    <button
      className={`w-full text-left p-2 rounded ${
        isDanger
          ? "text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
          : "hover:bg-gray-100 dark:hover:bg-neutral-800"
      }`}
      onClick={() => {
        onClick();
        setIsOpen(false);
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="lg:hidden p-2 m-2 rounded-md border hover:bg-gray-100 dark:hover:bg-neutral-800"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <Bars3Icon className="h-6 w-6 text-gray-700 dark:text-neutral-200" />
      </button>

      {/* Mobile sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <aside className="relative z-50 w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 min-h-screen p-4 space-y-4 shadow-lg">
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

            <NavButton
              label="Dashboard"
              onClick={() => setActivePage("dashboard")}
            />
            <NavButton
              label="View Subscriptions"
              onClick={() => setActivePage("subscriptions")}
            />
            <NavButton label="Logout" onClick={handleLogout} isDanger />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 min-h-screen p-4 space-y-4">
        <h2 className="font-bold text-lg mb-4 text-neutral-900 dark:text-neutral-100">
          Menu
        </h2>

        <NavButton
          label="Dashboard"
          onClick={() => setActivePage("dashboard")}
        />
        <NavButton
          label="View Subscriptions"
          onClick={() => setActivePage("subscriptions")}
        />
        <NavButton label="Logout" onClick={handleLogout} isDanger />
      </aside>
    </>
  );
}

import { useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    window.location.href = "/login"; // simple redirect
  };

  return (
    <>
      {/* Hamburger button for mobile */}
      <button
        className="lg:hidden p-2 m-2 rounded-md border hover:bg-gray-100"
        onClick={() => setIsOpen(true)}
      >
        <Bars3Icon className="h-6 w-6 text-gray-700" />
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          {/* Dark background */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Sidebar panel */}
          <aside className="relative z-50 w-64 bg-white border-r min-h-screen p-4 space-y-4 shadow-lg">
            {/* Close button */}
            <button
              className="absolute top-4 right-4 p-2 rounded hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-gray-700" />
            </button>

            <h2 className="font-bold text-lg mb-6">Menu</h2>

            <button
              className="w-full text-left p-2 rounded hover:bg-gray-100"
              onClick={() => (window.location.href = "/create-user")}
            >
              Create User
            </button>

            <button
              className="w-full text-left p-2 rounded hover:bg-gray-100"
              onClick={() => (window.location.href = "/subscriptions")}
            >
              View Subscriptions
            </button>

            <button
              className="w-full text-left p-2 rounded text-red-600 hover:bg-red-100"
              onClick={handleLogout}
            >
              Logout
            </button>
          </aside>
        </div>
      )}

      {/* Always visible sidebar on desktop */}
      <aside className="hidden lg:block w-64 bg-white border-r min-h-screen p-4 space-y-4">
        <h2 className="font-bold text-lg mb-4">Menu</h2>

        <button
          className="w-full text-left p-2 rounded hover:bg-gray-100"
          onClick={() => (window.location.href = "/create-user")}
        >
          Create User
        </button>

        <button
          className="w-full text-left p-2 rounded hover:bg-gray-100"
          onClick={() => (window.location.href = "/subscriptions")}
        >
          View Subscriptions
        </button>

        <button
          className="w-full text-left p-2 rounded text-red-600 hover:bg-red-100"
          onClick={handleLogout}
        >
          Logout
        </button>
      </aside>
    </>
  );
}

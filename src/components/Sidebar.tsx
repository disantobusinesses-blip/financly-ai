import { useState } from "react";
import { useRouter } from "next/router";
import { MenuIcon, XIcon } from "@heroicons/react/outline"; // install @heroicons/react if missing

export default function Sidebar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    router.push("/login");
  };

  return (
    <>
      {/* Hamburger button visible only on mobile */}
      <button
        className="lg:hidden p-2 m-2 rounded-md border hover:bg-gray-100"
        onClick={() => setIsOpen(true)}
      >
        <MenuIcon className="h-6 w-6 text-gray-700" />
      </button>

      {/* Sidebar overlay on mobile */}
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
              <XIcon className="h-6 w-6 text-gray-700" />
            </button>

            <h2 className="font-bold text-lg mb-6">Menu</h2>

            <button
              className="w-full text-left p-2 rounded hover:bg-gray-100"
              onClick={() => {
                router.push("/create-user");
                setIsOpen(false);
              }}
            >
              Create User
            </button>

            <button
              className="w-full text-left p-2 rounded hover:bg-gray-100"
              onClick={() => {
                router.push("/subscriptions");
                setIsOpen(false);
              }}
            >
              View Subscriptions
            </button>

            <button
              className="w-full text-left p-2 rounded text-red-600 hover:bg-red-100"
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
            >
              Logout
            </button>
          </aside>
        </div>
      )}

      {/* Always visible sidebar on large screens */}
      <aside className="hidden lg:block w-64 bg-white border-r min-h-screen p-4 space-y-4">
        <h2 className="font-bold text-lg mb-4">Menu</h2>

        <button
          className="w-full text-left p-2 rounded hover:bg-gray-100"
          onClick={() => router.push("/create-user")}
        >
          Create User
        </button>

        <button
          className="w-full text-left p-2 rounded hover:bg-gray-100"
          onClick={() => router.push("/subscriptions")}
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

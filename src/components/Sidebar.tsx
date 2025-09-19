import { useState } from "react";

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    console.log("Logging out...");
    // TODO: wire to your auth logic
    window.location.href = "/login";
  };

  const handleCreateUser = () => {
    console.log("Create user clicked");
    window.location.href = "/signup";
  };

  const handleViewSubscriptions = () => {
    const el = document.getElementById("subscriptions-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setOpen(false); // close menu after clicking
    }
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between bg-white border-b p-4">
        <h2 className="text-lg font-bold">Menu</h2>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 border rounded-md"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-white border-b p-4 space-y-3">
          <button
            onClick={handleCreateUser}
            className="block w-full text-left px-4 py-2 rounded-md border hover:bg-gray-100"
          >
            Create User
          </button>
          <button
            onClick={handleViewSubscriptions}
            className="block w-full text-left px-4 py-2 rounded-md border hover:bg-gray-100"
          >
            View Subscriptions
          </button>
          <button
            onClick={handleLogout}
            className="block w-full px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 h-screen bg-white border-r p-6 justify-between">
        <div>
          <h2 className="text-lg font-bold mb-6">Menu</h2>
          <nav className="space-y-4">
            <button
              onClick={handleCreateUser}
              className="block w-full text-left px-4 py-2 rounded-md border hover:bg-gray-100"
            >
              Create User
            </button>
            <button
              onClick={handleViewSubscriptions}
              className="block w-full text-left px-4 py-2 rounded-md border hover:bg-gray-100"
            >
              View Subscriptions
            </button>
          </nav>
        </div>

        <div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

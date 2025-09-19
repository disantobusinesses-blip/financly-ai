import Link from "next/link";
import { useRouter } from "next/router";

export default function Sidebar() {
  const router = useRouter();

  const handleLogout = () => {
    // TODO: wire this up to your auth context / API logout
    console.log("Logging out...");
    router.push("/login");
  };

  const handleCreateUser = () => {
    // TODO: replace with real user creation logic
    console.log("Create user clicked");
    router.push("/signup");
  };

  const handleViewSubscriptions = () => {
    // Scroll to subscriptions section on the dashboard
    const el = document.getElementById("subscriptions-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push("/#subscriptions-section");
    }
  };

  return (
    <aside className="w-64 h-screen bg-white border-r p-6 flex flex-col justify-between">
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
  );
}

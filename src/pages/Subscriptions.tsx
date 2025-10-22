import { SparklesIcon } from "@heroicons/react/24/solid";
import { useAuth } from "../contexts/AuthContext";
import { createCheckoutSession } from "../services/StripeService";

const Subscriptions = () => {
  const { user } = useAuth();

  const handleUpgrade = async () => {
    if (!user) {
      alert("Please log in to upgrade.");
      return;
    }

    try {
      const { url } = await createCheckoutSession(user);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Stripe checkout error:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <SparklesIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Subscription Hunter
          </h1>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We found <span className="font-semibold">3 active subscriptions</span>{" "}
          that could be costing you more than you think.
        </p>

        <ul className="space-y-3 mb-6">
          <li className="flex items-center justify-between bg-gray-50 dark:bg-neutral-800 p-3 rounded">
            <span>🎶 Spotify</span>
            <span className="text-gray-500">A$12.99 / mo</span>
          </li>
          <li className="flex items-center justify-between bg-gray-50 dark:bg-neutral-800 p-3 rounded">
            <span>📺 Netflix</span>
            <span className="text-gray-500">A$15.99 / mo</span>
          </li>
          <li className="flex items-center justify-between bg-gray-50 dark:bg-neutral-800 p-3 rounded">
            <span>💪 Gym Membership</span>
            <span className="text-gray-500">A$60.00 / mo</span>
          </li>
        </ul>

        <div className="bg-primary/10 p-4 rounded-lg mb-6">
          <p className="text-primary font-medium">
            Pro users can cancel unwanted subscriptions in one click and get AI
            recommendations to save up to $500/yr.
          </p>
        </div>

        <button
          onClick={handleUpgrade}
          className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary-hover transition"
        >
          Upgrade to Pro & Unlock Cancellation
        </button>
      </div>
    </div>
  );
};

export default Subscriptions;

import { SparklesIcon } from "@heroicons/react/24/solid";

const Subscriptions = () => {

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
            Good news! Subscription Hunter is fully unlocked. Connect your bank and cancel recurring charges directly from your dashboard.
          </p>
        </div>

        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Make the most of these tools:</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>View AI-prioritized subscriptions with cost trends and renewal dates.</li>
              <li>Use the built-in cancel links to take action in a click.</li>
              <li>Track monthly savings in real time across the Financly dashboard.</li>
            </ul>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Need a refresher?</h2>
            <p>
              Head back to the dashboard to explore Subscription Hunter alongside cashflow, alerts, and AI spending insights.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;

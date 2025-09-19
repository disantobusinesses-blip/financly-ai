import { useAuth } from "../contexts/AuthContext";

export default function Pricing() {
  const { setIsUpgradeModalOpen } = useAuth();

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 space-y-12">
      <h1 className="text-3xl font-bold text-center">Choose your plan</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Free Plan */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Free</h2>
          <p className="mb-4 text-gray-600">Basic budgeting tools</p>
          <ul className="mb-4 text-sm list-disc list-inside">
            <li>Cashflow tracking</li>
            <li>Basic categories</li>
            <li>Connect 1 bank</li>
          </ul>
          <button className="w-full p-2 rounded bg-gray-300 cursor-not-allowed">
            Current Plan
          </button>
        </div>

        {/* Pro Plan */}
        <div className="border-2 border-indigo-600 rounded-lg p-6 relative bg-indigo-50">
          <span className="absolute -top-3 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            RECOMMENDED
          </span>
          <h2 className="text-xl font-semibold mb-2">Pro</h2>
          <p className="mb-4 text-gray-600">AI-powered insights & savings</p>
          <ul className="mb-4 text-sm list-disc list-inside">
            <li>Unlimited bank connections</li>
            <li>AI Forecasting</li>
            <li>Subscription Hunter</li>
            <li>Personalized Alerts</li>
          </ul>
          <button
            className="w-full p-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => setIsUpgradeModalOpen(true)}
          >
            Upgrade to Pro
          </button>
        </div>
      </div>

      {/* Testimonials */}
      <div className="grid md:grid-cols-3 gap-6">
        <blockquote className="p-4 border rounded-md italic">
          “I saved $500 in the first 3 months.” – Alex T.
        </blockquote>
        <blockquote className="p-4 border rounded-md italic">
          “Financly made budgeting effortless.” – Maria K.
        </blockquote>
        <blockquote className="p-4 border rounded-md italic">
          “Best alternative to Revolut & WeMoney.” – David R.
        </blockquote>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { createCheckoutSession } from "../services/stripeService"; // adjust the path if needed
import { useAuth } from "../contexts/AuthContext"; // assuming you store user here

const SubscriptionCard: React.FC = () => {
  const { user } = useAuth(); // must expose {id, email, region} in AuthContext
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    if (!user) {
      setError("You must be logged in to upgrade.");
      return;
    }

    try {
      setLoading(true);
      const { url } = await createCheckoutSession(user);
      window.location.href = url; // redirect to Stripe Checkout
    } catch (err: any) {
      console.error("❌ Stripe upgrade error:", err);
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/10 rounded-lg p-4">
      <h2 className="text-lg font-semibold">Subscription</h2>
      <p className="text-gray-400 text-sm mb-3">
        Unlock full Financly insights with Pro.
      </p>
      {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="bg-primary px-4 py-2 rounded-lg text-white font-semibold hover:bg-primary-hover disabled:opacity-50"
      >
        {loading ? "Redirecting..." : "Upgrade to Pro"}
      </button>
    </div>
  );
};

export default SubscriptionCard;

import React from "react";

const features = [
  "AI-powered transaction insights",
  "Subscription hunter with instant cancel links",
  "Borrowing power guidance tailored to you",
  "Savings plans that adapt to your goals",
];

const SubscriptionCard: React.FC = () => {
  return (
    <div className="bg-white/10 rounded-lg p-4">
      <h2 className="text-lg font-semibold">Financly Toolkit</h2>
      <p className="text-gray-400 text-sm mb-4">
        Every intelligence tool is now included for free. Explore the full suite below.
      </p>
      <ul className="space-y-2 text-sm text-gray-300">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" aria-hidden="true"></span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SubscriptionCard;

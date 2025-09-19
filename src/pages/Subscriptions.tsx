import React from "react";
import SubscriptionHunter from "../components/SubscriptionHunter";
import { demoTransactions } from "../demo/demoData"; // swap to real transactions if available

export default function SubscriptionsPage() {
  return (
    <div className="max-w-3xl mx-auto p-4">
      <SubscriptionHunter transactions={demoTransactions} />
    </div>
  );
}

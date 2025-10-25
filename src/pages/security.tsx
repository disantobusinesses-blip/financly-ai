export default function SecurityPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-6">
      <h1 className="text-3xl font-bold">Your Security Matters</h1>
      <p>
        MyAiBank uses <strong>Basiq</strong> for bank connections and{" "}
        <strong>Stripe</strong> for payments. Both are industry leaders in
        security and compliance.
      </p>
      <h2 className="text-xl font-semibold">How we protect you</h2>
      <ul className="list-disc list-inside space-y-2">
        <li>🔒 Bank-grade 256-bit encryption</li>
        <li>⚖️ We never store your banking credentials</li>
        <li>💳 Secure payments handled by Stripe</li>
      </ul>
      <p>
        For questions, email us at{" "}
        <a href="mailto:support@myaibank.ai" className="text-indigo-600">
          support@myaibank.ai
        </a>
        .
      </p>
    </div>
  );
}

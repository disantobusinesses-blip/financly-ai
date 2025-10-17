export default function Pricing() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Financly All-Access</h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          We listened to our community and made every AI assistant, forecast, and insight part of the core experience. There's no longer a paid tier—just sign in and start exploring.
        </p>
      </div>

      <div className="border border-dashed border-primary rounded-2xl p-8 bg-primary/5 text-center space-y-6">
        <div>
          <p className="uppercase tracking-wide text-xs font-semibold text-primary">Pricing</p>
          <p className="text-5xl font-extrabold text-primary">$0</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Unlimited access • Unlimited accounts • Unlimited insights</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 text-left">
          <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
            <li>✔️ Real-time cashflow and forecasting</li>
            <li>✔️ AI spending and savings insights</li>
            <li>✔️ Subscription Hunter with cancel links</li>
          </ul>
          <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
            <li>✔️ Borrowing power analysis</li>
            <li>✔️ Financial alerts and anomaly detection</li>
            <li>✔️ Goal-based planning powered by AI</li>
          </ul>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          Ready to see it in action? Connect your bank from the dashboard and watch Financly curate insights instantly.
        </p>
      </div>
    </div>
  );
}

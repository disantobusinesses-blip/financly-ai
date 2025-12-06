import StripePricingTable from "../components/StripePricingTable";

export default function Pricing() {
  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-light">Pricing</p>
          <h1 className="text-3xl font-bold text-white">Choose a plan that grows with you</h1>
          <p className="text-lg text-white/80">
            Start with our free tools or unlock AI-powered cashflow forecasting, personalised alerts, and
            subscription hunting with Pro. Upgrade securely through Stripe in seconds.
          </p>
          <ul className="space-y-3 text-white/80">
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                ✓
              </span>
              <div>
                <p className="font-semibold text-white">Connect all your banks</p>
                <p>Unify your accounts for a single view of your spending and savings.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                ✓
              </span>
              <div>
                <p className="font-semibold text-white">AI insights & alerts</p>
                <p>Receive proactive forecasts and savings nudges tailored to your habits.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                ✓
              </span>
              <div>
                <p className="font-semibold text-white">Subscription hunter</p>
                <p>Spot recurring charges fast and cancel what you don’t need.</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="flex justify-center">
          <StripePricingTable />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80">
        <h2 className="mb-2 text-xl font-semibold text-white">Need a tailored plan?</h2>
        <p className="mb-4">
          We&apos;re happy to help set up team access or talk through unique requirements. Email us at
          <a className="ml-1 font-semibold text-primary" href="mailto:hello@myaibank.ai">
            hello@myaibank.ai
          </a>
          .
        </p>
        <p>All payments are handled securely via Stripe.</p>
      </div>
    </div>
  );
}

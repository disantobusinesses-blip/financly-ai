import React from "react";

interface WhatWeDoPageProps {
  onNavigateHome: () => void;
}

const WhatWeDoPage: React.FC<WhatWeDoPageProps> = ({ onNavigateHome }) => (
  <article className="mx-auto max-w-4xl space-y-10 text-slate-700">
    <header className="space-y-4">
      <button
        type="button"
        onClick={onNavigateHome}
        className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-slate-600 transition hover:border-primary hover:text-primary"
      >
        ← Back to dashboard
      </button>
      <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
        How AI can help you save on your bills (and fall back in love with your money)
      </h1>
      <p className="text-lg text-slate-600">
        Financly AI was designed to answer a deceptively simple question: “Where is my cash really going, and what should I do about it?”
        Below you’ll find a guided deep dive that unpacks how our platform analyses your live bank feeds, uncovers hidden subscriptions,
        and translates the numbers into friendly next actions. Whether you’re touring the <a href="#financial-wellness" className="text-primary underline">Financial Wellness Score</a>
        or exploring the <a href="#subscription-hunter" className="text-primary underline">Subscription Hunter card</a>, every insight is built to keep you informed without ever drifting into financial advice.
      </p>
    </header>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">1. Let algorithms watch for recurring charges so you don’t have to</h2>
      <p>
        Traditional budgeting requires you to comb through statements line by line, highlight recurring payments, and remember to cancel services you no longer use.
        Financly flips that process on its head. As soon as your transactions sync, our classification engine groups repeat merchants, estimates how frequently they bill you,
        and calculates the combined spend. The moment you unlock My Finances Pro, the Subscription Hunter panel shows a clean list of streaming, software,
        and utility agreements, ranked by potential savings. You’ll see statements like “Three overlapping video subscriptions totalling $52.97 per month—tap to cancel or downgrade,”
        along with the assurance that every suggestion is delivered with the reminder that “This is not Financial advice.” That single overview can free up a meaningful portion of your budget in minutes.
      </p>
      <figure className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="rounded-2xl bg-gradient-to-r from-primary/90 to-indigo-500/90 p-6 text-left text-white">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">Visual snapshot</p>
          <h3 className="mt-2 text-xl font-semibold">Subscription Hunter preview</h3>
          <p className="mt-3 max-w-md text-sm text-white/80">
            Spotify • 3 charges this quarter · $26.97<br />
            Cloud Storage • 2 charges this quarter · $19.98<br />
            Game Pass • 1 charge this quarter · $24.99
          </p>
        </div>
        <figcaption className="mt-3 text-sm text-slate-500">
          A stylised representation of the Subscription Hunter card you’ll find beside the Balance Summary once you upgrade to Pro.
        </figcaption>
      </figure>
      <p>
        Smart detection is only half the story. Behind the scenes we also track price creep—if a gym membership quietly jumped from $39.99 to $52.99, or a cloud backup plan starts adding overage fees,
        you’ll see a prompt in your alerts feed. The goal is simple: shine a light on every dollar that could be redirected toward the goals you defined inside the dashboard.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">2. Understand your cashflow faster than it takes to open a spreadsheet</h2>
      <p>
        Bills rarely exist in isolation. Rent, insurance, groceries, and spontaneous “treat yourself” moments all compete for the same paycheque.
        The <strong>Financial Wellness Score</strong> crunches the last thirty days of inflows and outflows, then translates the results into a 0–100 rating with crystal-clear colour cues.
        Hover over the debt-to-income module and you’ll see how lenders think about the thresholds (excellent at or below 25%, good through 35%, acceptable below 36%) alongside a personalised plan for nudging the ratio lower.
        When you connect more accounts, the cashflow mini card and category breakdowns update instantly, giving you week-by-week visibility into how essentials, lifestyle, and saving buckets line up with the 50/30/20 rule.
      </p>
      <figure className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-inner">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 shadow">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Cashflow pulse</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">+$486 surplus</p>
            <p className="text-sm text-slate-500">Income 4,200 · Spend 3,714</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">DTI snapshot</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">28.4% ratio</p>
            <p className="text-sm text-slate-500">Aim for 25% to unlock “excellent” status.</p>
          </div>
        </div>
        <figcaption className="mt-3 text-sm text-slate-500">
          These mock widgets mirror the tiles you’ll unlock by visiting the <a href="#financial-wellness" className="text-primary underline">Financial Wellness Score</a> card inside the dashboard grid.
        </figcaption>
      </figure>
      <p>
        Prefer a more tactile workflow? The Goal Planner sits directly below the wellness section so you can translate insights into transfers.
        Every time you log a new contribution, the assistant pops up with a celebratory toast (“Great stuff, Alex!”) while reminding you that you set the pace.
        Together, the score, the cashflow visual, and the goals carousel give you the same clarity a spreadsheet would, minus the manual upkeep.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">3. Turn insights into action without losing the human touch</h2>
      <p>
        Data alone doesn’t lower bills—you still need a plan and gentle accountability. That’s why every AI generated prompt inside Financly includes a neutral description, supporting stats,
        and the explicit statement “This is not Financial advice.” The <em>Financial Alerts</em> panel flags unusual charges, upcoming renewals, or opportunities to accelerate debt payoff.
        The <em>Smart Cashflow</em> forecast projects how the next few pay periods will look if you accept or ignore those suggestions. Meanwhile the newsletter sign-up on the welcome screen connects you to curated tips every week.
      </p>
      <h3 className="text-xl font-semibold text-slate-900">Action checklist</h3>
      <ul className="list-disc space-y-2 pl-6 text-sm">
        <li>Start with the free showcase to explore the Financial Wellness Score, Balance Summary, and Goal Planner.</li>
        <li>Upgrade to My Finances Pro when you’re ready to unblur Subscription Hunter, Cashflow, Alerts, and the full transaction history.</li>
        <li>Tap the floating magnifier on the dashboard if you’d like the tour icon to revisit each card in order.</li>
        <li>Use the <a href="#subscription-hunter" className="text-primary underline">Subscription Hunter</a> insights to schedule cancellations or downgrades right away.</li>
        <li>Keep the 50/30/20 rule handy: the coloured bar on the wellness card shows exactly how close you are to the ideal split.</li>
      </ul>
      <p>
        The result is a budgeting experience that feels collaborative. You stay firmly in control, the AI handles the heavy analysis, and every recommendation is framed as a friendly nudge rather than a command.
        Over time, the combination of timely alerts, concise summaries, and celebratory feedback helps you rewire financial habits without the usual willpower drain.
      </p>
    </section>

    <footer className="border-t border-slate-200 pt-6 text-sm text-slate-500">
      <p>
        Ready to see these tools in context? Return to the dashboard, swipe through the carousel on mobile, or jump straight to the
        <a href="#financial-wellness" className="text-primary underline"> Financial Wellness Score</a> and
        <a href="#subscription-hunter" className="text-primary underline"> Subscription Hunter</a> cards using the quick links in the header menu.
        We’ll keep listening to your data, celebrating your wins, and reminding you—gently—that while we crunch the numbers, the decisions are always yours.
      </p>
    </footer>
  </article>
);

export default WhatWeDoPage;

import React from "react";

const WhatWeDo: React.FC = () => {
  return (
    <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-white/10 md:p-12">
      <article className="space-y-10 text-slate-800 dark:text-slate-100">
      <header className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">Our mission</p>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white">How AI can help you save on your bills</h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          Financly AI blends secure bank connections, explainable machine intelligence, and behavioural coaching to help you
          cut waste, accelerate savings, and feel confident about every dollar. Below is a behind-the-scenes look at how we
          deliver that promise for members of all plans.
        </p>
      </header>

      <section
        className="grid gap-6 rounded-3xl bg-slate-50 p-6 shadow-inner ring-1 ring-slate-200/80 dark:bg-slate-950/60 dark:ring-white/10 md:grid-cols-2"
        id="financial-wellness"
      >
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">1. Read your money story instantly</h2>
          <p>
            We start with your real accounts. Financly connects through Basiq&apos;s regulated open-banking platform so you can
            securely pull balances, mortgages, credit cards, and transaction history into a single canvas. Our
            <a href="#financial-wellness" className="font-semibold text-primary"> Financial Wellness score</a> takes that live
            data and transforms it into a 0-100 health indicator that updates as soon as new activity arrives. We factor your
            debt-to-income ratio, spending stability, emergency buffer, and cashflow resilience, highlighting what&apos;s helping
            or hurting your score in plain English.
          </p>
          <p>
            If your debt-to-income ratio crosses common lender thresholds (36% for most banks, 25% for premium products), the
            dashboard flags the accounts contributing most to the load and gives you a realistic target to work toward.
            Meanwhile our 50/30/20 allocation chip shows how much of your income currently supports essentials, lifestyle, and
            savings so you can adjust with confidence.
          </p>
          <p>
            Every insight includes the disclaimer <em>“This is not financial advice.”</em> Our role is to surface patterns and
            options, not prescribe investments.
          </p>
        </div>
        <div className="flex items-center justify-center">
          <div className="h-64 w-full max-w-sm rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/10 p-6 text-sm text-slate-200 shadow-inner">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Preview</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Financial Wellness</h3>
            <div className="mt-6 space-y-2">
              <p className="text-5xl font-black text-white">82<span className="text-lg">/100</span></p>
              <p className="text-sm text-white/70">Great work! Keep essentials near 50% and send an extra $220 to savings to hit 20%.</p>
            </div>
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-xs uppercase tracking-widest text-white/60">Debt-to-income</p>
                <p className="text-sm text-white">31% · Focus: Mortgage + Visa Rewards</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-xs uppercase tracking-widest text-white/60">50/30/20 rule</p>
                <p className="text-sm text-white">Spend 50% on essentials · Enjoy 30% lifestyle · Put 20% into savings</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4" id="goal-planner">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">2. Turn ambition into progress</h2>
        <p>
          Inside the Goal Planner (you&apos;ll find it just beneath wellness on the dashboard) you can create personalised savings
          missions like “New Car 🚗” or “Europe Trip ✈️”. Add a target amount, optional date, and we&apos;ll estimate a finish line
          using your current savings rate. Every contribution triggers a cheerful “Great stuff!” toast using your name, and
          milestones at 25%, 50%, and 75% unlock Gemini-powered encouragement. We even suggest tips such as trimming unused
          subscriptions or redirecting a portion of surplus income. Goals persist in local storage per user, so your plan
          survives refreshes and device switches.
        </p>
        <p>
          Prefer to track multiple ambitions? Sort goals by progress or timeline, edit them on the fly, or delete ones you no
          longer need. At the bottom of the card we surface an insight like “At your current savings rate, you could add another
          $1,200 goal this year,” helping you plan ahead.
        </p>
      </section>

      <section className="space-y-4" id="subscription-hunter">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">3. Expose silent spend</h2>
        <p>
          Recurring charges are the number-one leak we observe across members. Subscription Hunter groups identical merchants,
          counts how many times they hit your account, and estimates the total that rolls out each month. Basic showcase users
          see a blurred preview that teases how much they could save by upgrading to Pro, while Pro members unlock the full
          cancellation playbook with customer service links.
        </p>
        <p>
          This feature lives next to your <a href="#balance-summary" className="font-semibold text-primary">Balance Summary</a>
          so you can weigh ongoing commitments against your net worth. Upgrading reveals card-by-card insights, cancellation
          prompts, and AI commentary that again includes the reminder: “This is not financial advice.”
        </p>
      </section>

      <section className="space-y-4" id="cashflow">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">4. Forecast cashflow and spending clarity</h2>
        <p>
          The Cashflow Monthly graph plots income versus expenses with a zero baseline so you can instantly spot when you dip
          below break-even. Swipe left or right on mobile to cycle through additional tools without overwhelming small screens —
          the dashboard carousel was designed for thumb-friendly navigation. <a href="#spending-by-category" className="font-semibold text-primary">Spending by Category</a>
          switches from cramped pies to clean progress bars, includes straight labels, and displays every value in currency with
          two decimal places for accuracy.
        </p>
        <p>
          For analysts, Transaction History combines AI notes with neutral statistics: net positive or negative totals, top
          merchants, and month-on-month comparisons. Again, insights arrive with the reminder “This is not financial advice.”
        </p>
      </section>

      <section className="space-y-4" id="onboarding">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">5. Guided onboarding and education</h2>
        <p>
          New members choose between a seven-day Basic showcase or My Finances Pro. Basic keeps Financial Wellness, Goals, and
          Balance Summary visible while softly blurring AI-heavy panels to demonstrate the value of upgrading. Our playful
          emoji-filled signup modal helps you pick an avatar, region, and plan while explaining that the email you enter becomes
          your Basiq user ID.
        </p>
        <p>
          After connecting your bank, a live tutorial icon appears on the dashboard. Tap “Need a tour?” and a glowing pointer
          walks through each section from top to bottom, including swipe prompts for mobile-only cards. No screen blur — just a
          focused highlight so you can keep reading the data behind it.
        </p>
      </section>

      <section className="space-y-4" id="commitment">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Our commitment</h2>
        <p>
          Financly AI never sells your financial data. We simply analyse it on your behalf to uncover smarter habits, lower
          bills, and reduce stress. Whether you stay on the Basic showcase or upgrade to Pro, our north star remains the same:
          save you time and money while keeping you fully in control.
        </p>
      </section>
      </article>
    </div>
  );
};

export default WhatWeDo;

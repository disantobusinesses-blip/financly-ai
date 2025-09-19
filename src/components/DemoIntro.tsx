import { useState } from "react";

export default function DemoIntro() {
  const [step, setStep] = useState(0);
  const steps = [
    { title: "Track your spending", body: "See where your money goes by category, month over month." },
    { title: "Forecast your balance", body: "Project 6 months ahead and test savings plans." },
    { title: "Hunt subscriptions", body: "Find recurring charges and cancel the ones you don’t need." },
  ];
  const s = steps[step];

  return (
    <div className="mb-6 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100 rounded-lg p-4 flex items-start justify-between">
      <div>
        <h3 className="font-semibold">{s.title}</h3>
        <p className="text-sm opacity-80">{s.body}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="text-sm px-3 py-1 rounded bg-white dark:bg-neutral-800 border"
          onClick={() => setStep((step + steps.length - 1) % steps.length)}
        >
          Back
        </button>
        <button
          className="text-sm px-3 py-1 rounded bg-indigo-600 text-white"
          onClick={() => setStep((step + 1) % steps.length)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

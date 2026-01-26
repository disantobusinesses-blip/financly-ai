import React from "react";
import type { TransactionAnalysisResult, Insight } from "../services/AIService";

type Props = {
  analysis: TransactionAnalysisResult | null;
};

const AIInsightsPanel: React.FC<Props> = ({ analysis }) => {
  if (!analysis) return null;

  const insights: Insight[] = analysis.analysis.insights;

  return (
    <section className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">AI Insights</h3>

      <ul className="space-y-2">
        {insights.map((item: Insight, idx: number) => (
          <li key={idx} className="text-sm text-white/80">
            <span className="mr-2">{item.emoji}</span>
            {item.text}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default AIInsightsPanel;

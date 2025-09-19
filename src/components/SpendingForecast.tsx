// Only show chart for free users. Wrap insights in ProFeatureBlocker.
...
{forecastResult && user?.membershipType === 'Pro' ? (
  <div className="space-y-4">
    {/* Insights */}
    <ProFeatureBlocker
      featureTitle="AI Insights"
      teaserText="Upgrade to unlock personalized savings insights."
    >
      <div className="p-4 bg-background rounded-lg border">
        <h4 className="font-bold text-sm mb-2">AI Insight</h4>
        <p className="text-sm italic">{forecastResult.insight}</p>
      </div>
    </ProFeatureBlocker>
  </div>
) : null}
...

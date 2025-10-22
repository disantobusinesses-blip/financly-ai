import ProFeatureBlocker from "./ProFeatureBlocker";
import SubscriptionCard from "./SubscriptionCard";

export default function SubscriptionCardWrapper() {
  return (
    <ProFeatureBlocker
      featureTitle="Subscription Hunter"
      teaserText="We found 3 subscriptions. Upgrade to cancel them easily."
    >
      <SubscriptionCard />
    </ProFeatureBlocker>
  );
}

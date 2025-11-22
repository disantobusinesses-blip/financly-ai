import React, { useEffect } from "react";

const StripePricingTable: React.FC = () => {
  useEffect(() => {
    const scriptId = "stripe-pricing-table-script";
    if (document.getElementById(scriptId)) return;

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://js.stripe.com/v3/pricing-table.js";
    script.async = true;

    document.body.appendChild(script);
  }, []);

  return (
    <div className="glass-panel mx-auto max-w-6xl rounded-3xl p-6 text-center text-white shadow-2xl ring-1 ring-white/10">
      <h2 className="mb-6 text-2xl font-bold uppercase tracking-[0.3em] text-primary-light">Choose Your Plan</h2>
      <stripe-pricing-table
        pricing-table-id="prctbl_1SVO0mIxumNMN5hSfg3DOnrt"
        publishable-key="pk_live_51S3FDBIxumNMN5hSSbT8T83H5o5FRn1tF6QchCom6AAkafCDVPtDc9oXPhuNn2OMVgyfUVySvOKlE2cP5o2cE7tu00NnC3Oeyc"
      ></stripe-pricing-table>
    </div>
  );
};

export default StripePricingTable;

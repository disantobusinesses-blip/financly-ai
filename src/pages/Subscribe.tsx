import React, { useEffect, useMemo, useState } from "react";

const buildSaleEndDate = () => {
  const now = new Date();
  const end = new Date(`${now.getFullYear()}-12-31T23:59:59+11:00`);
  if (now.getTime() > end.getTime()) {
    return new Date(`${now.getFullYear() + 1}-12-31T23:59:59+11:00`);
  }
  return end;
};

const getTimeRemaining = (target: Date) => {
  const total = target.getTime() - Date.now();
  const clamped = Math.max(total, 0);
  return {
    total,
    days: Math.floor(clamped / (1000 * 60 * 60 * 24)),
    hours: Math.floor((clamped / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((clamped / (1000 * 60)) % 60),
  };
};

const SubscribePage: React.FC = () => {
  const saleEndDate = useMemo(buildSaleEndDate, []);
  const [countdown, setCountdown] = useState(() => getTimeRemaining(saleEndDate));

  useEffect(() => {
    const timer = setInterval(() => setCountdown(getTimeRemaining(saleEndDate)), 1000);
    return () => clearInterval(timer);
  }, [saleEndDate]);

  return (
    <div className="px-4 pb-16 pt-24 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
          {countdown.total > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-semibold text-white">Sale ends Dec 31.</span>
              <div className="flex gap-3 text-center text-white/80">
                <div>
                  <p className="text-lg font-bold leading-tight">{countdown.days}</p>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">Days</p>
                </div>
                <div>
                  <p className="text-lg font-bold leading-tight">{countdown.hours}</p>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">Hours</p>
                </div>
                <div>
                  <p className="text-lg font-bold leading-tight">{countdown.minutes}</p>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">Minutes</p>
                </div>
              </div>
            </div>
          ) : (
            <span className="font-semibold text-white">Choose your plan.</span>
          )}
        </div>
        <div className="flex justify-center">
          <div
            className="w-full max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-4"
            dangerouslySetInnerHTML={{
              __html:
                '\n<script async src="https://js.stripe.com/v3/pricing-table.js"></script>\n<stripe-pricing-table pricing-table-id="prctbl_1SVO0mIxumNMN5hSfg3DOnrt"\npublishable-key="pk_live_51S3FDBIxumNMN5hSSbT8T83H5o5FRn1tF6QchCom6AAkafCDVPtDc9oXPhuNn2OMVgyfUVySvOKlE2cP5o2cE7tu00NnC3Oeyc">\n</stripe-pricing-table>\n',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SubscribePage;

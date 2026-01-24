import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useAppData } from "../contexts/AppDataContext";
import WeeklyOrdersPanel from "./WeeklyOrdersPanel";

const WeeklyOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const { accounts, transactions } = useAppData();

  const region = user?.region ?? "AU";
  const totalBalance = accounts.reduce((sum, a) => sum + (Number((a as any).balance) || 0), 0);

  if (!user?.id) return null;

  return (
    <div className="mx-auto max-w-4xl px-2 pb-10 pt-2">
      <WeeklyOrdersPanel
        userId={user.id}
        region={region}
        transactions={transactions}
        accounts={accounts}
        totalBalance={totalBalance}
      />
    </div>
  );
};

export default WeeklyOrdersPage;

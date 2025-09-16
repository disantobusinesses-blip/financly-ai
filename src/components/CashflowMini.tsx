import Card from "./Card";
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { m: "Jan", in: 4200, out: 3600 },
  { m: "Feb", in: 3800, out: 3100 },
  { m: "Mar", in: 4500, out: 4300 },
  { m: "Apr", in: 4700, out: 3900 },
  { m: "May", in: 5200, out: 4600 },
];

export default function CashflowMini() {
  return (
    <Card title="Cashflow (5 mo)">
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="inG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopOpacity={0.35} />
                <stop offset="95%" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="outG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopOpacity={0.25} />
                <stop offset="95%" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="m" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip />
            <Area type="monotone" dataKey="in" strokeWidth={2} fillOpacity={1} fill="url(#inG)" />
            <Area type="monotone" dataKey="out" strokeWidth={2} fillOpacity={1} fill="url(#outG)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

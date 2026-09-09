"use client";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { cycleTimeSeries, valueByDept, riskDistribution, clauseHeat } from "@/lib/data";

const axis = {
  stroke: "var(--line-strong)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

function TipBox({ active, payload, label, suffix = "" }: {
  active?: boolean; payload?: { name?: string; value?: number | string; color?: string }[];
  label?: string; suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2
      shadow-[var(--shadow-md)]">
      {label && <div className="mb-1 text-[11px] font-semibold text-[var(--fg)]">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-[12px]">
          <span className="size-2 rounded-full" style={{ background: p.color }} aria-hidden />
          <span className="text-[var(--fg-muted)]">{p.name}</span>
          <span className="tabular ml-auto font-medium text-[var(--fg)]">
            {typeof p.value === "number" ? p.value.toLocaleString() : p.value}{suffix}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Cycle time: manual vs Bontraco ─────────────────────────── */
export function CycleTimeChart() {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <AreaChart data={cycleTimeSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gBontraco" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity={0.32} />
            <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--line)" vertical={false} />
        <XAxis dataKey="month" {...axis} />
        <YAxis {...axis} width={44} tickFormatter={(v: number) => `${v}d`} />
        <Tooltip content={<TipBox suffix=" days" />} cursor={{ stroke: "var(--line-strong)" }} />
        <Legend
          verticalAlign="top" align="right" height={28} iconType="plainline" iconSize={14}
          wrapperStyle={{ fontSize: 11.5, color: "var(--fg-muted)" }}
        />
        <Area
          type="monotone" dataKey="manual" name="Manual review"
          stroke="var(--line-strong)" strokeWidth={1.5} strokeDasharray="4 4"
          fill="none" dot={false}
        />
        <Area
          type="monotone" dataKey="bontraco" name="With Bontraco"
          stroke="var(--color-brand-600)" strokeWidth={2.5}
          fill="url(#gBontraco)"
          dot={{ r: 2.5, fill: "var(--color-brand-600)", strokeWidth: 0 }}
          activeDot={{ r: 4.5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── Portfolio value by department ──────────────────────────── */
export function ValueByDeptChart() {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={valueByDept} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
        <CartesianGrid stroke="var(--line)" horizontal={false} />
        <XAxis
          type="number" {...axis}
          tickFormatter={(v: number) => `$${(v / 1_000_000).toFixed(1)}M`}
        />
        <YAxis type="category" dataKey="dept" {...axis} width={88} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const v = payload[0].value as number;
            return (
              <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2
                shadow-[var(--shadow-md)]">
                <div className="text-[11px] font-semibold">{label}</div>
                <div className="tabular mt-0.5 text-[13px] text-[var(--fg-muted)]">
                  ${v.toLocaleString()} total contract value
                </div>
              </div>
            );
          }}
          cursor={{ fill: "var(--surface-2)" }}
        />
        <Bar dataKey="value" name="Contract value" radius={[0, 4, 4, 0]} maxBarSize={18}>
          {valueByDept.map((_, i) => (
            <Cell key={i} fill={i === 0 ? "var(--color-brand-600)" : "var(--color-brand-600)"} fillOpacity={1 - i * 0.11} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Risk mix ───────────────────────────────────────────────── */
export function RiskDonut() {
  const total = riskDistribution.reduce((n, d) => n + d.value, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={188}>
        <PieChart>
          <Pie
            data={riskDistribution} dataKey="value" nameKey="name"
            innerRadius={58} outerRadius={80} paddingAngle={3} strokeWidth={0}
          >
            {riskDistribution.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Pie>
          <Tooltip content={<TipBox suffix=" contracts" />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular font-serif text-[30px] leading-none text-[var(--fg)]">{total}</span>
        <span className="mt-1 text-[11px] text-[var(--fg-subtle)]">contracts</span>
      </div>
    </div>
  );
}

/* ── Where the flags land ───────────────────────────────────── */
export function ClauseHeatChart() {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={clauseHeat} margin={{ top: 8, right: 8, left: 0, bottom: 40 }}>
        <CartesianGrid stroke="var(--line)" vertical={false} />
        <XAxis
          dataKey="category" {...axis} interval={0}
          angle={-32} textAnchor="end" height={60}
        />
        <YAxis {...axis} width={40} />
        <Tooltip content={<TipBox />} cursor={{ fill: "var(--surface-2)" }} />
        <Legend
          verticalAlign="top" align="right" height={26} iconType="circle" iconSize={8}
          wrapperStyle={{ fontSize: 11.5, color: "var(--fg-muted)" }}
        />
        <Bar dataKey="total" name="Clauses reviewed" fill="var(--line-strong)" radius={[3, 3, 0, 0]} maxBarSize={26} />
        <Bar dataKey="flagged" name="Flagged" fill="var(--color-risk-high)" radius={[3, 3, 0, 0]} maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}

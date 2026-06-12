import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  CategoryBreakdownRow,
  MonthlyReportRow,
} from "../../shared/types";
import { formatBaht, formatMonthLabel } from "../lib/format";

const PALETTE = [
  "#10b981", "#f43f5e", "#3b82f6", "#f59e0b", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
  "#06b6d4", "#a855f7",
];

const axisProps = {
  tick: { fontSize: 12, fill: "currentColor" },
  stroke: "currentColor",
};

const tooltipStyle = {
  contentStyle: {
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.3)",
    fontSize: 13,
  },
  formatter: (v: number) => formatBaht(v),
};

// Income vs Expense per month (grouped bar chart).
export function MonthlyBarChart({ data }: { data: MonthlyReportRow[] }) {
  // Reverse so the chart reads oldest -> newest left to right.
  const rows = [...data].reverse().map((r) => ({
    ...r,
    label: formatMonthLabel(r.month),
  }));
  return (
    <div className="h-72 w-full text-slate-500 dark:text-slate-400">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <XAxis dataKey="label" {...axisProps} />
          <YAxis
            width={64}
            tickFormatter={(v) => formatBaht(v as number)}
            {...axisProps}
          />
          <Tooltip {...tooltipStyle} cursor={{ fill: "rgba(148,163,184,0.1)" }} />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <Bar
            dataKey="income"
            name="Income"
            fill="#10b981"
            radius={[6, 6, 0, 0]}
          />
          <Bar
            dataKey="expense"
            name="Expense"
            fill="#f43f5e"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Expense (or income) share by category (donut chart).
export function CategoryDonut({ data }: { data: CategoryBreakdownRow[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

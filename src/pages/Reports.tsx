import { useEffect, useState } from "react";
import type {
  CategoryBreakdownRow,
  MonthlyReportRow,
  TransactionType,
} from "../../shared/types";
import * as api from "../lib/api";
import { formatBaht, formatMonthLabel } from "../lib/format";
import {
  Card,
  EmptyState,
  ErrorBanner,
  LoadingScreen,
} from "../components/ui";
import { CategoryDonut, MonthlyBarChart } from "../components/charts";

export default function Reports() {
  const [months, setMonths] = useState<MonthlyReportRow[]>([]);
  const [breakdown, setBreakdown] = useState<CategoryBreakdownRow[]>([]);
  const [breakdownType, setBreakdownType] = useState<TransactionType>("expense");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .getMonthlyReport(12)
      .then((m) => alive && setMonths(m))
      .catch(
        (err) =>
          alive &&
          setError(err instanceof Error ? err.message : "Failed to load"),
      )
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  // All-time category breakdown for the selected type.
  useEffect(() => {
    let alive = true;
    api
      .getCategoryBreakdown(breakdownType)
      .then((b) => alive && setBreakdown(b))
      .catch(() => alive && setBreakdown([]));
    return () => {
      alive = false;
    };
  }, [breakdownType]);

  if (loading) return <LoadingScreen label="Loading reports…" />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Reports
        </h1>
        <p className="text-sm text-slate-500">Last 12 months</p>
      </header>

      {error && <ErrorBanner message={error} />}

      {/* Chart 1: monthly income vs expense */}
      <Card>
        <h2 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">
          Income vs Expense
        </h2>
        {months.length === 0 ? (
          <EmptyState icon="📊" title="No data yet" />
        ) : (
          <MonthlyBarChart data={months} />
        )}
      </Card>

      {/* Chart 2: category breakdown */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">
            Breakdown by category
          </h2>
          <div className="flex rounded-xl border border-slate-200 p-0.5 dark:border-slate-700">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setBreakdownType(t)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize ${
                  breakdownType === t
                    ? "bg-emerald-600 text-white"
                    : "text-slate-500"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        {breakdown.length === 0 ? (
          <EmptyState icon="🍃" title="No data for this type" />
        ) : (
          <CategoryDonut data={breakdown} />
        )}
      </Card>

      {/* Monthly table */}
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
              <th className="px-4 py-3 font-medium">Month</th>
              <th className="px-4 py-3 text-right font-medium">Income</th>
              <th className="px-4 py-3 text-right font-medium">Expense</th>
              <th className="px-4 py-3 text-right font-medium">Balance</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <tr
                key={m.month}
                className="border-b border-slate-100 last:border-0 dark:border-slate-800/60"
              >
                <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                  {formatMonthLabel(m.month)}
                </td>
                <td className="px-4 py-3 text-right text-emerald-600">
                  {formatBaht(m.income)}
                </td>
                <td className="px-4 py-3 text-right text-rose-600">
                  {formatBaht(m.expense)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-semibold ${
                    m.balance >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {formatBaht(m.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

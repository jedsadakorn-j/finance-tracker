import { useCallback, useEffect, useState } from "react";
import type {
  CategoryBreakdownRow,
  DashboardSummary,
} from "../../shared/types";
import * as api from "../lib/api";
import { currentMonth, formatBaht, formatMonthLabel } from "../lib/format";
import {
  Card,
  EmptyState,
  ErrorBanner,
  LoadingScreen,
  Button,
} from "../components/ui";
import { CategoryDonut } from "../components/charts";
import TransactionFormModal from "../components/TransactionFormModal";

interface Stat {
  label: string;
  value: string;
  accent?: string;
  icon: string;
}

export default function Dashboard() {
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [breakdown, setBreakdown] = useState<CategoryBreakdownRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, b] = await Promise.all([
        api.getDashboard(month),
        api.getCategoryBreakdown("expense", month),
      ]);
      setSummary(s);
      setBreakdown(b);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const stats: Stat[] = summary
    ? [
        { label: "Income this month", value: formatBaht(summary.income), accent: "text-emerald-600", icon: "▲" },
        { label: "Expense this month", value: formatBaht(summary.expense), accent: "text-rose-600", icon: "▼" },
        {
          label: "Balance this month",
          value: formatBaht(summary.balance),
          accent: summary.balance >= 0 ? "text-emerald-600" : "text-rose-600",
          icon: "💵",
        },
        { label: "Avg. expense / day", value: formatBaht(summary.avgExpensePerDay), icon: "📆" },
        {
          label: "Top spending category",
          value: summary.topCategory ? summary.topCategory.category : "—",
          icon: "🏆",
        },
        { label: "Total transactions", value: String(summary.totalCount), icon: "🧾" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500">{formatMonthLabel(month)}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            max={currentMonth()}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <Button onClick={() => setModalOpen(true)}>+ Add</Button>
        </div>
      </header>

      {error && <ErrorBanner message={error} />}

      {loading && !summary ? (
        <LoadingScreen label="Loading dashboard…" />
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {stats.map((s) => (
              <Card key={s.label}>
                <div className="flex items-start justify-between">
                  <p className="text-xs font-medium text-slate-500">
                    {s.label}
                  </p>
                  <span aria-hidden>{s.icon}</span>
                </div>
                <p
                  className={`mt-2 text-xl font-bold capitalize sm:text-2xl ${
                    s.accent ?? "text-slate-900 dark:text-slate-100"
                  }`}
                >
                  {s.value}
                </p>
              </Card>
            ))}
          </div>

          {/* Expense breakdown */}
          <Card>
            <h2 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">
              Expense by category
            </h2>
            {breakdown.length === 0 ? (
              <EmptyState
                icon="🍃"
                title="No expenses this month"
                hint="Add a transaction to see the breakdown."
              />
            ) : (
              <CategoryDonut data={breakdown} />
            )}
          </Card>
        </>
      )}

      <TransactionFormModal
        open={modalOpen}
        editing={null}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </div>
  );
}

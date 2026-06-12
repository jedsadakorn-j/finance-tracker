import { useCallback, useEffect, useMemo, useState } from "react";
import type { Transaction } from "../../shared/types";
import * as api from "../lib/api";
import { useCategories } from "../lib/useCategories";
import { formatBaht, formatDate } from "../lib/format";
import {
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  LoadingScreen,
  TypeBadge,
} from "../components/ui";
import TransactionFormModal from "../components/TransactionFormModal";

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

export default function Transactions() {
  const cats = useCategories();
  const [filters, setFilters] = useState({
    type: "" as "" | "income" | "expense",
    category: "",
    start: "",
    end: "",
    search: "",
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [items, setItems] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Debounce the free-text search so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(t);
  }, [filters.search]);

  const query = useMemo(
    () => ({
      type: filters.type || undefined,
      category: filters.category || undefined,
      start: filters.start || undefined,
      end: filters.end || undefined,
      search: debouncedSearch || undefined,
    }),
    [filters.type, filters.category, filters.start, filters.end, debouncedSearch],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTransactions(query);
      setItems(res.transactions);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  async function onDelete(id: string) {
    if (!confirm("Delete this transaction?")) return;
    setDeletingId(id);
    try {
      await api.deleteTransaction(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
    } finally {
      setDeletingId(null);
    }
  }

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(t: Transaction) {
    setEditing(t);
    setModalOpen(true);
  }

  const categoryOptions =
    filters.type === "income"
      ? cats.income
      : filters.type === "expense"
        ? cats.expense
        : cats.categories;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Transactions
          </h1>
          <p className="text-sm text-slate-500">{total} record(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={api.exportCsvUrl(query)}>
            <Button variant="secondary">⬇ Export CSV</Button>
          </a>
          <Button onClick={openAdd}>+ Add</Button>
        </div>
      </header>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <select
            value={filters.type}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                type: e.target.value as typeof f.type,
                category: "",
              }))
            }
            className={inputCls}
          >
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters((f) => ({ ...f, category: e.target.value }))
            }
            className={inputCls}
          >
            <option value="">All categories</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.name}>
                {c.icon ? `${c.icon} ` : ""}
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filters.start}
            max={filters.end || undefined}
            onChange={(e) =>
              setFilters((f) => ({ ...f, start: e.target.value }))
            }
            className={inputCls}
            aria-label="Start date"
          />
          <input
            type="date"
            value={filters.end}
            min={filters.start || undefined}
            onChange={(e) => setFilters((f) => ({ ...f, end: e.target.value }))}
            className={inputCls}
            aria-label="End date"
          />
          <input
            type="search"
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
            className={inputCls}
            placeholder="Search description…"
          />
        </div>
      </Card>

      {error && <ErrorBanner message={error} />}

      {loading && items.length === 0 ? (
        <LoadingScreen label="Loading transactions…" />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            title="No transactions found"
            hint="Try adjusting filters, or add your first record."
            action={<Button onClick={openAdd}>+ Add transaction</Button>}
          />
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-x-auto p-0 md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                      {formatDate(t.transaction_date)}
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={t.type} />
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-700 dark:text-slate-200">
                      {t.category}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-500">
                      {t.description || "—"}
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${
                        t.type === "income"
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {t.type === "income" ? "+" : "−"}
                      {formatBaht(t.amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(t)}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(t.id)}
                        disabled={deletingId === t.id}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:hover:bg-rose-500/10"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {items.map((t) => (
              <Card key={t.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <TypeBadge type={t.type} />
                      <span className="truncate text-sm font-medium capitalize text-slate-700 dark:text-slate-200">
                        {t.category}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      {t.description || "—"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(t.transaction_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        t.type === "income"
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {t.type === "income" ? "+" : "−"}
                      {formatBaht(t.amount)}
                    </p>
                    <div className="mt-2 flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(t)}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(t.id)}
                        disabled={deletingId === t.id}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:hover:bg-rose-500/10"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <TransactionFormModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </div>
  );
}

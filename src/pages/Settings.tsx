import { useState, type FormEvent } from "react";
import type { Category, TransactionType } from "../../shared/types";
import * as api from "../lib/api";
import { useCategories } from "../lib/useCategories";
import { Button, Card, ErrorBanner } from "../components/ui";

export default function Settings() {
  const cats = useCategories();
  const [type, setType] = useState<TransactionType>("expense");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function addCategory(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Category name is required");
      return;
    }
    setBusy(true);
    try {
      await api.createCategory({ type, name: name.trim(), icon: icon.trim() || undefined });
      setName("");
      setIcon("");
      cats.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add category");
    } finally {
      setBusy(false);
    }
  }

  async function remove(c: Category) {
    if (!confirm(`Delete category "${c.name}"? Existing transactions keep their category label.`))
      return;
    try {
      await api.deleteCategory(c.id);
      cats.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Settings
        </h1>
        <p className="text-sm text-slate-500">Manage your categories</p>
      </header>

      {error && <ErrorBanner message={error} />}

      {/* Add category */}
      <Card>
        <h2 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">
          Add custom category
        </h2>
        <form
          onSubmit={addCategory}
          className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_1fr_auto_auto]"
        >
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="Icon (emoji)"
            maxLength={4}
            className="w-24 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <Button type="submit" disabled={busy}>
            {busy ? "Adding…" : "Add"}
          </Button>
        </form>
      </Card>

      {/* Existing categories */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(["income", "expense"] as const).map((t) => (
          <Card key={t}>
            <h3 className="mb-3 font-semibold capitalize text-slate-900 dark:text-slate-100">
              {t} categories
            </h3>
            <ul className="space-y-1">
              {(t === "income" ? cats.income : cats.expense).map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <span className="text-sm capitalize text-slate-700 dark:text-slate-200">
                    {c.icon ? `${c.icon} ` : ""}
                    {c.name}
                  </span>
                  <button
                    onClick={() => remove(c)}
                    className="text-xs font-medium text-rose-600 hover:underline"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}

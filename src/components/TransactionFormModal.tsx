import { useEffect, useState, type FormEvent } from "react";
import type { Transaction, TransactionType } from "../../shared/types";
import { useCategories } from "../lib/useCategories";
import { todayISO } from "../lib/format";
import * as api from "../lib/api";
import { Button, ErrorBanner } from "./ui";

interface Props {
  open: boolean;
  editing: Transaction | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function TransactionFormModal({
  open,
  editing,
  onClose,
  onSaved,
}: Props) {
  const cats = useCategories();
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset / prefill whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editing) {
      setType(editing.type);
      setAmount(String(editing.amount));
      setCategory(editing.category);
      setDescription(editing.description ?? "");
      setDate(editing.transaction_date);
    } else {
      setType("expense");
      setAmount("");
      setCategory("");
      setDescription("");
      setDate(todayISO());
    }
  }, [open, editing]);

  const options = type === "income" ? cats.income : cats.expense;

  // Keep a valid category selected when the type switches.
  useEffect(() => {
    if (options.length && !options.some((o) => o.name === category)) {
      setCategory(options[0].name);
    }
  }, [type, options, category]);

  if (!open) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError("Amount must be a positive number");
      return;
    }
    if (!category) {
      setError("Please choose a category");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        type,
        amount: amt,
        category,
        description: description.trim() || null,
        transaction_date: date,
      };
      if (editing) await api.updateTransaction(editing.id, payload);
      else await api.createTransaction(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl dark:bg-slate-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {editing ? "Edit transaction" : "Add transaction"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {error && <ErrorBanner message={error} />}

          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold capitalize transition-colors ${
                  type === t
                    ? t === "income"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : "border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                    : "border-slate-300 text-slate-500 dark:border-slate-700"
                }`}
              >
                {t === "income" ? "▲ Income" : "▼ Expense"}
              </button>
            ))}
          </div>

          <Field label="Amount (฿)">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputCls}
              placeholder="0.00"
            />
          </Field>

          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputCls}
            >
              {options.length === 0 && <option value="">—</option>}
              {options.map((o) => (
                <option key={o.id} value={o.name}>
                  {o.icon ? `${o.icon} ` : ""}
                  {o.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Description (optional)">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputCls}
              placeholder="e.g. ข้าวกลางวัน"
              maxLength={500}
            />
          </Field>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Add"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </span>
      {children}
    </label>
  );
}

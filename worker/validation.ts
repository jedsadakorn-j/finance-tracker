// Request validation. Returns { ok: true, value } or { ok: false, error }.
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  type TransactionInput,
  type TransactionType,
} from "../shared/types";

export type Validated<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

const KNOWN_CATEGORIES = new Set<string>([
  ...DEFAULT_INCOME_CATEGORIES,
  ...DEFAULT_EXPENSE_CATEGORIES,
]);

function isValidDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function isValidMonth(s: string): boolean {
  return MONTH_RE.test(s);
}

// Validate a transaction create/update payload.
// `knownCategories` lets callers extend the allow-list with custom categories.
export function validateTransaction(
  body: unknown,
  knownCategories?: Set<string>,
): Validated<TransactionInput> {
  if (typeof body !== "object" || body === null)
    return { ok: false, error: "Body must be a JSON object" };
  const b = body as Record<string, unknown>;

  if (b.type !== "income" && b.type !== "expense")
    return { ok: false, error: "type must be 'income' or 'expense'" };

  const amount =
    typeof b.amount === "string" ? Number(b.amount) : (b.amount as number);
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0)
    return { ok: false, error: "amount must be a positive number" };
  if (amount > 1_000_000_000)
    return { ok: false, error: "amount is unreasonably large" };

  if (typeof b.category !== "string" || b.category.trim() === "")
    return { ok: false, error: "category is required" };
  const category = b.category.trim();
  const allowed = knownCategories ?? KNOWN_CATEGORIES;
  if (!allowed.has(category))
    return { ok: false, error: `unknown category: ${category}` };

  if (typeof b.transaction_date !== "string" || !isValidDate(b.transaction_date))
    return { ok: false, error: "transaction_date must be YYYY-MM-DD" };

  let description: string | null = null;
  if (b.description != null) {
    if (typeof b.description !== "string")
      return { ok: false, error: "description must be a string" };
    description = b.description.trim().slice(0, 500) || null;
  }

  return {
    ok: true,
    value: {
      type: b.type as TransactionType,
      amount: Math.round(amount * 100) / 100, // 2-decimal money
      category,
      description,
      transaction_date: b.transaction_date,
    },
  };
}

// Centralized D1 query layer. Every read/write to the database goes through
// here. When we move to multi-user, this is the ONE file that gains a
// `userId` parameter + `WHERE user_id = ?` on each query — routes stay the same.

import type {
  Category,
  CategoryBreakdownRow,
  MonthlyReportRow,
  Transaction,
  TransactionInput,
  TransactionType,
} from "../shared/types";

export interface TxFilters {
  type?: TransactionType;
  category?: string;
  search?: string;
  start?: string; // YYYY-MM-DD inclusive
  end?: string; // YYYY-MM-DD inclusive
  limit?: number;
  offset?: number;
}

// Build the shared WHERE clause + bindings used by list and export.
function buildFilter(f: TxFilters): { where: string; binds: unknown[] } {
  const clauses: string[] = [];
  const binds: unknown[] = [];
  if (f.type) {
    clauses.push("type = ?");
    binds.push(f.type);
  }
  if (f.category) {
    clauses.push("category = ?");
    binds.push(f.category);
  }
  if (f.start) {
    clauses.push("transaction_date >= ?");
    binds.push(f.start);
  }
  if (f.end) {
    clauses.push("transaction_date <= ?");
    binds.push(f.end);
  }
  if (f.search) {
    clauses.push("description LIKE ? ESCAPE '\\'");
    const escaped = f.search.replace(/[\\%_]/g, (m) => "\\" + m);
    binds.push(`%${escaped}%`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return { where, binds };
}

export async function listTransactions(
  db: D1Database,
  f: TxFilters,
): Promise<Transaction[]> {
  const { where, binds } = buildFilter(f);
  const limit = Math.min(Math.max(f.limit ?? 500, 1), 1000);
  const offset = Math.max(f.offset ?? 0, 0);
  const sql = `SELECT * FROM transactions ${where}
               ORDER BY transaction_date DESC, created_at DESC
               LIMIT ? OFFSET ?`;
  const res = await db
    .prepare(sql)
    .bind(...binds, limit, offset)
    .all<Transaction>();
  return res.results ?? [];
}

export async function countTransactions(
  db: D1Database,
  f: TxFilters,
): Promise<number> {
  const { where, binds } = buildFilter(f);
  const row = await db
    .prepare(`SELECT COUNT(*) AS n FROM transactions ${where}`)
    .bind(...binds)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export async function getTransaction(
  db: D1Database,
  id: string,
): Promise<Transaction | null> {
  return db
    .prepare("SELECT * FROM transactions WHERE id = ?")
    .bind(id)
    .first<Transaction>();
}

export async function createTransaction(
  db: D1Database,
  input: TransactionInput,
): Promise<Transaction> {
  const now = Date.now();
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO transactions
         (id, type, amount, category, description, transaction_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.type,
      input.amount,
      input.category,
      input.description ?? null,
      input.transaction_date,
      now,
      now,
    )
    .run();
  return {
    id,
    ...input,
    description: input.description ?? null,
    created_at: now,
    updated_at: now,
  };
}

export async function updateTransaction(
  db: D1Database,
  id: string,
  input: TransactionInput,
): Promise<Transaction | null> {
  const now = Date.now();
  const res = await db
    .prepare(
      `UPDATE transactions
         SET type = ?, amount = ?, category = ?, description = ?,
             transaction_date = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(
      input.type,
      input.amount,
      input.category,
      input.description ?? null,
      input.transaction_date,
      now,
      id,
    )
    .run();
  if (res.meta.changes === 0) return null;
  return getTransaction(db, id);
}

export async function deleteTransaction(
  db: D1Database,
  id: string,
): Promise<boolean> {
  const res = await db
    .prepare("DELETE FROM transactions WHERE id = ?")
    .bind(id)
    .run();
  return res.meta.changes > 0;
}

// ---- aggregates ----

const monthStart = (month: string) => `${month}-01`;
const monthEnd = (month: string) => `${month}-31`; // lexical upper bound

export async function getMonthTotals(
  db: D1Database,
  month: string,
): Promise<{ income: number; expense: number }> {
  const row = await db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN type='income'  THEN amount END), 0) AS income,
         COALESCE(SUM(CASE WHEN type='expense' THEN amount END), 0) AS expense
       FROM transactions
       WHERE transaction_date >= ? AND transaction_date <= ?`,
    )
    .bind(monthStart(month), monthEnd(month))
    .first<{ income: number; expense: number }>();
  return { income: row?.income ?? 0, expense: row?.expense ?? 0 };
}

export async function getTopExpenseCategory(
  db: D1Database,
  month: string,
): Promise<{ category: string; amount: number } | null> {
  const row = await db
    .prepare(
      `SELECT category, SUM(amount) AS amount
       FROM transactions
       WHERE type='expense' AND transaction_date >= ? AND transaction_date <= ?
       GROUP BY category
       ORDER BY amount DESC
       LIMIT 1`,
    )
    .bind(monthStart(month), monthEnd(month))
    .first<{ category: string; amount: number }>();
  return row ?? null;
}

export async function getTotalCount(db: D1Database): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM transactions")
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export async function getMonthlyReport(
  db: D1Database,
  limit = 12,
): Promise<MonthlyReportRow[]> {
  const res = await db
    .prepare(
      `SELECT
         substr(transaction_date, 1, 7) AS month,
         COALESCE(SUM(CASE WHEN type='income'  THEN amount END), 0) AS income,
         COALESCE(SUM(CASE WHEN type='expense' THEN amount END), 0) AS expense
       FROM transactions
       GROUP BY month
       ORDER BY month DESC
       LIMIT ?`,
    )
    .bind(Math.min(Math.max(limit, 1), 60))
    .all<{ month: string; income: number; expense: number }>();
  return (res.results ?? []).map((r) => ({
    ...r,
    balance: r.income - r.expense,
  }));
}

export async function getCategoryBreakdown(
  db: D1Database,
  type: TransactionType,
  month?: string,
): Promise<CategoryBreakdownRow[]> {
  const binds: unknown[] = [type];
  let range = "";
  if (month) {
    range = "AND transaction_date >= ? AND transaction_date <= ?";
    binds.push(monthStart(month), monthEnd(month));
  }
  const res = await db
    .prepare(
      `SELECT category, SUM(amount) AS amount
       FROM transactions
       WHERE type = ? ${range}
       GROUP BY category
       ORDER BY amount DESC`,
    )
    .bind(...binds)
    .all<CategoryBreakdownRow>();
  return res.results ?? [];
}

// ---- categories ----

export async function listCategories(db: D1Database): Promise<Category[]> {
  const res = await db
    .prepare(
      `SELECT id, type, name, icon, sort_order
       FROM categories
       ORDER BY type ASC, sort_order ASC, name ASC`,
    )
    .all<Category>();
  return res.results ?? [];
}

export async function createCategory(
  db: D1Database,
  type: TransactionType,
  name: string,
  icon: string | null,
): Promise<Category | null> {
  const now = Date.now();
  const id = crypto.randomUUID();
  try {
    await db
      .prepare(
        `INSERT INTO categories (id, type, name, icon, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, type, name, icon, 100, now, now)
      .run();
  } catch {
    return null; // UNIQUE(type, name) violation
  }
  return { id, type, name, icon, sort_order: 100 };
}

export async function deleteCategory(
  db: D1Database,
  id: string,
): Promise<boolean> {
  const res = await db
    .prepare("DELETE FROM categories WHERE id = ?")
    .bind(id)
    .run();
  return res.meta.changes > 0;
}

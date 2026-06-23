// Centralized D1 query layer. Every read/write is scoped to a userId so users
// only ever see their own data — the WHERE user_id = ? lives here, in one place.

import type {
  Category,
  CategoryBreakdownRow,
  MonthlyReportRow,
  Transaction,
  TransactionInput,
  TransactionType,
  User,
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

// Shared WHERE clause + bindings for list/export/count. Always scoped to user.
function buildFilter(
  userId: string,
  f: TxFilters,
): { where: string; binds: unknown[] } {
  const clauses: string[] = ["user_id = ?"];
  const binds: unknown[] = [userId];
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
  return { where: `WHERE ${clauses.join(" AND ")}`, binds };
}

// ---- users ----

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
}

export async function getUserByEmail(
  db: D1Database,
  email: string,
): Promise<UserRow | null> {
  return db
    .prepare("SELECT id, email, password_hash FROM users WHERE email = ?")
    .bind(email)
    .first<UserRow>();
}

export async function getUserById(
  db: D1Database,
  id: string,
): Promise<User | null> {
  return db
    .prepare("SELECT id, email FROM users WHERE id = ?")
    .bind(id)
    .first<User>();
}

// Create a user + seed their default categories. Returns null if email taken.
export async function createUser(
  db: D1Database,
  email: string,
  passwordHash: string,
): Promise<User | null> {
  const now = Date.now();
  const id = crypto.randomUUID();
  try {
    await db
      .prepare(
        `INSERT INTO users (id, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(id, email, passwordHash, now, now)
      .run();
  } catch {
    return null; // UNIQUE(email) violation
  }
  await seedDefaultCategories(db, id);
  return { id, email };
}

// Default categories given to every new user.
const DEFAULT_CATEGORIES: Array<{
  type: TransactionType;
  name: string;
  icon: string;
}> = [
  { type: "income", name: "salary", icon: "💼" },
  { type: "income", name: "bonus", icon: "🎁" },
  { type: "income", name: "freelance", icon: "🧑‍💻" },
  { type: "income", name: "investment", icon: "📈" },
  { type: "income", name: "gift", icon: "🎀" },
  { type: "income", name: "other_income", icon: "➕" },
  { type: "expense", name: "food", icon: "🍜" },
  { type: "expense", name: "transport", icon: "🚌" },
  { type: "expense", name: "shopping", icon: "🛍️" },
  { type: "expense", name: "rent", icon: "🏠" },
  { type: "expense", name: "utility", icon: "💡" },
  { type: "expense", name: "entertainment", icon: "🎬" },
  { type: "expense", name: "health", icon: "🏥" },
  { type: "expense", name: "education", icon: "📚" },
  { type: "expense", name: "travel", icon: "✈️" },
  { type: "expense", name: "other_expense", icon: "➖" },
];

async function seedDefaultCategories(
  db: D1Database,
  userId: string,
): Promise<void> {
  const now = Date.now();
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO categories
       (id, user_id, type, name, icon, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  await db.batch(
    DEFAULT_CATEGORIES.map((cat, i) =>
      stmt.bind(crypto.randomUUID(), userId, cat.type, cat.name, cat.icon, i + 1, now, now),
    ),
  );
}

// ---- transactions ----

export async function listTransactions(
  db: D1Database,
  userId: string,
  f: TxFilters,
): Promise<Transaction[]> {
  const { where, binds } = buildFilter(userId, f);
  const limit = Math.min(Math.max(f.limit ?? 500, 1), 1000);
  const offset = Math.max(f.offset ?? 0, 0);
  const res = await db
    .prepare(
      `SELECT * FROM transactions ${where}
       ORDER BY transaction_date DESC, created_at DESC
       LIMIT ? OFFSET ?`,
    )
    .bind(...binds, limit, offset)
    .all<Transaction>();
  return res.results ?? [];
}

export async function countTransactions(
  db: D1Database,
  userId: string,
  f: TxFilters,
): Promise<number> {
  const { where, binds } = buildFilter(userId, f);
  const row = await db
    .prepare(`SELECT COUNT(*) AS n FROM transactions ${where}`)
    .bind(...binds)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export async function getTransaction(
  db: D1Database,
  userId: string,
  id: string,
): Promise<Transaction | null> {
  return db
    .prepare("SELECT * FROM transactions WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .first<Transaction>();
}

export async function createTransaction(
  db: D1Database,
  userId: string,
  input: TransactionInput,
): Promise<Transaction> {
  const now = Date.now();
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO transactions
         (id, user_id, type, amount, category, description, transaction_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      userId,
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
  userId: string,
  id: string,
  input: TransactionInput,
): Promise<Transaction | null> {
  const now = Date.now();
  const res = await db
    .prepare(
      `UPDATE transactions
         SET type = ?, amount = ?, category = ?, description = ?,
             transaction_date = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
    )
    .bind(
      input.type,
      input.amount,
      input.category,
      input.description ?? null,
      input.transaction_date,
      now,
      id,
      userId,
    )
    .run();
  if (res.meta.changes === 0) return null;
  return getTransaction(db, userId, id);
}

export async function deleteTransaction(
  db: D1Database,
  userId: string,
  id: string,
): Promise<boolean> {
  const res = await db
    .prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .run();
  return res.meta.changes > 0;
}

// ---- aggregates ----

const monthStart = (month: string) => `${month}-01`;
const monthEnd = (month: string) => `${month}-31`; // lexical upper bound

export async function getMonthTotals(
  db: D1Database,
  userId: string,
  month: string,
): Promise<{ income: number; expense: number }> {
  const row = await db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN type='income'  THEN amount END), 0) AS income,
         COALESCE(SUM(CASE WHEN type='expense' THEN amount END), 0) AS expense
       FROM transactions
       WHERE user_id = ? AND transaction_date >= ? AND transaction_date <= ?`,
    )
    .bind(userId, monthStart(month), monthEnd(month))
    .first<{ income: number; expense: number }>();
  return { income: row?.income ?? 0, expense: row?.expense ?? 0 };
}

export async function getTopExpenseCategory(
  db: D1Database,
  userId: string,
  month: string,
): Promise<{ category: string; amount: number } | null> {
  const row = await db
    .prepare(
      `SELECT category, SUM(amount) AS amount
       FROM transactions
       WHERE user_id = ? AND type='expense'
         AND transaction_date >= ? AND transaction_date <= ?
       GROUP BY category
       ORDER BY amount DESC
       LIMIT 1`,
    )
    .bind(userId, monthStart(month), monthEnd(month))
    .first<{ category: string; amount: number }>();
  return row ?? null;
}

export async function getTotalCount(
  db: D1Database,
  userId: string,
): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM transactions WHERE user_id = ?")
    .bind(userId)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export async function getMonthlyReport(
  db: D1Database,
  userId: string,
  limit = 12,
): Promise<MonthlyReportRow[]> {
  const res = await db
    .prepare(
      `SELECT
         substr(transaction_date, 1, 7) AS month,
         COALESCE(SUM(CASE WHEN type='income'  THEN amount END), 0) AS income,
         COALESCE(SUM(CASE WHEN type='expense' THEN amount END), 0) AS expense
       FROM transactions
       WHERE user_id = ?
       GROUP BY month
       ORDER BY month DESC
       LIMIT ?`,
    )
    .bind(userId, Math.min(Math.max(limit, 1), 60))
    .all<{ month: string; income: number; expense: number }>();
  return (res.results ?? []).map((r) => ({
    ...r,
    balance: r.income - r.expense,
  }));
}

export async function getCategoryBreakdown(
  db: D1Database,
  userId: string,
  type: TransactionType,
  month?: string,
): Promise<CategoryBreakdownRow[]> {
  const binds: unknown[] = [userId, type];
  let range = "";
  if (month) {
    range = "AND transaction_date >= ? AND transaction_date <= ?";
    binds.push(monthStart(month), monthEnd(month));
  }
  const res = await db
    .prepare(
      `SELECT category, SUM(amount) AS amount
       FROM transactions
       WHERE user_id = ? AND type = ? ${range}
       GROUP BY category
       ORDER BY amount DESC`,
    )
    .bind(...binds)
    .all<CategoryBreakdownRow>();
  return res.results ?? [];
}

// ---- categories ----

export async function listCategories(
  db: D1Database,
  userId: string,
): Promise<Category[]> {
  const res = await db
    .prepare(
      `SELECT id, type, name, icon, sort_order
       FROM categories
       WHERE user_id = ?
       ORDER BY type ASC, sort_order ASC, name ASC`,
    )
    .bind(userId)
    .all<Category>();
  return res.results ?? [];
}

export async function createCategory(
  db: D1Database,
  userId: string,
  type: TransactionType,
  name: string,
  icon: string | null,
): Promise<Category | null> {
  const now = Date.now();
  const id = crypto.randomUUID();
  try {
    await db
      .prepare(
        `INSERT INTO categories (id, user_id, type, name, icon, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, userId, type, name, icon, 100, now, now)
      .run();
  } catch {
    return null; // UNIQUE(user_id, type, name) violation
  }
  return { id, type, name, icon, sort_order: 100 };
}

export async function deleteCategory(
  db: D1Database,
  userId: string,
  id: string,
): Promise<boolean> {
  const res = await db
    .prepare("DELETE FROM categories WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .run();
  return res.meta.changes > 0;
}
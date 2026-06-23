// Types shared between the Cloudflare Worker (API) and the React frontend.

export type TransactionType = "income" | "expense";

// A user account (the password hash never leaves the server).
export interface User {
  id: string;
  email: string;
}

export interface AuthInput {
  email: string;
  password: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string | null;
  transaction_date: string; // YYYY-MM-DD
  created_at: number; // epoch ms
  updated_at: number; // epoch ms
}

export interface Category {
  id: string;
  type: TransactionType;
  name: string;
  icon: string | null;
  sort_order: number;
}

// Payload for creating/updating a transaction.
export interface TransactionInput {
  type: TransactionType;
  amount: number;
  category: string;
  description?: string | null;
  transaction_date: string;
}

export interface DashboardSummary {
  month: string; // YYYY-MM
  income: number;
  expense: number;
  balance: number;
  avgExpensePerDay: number;
  topCategory: { category: string; amount: number } | null;
  totalCount: number; // all-time transaction count
}

export interface MonthlyReportRow {
  month: string; // YYYY-MM
  income: number;
  expense: number;
  balance: number;
}

export interface CategoryBreakdownRow {
  category: string;
  amount: number;
}

// Default seed categories, mirrored in seed.sql so the UI can fall back to
// them even before the categories table is queried.
export const DEFAULT_INCOME_CATEGORIES = [
  "salary",
  "bonus",
  "freelance",
  "investment",
  "gift",
  "other_income",
] as const;

export const DEFAULT_EXPENSE_CATEGORIES = [
  "food",
  "transport",
  "shopping",
  "rent",
  "utility",
  "entertainment",
  "health",
  "education",
  "travel",
  "other_expense",
] as const;

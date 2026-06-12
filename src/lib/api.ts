// Typed API client. All calls hit the same-origin Worker under /api.
import type {
  Category,
  CategoryBreakdownRow,
  DashboardSummary,
  MonthlyReportRow,
  Transaction,
  TransactionInput,
} from "../../shared/types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Lets AuthContext react globally to an expired/invalid session.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (res.status === 401) {
    onUnauthorized?.();
    throw new ApiError("Unauthorized", 401);
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---- auth ----
export const login = (password: string) =>
  request<{ ok: true }>("/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });

export const logout = () => request<{ ok: true }>("/logout", { method: "POST" });

export const checkSession = () =>
  request<{ authenticated: boolean }>("/me");

// ---- categories ----
export const getCategories = () =>
  request<{ categories: Category[] }>("/categories").then((r) => r.categories);

export const createCategory = (input: {
  type: "income" | "expense";
  name: string;
  icon?: string;
}) =>
  request<{ category: Category }>("/categories", {
    method: "POST",
    body: JSON.stringify(input),
  }).then((r) => r.category);

export const deleteCategory = (id: string) =>
  request<{ ok: true }>(`/categories/${id}`, { method: "DELETE" });

// ---- transactions ----
export interface TransactionQuery {
  type?: "income" | "expense";
  category?: string;
  search?: string;
  start?: string;
  end?: string;
  limit?: number;
  offset?: number;
}

function toQueryString(q: Record<string, unknown> | object): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export const getTransactions = (q: TransactionQuery = {}) =>
  request<{ transactions: Transaction[]; total: number }>(
    `/transactions${toQueryString(q)}`,
  );

export const createTransaction = (input: TransactionInput) =>
  request<{ transaction: Transaction }>("/transactions", {
    method: "POST",
    body: JSON.stringify(input),
  }).then((r) => r.transaction);

export const updateTransaction = (id: string, input: TransactionInput) =>
  request<{ transaction: Transaction }>(`/transactions/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  }).then((r) => r.transaction);

export const deleteTransaction = (id: string) =>
  request<{ ok: true }>(`/transactions/${id}`, { method: "DELETE" });

// ---- dashboard & reports ----
export const getDashboard = (month?: string) =>
  request<DashboardSummary>(`/dashboard${month ? `?month=${month}` : ""}`);

export const getMonthlyReport = (limit = 12) =>
  request<{ months: MonthlyReportRow[] }>(
    `/reports/monthly?limit=${limit}`,
  ).then((r) => r.months);

export const getCategoryBreakdown = (
  type: "income" | "expense",
  month?: string,
) =>
  request<{ breakdown: CategoryBreakdownRow[] }>(
    `/reports/categories${toQueryString({ type, month })}`,
  ).then((r) => r.breakdown);

// CSV export is a direct link (browser handles the download).
export const exportCsvUrl = (q: TransactionQuery = {}) =>
  `/api/export.csv${toQueryString(q)}`;

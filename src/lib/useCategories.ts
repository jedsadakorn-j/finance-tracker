import { useEffect, useState } from "react";
import * as api from "./api";
import type { Category } from "../../shared/types";

// Fetches categories once and exposes them grouped by type. Many pages
// (add form, filters, settings) need this, so it lives in one hook.
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .getCategories()
      .then((c) => alive && setCategories(c))
      .catch(() => alive && setCategories([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  return {
    categories,
    income: categories.filter((c) => c.type === "income"),
    expense: categories.filter((c) => c.type === "expense"),
    loading,
    reload: () => setReloadKey((k) => k + 1),
  };
}

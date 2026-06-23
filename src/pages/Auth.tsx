import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { Button, ErrorBanner } from "../components/ui";

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

export default function Auth() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === "register";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isRegister) await register(email, password);
      else await login(email, password);
      // AuthProvider sets `user` -> router renders the app.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(next: "login" | "register") {
    setMode(next);
    setError(null);
  }

  return (
    <main className="flex min-h-full items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-4xl">💰</div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            Finance Tracker
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isRegister
              ? "Create an account to get started"
              : "Sign in to your account"}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="mb-4 grid grid-cols-2 rounded-xl border border-slate-200 p-1 dark:border-slate-800">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`rounded-lg py-1.5 text-sm font-semibold capitalize transition-colors ${
                mode === m
                  ? "bg-emerald-600 text-white"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {m === "login" ? "Sign in" : "Register"}
            </button>
          ))}
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          {error && <ErrorBanner message={error} />}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </span>
            <input
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              placeholder="you@example.com"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </span>
            <input
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              placeholder="••••••••"
            />
            {isRegister && (
              <span className="mt-1 block text-xs text-slate-400">
                At least 8 characters.
              </span>
            )}
          </label>
          <Button
            type="submit"
            className="w-full"
            disabled={submitting || !email || !password}
          >
            {submitting
              ? isRegister
                ? "Creating account…"
                : "Signing in…"
              : isRegister
                ? "Create account"
                : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          {isRegister ? "Already have an account?" : "New here?"}{" "}
          <button
            onClick={() => switchMode(isRegister ? "login" : "register")}
            className="font-semibold text-emerald-600 hover:underline"
          >
            {isRegister ? "Sign in" : "Create one"}
          </button>
        </p>

        {!isRegister && (
          <p className="mt-6 rounded-xl bg-slate-100 px-4 py-3 text-center text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            Demo account — email{" "}
            <span className="font-mono font-semibold">demo@example.com</span>,
            password <span className="font-mono font-semibold">demo1234</span>
          </p>
        )}
      </div>
    </main>
  );
}
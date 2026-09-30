import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Button, Input } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ApiError, DEMO_CREDENTIALS } from "@/services";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Floodlight" },
      {
        name: "description",
        content: "Sign in or create a free account to follow teams and leagues on Floodlight.",
      },
      { property: "og:title", content: "Sign in — Floodlight" },
      {
        property: "og:description",
        content: "Create an account to follow football teams, leagues and live scores.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) void navigate({ to: "/" });
  }, [user, navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") {
        await login({ email: form.email, password: form.password });
      } else {
        await register(form);
      }
      await navigate({ to: "/" });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-4xl text-foreground">
        {mode === "login" ? "Sign in" : "Create account"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Follow teams and leagues, and get live recommendations.
      </p>

      <form onSubmit={submit} className="panel mt-6 space-y-4 p-5">
        {mode === "register" ? (
          <label className="block space-y-1.5">
            <span className="label-eyebrow">Name</span>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoComplete="name"
              required
            />
          </label>
        ) : null}

        <label className="block space-y-1.5">
          <span className="label-eyebrow">Email</span>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
            required
          />
        </label>

        <label className="block space-y-1.5">
          <span className="label-eyebrow">Password</span>
          <Input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
          />
        </label>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </Button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
          }}
          className="w-full text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          {mode === "login" ? "No account? Create one" : "Already registered? Sign in"}
        </button>
      </form>

      <div className="panel mt-4 p-4 text-sm text-muted-foreground">
        <p className="label-eyebrow mb-1">Demo account</p>
        {DEMO_CREDENTIALS.email} / {DEMO_CREDENTIALS.password}
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          onClick={() => {
            setMode("login");
            setForm({ name: "", ...DEMO_CREDENTIALS });
          }}
        >
          Fill demo credentials
        </Button>
      </div>
    </div>
  );
}

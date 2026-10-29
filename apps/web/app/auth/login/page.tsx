"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";

type LoginResponse = {
  active_mode?: string;
  onboarding_completed?: boolean;
  error?: { message?: string };
};

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { ok, data } = await apiPost<LoginResponse>("auth/login", {
        identifier,
        password,
      });

      if (!ok) {
        setError(
          (data as LoginResponse & { error?: { message?: string } }).error
            ?.message ?? "Invalid username or password.",
        );
        setLoading(false);
        return;
      }

      if (data.active_mode === "teacher") {
        router.push("/teacher");
      } else if (!data.onboarding_completed) {
        router.push("/onboarding");
      } else {
        router.push("/student");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <main className="simple-page">
      <header style={{ marginBottom: "24px" }}>
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">
            P
          </span>
          <span>
            PracticalLab <strong>Africa</strong>
          </span>
        </Link>
        <ThemeToggle />
      </header>

      <section
        className="simple-card"
        style={{ maxWidth: "440px", margin: "0 auto", padding: "32px 24px" }}
      >
        <p className="eyebrow">WELCOME BACK</p>
        <h1 style={{ fontSize: "28px", marginTop: "4px", marginBottom: "8px" }}>
          Sign in to your lab
        </h1>
        <p
          style={{
            color: "var(--pl-muted)",
            fontSize: "14px",
            marginBottom: "24px",
          }}
        >
          Individual student and educator accounts.
        </p>

        {error && (
          <div
            role="alert"
            style={{
              padding: "12px 16px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid var(--pl-danger)",
              borderRadius: "8px",
              color: "var(--pl-danger)",
              fontSize: "14px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Username or Email
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. amara or amara@example.com"
              style={{
                minHeight: "44px",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--pl-border)",
                background: "var(--pl-surface)",
                color: "var(--pl-text)",
                fontSize: "16px",
              }}
            />
          </label>

          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                minHeight: "44px",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--pl-border)",
                background: "var(--pl-surface)",
                color: "var(--pl-text)",
                fontSize: "16px",
              }}
            />
          </label>

          <button
            type="submit"
            className="button button-reward"
            disabled={loading}
            style={{
              marginTop: "8px",
              width: "100%",
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <footer
          style={{
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid var(--pl-border)",
            fontSize: "14px",
            textAlign: "center",
          }}
        >
          <p style={{ margin: "0 0 8px 0" }}>
            Don&apos;t have an account yet?{" "}
            <Link
              href="/auth/register"
              style={{ color: "var(--pl-primary)", fontWeight: 700 }}
            >
              Create an account
            </Link>
          </p>
          <p style={{ margin: "0" }}>
            <Link
              href="/auth/recovery"
              style={{ color: "var(--pl-muted)", fontSize: "13px" }}
            >
              Forgot your password?
            </Link>
          </p>
        </footer>
      </section>
    </main>
  );
}

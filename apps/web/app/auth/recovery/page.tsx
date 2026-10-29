"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiPost } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";

type ApiMessage = {
  status?: string;
  message?: string;
  error?: { message?: string };
};

export default function RecoveryPage() {
  const [identifier, setIdentifier] = useState("");
  const [uid, setUid] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUid(params.get("uid") ?? "");
    setToken(params.get("token") ?? "");
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (uid && token) {
        const { ok, data } = await apiPost<ApiMessage>(
          "auth/recovery/confirm",
          {
            user_id: uid,
            token,
            new_password: password,
          },
        );
        if (!ok)
          throw new Error(
            data.error?.message ?? "This reset link is invalid or expired.",
          );
        setMessage(
          "Password updated. You can now sign in with your new password.",
        );
      } else {
        const { ok, data } = await apiPost<ApiMessage>("auth/recovery", {
          identifier,
        });
        if (!ok)
          throw new Error(
            data.error?.message ?? "Please check your details and try again.",
          );
        setMessage(
          "If an account with a recovery email exists, we have sent a reset link.",
        );
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Network error. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="simple-page">
      <header className="simple-header" style={{ marginBottom: 24 }}>
        <Link className="brand" href="/">
          PracticalLab <strong>Africa</strong>
        </Link>
        <ThemeToggle />
      </header>
      <section
        className="simple-card"
        style={{ maxWidth: 480, margin: "0 auto", padding: "32px 24px" }}
      >
        <p className="eyebrow">ACCOUNT HELP</p>
        <h1>
          {uid && token ? "Choose a new password" : "Reset your password"}
        </h1>
        <p style={{ color: "var(--pl-muted)" }}>
          {uid && token
            ? "Choose a strong password you have not used here before."
            : "We will send a reset link if your account has a recovery email."}
        </p>
        {message && <p role="status">{message}</p>}
        {error && (
          <p role="alert" style={{ color: "var(--pl-danger)" }}>
            {error}
          </p>
        )}
        {!message && (
          <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
            {uid && token ? (
              <label>
                New password
                <input
                  required
                  minLength={8}
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
            ) : (
              <label>
                Username or email
                <input
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                />
              </label>
            )}
            <button
              className="button button-reward"
              type="submit"
              disabled={busy}
            >
              {busy
                ? "Please wait…"
                : uid && token
                  ? "Save new password"
                  : "Send reset link"}
            </button>
          </form>
        )}
        <p style={{ marginTop: 20 }}>
          <Link href="/auth/login">Back to sign in</Link>
        </p>
      </section>
    </main>
  );
}

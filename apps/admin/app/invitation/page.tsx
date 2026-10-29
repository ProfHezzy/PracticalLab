"use client";

import { FormEvent, useEffect, useState } from "react";
import { ThemeToggle } from "../../../web/components/theme-toggle";

export default function StaffInvitationPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(
    () =>
      setToken(new URLSearchParams(window.location.search).get("token") ?? ""),
    [],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const csrfResponse = await fetch("/api/v1/auth/csrf", {
        credentials: "include",
      });
      const { csrfToken } = (await csrfResponse.json()) as {
        csrfToken: string;
      };
      const response = await fetch("/api/v1/staff/invitations/accept", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({ token, password }),
      });
      const data = (await response.json()) as {
        status?: string;
        error?: { message?: string };
      };
      if (!response.ok)
        throw new Error(
          data.error?.message ?? "The invitation could not be accepted.",
        );
      setMessage("Staff account created. Sign in to set up mandatory MFA.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Network error. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-shell">
      <div className="staff-banner">PracticalLab Africa · staff invitation</div>
      <ThemeToggle />
      <section className="panel" style={{ maxWidth: 480, margin: "48px auto" }}>
        <h1>Accept staff invitation</h1>
        <p className="muted">
          Your account will require authenticator setup before staff tools are
          available.
        </p>
        {error && <p role="alert">{error}</p>}
        {message && (
          <p role="status">
            {message} <a href="/">Go to staff sign in</a>
          </p>
        )}
        {!message && (
          <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
            <label>
              Invitation token
              <input
                required
                value={token}
                onChange={(event) => setToken(event.target.value)}
              />
            </label>
            <label>
              Create password
              <input
                required
                type="password"
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <button className="button button-primary" disabled={busy}>
              {busy ? "Creating account…" : "Accept invitation"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

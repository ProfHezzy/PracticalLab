"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ThemeToggle } from "../../web/components/theme-toggle";

type Stage =
  "checking" | "login" | "enroll" | "verify" | "recovery-codes" | "dashboard";
type ApiError = { error?: { message?: string } };
type Access = {
  username: string;
  user_id: number;
  role: string;
  mfa_enrolled: boolean;
  mfa_verified: boolean;
};
type Summary = {
  subjects: number;
  courses: number;
  topics: number;
  pending_teacher_verifications: number;
  open_reports: number;
};
type QueueItem = {
  id: number;
  username?: string;
  reason?: string;
  verification_status?: string;
  status?: string;
  latest_application?: {
    id_document_type: string;
    id_reference_masked: string;
  };
};
type Approval = {
  id: number;
  action: string;
  target_model: string;
  target_id: number;
  status: string;
  requester_id: number;
  reason: string;
};

let csrfToken = "";

async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<{ ok: boolean; status: number; data: T }> {
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    if (!csrfToken) {
      const csrf = await fetch("/api/v1/auth/csrf", { credentials: "include" });
      csrfToken =
        ((await csrf.json()) as { csrfToken?: string }).csrfToken ?? "";
    }
    headers["Content-Type"] = "application/json";
    headers["X-CSRFToken"] = csrfToken;
  }
  const response = await fetch(`/api/v1/${path}`, {
    method,
    credentials: "include",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    ok: response.ok,
    status: response.status,
    data: (await response.json().catch(() => ({}))) as T,
  };
}

export default function AdminHomePage() {
  const [stage, setStage] = useState<Stage>("checking");
  const [access, setAccess] = useState<Access | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [secret, setSecret] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [teachers, setTeachers] = useState<QueueItem[]>([]);
  const [reports, setReports] = useState<QueueItem[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteRole, setInviteRole] = useState("Reviewer");
  const [inviteToken, setInviteToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const checkAccess = useCallback(async () => {
    const result = await request<Access & ApiError>("staff/access");
    if (!result.ok) {
      setStage("login");
      return;
    }
    setAccess(result.data);
    if (!result.data.mfa_enrolled) setStage("enroll");
    else if (!result.data.mfa_verified) setStage("verify");
    else setStage("dashboard");
  }, []);

  useEffect(() => {
    void checkAccess();
  }, [checkAccess]);

  useEffect(() => {
    if (stage !== "dashboard") return;
    let active = true;
    Promise.all([
      request<Summary & ApiError>("admin/overview"),
      request<QueueItem[] & ApiError>("admin/teacher-verifications"),
      request<QueueItem[] & ApiError>("admin/moderation"),
      request<Approval[] & ApiError>("admin/approvals"),
    ])
      .then(([overview, teacherQueue, moderation, approvalQueue]) => {
        if (!active) return;
        if (overview.ok) setSummary(overview.data);
        if (teacherQueue.ok) setTeachers(teacherQueue.data);
        if (moderation.ok) setReports(moderation.data);
        if (approvalQueue.ok) setApprovals(approvalQueue.data);
        if (
          !overview.ok &&
          !teacherQueue.ok &&
          !moderation.ok &&
          !approvalQueue.ok
        )
          setError("Your staff role cannot access these dashboard queues.");
      })
      .catch(() => {
        if (active)
          setError(
            "Could not load the staff dashboard. Check your connection.",
          );
      });
    return () => {
      active = false;
    };
  }, [stage]);

  async function decideApproval(id: number, decision: "approve" | "reject") {
    setBusy(true);
    setError("");
    const result = await request<Approval & ApiError>(
      `admin/approvals/${id}/decision`,
      "POST",
      { decision },
    );
    setBusy(false);
    if (!result.ok) {
      setError(result.data.error?.message ?? "Approval could not be recorded.");
      return;
    }
    setApprovals((current) => current.filter((item) => item.id !== id));
  }

  async function createStaffInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setInviteToken("");
    const result = await request<{
      invitation_token?: string;
      error?: { message?: string };
    }>("admin/staff/invitations", "POST", {
      username: inviteUsername,
      role: inviteRole,
    });
    setBusy(false);
    if (!result.ok || !result.data.invitation_token) {
      setError(
        result.data.error?.message ?? "Invitation could not be created.",
      );
      return;
    }
    setInviteToken(result.data.invitation_token);
    setInviteUsername("");
  }

  async function onLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await request<{ error?: { message?: string } }>(
      "staff/auth/login",
      "POST",
      { identifier, password },
    );
    setBusy(false);
    if (!result.ok) {
      setError(result.data.error?.message ?? "Sign-in failed.");
      return;
    }
    setPassword("");
    await checkAccess();
  }

  async function beginEnrollment() {
    setBusy(true);
    setError("");
    const result = await request<{
      secret?: string;
      error?: { message?: string };
    }>("staff/mfa/enroll", "POST", {});
    setBusy(false);
    if (!result.ok || !result.data.secret) {
      setError(result.data.error?.message ?? "Could not begin MFA enrollment.");
      return;
    }
    setSecret(result.data.secret);
  }

  async function verifyMfa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await request<{
      status?: string;
      recovery_codes?: string[];
      error?: { message?: string };
    }>("staff/mfa/verify", "POST", { code });
    setBusy(false);
    if (!result.ok) {
      setError(result.data.error?.message ?? "That code did not work.");
      return;
    }
    setCode("");
    if (result.data.recovery_codes) {
      setRecoveryCodes(result.data.recovery_codes);
      setStage("recovery-codes");
    } else await checkAccess();
  }

  async function signOut() {
    await request("auth/logout", "POST", {});
    csrfToken = "";
    setAccess(null);
    setSummary(null);
    setStage("login");
  }

  return (
    <main className="admin-shell">
      <div className="staff-banner">
        Invite-only staff area · protected session
      </div>
      <ThemeToggle />
      <header className="admin-header">
        <div>
          <p className="eyebrow">PRACTICALLAB AFRICA</p>
          <h1>Admin portal</h1>
          <p>Curriculum and learner safety operations.</p>
        </div>
        {access && <span className="ghost-badge">{access.role}</span>}
      </header>

      {stage === "checking" && <p role="status">Checking staff access…</p>}

      {stage === "login" && (
        <section
          className="panel"
          style={{ maxWidth: 460, margin: "32px auto" }}
        >
          <h2>Staff sign in</h2>
          <p className="muted">Use your invite-only staff account.</p>
          {error && <p role="alert">{error}</p>}
          <form onSubmit={onLogin} style={{ display: "grid", gap: 16 }}>
            <label>
              Username or email
              <input
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className="button button-primary" disabled={busy}>
              {busy ? "Signing in…" : "Continue to MFA"}
            </button>
          </form>
        </section>
      )}

      {stage === "enroll" && (
        <section
          className="panel"
          style={{ maxWidth: 540, margin: "32px auto" }}
        >
          <h2>Set up staff MFA</h2>
          <p className="muted">
            Add this account to an authenticator app, then enter its current
            six-digit code.
          </p>
          {error && <p role="alert">{error}</p>}
          {!secret ? (
            <button
              className="button button-primary"
              disabled={busy}
              onClick={() => void beginEnrollment()}
            >
              Set up authenticator
            </button>
          ) : (
            <>
              <p>
                <strong>Setup key</strong>
              </p>
              <code style={{ overflowWrap: "anywhere", userSelect: "all" }}>
                {secret}
              </code>
              <form
                onSubmit={verifyMfa}
                style={{ display: "grid", gap: 16, marginTop: 20 }}
              >
                <label>
                  Six-digit code
                  <input
                    required
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </label>
                <button className="button button-primary" disabled={busy}>
                  Verify and finish setup
                </button>
              </form>
            </>
          )}
        </section>
      )}

      {stage === "verify" && (
        <section
          className="panel"
          style={{ maxWidth: 460, margin: "32px auto" }}
        >
          <h2>Verify it is you</h2>
          <p className="muted">Enter a code from your authenticator app.</p>
          {error && <p role="alert">{error}</p>}
          <form onSubmit={verifyMfa} style={{ display: "grid", gap: 16 }}>
            <label>
              Six-digit code
              <input
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
            <button className="button button-primary" disabled={busy}>
              Verify
            </button>
          </form>
        </section>
      )}

      {stage === "recovery-codes" && (
        <section
          className="panel"
          style={{ maxWidth: 540, margin: "32px auto" }}
        >
          <h2>Save your recovery codes</h2>
          <p className="muted">
            Each code works once. Store them somewhere private. They will not be
            shown again.
          </p>
          <ul>
            {recoveryCodes.map((item) => (
              <li key={item}>
                <code>{item}</code>
              </li>
            ))}
          </ul>
          <button
            className="button button-primary"
            onClick={() => void checkAccess()}
          >
            I saved these codes
          </button>
        </section>
      )}

      {stage === "dashboard" && (
        <>
          <section className="summary-grid" aria-label="Live portal summary">
            {summary ? (
              Object.entries({
                Subjects: summary.subjects,
                Courses: summary.courses,
                Topics: summary.topics,
                "Pending teacher reviews":
                  summary.pending_teacher_verifications,
              }).map(([label, value]) => (
                <article key={label} className="stat-card">
                  <div className="stat-label">{label}</div>
                  <div className="stat-value">{value}</div>
                </article>
              ))
            ) : (
              <p role="status">Loading dashboard…</p>
            )}
          </section>
          {error && <p role="alert">{error}</p>}
          <section className="priority-grid" aria-label="Staff review queues">
            <article className="panel">
              <h2>Teacher verification queue</h2>
              {teachers.length ? (
                <ul className="list">
                  {teachers.map((item) => (
                    <li key={item.id}>
                      <div>
                        <strong>{item.username}</strong>
                        <div className="muted">
                          {item.verification_status ?? item.status}
                        </div>
                        {item.latest_application && (
                          <small>
                            {item.latest_application.id_document_type} ·{" "}
                            {item.latest_application.id_reference_masked}
                          </small>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No teacher reviews are available.</p>
              )}
            </article>
            <article className="panel">
              <h2>Open reports</h2>
              {reports.length ? (
                <ul className="list">
                  {reports.map((item) => (
                    <li key={item.id}>
                      <strong>{item.reason ?? "Report"}</strong>
                      <span className="pill pending">{item.status}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No open reports are available.</p>
              )}
            </article>
          </section>
          {approvals.length > 0 && (
            <section
              className="panel"
              aria-label="Pending second-person approvals"
            >
              <h2>Pending approvals</h2>
              <ul className="list">
                {approvals.map((item) => (
                  <li key={item.id}>
                    <div>
                      <strong>{item.action.replaceAll("_", " ")}</strong>
                      <div className="muted">
                        {item.target_model} #{item.target_id} · {item.reason}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="button button-primary"
                        disabled={busy || item.requester_id === access?.user_id}
                        onClick={() => void decideApproval(item.id, "approve")}
                      >
                        Approve
                      </button>
                      <button
                        className="button button-secondary"
                        disabled={busy || item.requester_id === access?.user_id}
                        onClick={() => void decideApproval(item.id, "reject")}
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {approvals.some(
                (item) => item.requester_id === access?.user_id,
              ) && (
                <p className="muted">
                  You cannot approve a request you submitted.
                </p>
              )}
            </section>
          )}
          {access?.role === "Super Admin" && (
            <section className="panel" style={{ marginTop: 20 }}>
              <h2>Invite staff</h2>
              <p className="muted">
                Invitations require approval by a different staff member. Share
                the token with the invitee only after approval.
              </p>
              <form
                onSubmit={createStaffInvite}
                style={{ display: "flex", flexWrap: "wrap", gap: 12 }}
              >
                <label>
                  Username
                  <input
                    required
                    minLength={3}
                    value={inviteUsername}
                    onChange={(event) => setInviteUsername(event.target.value)}
                  />
                </label>
                <label>
                  Role
                  <select
                    value={inviteRole}
                    onChange={(event) => setInviteRole(event.target.value)}
                  >
                    <option>Reviewer</option>
                    <option>Curriculum Manager</option>
                    <option>Moderator</option>
                    <option>Super Admin</option>
                  </select>
                </label>
                <button className="button button-primary" disabled={busy}>
                  Create invitation
                </button>
              </form>
              {inviteToken && (
                <p role="status">
                  One-time invitation token:{" "}
                  <code style={{ userSelect: "all", overflowWrap: "anywhere" }}>
                    {inviteToken}
                  </code>
                </p>
              )}
            </section>
          )}
          <button
            className="button button-secondary"
            onClick={() => void signOut()}
          >
            Sign out
          </button>
        </>
      )}

      <footer className="footer-note">
        Sensitive actions require a separate authenticated staff approval.
      </footer>
    </main>
  );
}

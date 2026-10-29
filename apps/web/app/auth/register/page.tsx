"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";

type RegisterResponse = {
  active_mode?: string;
  error?: { message?: string };
};

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"student" | "teacher">(
    "student",
  );
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!termsAccepted || !privacyAccepted) {
      setError(
        "Please accept the Terms of Service and Privacy Policy to register.",
      );
      return;
    }

    setLoading(true);

    try {
      const { ok, data } = await apiPost<RegisterResponse>("auth/register", {
        username,
        email,
        password,
        account_type: accountType,
        terms_accepted: termsAccepted,
        privacy_accepted: privacyAccepted,
        country: "Nigeria",
      });

      if (!ok) {
        setError(
          (data as RegisterResponse & { error?: { message?: string } }).error
            ?.message ?? "Registration failed. Please check your inputs.",
        );
        setLoading(false);
        return;
      }

      if (accountType === "teacher") {
        router.push("/teacher/verification");
      } else {
        router.push("/onboarding");
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
        style={{ maxWidth: "480px", margin: "0 auto", padding: "32px 24px" }}
      >
        <p className="eyebrow">JOIN THE LAB</p>
        <h1 style={{ fontSize: "28px", marginTop: "4px", marginBottom: "8px" }}>
          Create your account
        </h1>
        <p
          style={{
            color: "var(--pl-muted)",
            fontSize: "14px",
            marginBottom: "20px",
          }}
        >
          Individual learner or educator account. No school registration
          required.
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
          {/* Account type */}
          <fieldset
            style={{
              border: "1px solid var(--pl-border)",
              borderRadius: "8px",
              padding: "12px",
              margin: 0,
            }}
          >
            <legend
              style={{
                fontSize: "13px",
                fontWeight: 700,
                padding: "0 6px",
              }}
            >
              I am registering as:
            </legend>
            <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                <input
                  type="radio"
                  name="account_type"
                  checked={accountType === "student"}
                  onChange={() => setAccountType("student")}
                />
                <strong>Student / Learner</strong>
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                <input
                  type="radio"
                  name="account_type"
                  checked={accountType === "teacher"}
                  onChange={() => setAccountType("teacher")}
                />
                <strong>Teacher / Lecturer</strong>
              </label>
            </div>
          </fieldset>

          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Username
            <input
              type="text"
              required
              minLength={3}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. amara_sci"
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
            Email{" "}
            <span style={{ fontWeight: 400, color: "var(--pl-muted)" }}>
              (optional, for account recovery)
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. amara@example.com"
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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a strong password (8+ characters)"
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

          {/* Policy acceptance */}
          <div
            style={{
              background: "var(--pl-surface)",
              border: "1px solid var(--pl-border)",
              padding: "12px",
              borderRadius: "8px",
              fontSize: "13px",
            }}
          >
            <p style={{ margin: "0 0 8px 0" }}>
              🔒 <strong>Privacy by Default:</strong> Student profiles are
              private by default.
            </p>
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                cursor: "pointer",
                marginBottom: "6px",
              }}
            >
              <input
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{ marginTop: "3px" }}
              />
              <span>
                I accept the PracticalLab Africa Terms of Service (v1.0)
              </span>
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                required
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                style={{ marginTop: "3px" }}
              />
              <span>I accept the Privacy Policy (v1.0)</span>
            </label>
          </div>

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
            {loading ? "Creating account..." : "Create Account"}
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
          <p style={{ margin: "0" }}>
            Already have an account?{" "}
            <Link
              href="/auth/login"
              style={{ color: "var(--pl-primary)", fontWeight: 700 }}
            >
              Sign in
            </Link>
          </p>
        </footer>
      </section>
    </main>
  );
}

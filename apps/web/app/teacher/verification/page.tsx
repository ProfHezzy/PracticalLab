"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiPost } from "@/lib/api";
import { AppShell } from "@/components/app-shell";

type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export default function TeacherVerificationPage() {
  const [status, setStatus] = useState<VerificationStatus>("unverified");
  const [title, setTitle] = useState("Mr.");
  const [school, setSchool] = useState("");
  const [specialization, setSpecialization] = useState("Chemistry");
  const [years, setYears] = useState("5");
  const [docType, setDocType] = useState("TRCN License");
  const [docRef, setDocRef] = useState("");
  const [notes, setNotes] = useState("");
  const [submittedApp, setSubmittedApp] = useState<{
    id: number;
    submitted_at: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/teacher-verification/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setStatus(data.verification_status || "unverified");
          if (data.latest_application) {
            setSubmittedApp({
              id: data.latest_application.id,
              submitted_at: data.latest_application.submitted_at,
            });
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { ok, data } = await apiPost<{
        error?: { message?: string };
        application_id: number;
        submitted_at: string;
      }>("teacher-verification/applications", {
        title,
        school_affiliation: school,
        subject_specialization: specialization,
        years_of_experience: parseInt(years, 10) || 0,
        id_document_type: docType,
        id_reference: docRef,
        notes,
      });
      if (!ok) {
        setError(data.error?.message || "Failed to submit application.");
        setLoading(false);
        return;
      }

      setStatus("pending");
      setSubmittedApp({
        id: data.application_id,
        submitted_at: data.submitted_at,
      });
      setLoading(false);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <main className="simple-page verification-page page-enter">
        <Link className="verification-back" href="/teacher">
          ← Educator workspace
        </Link>

        <section
          className="simple-card"
          style={{ maxWidth: "560px", margin: "0 auto", padding: "32px 24px" }}
        >
          <p className="eyebrow">EDUCATOR CREDENTIALS</p>
          <h1
            style={{ fontSize: "28px", marginTop: "4px", marginBottom: "8px" }}
          >
            Teacher Verification
          </h1>
          <p
            style={{
              color: "var(--pl-muted)",
              fontSize: "14px",
              marginBottom: "20px",
            }}
          >
            To protect learners, teachers must be verified before creating
            classes, generating class codes, or assigning work.
          </p>

          {status === "verified" ? (
            <div
              style={{
                padding: "20px",
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid var(--pl-primary)",
                borderRadius: "12px",
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: "36px" }} aria-hidden="true">
                ✅
              </span>
              <h2 style={{ fontSize: "20px", margin: "12px 0 6px 0" }}>
                You are a Verified Educator!
              </h2>
              <p
                style={{ color: "var(--pl-text)", fontSize: "14px", margin: 0 }}
              >
                You have full access to create classes, issue class codes, and
                lead live demonstrations.
              </p>
              <div style={{ marginTop: "16px" }}>
                <Link className="button button-reward" href="/teacher">
                  Go to Teacher Lab
                </Link>
              </div>
            </div>
          ) : status === "pending" ? (
            <div
              style={{
                padding: "20px",
                background: "rgba(245, 158, 11, 0.1)",
                border: "1px solid #f59e0b",
                borderRadius: "12px",
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: "36px" }} aria-hidden="true">
                ⏳
              </span>
              <h2 style={{ fontSize: "20px", margin: "12px 0 6px 0" }}>
                Verification in Review
              </h2>
              <p
                style={{
                  color: "var(--pl-text)",
                  fontSize: "14px",
                  marginBottom: "8px",
                }}
              >
                Your application has been received and is currently in the staff
                review queue.
              </p>
              {submittedApp && (
                <p style={{ color: "var(--pl-muted)", fontSize: "13px" }}>
                  Application #{submittedApp.id} · Submitted{" "}
                  {new Date(submittedApp.submitted_at).toLocaleDateString()}
                </p>
              )}
              <div style={{ marginTop: "16px" }}>
                <Link className="button button-secondary" href="/">
                  Return to Home
                </Link>
              </div>
            </div>
          ) : (
            <>
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
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 2fr",
                    gap: "12px",
                  }}
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
                    Title
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Mr., Dr."
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
                    School affiliation (optional)
                    <input
                      type="text"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      placeholder="e.g. King's College, Lagos"
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
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr",
                    gap: "12px",
                  }}
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
                    Teaching Subject
                    <input
                      type="text"
                      required
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="e.g. Chemistry, Basic Science"
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
                    Experience (Yrs)
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={years}
                      onChange={(e) => setYears(e.target.value)}
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
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
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
                    Verification Document
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      style={{
                        minHeight: "44px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--pl-border)",
                        background: "var(--pl-surface)",
                        color: "var(--pl-text)",
                        fontSize: "16px",
                      }}
                    >
                      <option value="TRCN License">TRCN License</option>
                      <option value="School Staff ID">School Staff ID</option>
                      <option value="National Identity Card">
                        National Identity Card
                      </option>
                      <option value="Ministry Appointment Letter">
                        Ministry Appointment Letter
                      </option>
                    </select>
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
                    ID / Reference Number
                    <input
                      type="text"
                      required
                      value={docRef}
                      onChange={(e) => setDocRef(e.target.value)}
                      placeholder="e.g. TRCN-12345"
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
                </div>

                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  Additional Notes (Optional)
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Tell our review team about your classes or subjects..."
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--pl-border)",
                      background: "var(--pl-surface)",
                      color: "var(--pl-text)",
                      fontSize: "14px",
                      resize: "vertical",
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
                  {loading
                    ? "Submitting application..."
                    : "Submit Verification Request"}
                </button>
              </form>
            </>
          )}
        </section>
      </main>
    </AppShell>
  );
}

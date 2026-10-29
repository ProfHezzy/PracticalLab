"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";

type CurriculumOption = { id: number; name?: string; stage?: string };

const avatarPresets = [
  { id: "avatar_flask", label: "Flask" },
  { id: "avatar_circuit", label: "Circuit" },
  { id: "avatar_microscope", label: "Microscope" },
  { id: "avatar_atom", label: "Atom" },
  { id: "avatar_magnet", label: "Magnet" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [targetExam, setTargetExam] = useState("WAEC");
  const [avatarPreset, setAvatarPreset] = useState("avatar_flask");
  const [levels, setLevels] = useState<CurriculumOption[]>([]);
  const [subjects, setSubjects] = useState<CurriculumOption[]>([]);
  const [levelId, setLevelId] = useState("");
  const [subjectIds, setSubjectIds] = useState<number[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiGet<CurriculumOption[]>("content/levels"),
      apiGet<CurriculumOption[]>("content/subjects"),
    ])
      .then(([levelResult, subjectResult]) => {
        if (levelResult.ok) setLevels(levelResult.data);
        if (subjectResult.ok) setSubjects(subjectResult.data);
      })
      .catch(() =>
        setError(
          "We could not load your curriculum options. Try again when connected.",
        ),
      )
      .finally(() => setLoadingOptions(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { ok, data } = await apiPost<{ error?: { message?: string } }>(
        "users/me/student-onboarding",
        {
          level_id: levelId ? Number(levelId) : null,
          subject_ids: subjectIds,
          target_exam: targetExam,
          avatar_preset: avatarPreset,
        },
      );
      if (!ok) {
        setError(data.error?.message || "Failed to complete onboarding.");
        setLoading(false);
        return;
      }

      router.push("/student");
    } catch {
      setError("Network error. Please try again.");
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
        <p className="eyebrow">STEP 1 OF 1 · CUSTOMIZE YOUR LAB</p>
        <h1 style={{ fontSize: "28px", marginTop: "4px", marginBottom: "8px" }}>
          Welcome to your workspace!
        </h1>
        <p
          style={{
            color: "var(--pl-muted)",
            fontSize: "14px",
            marginBottom: "24px",
          }}
        >
          Tell us about your learning goals so we can tailor experiments to your
          curriculum.
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
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
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
            School level
            <select
              value={levelId}
              onChange={(event) => setLevelId(event.target.value)}
              disabled={loadingOptions}
            >
              <option value="">Choose a level (optional)</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.stage}
                </option>
              ))}
            </select>
          </label>
          <fieldset
            style={{
              border: "1px solid var(--pl-border)",
              borderRadius: 8,
              padding: 12,
              margin: 0,
            }}
          >
            <legend style={{ fontSize: 13, fontWeight: 700, padding: "0 6px" }}>
              Subjects to practise
            </legend>
            {loadingOptions ? (
              <p role="status">Loading subjects…</p>
            ) : subjects.length === 0 ? (
              <p>No subjects are available yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {subjects.map((subject) => (
                  <label
                    key={subject.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      minHeight: 48,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={subjectIds.includes(subject.id)}
                      onChange={(event) =>
                        setSubjectIds((current) =>
                          event.target.checked
                            ? [...current, subject.id]
                            : current.filter((id) => id !== subject.id),
                        )
                      }
                    />
                    {subject.name}
                  </label>
                ))}
              </div>
            )}
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
            Target Examination
            <select
              value={targetExam}
              onChange={(e) => setTargetExam(e.target.value)}
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
              <option value="WAEC">
                WAEC (West African Senior School Certificate)
              </option>
              <option value="NECO">NECO (National Examinations Council)</option>
              <option value="JAMB">JAMB / UTME</option>
              <option value="GENERAL">
                General Secondary Science Practice
              </option>
            </select>
          </label>

          <fieldset
            style={{
              border: "1px solid var(--pl-border)",
              borderRadius: "8px",
              padding: "12px",
              margin: 0,
            }}
          >
            <legend
              style={{ fontSize: "13px", fontWeight: 700, padding: "0 6px" }}
            >
              Pick an avatar badge:
            </legend>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
                gap: "8px",
                marginTop: "8px",
              }}
            >
              {avatarPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setAvatarPreset(preset.id)}
                  style={{
                    padding: "12px 8px",
                    borderRadius: "8px",
                    border:
                      avatarPreset === preset.id
                        ? "2px solid var(--pl-primary)"
                        : "1px solid var(--pl-border)",
                    background:
                      avatarPreset === preset.id
                        ? "rgba(16, 185, 129, 0.1)"
                        : "var(--pl-surface)",
                    color: "var(--pl-text)",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            className="button button-reward"
            disabled={loading}
            style={{ width: "100%", cursor: loading ? "wait" : "pointer" }}
          >
            {loading ? "Saving profile…" : "Enter PracticalLab Africa"}
          </button>
        </form>
      </section>
    </main>
  );
}

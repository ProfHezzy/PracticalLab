"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { apiGet, apiPatch, apiPost } from "@/lib/api";

type Profile = {
  username: string;
  email: string;
  country: string;
  bio: string;
  active_mode: string;
  is_verified_teacher: boolean;
  // M3 Gate: Age/verification fields
  date_of_birth: string | null;
  is_minor: boolean;
  email_verification_status: string;
  email_verified_at: string | null;
  phone: string;
  phone_verification_status: string;
  phone_verified_at: string | null;
  recovery_contact_name: string;
  recovery_contact_email: string;
  recovery_contact_phone: string;
  recovery_contact_relationship: string;
  has_recovery_contact: boolean;
  student_profile?: {
    level_stage: string | null;
    target_exam: string;
    avatar_preset: string;
    is_private: boolean;
  } | null;
  teacher_profile?: {
    verification_status: string;
    subject_specialization: string;
  } | null;
  preferences: {
    theme: string;
    reduced_motion: boolean;
    high_contrast: boolean;
    email_notifications: boolean;
    profile_visibility: string;
  };
};

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    apiGet<Profile>("auth/me")
      .then(({ ok, data }) => {
        if (ok) {
          setProfile(data);
          setBio(data.bio || "");
          setCountry(data.country || "Nigeria");
        } else setError("Sign in to see your profile.");
      })
      .catch(() =>
        setError(
          "Your profile could not load. Check your connection and try again.",
        ),
      );
  }, []);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    setError("");
    try {
      const { ok, data } = await apiPatch<
        Profile & { error?: { message?: string } }
      >("users/me", { bio, country });
      if (!ok)
        throw new Error(
          data.error?.message || "Your changes could not be saved.",
        );
      setProfile(data);
      setNotice("Your profile is up to date.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function updatePreference(
    key:
      | "reduced_motion"
      | "high_contrast"
      | "email_notifications"
      | "profile_visibility",
    value: boolean | string,
  ) {
    if (!profile) return;
    const previous = profile.preferences;
    setProfile({ ...profile, preferences: { ...previous, [key]: value } });
    const { ok, data } = await apiPatch<
      Profile["preferences"] & { error?: { message?: string } }
    >("users/me/preferences", { [key]: value });
    if (ok) {
      setProfile((current) =>
        current ? { ...current, preferences: data } : current,
      );
      if (key === "reduced_motion")
        document.documentElement.dataset.reducedMotion = String(value);
      if (key === "high_contrast")
        document.documentElement.dataset.highContrast = String(value);
      setNotice("Preference saved.");
    } else {
      setProfile((current) =>
        current ? { ...current, preferences: previous } : current,
      );
      setError(data.error?.message || "We could not save that preference.");
    }
  }

  // M3 Gate: Email verification
  async function sendEmailVerification() {
    setNotice("");
    setError("");
    try {
      const { ok, data } = await apiPost<{ status: string } & { error?: { message?: string } }>(
        "auth/verification/email/send",
        {}
      );
      if (!ok) throw new Error(data.error?.message || "Could not send verification email.");
      setNotice("Verification email sent. Check your inbox.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again.");
    }
  }

  // M3 Gate: Phone verification
  async function sendPhoneVerification() {
    setNotice("");
    setError("");
    try {
      const { ok, data } = await apiPost<{ status: string; dev_code?: string } & { error?: { message?: string } }>(
        "auth/verification/phone/send",
        {}
      );
      if (!ok) throw new Error(data.error?.message || "Could not send verification code.");
      if (data.dev_code) {
        setNotice(`Verification code sent (dev: ${data.dev_code}). Check your phone.`);
      } else {
        setNotice("Verification code sent. Check your phone.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again.");
    }
  }

  // M3 Gate: Age consent
  async function recordAgeConsent() {
    setNotice("");
    setError("");
    try {
      const { ok, data } = await apiPost<{ status: string } & { error?: { message?: string } }>(
        "auth/age-consent",
        { consent: true }
      );
      if (!ok) throw new Error(data.error?.message || "Could not record consent.");
      setProfile((current) =>
        current ? { ...current, age_consent_recorded_at: new Date().toISOString() } : current
      );
      setNotice("Age consent recorded. Thank you.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again.");
    }
  }

  const avatar = (profile?.username || "P").slice(0, 1).toUpperCase();

  return (
    <AppShell>
      <main className="profile-page page-enter">
        <div className="profile-breadcrumb">
          <Link href="/student">My lab</Link>
          <span aria-hidden="true">/</span>
          <span>Profile</span>
        </div>
        {hydrated && error && !profile ? (
          <section className="profile-load-error" role="alert">
            <span>◌</span>
            <h1>Profile unavailable</h1>
            <p>{error}</p>
            <Link className="button button-primary" href="/auth/login">
              Sign in
            </Link>
          </section>
        ) : !hydrated || !profile ? (
          <section className="profile-loading" aria-busy="true">
            <div className="profile-skeleton-cover" />
            <div className="profile-skeleton-card" />
          </section>
        ) : (
          <>
            <section className="profile-cover">
              <div className="profile-cover-pattern" aria-hidden="true" />
              <div className="profile-cover-label">
                <span className="cover-live-dot" /> PERSONAL LEARNING SPACE
              </div>
              <span
                className="profile-cover-orbit orbit-one"
                aria-hidden="true"
              />
              <span
                className="profile-cover-orbit orbit-two"
                aria-hidden="true"
              />
              <div className="profile-cover-bottom">
                <div className="profile-avatar-wrap">
                  <span className="profile-avatar">{avatar}</span>
                  <span className="profile-level-ring">✦</span>
                </div>
                <div className="profile-identity">
                  <span className="profile-member-chip">
                    {profile.student_profile?.level_stage || "LEARNER"}
                  </span>
                  <h1>{profile.username}</h1>
                  <p>{profile.bio || "Curious mind. Future scientist."}</p>
                </div>
                <span className="privacy-chip">
                  <span aria-hidden="true">◉</span> Private by default
                </span>
              </div>
            </section>
            {notice && (
              <p className="profile-notice" role="status">
                ✓ {notice}
              </p>
            )}
            {error && (
              <p className="profile-error" role="alert">
                {error}
              </p>
            )}
            <div className="profile-content-grid">
              <div className="profile-main-column">
                <section className="profile-card profile-about">
                  <div className="profile-card-heading">
                    <div>
                      <p className="eyebrow">A LITTLE ABOUT YOU</p>
                      <h2>Your profile</h2>
                    </div>
                    <span className="profile-card-symbol" aria-hidden="true">
                      ✎
                    </span>
                  </div>
                  <form onSubmit={saveProfile} className="profile-form">
                    <label>
                      Username
                      <input
                        value={profile.username}
                        readOnly
                        aria-describedby="username-note"
                      />
                      <small id="username-note">
                        Your username is how people recognise you in the lab.
                      </small>
                    </label>
                    <label>
                      About you
                      <textarea
                        rows={3}
                        maxLength={500}
                        value={bio}
                        onChange={(event) => setBio(event.target.value)}
                        placeholder="What are you curious about?"
                      />
                      <small>{bio.length}/500 characters</small>
                    </label>
                    <label>
                      Country
                      <input
                        value={country}
                        maxLength={64}
                        onChange={(event) => setCountry(event.target.value)}
                      />
                    </label>
                    <button
                      className="button button-primary"
                      type="submit"
                      disabled={saving}
                    >
                      {saving ? "Saving changes…" : "Save profile"}
                      <span aria-hidden="true">→</span>
                    </button>
                  </form>
                </section>
                <section className="profile-card learning-card">
                  <div className="profile-card-heading">
                    <div>
                      <p className="eyebrow">YOUR NEXT CHAPTER</p>
                      <h2>Learning preferences</h2>
                    </div>
                    <span
                      className="profile-card-symbol mint"
                      aria-hidden="true"
                    >
                      ✧
                    </span>
                  </div>
                  <div className="profile-fact-row">
                    <span className="profile-fact-icon">⌑</span>
                    <span>
                      <strong>Current level</strong>
                      <small>
                        {profile.student_profile?.level_stage ||
                          "Not selected yet"}
                      </small>
                    </span>
                    <Link href="/onboarding" aria-label="Update learning level">
                      ↗
                    </Link>
                  </div>
                  <div className="profile-fact-row">
                    <span className="profile-fact-icon warm">◎</span>
                    <span>
                      <strong>Exam focus</strong>
                      <small>
                        {profile.student_profile?.target_exam ||
                          "Choose a focus when you’re ready"}
                      </small>
                    </span>
                    <Link href="/onboarding" aria-label="Update exam focus">
                      ↗
                    </Link>
                  </div>
                  <Link className="profile-discover-link" href="/content">
                    Explore reviewed lessons <span aria-hidden="true">→</span>
                  </Link>
                </section>
              </div>
              <aside className="profile-side-column">
                <section className="profile-card privacy-card">
                  <div className="profile-card-heading">
                    <div>
                      <p className="eyebrow">YOUR SPACE, YOUR CALL</p>
                      <h2>Privacy & access</h2>
                    </div>
                    <span
                      className="profile-card-symbol warm"
                      aria-hidden="true"
                    >
                      ◈
                    </span>
                  </div>
                  <p className="privacy-intro">
                    Your profile starts private. Choose what feels right for
                    you.
                  </p>
                  <div className="preference-control">
                    <span>
                      <strong>Profile visibility</strong>
                      <small>Who can see your activity</small>
                    </span>
                    <select
                      aria-label="Profile visibility"
                      value={profile.preferences.profile_visibility}
                      onChange={(event) =>
                        updatePreference(
                          "profile_visibility",
                          event.target.value,
                        )
                      }
                    >
                      <option value="private">Only me</option>
                      <option value="connections">My connections</option>
                    </select>
                  </div>
                  <div className="preference-control">
                    <span>
                      <strong>Reduced motion</strong>
                      <small>Use gentler transitions</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={profile.preferences.reduced_motion}
                      onChange={(event) =>
                        updatePreference("reduced_motion", event.target.checked)
                      }
                    />
                  </div>
                  <div className="preference-control">
                    <span>
                      <strong>High contrast</strong>
                      <small>Make text and controls clearer</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={profile.preferences.high_contrast}
                      onChange={(event) =>
                        updatePreference("high_contrast", event.target.checked)
                      }
                    />
                  </div>
                  <div className="preference-control">
                    <span>
                      <strong>Email updates</strong>
                      <small>Essential account messages</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={profile.preferences.email_notifications}
                      onChange={(event) =>
                        updatePreference(
                          "email_notifications",
                          event.target.checked,
                        )
                      }
                    />
                  </div>
                  <p className="privacy-footnote">
                    <span aria-hidden="true">✓</span> Your learning profile is
                    private unless you choose otherwise.
                  </p>
                </section>
                <section className="profile-card account-card">
                  <p className="eyebrow">ACCOUNT DETAILS</p>
                  <h2>Everything in one place.</h2>
                  <p>
                    {profile.email ||
                      "Add an email in a future account update to make recovery easier."}
                  </p>
                  <Link href="/auth/recovery" className="text-link">
                    Password & account help <span aria-hidden="true">→</span>
                  </Link>
                </section>
                {/* M3 Gate: Verification & Minor Status */}
                <section className="profile-card verification-card">
                  <div className="profile-card-heading">
                    <div>
                      <p className="eyebrow">ACCOUNT VERIFICATION</p>
                      <h2>Secure your account</h2>
                    </div>
                    <span className="profile-card-symbol" aria-hidden="true">✓</span>
                  </div>
                  <div className="verification-grid">
                    <div className="verification-item">
                      <span className={`verification-icon ${profile.email_verification_status === 'verified' ? 'verified' : ''}`} aria-hidden="true">
                        {profile.email_verification_status === 'verified' ? '✓' : '✉'}
                      </span>
                      <div>
                        <strong>Email</strong>
                        <small>
                          {profile.email_verification_status === 'verified'
                            ? `Verified ${profile.email_verified_at ? new Date(profile.email_verified_at).toLocaleDateString() : ''}`
                            : profile.email
                            ? 'Not verified'
                            : 'No email on file'}
                        </small>
                      </div>
                      {profile.email_verification_status !== 'verified' && profile.email && (
                        <button
                          className="button button-secondary"
                          onClick={() => sendEmailVerification()}
                          style={{ marginTop: '8px', fontSize: '13px' }}
                        >
                          Verify
                        </button>
                      )}
                    </div>
                    <div className="verification-item">
                      <span className={`verification-icon ${profile.phone_verification_status === 'verified' ? 'verified' : ''}`} aria-hidden="true">
                        {profile.phone_verification_status === 'verified' ? '✓' : '☎'}
                      </span>
                      <div>
                        <strong>Phone</strong>
                        <small>
                          {profile.phone_verification_status === 'verified'
                            ? `Verified ${profile.phone_verified_at ? new Date(profile.phone_verified_at).toLocaleDateString() : ''}`
                            : profile.phone
                            ? 'Not verified'
                            : 'No phone on file'}
                        </small>
                      </div>
                      {profile.phone_verification_status !== 'verified' && profile.phone && (
                        <button
                          className="button button-secondary"
                          onClick={() => sendPhoneVerification()}
                          style={{ marginTop: '8px', fontSize: '13px' }}
                        >
                          Verify
                        </button>
                      )}
                    </div>
                  </div>
                </section>
                {/* M3 Gate: Minor Status & Recovery Contact */}
                {profile.is_minor && (
                  <section className="profile-card minor-card">
                    <div className="profile-card-heading">
                      <div>
                        <p className="eyebrow">MINOR ACCOUNT PROTECTION</p>
                        <h2>Guardian recovery contact</h2>
                      </div>
                      <span className="profile-card-symbol warm" aria-hidden="true">◈</span>
                    </div>
                    <p className="minor-intro">
                      Since you&apos;re under 18, a trusted adult can help you recover your account if needed.
                    </p>
                    <div className="recovery-contact-display">
                      {profile.has_recovery_contact ? (
                        <>
                          <div className="recovery-contact-info">
                            <strong>{profile.recovery_contact_name}</strong>
                            <small>{profile.recovery_contact_relationship}</small>
                            {profile.recovery_contact_email && (
                              <small>✉ {profile.recovery_contact_email}</small>
                            )}
                            {profile.recovery_contact_phone && (
                              <small>☎ {profile.recovery_contact_phone}</small>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="recovery-contact-missing">
                          <span className="missing-icon" aria-hidden="true">⚠</span>
                          <strong>No recovery contact set</strong>
                          <p>Add a trusted adult in account settings for recovery help.</p>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </aside>
            </div>
          </>
        )}
      </main>
    </AppShell>
  );
}

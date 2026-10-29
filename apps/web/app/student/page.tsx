"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { apiGet } from "@/lib/api";

type Me = {
  username: string;
  student_profile?: {
    level_stage?: string | null;
    target_exam?: string | null;
  } | null;
};
type Course = {
  id: number;
  title: string;
  subject__name: string;
  level__stage: string;
  description?: string;
};
type StudentProgress = {
  completed_count: number;
  total_score: number;
  continue_session: {
    session_id: number;
    slug: string;
    title: string;
    version: string;
    step_index: number;
    event_count: number;
    mode: "guided" | "free";
  } | null;
};

export default function StudentPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const updateOnline = () => setOffline(!navigator.onLine);
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    Promise.all([
      apiGet<Me>("auth/me"),
      apiGet<Course[]>("content/courses"),
      apiGet<StudentProgress>("student/progress"),
    ])
      .then(([profile, courseList, studentProgress]) => {
        if (profile.ok) setMe(profile.data);
        if (courseList.ok) setCourses(courseList.data);
        else
          setError(
            "Your learning paths could not load. Try refreshing this page.",
          );
        if (studentProgress.ok) setProgress(studentProgress.data);
        else if (
          studentProgress.status !== 401 &&
          studentProgress.status !== 403
        )
          setError(
            "Your progress could not load. Try again when your connection is steady.",
          );
      })
      .catch(() =>
        setError(
          "Your dashboard could not connect. Check your connection and try again.",
        ),
      )
      .finally(() => setLoading(false));
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  return (
    <AppShell>
      <main className="student-home page-enter">
        {offline && (
          <p className="content-notice" role="status">
            You’re offline. Practical progress saved on this device stays
            available here.
          </p>
        )}
        {error && (
          <div className="content-state content-error" role="alert">
            <p>{error}</p>
            <button
              className="button button-secondary"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        )}
        <section className="welcome-row">
          <div>
            <p className="eyebrow">YOUR STUDENT LAB</p>
            <h1>
              Good to see you, {(hydrated && me?.username) || "scientist"}
              <span className="wave-mark" aria-hidden="true">
                ✦
              </span>
            </h1>
            <p className="welcome-subtitle">
              A curious mind makes great discoveries. What will you try today?
            </p>
          </div>
          <Link className="streak-pill" href="/student/profile">
            <span aria-hidden="true">✧</span>
            <span>
              <strong>Build your streak</strong>
              <small>One small experiment at a time</small>
            </span>
            <span aria-hidden="true">→</span>
          </Link>
        </section>

        <section className="dashboard-hero" aria-labelledby="continue-heading">
          <div className="dashboard-hero-copy">
            <span className="hero-label">
              <span className="pulse-dot" /> READY WHEN YOU ARE
            </span>
            <p className="dashboard-kicker">
              CHEMISTRY · SEPARATION TECHNIQUES
            </p>
            <h2 id="continue-heading">
              {progress?.continue_session
                ? "Pick up where you left off."
                : "Turn a cloudy mixture into a clear discovery."}
            </h2>
            <p>
              {progress?.continue_session
                ? `${progress.continue_session.title} · step ${Math.max(1, progress.continue_session.step_index + 1)}`
                : "Set up a filter, make a prediction, and see what stays behind."}
            </p>
            <Link
              className="button button-white"
              href={
                progress?.continue_session
                  ? `/student/lab?experiment=${encodeURIComponent(progress.continue_session.slug)}&session_id=${progress.continue_session.session_id}`
                  : "/student/lab?experiment=filtration"
              }
            >
              <span>
                {progress?.continue_session
                  ? "Continue practical"
                  : "Start filtration"}
              </span>
              <span aria-hidden="true">↗</span>
            </Link>
            <small className="hero-duration">
              {progress?.continue_session
                ? "Your saved practical is ready"
                : "A guided practical · about 5 minutes"}
            </small>
          </div>
          <div className="hero-illustration" aria-hidden="true">
            <div className="science-orbit orbit-a" />
            <div className="science-orbit orbit-b" />
            <div className="hero-flask">
              <span className="hero-flask-neck" />
              <span className="hero-flask-liquid" />
              <span className="hero-flask-face">☺</span>
              <span className="hero-flask-shine" />
            </div>
            <span className="floating-molecule molecule-one">H₂O</span>
            <span className="floating-molecule molecule-two">NaCl</span>
            <span className="floating-spark">✦</span>
          </div>
        </section>

        <div className="dashboard-section-heading">
          <div>
            <p className="eyebrow">YOUR LEARNING PATH</p>
            <h2>Pick up a new skill</h2>
          </div>
          <Link href="/content" className="text-link">
            Explore all lessons <span aria-hidden="true">→</span>
          </Link>
        </div>
        {loading ? (
          <div
            className="dashboard-course-grid"
            aria-busy="true"
            aria-label="Loading learning paths"
          >
            <div className="course-skeleton" />
            <div className="course-skeleton" />
          </div>
        ) : courses.length ? (
          <div className="dashboard-course-grid">
            {courses.slice(0, 3).map((course, index) => (
              <article
                className={`path-card path-card-${index % 3}`}
                key={course.id}
              >
                <div className="path-card-top">
                  <span className="path-subject-icon">
                    {index % 2 ? "ϟ" : "✦"}
                  </span>
                  <span className="path-status">{course.level__stage}</span>
                </div>
                <p className="path-subject">{course.subject__name}</p>
                <h3>{course.title}</h3>
                <p className="path-description">
                  {course.description ||
                    "Build confidence with a practical, step by step."}
                </p>
                <Link href="/content" className="path-link">
                  View learning path <span aria-hidden="true">↗</span>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="learning-empty">
            <span className="empty-orb" aria-hidden="true">
              ✳
            </span>
            <div>
              <strong>Your learning path is taking shape</strong>
              <p>
                Reviewed lessons will appear here as they are added. You can
                still try the filtration practical.
              </p>
            </div>
            <Link
              href="/student/lab?experiment=filtration"
              className="button button-primary"
            >
              Try a practical
            </Link>
          </div>
        )}

        <section className="dashboard-bottom-grid">
          <article className="focus-card">
            <div className="focus-icon" aria-hidden="true">
              ◎
            </div>
            <div>
              <p className="eyebrow">YOUR FOCUS</p>
              <h3>
                {me?.student_profile?.level_stage ||
                  "Set up your learning profile"}
              </h3>
              <p>
                {me?.student_profile?.target_exam
                  ? `Preparing for ${me.student_profile.target_exam}.`
                  : "Choose your level and subjects to make your lab feel like yours."}
              </p>
              <Link href="/student/profile" className="text-link">
                View your profile <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
          <article className="focus-card">
            <span className="focus-icon" aria-hidden="true">
              ✦
            </span>
            <div>
              <p className="eyebrow">YOUR PRACTICALS</p>
              <h3>
                {loading
                  ? "Loading your progress…"
                  : `${progress?.completed_count ?? 0} completed`}
              </h3>
              <p>
                {progress?.total_score ?? 0} points earned across your completed
                practicals.
              </p>
              <Link href="/content" className="text-link">
                Explore practicals <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        </section>
      </main>
    </AppShell>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { AccountLinks } from "@/components/account-links";

type CurriculumCourse = {
  id: number;
  title: string;
  description: string;
  subject__name: string;
  level__stage: string;
};

type Scheme = {
  id: number;
  title: string;
  term: string;
  course__title: string;
};
type Lesson = {
  id: number;
  title: string;
  estimated_minutes: number;
  version: number;
  topic: { id: number; title: string; week: number | null };
  subject: { name: string };
  level: { stage: string };
};

export default function ContentPage() {
  const [courses, setCourses] = useState<CurriculumCourse[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const updateOnline = () => setOffline(!navigator.onLine);
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    apiGet<CurriculumCourse[]>("content/courses")
      .then((result) => {
        if (!result.ok) throw new Error("We could not load courses right now.");
        setCourses(result.data);
        if (result.data[0]) setSelectedCourse(String(result.data[0].id));
      })
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "Please try again."),
      )
      .finally(() => setLoading(false));
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  useEffect(() => {
    if (!selectedCourse) {
      setSchemes([]);
      setLessons([]);
      return;
    }
    setLoading(true);
    Promise.all([
      apiGet<Scheme[]>(`content/schemes?course_id=${selectedCourse}`),
      apiGet<{ results: Lesson[] }>(
        `content/lessons/published?course_id=${selectedCourse}`,
      ),
    ])
      .then(([schemeResult, lessonResult]) => {
        if (!schemeResult.ok || !lessonResult.ok)
          throw new Error("We could not load this course. Try again.");
        setSchemes(schemeResult.data);
        setLessons(lessonResult.data.results);
        setError(null);
      })
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "Please try again."),
      )
      .finally(() => setLoading(false));
  }, [selectedCourse]);

  return (
    <main className="content-page">
      <header className="site-header">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">
            P
          </span>
          <span>
            PracticalLab <strong>Africa</strong>
          </span>
        </Link>
        <AccountLinks />
      </header>
      <section className="content-hero">
        <p className="eyebrow">YOUR CURRICULUM, MADE PRACTICAL</p>
        <h1>Pick a topic. Get hands-on.</h1>
        <p>Explore reviewed lessons made for your level and curriculum.</p>
      </section>
      {offline && (
        <p className="content-notice" role="status">
          You’re offline. Curriculum and media need a connection; offline lesson
          packs are not available yet.
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
      {loading && (
        <div
          className="content-grid"
          aria-label="Loading curriculum"
          aria-busy="true"
        >
          <div className="content-skeleton" />
          <div className="content-skeleton" />
          <div className="content-skeleton" />
        </div>
      )}
      {!loading && !error && courses.length === 0 && (
        <div className="content-state">
          <h2>New lessons are on the way</h2>
          <p>Reviewed curriculum content will appear here as it is released.</p>
        </div>
      )}
      {!loading && courses.length > 0 && (
        <section className="content-layout" aria-label="Curriculum browser">
          <div className="content-filter">
            <label htmlFor="course-select">Choose a course</label>
            <select
              id="course-select"
              value={selectedCourse}
              onChange={(event) => setSelectedCourse(event.target.value)}
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.subject__name} · {course.level__stage} ·{" "}
                  {course.title}
                </option>
              ))}
            </select>
            <p>Choose a course to see its terms and available lessons.</p>
          </div>
          <div className="content-results">
            <h2>Scheme of work</h2>
            {schemes.length === 0 ? (
              <p className="content-muted">
                No reviewed scheme is available for this course yet.
              </p>
            ) : (
              <ul className="scheme-list">
                {schemes.map((scheme) => (
                  <li key={scheme.id}>
                    <span className="scheme-term">{scheme.term}</span>
                    <strong>{scheme.title}</strong>
                    <span>{scheme.course__title}</span>
                  </li>
                ))}
              </ul>
            )}
            <h2>Lessons</h2>
            {lessons.length === 0 ? (
              <div className="content-state compact">
                <p>No published lessons yet. Check back soon.</p>
              </div>
            ) : (
              <div className="content-grid">
                {lessons.map((lesson) => (
                  <Link
                    className="lesson-card"
                    href={`/content/lessons/${lesson.id}`}
                    key={`${lesson.id}-${lesson.version}`}
                  >
                    <span className="lesson-card-icon" aria-hidden="true">
                      ✦
                    </span>
                    <span className="lesson-card-meta">
                      {lesson.subject.name} · {lesson.level.stage}
                    </span>
                    <strong>{lesson.title}</strong>
                    <span>
                      {lesson.topic.title}
                      {lesson.topic.week ? ` · Week ${lesson.topic.week}` : ""}
                    </span>
                    <span className="lesson-card-time">
                      {lesson.estimated_minutes} min · reviewed lesson
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

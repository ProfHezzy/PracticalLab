"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { AccountLinks } from "@/components/account-links";

type LessonDetail = {
  id: number;
  title: string;
  version: number;
  content_hash: string;
  offline_eligible: boolean;
  captions_url: string | null;
  estimated_minutes: number;
  content: string;
  safety_notes: string;
  transcript: string;
  captions: string;
  topic: { id: number; title: string; week: number | null };
  scheme: { title: string; term: string };
  course: { title: string };
  subject: { name: string };
  level: { stage: string };
  assets: {
    id: number;
    kind: string;
    mime_type: string;
    size_bytes: number;
    url: string;
    attribution: string;
    license: string;
    license_url: string;
  }[];
};

export default function LessonPage() {
  const params = useParams<{ lessonId: string }>();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOffline(!navigator.onLine);
    apiGet<LessonDetail>(`content/lessons/${params.lessonId}`)
      .then((result) => {
        if (!result.ok)
          throw new Error(
            result.status === 404
              ? "This lesson is not available."
              : "We could not load this lesson.",
          );
        setLesson(result.data);
      })
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "Please try again."),
      )
      .finally(() => setLoading(false));
  }, [params.lessonId]);

  return (
    <main className="content-page lesson-page">
      <header className="site-header">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">
            P
          </span>
          <span>
            PracticalLab <strong>Africa</strong>
          </span>
        </Link>
        <nav
          className="lesson-header-actions"
          aria-label="Lesson and account navigation"
        >
          <Link href="/content" className="button button-secondary">
            All lessons
          </Link>
          <AccountLinks />
        </nav>
      </header>
      {offline && (
        <p className="content-notice" role="status">
          You’re offline. This lesson and its media need a connection; offline
          lesson packs are not available yet.
        </p>
      )}
      {loading && (
        <article
          className="lesson-content"
          aria-busy="true"
          aria-label="Loading lesson"
        >
          <div className="content-skeleton" />
          <div className="content-skeleton" />
          <div className="content-skeleton" />
        </article>
      )}
      {!loading && error && (
        <div className="content-state content-error" role="alert">
          <h1>Lesson unavailable</h1>
          <p>{error}</p>
          <Link className="button button-secondary" href="/content">
            Back to lessons
          </Link>
        </div>
      )}
      {!loading && lesson && (
        <article className="lesson-content">
          <nav className="lesson-breadcrumb" aria-label="Breadcrumb">
            <Link href="/content">Curriculum</Link>
            <span aria-hidden="true">/</span>
            <span>{lesson.topic.title}</span>
          </nav>
          <p className="eyebrow">
            {lesson.subject.name} · {lesson.level.stage} · {lesson.scheme.term}
          </p>
          <h1>{lesson.title}</h1>
          <p className="lesson-lede">
            {lesson.course.title} · {lesson.estimated_minutes} minutes ·
            reviewed version {lesson.version}
          </p>
          <p className="lesson-offline-state" role="status">
            {lesson.offline_eligible
              ? "Available offline on this device"
              : "Online lesson · not saved for offline yet"}
          </p>
          <div className="lesson-body">
            {lesson.content.split(/\n{2,}/).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          {lesson.safety_notes && (
            <aside className="lesson-safety" aria-labelledby="safety-heading">
              <span className="safety-icon" aria-hidden="true">
                !
              </span>
              <div>
                <h2 id="safety-heading">Stay safe</h2>
                <p>{lesson.safety_notes}</p>
              </div>
            </aside>
          )}
          {lesson.assets.length > 0 && (
            <section className="lesson-media" aria-labelledby="media-heading">
              <h2 id="media-heading">Lesson media</h2>
              {lesson.assets.map((asset) => (
                <div className="lesson-asset" key={asset.id}>
                  {asset.kind === "image" && (
                    <img
                      src={asset.url}
                      alt={`Illustration for ${lesson.title}`}
                      loading="lazy"
                    />
                  )}
                  {asset.kind === "audio" && (
                    <audio controls preload="none" src={asset.url}>
                      {lesson.captions_url && (
                        <track
                          kind="captions"
                          src={lesson.captions_url}
                          srcLang="en"
                          label="English captions"
                          default
                        />
                      )}
                      Your browser does not support audio playback.
                    </audio>
                  )}
                  {asset.kind === "video" && (
                    <video controls preload="none" src={asset.url}>
                      {lesson.captions_url && (
                        <track
                          kind="captions"
                          src={lesson.captions_url}
                          srcLang="en"
                          label="English captions"
                          default
                        />
                      )}
                      Your browser does not support video playback.
                    </video>
                  )}
                  {asset.kind === "document" && (
                    <a className="button button-secondary" href={asset.url}>
                      Open lesson document (PDF)
                    </a>
                  )}
                  <p className="asset-attribution">
                    {asset.attribution} · {asset.license}
                    {asset.license_url ? (
                      <>
                        {" "}
                        ·{" "}
                        <a
                          href={asset.license_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          License details
                        </a>
                      </>
                    ) : null}
                  </p>
                </div>
              ))}
            </section>
          )}
          {lesson.transcript && (
            <section className="lesson-accessible-media">
              <h2>Transcript</h2>
              <p>{lesson.transcript}</p>
            </section>
          )}
          {lesson.captions && (
            <section className="lesson-accessible-media">
              <h2>Captions</h2>
              <pre>{lesson.captions}</pre>
            </section>
          )}
          <footer className="lesson-footer">
            <span>
              Content version {lesson.version} ·{" "}
              {lesson.content_hash.slice(0, 12)}
            </span>
            <Link href="/content">Explore another lesson</Link>
          </footer>
        </article>
      )}
    </main>
  );
}

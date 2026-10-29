"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { apiGet } from "@/lib/api";
import { Icon } from "@/components/icon";

type Verification = {
  has_teacher_profile?: boolean;
  verification_status?: string;
  subject_specialization?: string;
};

export default function TeacherPage() {
  const [verification, setVerification] = useState<Verification | null>(null);
  useEffect(() => {
    apiGet<Verification>("teacher-verification/me").then(({ ok, data }) => {
      if (ok) setVerification(data);
    });
  }, []);
  const verified = verification?.verification_status === "verified";
  const pending = verification?.verification_status === "pending";

  return (
    <AppShell>
      <main className="teacher-home page-enter">
        <section className="teacher-welcome">
          <div>
            <p className="eyebrow">TEACHER WORKSPACE</p>
            <h1>
              Bring the practical
              <br />
              into the lesson.
            </h1>
            <p>
              Thoughtful tools for turning science concepts into something
              learners can see, try and remember.
            </p>
            <Link
              className="button button-primary"
              href="/teacher/verification"
            >
              {verified
                ? "Open your educator profile"
                : pending
                  ? "Check verification status"
                  : "Start educator verification"}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="teacher-visual" aria-hidden="true">
            <span className="teacher-visual-ring ring-one" />
            <span className="teacher-visual-ring ring-two" />
            <span className="teacher-book">⌑</span>
            <span className="teacher-spark">✦</span>
            <span className="teacher-atom">
              <Icon name="spark" />
            </span>
          </div>
        </section>
        <section className="teacher-status-card">
          <span
            className={`teacher-status-icon ${verified ? "verified" : pending ? "pending" : ""}`}
            aria-hidden="true"
          >
            {verified ? "✓" : pending ? "…" : "◈"}
          </span>
          <div>
            <p className="eyebrow">EDUCATOR ACCESS</p>
            <h2>
              {verified
                ? "Your educator account is verified"
                : pending
                  ? "Your application is under review"
                  : "A trusted learning space starts with verification"}
            </h2>
            <p>
              {verified
                ? "Your verified status is ready. Teacher tools will become available as the classroom features are released."
                : pending
                  ? "Thanks for submitting your details. Our review team will update your status here."
                  : "Verification helps protect learners and gives every educator the right level of access."}
            </p>
          </div>
          <span
            className={`verification-chip ${verified ? "chip-success" : pending ? "chip-pending" : "chip-unverified"}`}
          >
            {verified ? "VERIFIED" : pending ? "IN REVIEW" : "NOT VERIFIED"}
          </span>
        </section>
        <div className="dashboard-section-heading">
          <div>
            <p className="eyebrow">MADE FOR REAL CLASSROOMS</p>
            <h2>Teach it so it sticks.</h2>
          </div>
        </div>
        <section className="teacher-feature-grid">
          <article className="teacher-feature">
            <span className="feature-number">01</span>
            <span className="feature-icon purple">✦</span>
            <h3>Demonstrate with confidence</h3>
            <p>
              Walk through a practical on your own screen, at a pace that works
              for your class.
            </p>
            <span className="feature-state">Teacher Lab · in development</span>
          </article>
          <article className="teacher-feature">
            <span className="feature-number">02</span>
            <span className="feature-icon orange">↗</span>
            <h3>Make practice feel possible</h3>
            <p>
              Give learners a safe way to explore apparatus and experiment steps
              beyond the lab bench.
            </p>
            <span className="feature-state">Student practice · available</span>
          </article>
          <article className="teacher-feature">
            <span className="feature-number">03</span>
            <span className="feature-icon teal">◷</span>
            <h3>See how understanding grows</h3>
            <p>
              Review practical work with context, so feedback starts with what
              each learner tried.
            </p>
            <span className="feature-state">Class tools · coming later</span>
          </article>
        </section>
        <section className="teacher-footnote">
          <span aria-hidden="true">✧</span>
          <p>
            <strong>Designed around educators.</strong> PracticalLab is for
            individual teachers and lecturers. No school account is required.
          </p>
          <Link href="/content">Explore reviewed lessons →</Link>
        </section>
      </main>
    </AppShell>
  );
}

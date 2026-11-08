"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import {
  filtrationDefinition,
  evaporationDefinition,
  simpleDistillationDefinition,
  fractionalDistillationDefinition,
  decantationDefinition,
  chromatographyDefinition,
  componentIdentificationDefinition,
  seriesCircuitDefinition,
  parallelCircuitDefinition,
  faultDiagnosisDefinition,
  ExperimentDefinition,
} from "@practicallab/experiment-schemas";

type ExperimentId =
  | "filtration"
  | "evaporation"
  | "simple-distillation"
  | "fractional-distillation"
  | "decantation"
  | "chromatography"
  | "component-identification"
  | "series-circuit"
  | "parallel-circuit"
  | "fault-diagnosis";

const EXPERIMENT_DEFINITIONS: Record<ExperimentId, ExperimentDefinition> = {
  filtration: filtrationDefinition,
  evaporation: evaporationDefinition,
  "simple-distillation": simpleDistillationDefinition,
  "fractional-distillation": fractionalDistillationDefinition,
  decantation: decantationDefinition,
  chromatography: chromatographyDefinition,
  "component-identification": componentIdentificationDefinition,
  "series-circuit": seriesCircuitDefinition,
  "parallel-circuit": parallelCircuitDefinition,
  "fault-diagnosis": faultDiagnosisDefinition,
};

const EXPERIMENT_SUBJECTS: Record<ExperimentId, string> = {
  filtration: "chemistry",
  evaporation: "chemistry",
  "simple-distillation": "chemistry",
  "fractional-distillation": "chemistry",
  decantation: "chemistry",
  chromatography: "chemistry",
  "component-identification": "electronics",
  "series-circuit": "electronics",
  "parallel-circuit": "electronics",
  "fault-diagnosis": "electronics",
};

const EXPERIMENT_TITLES: Record<ExperimentId, string> = {
  filtration: "Filter a cloudy mixture",
  evaporation: "Evaporate a dissolved solute",
  "simple-distillation": "Distill a liquid from a solution",
  "fractional-distillation": "Fractional distillation of alcohol and water",
  decantation: "Decant a settled mixture",
  chromatography: "Separate ink components by paper chromatography",
  "component-identification": "Identify basic electronic components",
  "series-circuit": "Build a series circuit",
  "parallel-circuit": "Build a parallel circuit",
  "fault-diagnosis": "Diagnose simple circuit faults",
};

const subjects = [
  { id: "chemistry", title: "Chemistry", icon: "flask" as const },
  { id: "electronics", title: "Electronics", icon: "spark" as const },
];

export default function TeacherLibraryPage() {
  const [previewExperiment, setPreviewExperiment] = useState<ExperimentId | null>(null);

  const experimentsBySubject = useMemo(() => {
    const result: { [key: string]: ExperimentId[] } = {};
    for (const id of Object.keys(EXPERIMENT_DEFINITIONS) as ExperimentId[]) {
      const subject = EXPERIMENT_SUBJECTS[id];
      if (!result[subject]) result[subject] = [];
      result[subject].push(id);
    }
    return result;
  }, []);

  const handlePreview = (id: ExperimentId) => {
    setPreviewExperiment(id);
  };

  const closePreview = () => {
    setPreviewExperiment(null);
  };

  return (
    <AppShell>
      <main className="teacher-library-page page-enter">
        <div className="teacher-lab-toolbar">
          <div className="toolbar-left">
            <Link className="toolbar-home" href="/teacher">
              <Icon name="home" /> Teacher Lab
            </Link>
          </div>
        </div>

        <section className="teacher-lab-heading">
          <div>
            <p className="eyebrow">TEACHER LIBRARY</p>
            <h1>Experiment Catalog</h1>
            <p>Preview student experiments and prepare your lessons.</p>
          </div>
        </section>

        <section className="teacher-workspace">
          <div className="workbench-top">
            <div>
              <span className="workbench-live-dot" /> EXPERIMENT CATALOG
            </div>
          </div>

          <div className="library-content">
            {subjects.map((subject) => {
              const experiments = experimentsBySubject[subject.id] || [];
              return (
                <section key={subject.id} className="library-section">
                  <h2 className="library-section-title">
                    <Icon name={subject.icon} />
                    {subject.title} Experiments
                  </h2>
                  <div className="library-grid">
                    {experiments.map((id) => (
                      <div key={id} className="library-card">
                        <h3 className="library-title">
                          {EXPERIMENT_TITLES[id]}
                        </h3>
                        <p className="library-description">
                          {EXPERIMENT_DEFINITIONS[id].steps[0]?.instruction}
                        </p>
                        <div className="library-actions">
                          <button
                            className="lab-action action-quiet"
                            onClick={() => handlePreview(id)}
                          >
                            <Icon name="mouse" /> Preview as student
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        {previewExperiment && (
          <div className="preview-modal-overlay" onClick={closePreview}>
            <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
              <div className="preview-header">
                <h3>Student Preview: {EXPERIMENT_TITLES[previewExperiment]}</h3>
                <button className="preview-close" onClick={closePreview}>
                  <Icon name="rotate-ccw" />
                </button>
              </div>
              <div className="preview-content">
                <Link
                  className="preview-link"
                  href={`/student/lab?experiment=${previewExperiment}`}
                >
                  Open student lab →
                </Link>
                <div className="preview-info">
                  <p>This will open the experiment in student mode, showing your students exactly what they will see.</p>
                  <ul>
                    <li><strong>Guided mode</strong> shows step-by-step instructions</li>
                    <li><strong>Free exploration</strong> lets students experiment on their own</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .teacher-library-page {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .teacher-lab-toolbar {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          padding: 8px 16px;
          border-bottom: 1px solid var(--pl-border);
        }

        .toolbar-home {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--pl-primary);
          text-decoration: none;
        }

        .toolbar-home:hover {
          text-decoration: underline;
        }

        .teacher-lab-heading {
          padding: 24px 16px 16px;
        }

        .teacher-lab-heading .eyebrow {
          color: var(--pl-muted);
          font-size: 14px;
          margin-bottom: 8px;
        }

        .teacher-lab-heading h1 {
          font-size: 28px;
          margin: 0 0 8px;
        }

        .library-section {
          padding: 0 16px 24px;
        }

        .library-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 16px;
          color: var(--pl-text);
        }

        .library-section-title svg {
          width: 20px;
          height: 20px;
        }

        .library-grid {
          display: grid;
          gap: 16px;
        }

        .library-card {
          background: var(--pl-surface);
          border: 1px solid var(--pl-border);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .library-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          color: var(--pl-text);
        }

        .library-description {
          font-size: 14px;
          color: var(--pl-muted);
          margin: 0;
          line-height: 1.4;
        }

        .library-actions {
          display: flex;
          gap: 8px;
        }

        .preview-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 100;
        }

        .preview-modal {
          background: var(--pl-surface);
          border-radius: 12px;
          padding: 20px;
          max-width: 480px;
          width: 100%;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .preview-header h3 {
          margin: 0;
          font-size: 18px;
        }

        .preview-close {
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          border-radius: 8px;
        }

        .preview-close:hover {
          background: var(--pl-surface-2);
        }

        .preview-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .preview-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--pl-primary);
          text-decoration: none;
          font-weight: 500;
        }

        .preview-link:hover {
          text-decoration: underline;
        }

        .preview-info {
          font-size: 14px;
          color: var(--pl-muted);
        }

        .preview-info ul {
          margin: 8px 0 0 16px;
          padding: 0;
        }

        .preview-info li {
          margin-bottom: 4px;
        }
      `}</style>
    </AppShell>
  );
}
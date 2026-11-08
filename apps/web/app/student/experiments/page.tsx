"use client";

import Link from "next/link";
import { useMemo } from "react";
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
  { id: "chemistry", title: "Chemistry", icon: "flask" as const, color: "#ef4444" },
  { id: "electronics", title: "Electronics", icon: "spark" as const, color: "#3b82f6" },
];

export default function StudentExperimentsPage() {
  const experimentsBySubject = useMemo(() => {
    const result: { [key: string]: ExperimentId[] } = {};
    for (const id of Object.keys(EXPERIMENT_DEFINITIONS) as ExperimentId[]) {
      const subject = EXPERIMENT_SUBJECTS[id];
      if (!result[subject]) result[subject] = [];
      result[subject].push(id);
    }
    return result;
  }, []);

  return (
    <AppShell>
      <main className="student-experiments-page page-enter">
        <section className="student-lab-heading">
          <div>
            <p className="eyebrow">YOUR PRACTICALS</p>
            <h1>Explore Science Experiments</h1>
            <p>Test your knowledge with interactive practical exercises.</p>
          </div>
        </section>

        <section className="student-workspace" aria-label="Experiment library">
          <div className="workbench-top">
            <div>
              <span className="workbench-live-dot" /> YOUR EXPERIMENTS
            </div>
          </div>

          <div className="library-content">
            {subjects.map((subject) => {
              const experiments = experimentsBySubject[subject.id] || [];
              return (
                <section key={subject.id} className="library-section">
                  <h2
                    className="library-section-title"
                    style={{ color: subject.color }}
                  >
                    <Icon name={subject.icon} />
                    {subject.title}
                  </h2>
                  <div className="library-grid">
                    {experiments.map((id) => (
                      <Link
                        key={id}
                        className="library-card"
                        href={`/student/lab?experiment=${id}`}
                      >
                        <h3 className="library-title">{EXPERIMENT_TITLES[id]}</h3>
                        <p className="library-description">
                          {EXPERIMENT_DEFINITIONS[id].steps[0]?.instruction}
                        </p>
                        <div className="library-actions">
                          <button className="lab-action">
                            <Icon name="flask" />
                            Start experiment
                          </button>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </section>
      </main>

      <style jsx>{`
        .student-experiments-page {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .student-lab-heading {
          padding: 24px 16px 16px;
        }

        .student-lab-heading .eyebrow {
          color: var(--pl-muted);
          font-size: 14px;
          margin-bottom: 8px;
        }

        .student-lab-heading h1 {
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
          text-decoration: none;
          color: inherit;
        }

        .library-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
          margin-top: 8px;
        }

        .lab-action {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--pl-primary);
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
        }

        .lab-action:hover {
          opacity: 0.9;
        }
      `}</style>
    </AppShell>
  );
}
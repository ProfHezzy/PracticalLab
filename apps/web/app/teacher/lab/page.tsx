"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  validateDefinition,
  ExperimentDefinition,
} from "@practicallab/experiment-schemas";
import {
  applyAction,
  createInitialState,
  loadDefinition,
  replayCommands,
  setExperimentMode,
  toggleMute,
  setReducedMotion,
} from "@practicallab/simulation-engine";

const SimulationStage = dynamic(
  () =>
    import("@/components/simulation-stage").then(
      (module) => module.SimulationStage,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="simulation-stage-loading" role="status">
        Preparing your workbench…
      </div>
    ),
  },
);

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

const EXPERIMENT_HINTS: Record<ExperimentId, string> = {
  filtration: "What must line the funnel before the mixture goes in?",
  evaporation: "What setup is needed above the heat source before heating?",
  "simple-distillation": "Where must cold water enter the condenser?",
  "fractional-distillation": "What does the fractionating column do that a simple condenser doesn't?",
  decantation: "How do you pour without disturbing the settled solids?",
  chromatography: "Why must the ink dot be above the solvent level?",
  "component-identification": "Look at the shape, markings, and terminals to identify each component.",
  "series-circuit": "In a series circuit, all components must be connected in a single loop.",
  "parallel-circuit": "In a parallel circuit, each branch connects directly across the power rails.",
  "fault-diagnosis": "Use the multimeter systematically: check voltage across components, then current.",
};

function getExperimentId(searchParams: URLSearchParams): ExperimentId {
  const id = searchParams.get("experiment") as ExperimentId;
  return id && id in EXPERIMENT_DEFINITIONS ? id : "filtration";
}

type TeacherMode = "auto" | "live";

export default function TeacherLabPage() {
  const searchParams = useSearchParams();
  const experimentId = getExperimentId(searchParams);
  const definition = EXPERIMENT_DEFINITIONS[experimentId];
  const subject = EXPERIMENT_SUBJECTS[experimentId];

  const [state, setState] = useState(() => {
    const initial = createInitialState(false);
    return validateDefinition(definition)
      ? loadDefinition(initial, definition)
      : initial;
  });
  const [teacherMode, setTeacherMode] = useState<TeacherMode>("auto");
  const [autoPlayIndex, setAutoPlayIndex] = useState(0);
  const [autoPlayRunning, setAutoPlayRunning] = useState(false);
  const [narrationMessage, setNarrationMessage] = useState("");
  const [narrationPlaying, setNarrationPlaying] = useState(false);
  const [audioUnsupported, setAudioUnsupported] = useState(false);
  const [saveMessage, setSaveMessage] = useState("Ready for class");
  const [laserPointer, setLaserPointer] = useState<{ x: number; y: number } | null>(null);
  const [highContrast, setHighContrast] = useState(false);
  const [largeLabels, setLargeLabels] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

  const done = state.status === "completed";
  const currentStep = state.definition?.steps[state.stepIndex];
  const caption = useMemo(
    () =>
      state.definition?.captions.find(
        (cue) => cue.id === currentStep?.narrationCueId,
      ),
    [currentStep?.narrationCueId, state.definition],
  );
  const replayed = useMemo(
    () =>
      state.definition
        ? replayCommands(
            state.definition,
            state.events.map((event) => event.command),
            state.mode,
          )
        : null,
    [state.definition, state.events, state.mode],
  );

  useEffect(() => {
    const reduced =
      document.documentElement.dataset.reducedMotion === "true" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setState((current) => setReducedMotion(current, reduced));
    return () => window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    if (!state.definition) return;
    const binding = {
      id: state.definition.id,
      version: state.definition.version,
      runtimeVersion: state.definition.runtimeVersion,
    };
    const key = `practicallab:teacher:${binding.id}:v${binding.version}`;
    try {
      if (!state.events.length) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const saved = JSON.parse(raw) as {
            binding?: typeof binding;
            mode?: "guided" | "free";
            commands?: Parameters<typeof replayCommands>[1];
          };
          if (
            JSON.stringify(saved.binding) === JSON.stringify(binding) &&
            Array.isArray(saved.commands) &&
            (saved.mode === "guided" || saved.mode === "free")
          ) {
            const restored = replayCommands(
              state.definition,
              saved.commands,
              saved.mode,
            );
            if (restored.events.length === saved.commands.length)
              setState((current) =>
                current.events.length ? current : restored,
              );
          }
        }
      } else {
        localStorage.setItem(
          key,
          JSON.stringify({
            binding,
            mode: state.mode,
            commands: state.events.map((event) => event.command),
          }),
        );
        setSaveMessage("Lesson state saved");
      }
    } catch {
      setSaveMessage("Could not save lesson state");
    }
  }, [state.definition, state.events, state.mode]);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    setNarrationPlaying(false);
  }, [state.stepIndex]);

  useEffect(() => {
    if (teacherMode === "auto" && autoPlayRunning && !done) {
      const narration = state.definition?.narration.find(
        (n) => n.id === currentStep?.narrationCueId,
      );
      if (narration) {
        const duration = narration.endMs - narration.startMs;
        const timer = setTimeout(() => {
          if (autoPlayIndex < (state.definition?.steps.length ?? 0) - 1) {
            setAutoPlayIndex((i) => i + 1);
            act({ type: "check" });
          } else {
            setAutoPlayRunning(false);
          }
        }, duration + 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [state.stepIndex, autoPlayRunning, autoPlayIndex, done, state.definition]);

  const playSoftTone = useCallback(() => {
    if (state.muted || typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 660;
    gain.gain.setValueAtTime(0.045, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.16);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.16);
    oscillator.onended = () => void context.close();
  }, [state.muted]);

  function act(action: Parameters<typeof applyAction>[1]) {
    const next = applyAction(state, action);
    setState(next);
    if (next.score > state.score) playSoftTone();
  }

  function changeMode(mode: "guided" | "free") {
    setState((current) => setExperimentMode(current, mode));
  }

  function playNarration() {
    if (state.muted) {
      setNarrationMessage(
        "Turn sound on to hear the step. Captions are available below.",
      );
      return;
    }
    if (!caption || !("speechSynthesis" in window)) {
      setAudioUnsupported(true);
      setNarrationMessage(
        "Narration is not available in this browser. Read the caption below.",
      );
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(caption.text);
    utterance.lang = "en-NG";
    utterance.onstart = () => setNarrationPlaying(true);
    utterance.onend = () => setNarrationPlaying(false);
    utterance.onerror = () => {
      setNarrationPlaying(false);
      setNarrationMessage("Narration could not play. Read the caption below.");
    };
    setNarrationMessage("");
    window.speechSynthesis.speak(utterance);
  }

  function toggleSound() {
    setState((current) => toggleMute(current));
    if (narrationPlaying) {
      window.speechSynthesis.cancel();
      setNarrationPlaying(false);
    }
  }

  function startAutoPlay() {
    setAutoPlayRunning(true);
    setAutoPlayIndex(0);
    if (state.stepIndex === 0) {
      act({ type: "check" });
    }
  }

  function pauseAutoPlay() {
    setAutoPlayRunning(false);
  }

  function resetAutoPlay() {
    setAutoPlayRunning(false);
    setAutoPlayIndex(0);
    act({ type: "reset" });
  }

  function stepForward() {
    if (state.stepIndex < (state.definition?.steps.length ?? 0) - 1) {
      act({ type: "check" });
    }
  }

  function stepBackward() {
    act({ type: "undo" });
  }

  function toggleFullScreen() {
    setFullScreen((prev) => {
      const next = !prev;
      if (next && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (!next && document.exitFullscreen) {
        document.exitFullscreen();
      }
      return next;
    });
  }

  const completedPercent = state.definition
    ? Math.round((state.stepIndex / state.definition.steps.length) * 100)
    : 0;

  return (
    <AppShell>
      <main
        className={`teacher-lab-page page-enter ${highContrast ? "high-contrast" : ""} ${largeLabels ? "large-labels" : ""} ${fullScreen ? "full-screen" : ""}`}
        onMouseMove={(e) => setLaserPointer({ x: e.clientX, y: e.clientY })}
      >
        <div className="teacher-lab-toolbar">
          <div className="toolbar-left">
            <Link href="/teacher" className="toolbar-home">
              <Icon name="home" />
              Teacher Lab
            </Link>
            <span className="toolbar-divider" aria-hidden="true">/</span>
            <span className="toolbar-subject">
              {subject === "chemistry" ? "CHEMISTRY" : "ELECTRONICS"} ·{" "}
              {definition.title}
            </span>
          </div>

          <div className="toolbar-center">
            <div className="teacher-mode-toggle" role="radiogroup" aria-label="Teaching mode">
              <button
                type="button"
                className={`mode-btn ${teacherMode === "auto" ? "active" : ""}`}
                onClick={() => setTeacherMode("auto")}
                aria-pressed={teacherMode === "auto"}
              >
                <Icon name="play" /> Auto-play
              </button>
              <button
                type="button"
                className={`mode-btn ${teacherMode === "live" ? "active" : ""}`}
                onClick={() => setTeacherMode("live")}
                aria-pressed={teacherMode === "live"}
              >
                <Icon name="mouse" /> Live
              </button>
            </div>

            {teacherMode === "auto" && (
              <div className="auto-play-controls" role="group" aria-label="Auto-play controls">
                {!autoPlayRunning && autoPlayIndex === 0 ? (
                  <button
                    type="button"
                    className="lab-action action-primary"
                    onClick={startAutoPlay}
                  >
                    <Icon name="play" /> Start lesson
                  </button>
                ) : autoPlayRunning ? (
                  <>
                    <button
                      type="button"
                      className="lab-action action-quiet"
                      onClick={pauseAutoPlay}
                    >
                      <Icon name="pause" /> Pause
                    </button>
                    <button
                      type="button"
                      className="lab-action action-quiet"
                      onClick={stepForward}
                    >
                      <Icon name="skip-forward" /> Next
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="lab-action action-primary"
                      onClick={startAutoPlay}
                    >
                      <Icon name="play" /> Resume
                    </button>
                    <button
                      type="button"
                      className="lab-action action-quiet"
                      onClick={resetAutoPlay}
                    >
                      <Icon name="rotate-ccw" /> Restart
                    </button>
                  </>
                )}
              </div>
            )}

            {teacherMode === "live" && (
              <div className="live-controls" role="group" aria-label="Live mode controls">
                <button
                  type="button"
                  className={`lab-action ${state.mode === "guided" ? "action-primary" : "action-quiet"}`}
                  onClick={() => changeMode("guided")}
                  disabled={state.events.length > 0}
                  aria-pressed={state.mode === "guided"}
                >
                  Guided
                </button>
                <button
                  type="button"
                  className={`lab-action ${state.mode === "free" ? "action-primary" : "action-quiet"}`}
                  onClick={() => changeMode("free")}
                  disabled={state.events.length > 0}
                  aria-pressed={state.mode === "free"}
                >
                  Free
                </button>
                {state.mode === "free" && (
                  <button
                    type="button"
                    className="lab-action action-primary"
                    onClick={() => act({ type: "check" })}
                  >
                    Check work
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="toolbar-right">
            <div className="projector-tools" role="group" aria-label="Projector tools">
              <button
                type="button"
                className={`projector-btn ${highContrast ? "active" : ""}`}
                onClick={() => setHighContrast(!highContrast)}
                aria-pressed={highContrast}
                title="High contrast"
              >
                <Icon name="contrast" />
              </button>
              <button
                type="button"
                className={`projector-btn ${largeLabels ? "active" : ""}`}
                onClick={() => setLargeLabels(!largeLabels)}
                aria-pressed={largeLabels}
                title="Large labels"
              >
                <Icon name="text" />
              </button>
              <button
                type="button"
                className={`projector-btn ${fullScreen ? "active" : ""}`}
                onClick={toggleFullScreen}
                aria-pressed={fullScreen}
                title="Full screen"
              >
                <Icon name={fullScreen ? "minimize" : "maximize"} />
              </button>
              <button
                type="button"
                className="projector-btn laser-toggle"
                title="Laser pointer (move mouse)"
              >
                <Icon name="target" />
              </button>
            </div>
            <span className="save-status">{saveMessage}</span>
          </div>
        </div>

        {laserPointer && (
          <div
            className="laser-pointer"
            style={{ left: laserPointer.x, top: laserPointer.y }}
            aria-hidden="true"
          >
            <span className="laser-dot" />
            <span className="laser-line" />
          </div>
        )}

        <section className="teacher-lab-heading">
          <div>
            <p className="eyebrow">
              {subject.toUpperCase()} ·{" "}
              {subject === "chemistry" ? "SEPARATION TECHNIQUES" : "BASIC ELECTRONICS"}
            </p>
            <h1>{definition.title}</h1>
            <p>
              {teacherMode === "auto"
                ? "Auto-play narrated demonstration for classroom projection."
                : "Live demonstration with manual step control and free exploration."}
            </p>
          </div>
          <div className="lesson-progress" aria-label={`Lesson ${completedPercent}% complete`}>
            <div className="lesson-progress-bar">
              <span
                style={{ transform: `scaleX(${completedPercent / 100})` }}
              />
            </div>
            <span className="lesson-progress-text">
              Step {state.stepIndex + 1} of {state.definition?.steps.length}
            </span>
          </div>
        </section>

        <section
          className="teacher-workspace"
          aria-label={`${definition.title} experiment workspace`}
        >
          <div className="workbench-top">
            <div>
              <span className="workbench-live-dot" /> TEACHER WORKBENCH
            </div>
          </div>

          {state.definition && (
            <SimulationStage
              definition={state.definition}
              state={state}
              onAction={act}
              className={highContrast ? "high-contrast" : ""}
            />
          )}

          <div className="teacher-feedback" role="status" aria-live="polite">
            <span
              className={`feedback-icon ${done ? "is-complete" : ""}`}
              aria-hidden="true"
            >
              {done ? "✓" : "✧"}
            </span>
            <div>
              <strong>
                {teacherMode === "auto" && autoPlayRunning
                  ? `Auto-playing step ${state.stepIndex + 1}…`
                  : teacherMode === "auto" && autoPlayIndex > 0
                  ? "Auto-play paused"
                  : currentStep?.instruction ||
                    "Select a teaching mode to begin."}
              </strong>
              <small>
                {done
                  ? definition.outcomes[0]?.description
                  : "A wrong move is safe. Check the labels and have another go."}
              </small>
            </div>
          </div>

          <section
            className="teacher-coach-panel"
            aria-label="Step coach and narration"
          >
            <div className="teacher-coach-copy">
              <span className="coach-avatar" aria-hidden="true">
                <Icon name="flask" />
              </span>
              <div>
                <p className="eyebrow">TEACHER NOTES</p>
                <strong>
                  {teacherMode === "auto"
                    ? `Auto-play narrates each step. Use Pause to discuss, Next to skip ahead.`
                    : currentStep?.instruction}
                </strong>
              </div>
            </div>
            <div className="teacher-coach-actions">
              <button
                className="lab-tool-button"
                type="button"
                onClick={playNarration}
                disabled={done || narrationPlaying}
              >
                <span aria-hidden="true">{narrationPlaying ? "Ⅱ" : "▶"}</span>
                {narrationPlaying ? "Speaking…" : "Play narration"}
              </button>
              <button
                className="lab-tool-button"
                type="button"
                onClick={toggleSound}
                aria-pressed={!state.muted}
              >
                <span aria-hidden="true">{state.muted ? "◌" : "◖"}</span>
                {state.muted ? "Sound off" : "Sound on"}
              </button>
              {teacherMode === "auto" && !autoPlayRunning && autoPlayIndex > 0 && (
                <button
                  className="lab-tool-button"
                  type="button"
                  onClick={() => setAutoPlayRunning(true)}
                >
                  <Icon name="play" /> Resume auto-play
                </button>
              )}
              {teacherMode === "live" && (
                <>
                  <button
                    className="lab-tool-button"
                    type="button"
                    onClick={stepBackward}
                    disabled={!state.history.length}
                  >
                    <Icon name="rotate-ccw" /> Undo
                  </button>
                  <button
                    className="lab-tool-button"
                    type="button"
                    onClick={stepForward}
                    disabled={done}
                  >
                    <Icon name="skip-forward" /> Next step
                  </button>
                </>
              )}
            </div>
            <p className="lab-caption" aria-live="polite">
              <span>CAPTION</span>
              {done
                ? definition.captions[0]?.text
                : caption?.text}
            </p>
            {narrationMessage && (
              <p className="lab-narration-note" role="status">
                {narrationMessage}
              </p>
            )}
            {audioUnsupported && (
              <span className="pl-sr-only">
                Audio is unavailable; captions remain visible.
              </span>
            )}
          </section>

          {teacherMode === "auto" && (
            <div className="auto-play-hint" role="status" aria-live="polite">
              <Icon name="info" />
              <span>
                Auto-play advances through each narrated step. Click
                <strong>Pause</strong> to hold on a step for questions, or
                <strong>Next</strong> to skip ahead.
              </span>
            </div>
          )}

          <div className="teacher-controls" aria-label="Experiment controls">
            <button
              className="lab-action action-quiet"
              onClick={() => act({ type: "undo" })}
              disabled={!state.history.length}
            >
              <span aria-hidden="true">↶</span>
              <small>Undo</small>
            </button>
            <button
              className="lab-action action-quiet"
              onClick={() => act({ type: "reset" })}
            >
              <span aria-hidden="true">⟳</span>
              <small>Reset</small>
            </button>
            {done && (
              <button
                className="lab-action action-primary"
                onClick={() => act({ type: "reset" })}
              >
                <Icon name="arrow" />
                <small>Run again</small>
              </button>
            )}
          </div>
        </section>

        {done && (
          <section
            className="teacher-result-card page-enter"
            aria-labelledby="teacher-result-title"
          >
            <span className="teacher-result-medal" aria-hidden="true">
              ✓
            </span>
            <div>
              <p className="eyebrow">LESSON COMPLETE</p>
              <h2 id="teacher-result-title">
                {definition.outcomes[0]?.title || "Experiment completed"}
              </h2>
              <p>{definition.outcomes[0]?.description}</p>
            </div>
            <div className="lesson-score">
              <strong>{state.score}</strong>
              <span>of {state.definition?.scoring.maxScore} points</span>
            </div>
          </section>
        )}

        <details className="teacher-event-log">
          <summary>
            Step log · {state.events.length} recorded actions
          </summary>
          <ol>
            {state.events.map((event) => (
              <li key={event.sequence}>
                <span
                  className={
                    event.accepted ? "event-mark accepted" : "event-mark failed"
                  }
                >
                  {event.accepted ? "✓" : "↻"}
                </span>
                <span>
                  <strong>Step {event.stepAfter}</strong>
                  <small>{event.feedback}</small>
                </span>
              </li>
            ))}
          </ol>
          {replayed && (
            <p className="lab-replay-check" role="status">
              Replay check: {replayed.score} points · {replayed.stepIndex} steps
              · {replayed.outcomeId ? "outcome reproduced" : "in progress"}
            </p>
          )}
        </details>

        <div className="teacher-lab-footer">
          <span>
            <span className="safety-check">✓</span> Safe virtual demonstration.
            No chemicals or real apparatus needed.
          </span>
          <Link href="/content">
            Browse lessons <span aria-hidden="true">→</span>
          </Link>
        </div>
      </main>
    </AppShell>
  );
}
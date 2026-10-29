"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import {
  filtrationDefinition,
  validateDefinition,
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

export default function StudentLabPage() {
  const [state, setState] = useState(() => {
    const initial = createInitialState(false);
    return validateDefinition(filtrationDefinition)
      ? loadDefinition(initial, filtrationDefinition)
      : initial;
  });
  const [hintOpen, setHintOpen] = useState(false);
  const [narrationMessage, setNarrationMessage] = useState("");
  const [narrationPlaying, setNarrationPlaying] = useState(false);
  const [audioUnsupported, setAudioUnsupported] = useState(false);
  const [saveMessage, setSaveMessage] = useState("Saved on this device");
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
    const key = `practicallab:draft:${binding.id}:v${binding.version}`;
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
        setSaveMessage("Progress saved on this device");
      }
    } catch {
      setSaveMessage("This browser could not save your progress");
    }
  }, [state.definition, state.events, state.mode]);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    setNarrationPlaying(false);
  }, [state.stepIndex]);

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

  const completedPercent = state.definition
    ? Math.round((state.stepIndex / state.definition.steps.length) * 100)
    : 0;

  return (
    <AppShell>
      <main className="lab-page page-enter">
        <div className="lab-breadcrumb">
          <Link href="/student">My lab</Link>
          <span aria-hidden="true">/</span>
          <span>Chemistry practical</span>
          <span className="lab-save-state">
            <span className="save-dot" /> {saveMessage} · works offline
          </span>
        </div>

        <section className="lab-heading">
          <div>
            <p className="eyebrow">CHEMISTRY · SEPARATION TECHNIQUES</p>
            <h1>Filtration</h1>
            <p>
              Separate an insoluble solid from a liquid, one careful step at a
              time.
            </p>
            <span className="lab-review-badge">
              <span aria-hidden="true">i</span> Practice preview · subject
              review pending
            </span>
          </div>
          <button
            className="hint-button"
            onClick={() => setHintOpen((open) => !open)}
            aria-expanded={hintOpen}
          >
            <Icon name="spark" /> {hintOpen ? "Hide hint" : "Need a hint?"}
          </button>
        </section>

        {hintOpen && (
          <aside className="hint-card" role="status">
            <Icon name="flask" className="hint-flask-icon" />
            <p>
              <strong>Think like a scientist:</strong> What must line the funnel
              before the mixture goes in?
            </p>
          </aside>
        )}

        <section
          className="lab-workspace"
          aria-label="Filtration experiment workspace"
        >
          <div className="workbench-top">
            <div>
              <span className="workbench-live-dot" /> YOUR WORKBENCH
            </div>
            <span className="workbench-step">
              STEP{" "}
              <strong>
                {done ? state.definition?.steps.length : state.stepIndex + 1}
              </strong>{" "}
              OF {state.definition?.steps.length}
            </span>
          </div>

          <div className="lab-controls" aria-label="Choose practical mode">
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
              Free exploration
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

          {state.definition && (
            <SimulationStage
              definition={state.definition}
              state={state}
              onAction={act}
            />
          )}

          <div
            className="lab-progress-block"
            aria-label={`Experiment ${completedPercent}% complete`}
          >
            <div className="lab-progress-label">
              <span>Practical progress</span>
              <strong>{completedPercent}%</strong>
            </div>
            <div className="lab-progress-track">
              <span
                style={{ transform: `scaleX(${completedPercent / 100})` }}
              />
            </div>
          </div>

          <div className="experiment-feedback" role="status" aria-live="polite">
            <span
              className={`feedback-icon ${done ? "is-complete" : ""}`}
              aria-hidden="true"
            >
              {done ? "✓" : "✧"}
            </span>
            <div>
              <strong>
                {done
                  ? "Practical complete. Nice work!"
                  : state.message ||
                    (state.mode === "free" && !currentStep
                      ? "All steps explored. Check your work when you are ready."
                      : null) ||
                    currentStep?.instruction ||
                    "Choose an action to begin."}
              </strong>
              <small>
                {done
                  ? "You saw how filter paper separates an insoluble solid from a liquid."
                  : "A wrong move is safe. Check the labels and have another go."}
              </small>
            </div>
          </div>

          <section
            className="lab-coach-panel"
            aria-label="Step coach and narration"
          >
            <div className="lab-coach-copy">
              <span className="coach-avatar" aria-hidden="true">
                <Icon name="flask" />
              </span>
              <div>
                <p className="eyebrow">YOUR NEXT STEP</p>
                <strong>
                  {done
                    ? "You completed the filtration steps."
                    : currentStep?.instruction}
                </strong>
              </div>
            </div>
            <div className="lab-coach-actions">
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
            </div>
            <p className="lab-caption" aria-live="polite">
              <span>CAPTION</span>
              {done
                ? "Filtration separates the insoluble sand from the water."
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

          <div className="lab-controls" aria-label="Experiment controls">
            <button
              className="lab-action action-quiet"
              onClick={() => act({ type: "undo" })}
              disabled={!state.history.length}
            >
              <span aria-hidden="true">↶</span>
              <small>Undo step</small>
            </button>
            <button
              className="lab-action action-quiet"
              onClick={() => act({ type: "reset" })}
            >
              <span aria-hidden="true">⟳</span>
              <small>Start again</small>
            </button>
            {done && (
              <button
                className="lab-action action-primary"
                onClick={() => act({ type: "reset" })}
              >
                <Icon name="arrow" />
                <small>Try again</small>
              </button>
            )}
          </div>
        </section>

        {done && (
          <section
            className="lab-result-card page-enter"
            aria-labelledby="lab-result-title"
          >
            <span className="lab-result-medal" aria-hidden="true">
              ✓
            </span>
            <div>
              <p className="eyebrow">WHAT YOU LEARNED</p>
              <h2 id="lab-result-title">A filter catches insoluble solids.</h2>
              <p>
                Water passes through the paper into the receiving flask while
                the sand stays behind.
              </p>
            </div>
            <div className="lab-score">
              <strong>{state.score}</strong>
              <span>of {state.definition?.scoring.maxScore} points</span>
            </div>
          </section>
        )}

        <details className="lab-event-log">
          <summary>
            Attempt replay · {state.events.length} recorded actions
          </summary>
          <p>
            Actions are recorded in order on this device. Replay reproduces the
            accepted steps deterministically.
          </p>
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
                  <strong>Action {event.sequence}</strong>
                  <small>{event.feedback}</small>
                </span>
                <span className="event-step">Step {event.stepAfter}</span>
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

        <div className="lab-footer-row">
          <span>
            <span className="safety-check">✓</span> Safe virtual practice. No
            chemicals or real apparatus needed.
          </span>
          <Link href="/content">
            Browse lessons <span aria-hidden="true">→</span>
          </Link>
        </div>
      </main>
    </AppShell>
  );
}

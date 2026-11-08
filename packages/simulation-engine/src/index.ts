import type {
  ExperimentAction,
  ExperimentCommand,
  ExperimentDefinition,
} from "@practicallab/experiment-schemas";

export type SimulationEngineStatus =
  "not-initialized" | "ready" | "running" | "paused" | "completed";
export type ExperimentMode = "guided" | "free";
export type ExperimentEvent = {
  sequence: number;
  command: ExperimentCommand;
  accepted: boolean;
  stepBefore: number;
  stepAfter: number;
  scoreAfter: number;
  feedback: string;
};
export type ApparatusRuntimeState = { location: string; prepared: boolean };
export type EngineState = {
  status: SimulationEngineStatus;
  definition: ExperimentDefinition | null;
  stepIndex: number;
  score: number;
  history: ExperimentAction[];
  events: ExperimentEvent[];
  apparatusState: Record<string, ApparatusRuntimeState>;
  outcomeId: string | null;
  message: string | null;
  safeFailures: number;
  reducedMotion: boolean;
  muted: boolean;
  mode: ExperimentMode;
  completedRuleIds: string[];
};

export function createInitialState(reducedMotion = false): EngineState {
  return {
    status: "not-initialized",
    definition: null,
    stepIndex: 0,
    score: 0,
    history: [],
    events: [],
    apparatusState: {},
    outcomeId: null,
    message: null,
    safeFailures: 0,
    reducedMotion,
    muted: true,
    mode: "guided",
    completedRuleIds: [],
  };
}

function initialApparatusState(definition: ExperimentDefinition) {
  return Object.fromEntries(
    definition.apparatus.map((item) => [
      item.id,
      { location: "tray", prepared: false },
    ]),
  );
}

export function loadDefinition(
  state: EngineState,
  definition: ExperimentDefinition,
): EngineState {
  return {
    ...state,
    status: "ready",
    definition,
    stepIndex: 0,
    score: 0,
    history: [],
    events: [],
    apparatusState: initialApparatusState(definition),
    outcomeId: null,
    safeFailures: 0,
    completedRuleIds: [],
    message: null,
  };
}

function sameAction(left: ExperimentAction, right: ExperimentAction): boolean {
  if (left.type !== right.type) return false;
  if (left.type === "fit" && right.type === "fit") {
    return left.apparatus === right.apparatus && left.target === right.target;
  }
  if (left.type === "place" && right.type === "place") {
    return left.apparatus === right.apparatus && left.slot === right.slot;
  }
  if (left.type === "pour" && right.type === "pour") {
    return left.from === right.from && left.to === right.to;
  }
  if (left.type === "connect" && right.type === "connect") {
    return left.from === right.from && left.to === right.to;
  }
  if (left.type === "disconnect" && right.type === "disconnect") {
    return left.from === right.from;
  }
  if (left.type === "measure" && right.type === "measure") {
    return left.apparatus === right.apparatus && left.with === right.with;
  }
  if (left.type === "toggle" && right.type === "toggle") {
    return left.apparatus === right.apparatus;
  }
  if (left.type === "identify" && right.type === "identify") {
    return left.apparatus === right.apparatus;
  }
  return false;
}

function updateApparatus(
  state: EngineState,
  action: ExperimentAction,
): Record<string, ApparatusRuntimeState> {
  const next = { ...state.apparatusState };
  if (action.type === "fit") {
    next[action.apparatus] = { location: action.target, prepared: true };
  } else if (action.type === "place") {
    next[action.apparatus] = { location: action.slot, prepared: true };
  } else if (action.type === "connect") {
    next[action.from] = { location: action.to, prepared: true };
    next[action.to] = { location: action.from, prepared: true };
  } else if (action.type === "disconnect") {
    next[action.from] = { location: "tray", prepared: false };
  } else if (action.type === "toggle") {
    if (next[action.apparatus]) {
      next[action.apparatus] = { ...next[action.apparatus], prepared: !next[action.apparatus].prepared };
    }
  }
  return next;
}

function appendEvent(
  state: EngineState,
  command: ExperimentCommand,
  next: EngineState,
  accepted: boolean,
  feedback: string,
): EngineState {
  const event: ExperimentEvent = {
    sequence: state.events.length + 1,
    command,
    accepted,
    stepBefore: state.stepIndex,
    stepAfter: next.stepIndex,
    scoreAfter: next.score,
    feedback,
  };
  return { ...next, events: [...state.events, event] };
}

function applyExperimentAction(
  state: EngineState,
  action: ExperimentAction,
): EngineState {
  const definition = state.definition;
  if (!definition) return { ...state, message: "No experiment is loaded." };
  const step = definition.steps[state.stepIndex];
  if (!step) {
    return { ...state, status: "completed", message: "Experiment complete." };
  }
  const rule = definition.rules.find((item) => item.id === step.ruleId);
  if (!rule || !sameAction(action, rule.action)) {
    const feedback = `${definition.safeFailure.message} ${definition.safeFailure.guidance}`;
    const failed = {
      ...state,
      message: feedback,
      safeFailures: state.safeFailures + 1,
    };
    return appendEvent(state, action, failed, false, feedback);
  }

  const nextIndex = state.stepIndex + 1;
  const complete = nextIndex === definition.steps.length;
  const stepHook = definition.scoring.hooks.find(
    (hook) => hook.event === "correct_step",
  );
  const score = Math.min(
    definition.scoring.maxScore,
    state.score + (stepHook?.points ?? 0),
  );
  const next: EngineState = {
    ...state,
    status: complete ? "completed" : "running",
    stepIndex: nextIndex,
    score,
    history: [...state.history, action],
    completedRuleIds: [...state.completedRuleIds, rule.id],
    apparatusState: updateApparatus(state, action),
    outcomeId: rule.outcomeId ?? state.outcomeId,
    message: rule.feedback,
  };
  return appendEvent(state, action, next, true, rule.feedback);
}

function applyFreeAction(
  state: EngineState,
  action: ExperimentAction,
): EngineState {
  const definition = state.definition;
  if (!definition) return { ...state, message: "No experiment is loaded." };
  const rule = definition.rules.find(
    (item) =>
      sameAction(action, item.action) &&
      !state.completedRuleIds.includes(item.id),
  );
  if (!rule) {
    const feedback = `${definition.safeFailure.message} ${definition.safeFailure.guidance}`;
    return appendEvent(
      state,
      action,
      { ...state, message: feedback, safeFailures: state.safeFailures + 1 },
      false,
      feedback,
    );
  }
  const completedRuleIds = [...state.completedRuleIds, rule.id];
  const next: EngineState = {
    ...state,
    status: "running",
    stepIndex: completedRuleIds.length,
    score: 0,
    history: [...state.history, action],
    completedRuleIds,
    apparatusState: updateApparatus(state, action),
    message: rule.feedback,
  };
  return appendEvent(state, action, next, true, rule.feedback);
}

function checkWork(state: EngineState): EngineState {
  const definition = state.definition;
  if (!definition) return { ...state, message: "No experiment is loaded." };
  const complete =
    state.mode === "free" &&
    state.completedRuleIds.length === definition.steps.length;
  if (!complete) {
    const feedback =
      state.mode === "guided"
        ? "Follow the guided steps and review what you learned."
        : "There are still practical steps to try. Explore and check again.";
    return appendEvent(
      state,
      { type: "check" },
      { ...state, message: feedback },
      false,
      feedback,
    );
  }
  const outcomeId =
    definition.rules.find((rule) => rule.outcomeId)?.outcomeId ?? null;
  const next = {
    ...state,
    status: "completed" as const,
    score: definition.scoring.maxScore,
    outcomeId,
    message: "All the practical steps are complete. Nice work!",
  };
  return appendEvent(state, { type: "check" }, next, true, next.message);
}

function replayAcceptedActions(
  definition: ExperimentDefinition,
  actions: ExperimentAction[],
  mode: ExperimentMode = "guided",
): EngineState {
  const initial = loadDefinition(createInitialState(), definition);
  initial.mode = mode;
  return actions.reduce(
    (state, action) =>
      mode === "free"
        ? applyFreeAction(state, action)
        : applyExperimentAction(state, action),
    initial,
  );
}

export function applyAction(
  state: EngineState,
  command: ExperimentCommand,
): EngineState {
  if (!state.definition)
    return { ...state, message: "No experiment is loaded." };
  if (command.type === "reset") {
    const clean = loadDefinition(state, state.definition);
    clean.mode = state.mode;
    return appendEvent(
      state,
      command,
      clean,
      true,
      "Experiment reset. Start again when you are ready.",
    );
  }
  if (command.type === "check") return checkWork(state);
  if (command.type === "undo") {
    if (!state.history.length) {
      return appendEvent(
        state,
        command,
        state,
        false,
        "There is no step to undo yet.",
      );
    }
    const prior = state.history.slice(0, -1);
    const replayed = replayAcceptedActions(state.definition, prior, state.mode);
    const next = {
      ...replayed,
      safeFailures: state.safeFailures,
      muted: state.muted,
      reducedMotion: state.reducedMotion,
    };
    return appendEvent(
      state,
      command,
      next,
      true,
      "Last step undone. You can try it again.",
    );
  }
  return state.mode === "free"
    ? applyFreeAction(state, command)
    : applyExperimentAction(state, command);
}

export function replayCommands(
  definition: ExperimentDefinition,
  commands: ExperimentCommand[],
  mode: ExperimentMode = "guided",
): EngineState {
  const initial = loadDefinition(createInitialState(), definition);
  initial.mode = mode;
  return commands.reduce(
    (state, command) => applyAction(state, command),
    initial,
  );
}

export function setExperimentMode(
  state: EngineState,
  mode: ExperimentMode,
): EngineState {
  if (state.events.length) return state;
  return { ...state, mode };
}

export function replayActions(
  definition: ExperimentDefinition,
  actions: ExperimentAction[],
): EngineState {
  return replayAcceptedActions(definition, actions);
}

export type ApparatusHandler = (
  state: EngineState,
  action: ExperimentAction,
) => EngineState;

export const apparatusRegistry: Record<string, ApparatusHandler> = {
  default: (state, action) => applyAction(state, action),
};

export function registerApparatus(
  name: string,
  handler: ApparatusHandler,
): void {
  if (!/^[a-z][a-z0-9-]{0,63}$/.test(name)) {
    throw new Error("Apparatus registry keys must be lowercase identifiers.");
  }
  apparatusRegistry[name] = handler;
}

export type Scene = {
  id: string;
  mounted: boolean;
  mount: (dispose: () => void) => void;
  unmount: () => void;
};

export function createScene(id: string): Scene {
  let dispose: (() => void) | undefined;
  return {
    id,
    mounted: false,
    mount(cleanup) {
      if (this.mounted) return;
      dispose = cleanup;
      this.mounted = true;
    },
    unmount() {
      if (!this.mounted) return;
      dispose?.();
      dispose = undefined;
      this.mounted = false;
    },
  };
}

export function responsiveViewport(width: number): "mobile" | "desktop" {
  return width < 768 ? "mobile" : "desktop";
}

export function toggleMute(state: EngineState): EngineState {
  return { ...state, muted: !state.muted };
}

export function setReducedMotion(
  state: EngineState,
  value: boolean,
): EngineState {
  return { ...state, reducedMotion: value };
}

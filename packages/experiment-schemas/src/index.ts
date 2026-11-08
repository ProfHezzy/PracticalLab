export const EXPERIMENT_SCHEMA_VERSION = "1.1" as const;
export const EXPERIMENT_RUNTIME_VERSION = "1.0.0" as const;

export const APPARATUS_TYPES = [
  "beaker",
  "funnel",
  "filter-paper",
  "receiving-flask",
  "mixture",
  "heat-source",
  "battery",
  "wire",
  "resistor",
  "led",
  "breadboard",
  "multimeter",
  "switch",
  "bulb",
  "motor",
] as const;

export type ApparatusType = (typeof APPARATUS_TYPES)[number];

export type ExperimentAction =
  | { type: "place"; apparatus: ApparatusType; slot: string }
  | { type: "pour"; from: string; to: string }
  | { type: "fit"; apparatus: "filter-paper"; target: "funnel" }
  | { type: "connect"; from: string; to: string }
  | { type: "disconnect"; from: string }
  | { type: "measure"; apparatus: ApparatusType; with: ApparatusType }
  | { type: "toggle"; apparatus: ApparatusType }
  | { type: "identify"; apparatus: ApparatusType };

export type ExperimentCommand =
  ExperimentAction | { type: "undo" } | { type: "reset" } | { type: "check" };

export type ExperimentDefinition = {
  schemaVersion: typeof EXPERIMENT_SCHEMA_VERSION;
  runtimeVersion: typeof EXPERIMENT_RUNTIME_VERSION;
  id: string;
  title: string;
  subject: string;
  version: number;
  apparatus: { id: string; type: ApparatusType; label: string }[];
  steps: {
    id: string;
    instruction: string;
    ruleId: string;
    narrationCueId: string;
  }[];
  rules: {
    id: string;
    action: ExperimentAction;
    outcomeId?: string;
    feedback: string;
  }[];
  outcomes: { id: string; title: string; description: string }[];
  scoring: {
    maxScore: number;
    hooks: { id: string; event: "correct_step"; points: number }[];
  };
  safeFailure: { message: string; guidance: string };
  narration: { id: string; text: string; startMs: number; endMs: number }[];
  captions: { id: string; text: string; startMs: number; endMs: number }[];
  assets: {
    id: string;
    kind: "image" | "audio" | "video";
    url: string;
    altText: string;
    sizeBytes: number;
  }[];
};

type JsonSchema = {
  $schema: string;
  $id: string;
  title: string;
  type: "object";
  additionalProperties: false;
  required: string[];
  properties: Record<string, unknown>;
};

const nonEmptyString = { type: "string", minLength: 1 };
const apparatusAction = {
  oneOf: [
    {
      type: "object",
      additionalProperties: false,
      required: ["type", "apparatus", "slot"],
      properties: {
        type: { const: "place" },
        apparatus: { enum: APPARATUS_TYPES },
        slot: nonEmptyString,
      },
    },
    {
      type: "object",
      additionalProperties: false,
      required: ["type", "from", "to"],
      properties: {
        type: { const: "pour" },
        from: nonEmptyString,
        to: nonEmptyString,
      },
    },
    {
      type: "object",
      additionalProperties: false,
      required: ["type", "apparatus", "target"],
      properties: {
        type: { const: "fit" },
        apparatus: { const: "filter-paper" },
        target: { const: "funnel" },
      },
    },
    {
      type: "object",
      additionalProperties: false,
      required: ["type", "from", "to"],
      properties: {
        type: { const: "connect" },
        from: nonEmptyString,
        to: nonEmptyString,
      },
    },
    {
      type: "object",
      additionalProperties: false,
      required: ["type", "from"],
      properties: {
        type: { const: "disconnect" },
        from: nonEmptyString,
      },
    },
    {
      type: "object",
      additionalProperties: false,
      required: ["type", "apparatus", "with"],
      properties: {
        type: { const: "measure" },
        apparatus: { enum: APPARATUS_TYPES },
        with: { enum: APPARATUS_TYPES },
      },
    },
    {
      type: "object",
      additionalProperties: false,
      required: ["type", "apparatus"],
      properties: {
        type: { const: "toggle" },
        apparatus: { enum: APPARATUS_TYPES },
      },
    },
    {
      type: "object",
      additionalProperties: false,
      required: ["type", "apparatus"],
      properties: {
        type: { const: "identify" },
        apparatus: { enum: APPARATUS_TYPES },
      },
    },
  ],
};

const cue = {
  type: "object",
  additionalProperties: false,
  required: ["id", "text", "startMs", "endMs"],
  properties: {
    id: nonEmptyString,
    text: nonEmptyString,
    startMs: { type: "integer", minimum: 0 },
    endMs: { type: "integer", minimum: 1 },
  },
};

export const EXPERIMENT_JSON_SCHEMA: JsonSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://practicallab.africa/schemas/experiment/1.1.json",
  title: "PracticalLab Africa experiment definition 1.1",
  type: "object",
  additionalProperties: false,
  required: [
    "schemaVersion",
    "runtimeVersion",
    "id",
    "title",
    "subject",
    "version",
    "apparatus",
    "steps",
    "rules",
    "outcomes",
    "scoring",
    "safeFailure",
    "narration",
    "captions",
    "assets",
  ],
  properties: {
    schemaVersion: { const: EXPERIMENT_SCHEMA_VERSION },
    runtimeVersion: { const: EXPERIMENT_RUNTIME_VERSION },
    id: { type: "string", pattern: "^[a-z0-9][a-z0-9-]{1,79}$" },
    title: { type: "string", minLength: 1, maxLength: 200 },
    subject: { type: "string", minLength: 1, maxLength: 80 },
    version: { type: "integer", minimum: 1 },
    apparatus: {
      type: "array",
      minItems: 1,
      maxItems: 32,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "type", "label"],
        properties: {
          id: { type: "string", pattern: "^[a-z][a-z0-9-]{0,63}$" },
          type: { enum: APPARATUS_TYPES },
          label: { type: "string", minLength: 1, maxLength: 80 },
        },
      },
    },
    steps: {
      type: "array",
      minItems: 1,
      maxItems: 40,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "instruction", "ruleId", "narrationCueId"],
        properties: {
          id: { type: "string", pattern: "^[a-z][a-z0-9-]{0,63}$" },
          instruction: { type: "string", minLength: 1, maxLength: 240 },
          ruleId: nonEmptyString,
          narrationCueId: nonEmptyString,
        },
      },
    },
    rules: {
      type: "array",
      minItems: 1,
      maxItems: 80,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "action", "feedback"],
        properties: {
          id: nonEmptyString,
          action: apparatusAction,
          outcomeId: nonEmptyString,
          feedback: { type: "string", minLength: 1, maxLength: 240 },
        },
      },
    },
    outcomes: {
      type: "array",
      minItems: 1,
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "description"],
        properties: {
          id: nonEmptyString,
          title: { type: "string", minLength: 1, maxLength: 120 },
          description: { type: "string", minLength: 1, maxLength: 500 },
        },
      },
    },
    scoring: {
      type: "object",
      additionalProperties: false,
      required: ["maxScore", "hooks"],
      properties: {
        maxScore: { type: "integer", minimum: 0, maximum: 1000 },
        hooks: {
          type: "array",
          maxItems: 20,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "event", "points"],
            properties: {
              id: nonEmptyString,
              event: { const: "correct_step" },
              points: { type: "integer", minimum: 0, maximum: 1000 },
            },
          },
        },
      },
    },
    safeFailure: {
      type: "object",
      additionalProperties: false,
      required: ["message", "guidance"],
      properties: {
        message: { type: "string", minLength: 1, maxLength: 240 },
        guidance: { type: "string", minLength: 1, maxLength: 240 },
      },
    },
    narration: { type: "array", minItems: 1, maxItems: 80, items: cue },
    captions: { type: "array", minItems: 1, maxItems: 80, items: cue },
    assets: {
      type: "array",
      maxItems: 32,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "kind", "url", "altText", "sizeBytes"],
        properties: {
          id: nonEmptyString,
          kind: { enum: ["image", "audio", "video"] },
          url: { type: "string", format: "uri-reference", maxLength: 1000 },
          altText: { type: "string", maxLength: 300 },
          sizeBytes: { type: "integer", minimum: 0, maximum: 1572864 },
        },
      },
    },
  },
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAction(value: unknown): value is ExperimentAction {
  if (!isObject(value)) return false;
  if (value.type === "place") {
    return (
      typeof value.apparatus === "string" &&
      APPARATUS_TYPES.includes(value.apparatus as ApparatusType) &&
      typeof value.slot === "string" &&
      value.slot.length > 0
    );
  }
  if (value.type === "pour") {
    return typeof value.from === "string" && typeof value.to === "string";
  }
  if (value.type === "fit") {
    return (
      value.apparatus === "filter-paper" &&
      value.target === "funnel"
    );
  }
  if (value.type === "connect") {
    return typeof value.from === "string" && typeof value.to === "string";
  }
  if (value.type === "disconnect") {
    return typeof value.from === "string";
  }
  if (value.type === "measure") {
    return (
      typeof value.apparatus === "string" &&
      APPARATUS_TYPES.includes(value.apparatus as ApparatusType) &&
      typeof value.with === "string" &&
      APPARATUS_TYPES.includes(value.with as ApparatusType)
    );
  }
  if (value.type === "toggle") {
    return (
      typeof value.apparatus === "string" &&
      APPARATUS_TYPES.includes(value.apparatus as ApparatusType)
    );
  }
  if (value.type === "identify") {
    return (
      typeof value.apparatus === "string" &&
      APPARATUS_TYPES.includes(value.apparatus as ApparatusType)
    );
  }
  return false;
}

export function definitionErrors(value: unknown): string[] {
  if (!isObject(value)) return ["Definition must be an object."];
  const errors: string[] = [];
  if (value.schemaVersion !== EXPERIMENT_SCHEMA_VERSION)
    errors.push("Unsupported schema version.");
  if (value.runtimeVersion !== EXPERIMENT_RUNTIME_VERSION)
    errors.push("Unsupported runtime version.");
  if (
    typeof value.id !== "string" ||
    !/^[a-z0-9][a-z0-9-]{1,79}$/.test(value.id)
  )
    errors.push("Invalid experiment id.");
  if (
    typeof value.title !== "string" ||
    !value.title.trim() ||
    value.title.length > 200
  )
    errors.push("Invalid title.");
  if (
    typeof value.subject !== "string" ||
    !value.subject.trim() ||
    value.subject.length > 80
  )
    errors.push("Invalid subject.");
  if (!Number.isInteger(value.version) || Number(value.version) < 1)
    errors.push("Version must be a positive integer.");

  const apparatus = Array.isArray(value.apparatus) ? value.apparatus : [];
  if (!apparatus.length || apparatus.length > 32)
    errors.push("Add between 1 and 32 apparatus items.");
  const apparatusIds = new Set<string>();
  for (const item of apparatus) {
    if (
      !isObject(item) ||
      typeof item.id !== "string" ||
      !item.id ||
      !APPARATUS_TYPES.includes(item.type as ApparatusType) ||
      typeof item.label !== "string" ||
      !item.label.trim()
    ) {
      errors.push("Each apparatus item needs a valid id, type and label.");
      continue;
    }
    if (apparatusIds.has(item.id)) errors.push("Apparatus ids must be unique.");
    apparatusIds.add(item.id);
  }

  const steps = Array.isArray(value.steps) ? value.steps : [];
  const rules = Array.isArray(value.rules) ? value.rules : [];
  const outcomes = Array.isArray(value.outcomes) ? value.outcomes : [];
  const narration = Array.isArray(value.narration) ? value.narration : [];
  const captions = Array.isArray(value.captions) ? value.captions : [];
  if (!steps.length || steps.length > 40)
    errors.push("Add between 1 and 40 steps.");
  if (!rules.length || rules.length > 80)
    errors.push("Add between 1 and 80 rules.");
  if (!outcomes.length || outcomes.length > 20)
    errors.push("Add between 1 and 20 outcomes.");
  const ruleIds = new Set<string>();
  for (const rule of rules) {
    if (
      !isObject(rule) ||
      typeof rule.id !== "string" ||
      !rule.id ||
      !isAction(rule.action) ||
      typeof rule.feedback !== "string" ||
      !rule.feedback.trim()
    ) {
      errors.push("Each rule needs an id, supported action and feedback.");
      continue;
    }
    if (ruleIds.has(rule.id)) errors.push("Rule ids must be unique.");
    ruleIds.add(rule.id);
    if (
      rule.outcomeId !== undefined &&
      !outcomes.some(
        (outcome) => isObject(outcome) && outcome.id === rule.outcomeId,
      )
    )
      errors.push("Rules must reference an existing outcome.");
  }
  const stepIds = new Set<string>();
  for (const step of steps) {
    if (
      !isObject(step) ||
      typeof step.id !== "string" ||
      !step.id ||
      typeof step.instruction !== "string" ||
      !step.instruction.trim() ||
      typeof step.ruleId !== "string" ||
      typeof step.narrationCueId !== "string"
    ) {
      errors.push(
        "Each step needs an id, instruction, rule and narration cue.",
      );
      continue;
    }
    if (stepIds.has(step.id)) errors.push("Step ids must be unique.");
    stepIds.add(step.id);
    if (!ruleIds.has(step.ruleId))
      errors.push("Steps must reference an existing rule.");
    if (
      !narration.some(
        (cueItem) => isObject(cueItem) && cueItem.id === step.narrationCueId,
      )
    )
      errors.push("Steps must reference an existing narration cue.");
  }
  for (const cueList of [narration, captions]) {
    for (const item of cueList) {
      if (
        !isObject(item) ||
        typeof item.id !== "string" ||
        typeof item.text !== "string" ||
        !item.text.trim() ||
        !Number.isInteger(item.startMs) ||
        !Number.isInteger(item.endMs) ||
        Number(item.startMs) < 0 ||
        Number(item.endMs) <= Number(item.startMs)
      ) {
        errors.push(
          "Narration and caption cues require text and a valid time range.",
        );
        break;
      }
    }
  }
  if (
    captions.length &&
    narration.length &&
    !captions.every(
      (caption) =>
        isObject(caption) &&
        narration.some((voice) => isObject(voice) && voice.id === caption.id),
    )
  )
    errors.push("Caption cues must map to narration cues.");
  if (
    !isObject(value.scoring) ||
    !Number.isInteger(value.scoring.maxScore) ||
    Number(value.scoring.maxScore) < 0 ||
    !Array.isArray(value.scoring.hooks)
  )
    errors.push("Scoring configuration is invalid.");
  if (
    !isObject(value.safeFailure) ||
    typeof value.safeFailure.message !== "string" ||
    typeof value.safeFailure.guidance !== "string"
  )
    errors.push("Safe-failure feedback is required.");
  if (!Array.isArray(value.assets) || value.assets.length > 32)
    errors.push("Assets must be an array with at most 32 entries.");
  else if (
    value.assets.some(
      (asset) =>
        !isObject(asset) ||
        typeof asset.id !== "string" ||
        !["image", "audio", "video"].includes(String(asset.kind)) ||
        typeof asset.url !== "string" ||
        typeof asset.altText !== "string" ||
        !Number.isInteger(asset.sizeBytes) ||
        Number(asset.sizeBytes) < 0 ||
        Number(asset.sizeBytes) > 1_572_864,
    )
  )
    errors.push(
      "Asset metadata is invalid or exceeds the 1.5 MB experiment budget.",
    );
  return [...new Set(errors)];
}

export function validateDefinition(
  value: unknown,
): value is ExperimentDefinition {
  return definitionErrors(value).length === 0;
}

export const filtrationDefinition: ExperimentDefinition = {
  schemaVersion: EXPERIMENT_SCHEMA_VERSION,
  runtimeVersion: EXPERIMENT_RUNTIME_VERSION,
  id: "filtration",
  title: "Filter a cloudy mixture",
  subject: "chemistry",
  version: 1,
  apparatus: [
    { id: "mixture", type: "mixture", label: "Sand and water mixture" },
    { id: "funnel", type: "funnel", label: "Funnel" },
    { id: "filter-paper", type: "filter-paper", label: "Filter paper" },
    {
      id: "receiving-flask",
      type: "receiving-flask",
      label: "Receiving flask",
    },
  ],
  steps: [
    {
      id: "fit-paper",
      instruction: "Fit the filter paper into the funnel.",
      ruleId: "fit-paper",
      narrationCueId: "cue-fit",
    },
    {
      id: "place-funnel",
      instruction: "Place the funnel in the receiving flask.",
      ruleId: "place-funnel",
      narrationCueId: "cue-place",
    },
    {
      id: "pour-mixture",
      instruction: "Pour the mixture slowly into the funnel.",
      ruleId: "pour-mixture",
      narrationCueId: "cue-pour",
    },
  ],
  rules: [
    {
      id: "fit-paper",
      action: { type: "fit", apparatus: "filter-paper", target: "funnel" },
      feedback: "The paper lines the funnel and catches the sand.",
    },
    {
      id: "place-funnel",
      action: { type: "place", apparatus: "funnel", slot: "receiving-flask" },
      feedback: "The flask is ready to collect the liquid.",
    },
    {
      id: "pour-mixture",
      action: { type: "pour", from: "mixture", to: "funnel" },
      outcomeId: "mixture-separated",
      feedback: "The water passes through while the sand stays in the paper.",
    },
  ],
  outcomes: [
    {
      id: "mixture-separated",
      title: "Mixture separated",
      description:
        "The liquid collects in the flask. The insoluble sand remains in the filter paper.",
    },
  ],
  scoring: {
    maxScore: 3,
    hooks: [{ id: "step-complete", event: "correct_step", points: 1 }],
  },
  safeFailure: {
    message: "That step did not work yet. No harm done.",
    guidance: "Check the apparatus labels and try the suggested step.",
  },
  narration: [
    {
      id: "cue-fit",
      text: "First, fit the folded filter paper inside the funnel.",
      startMs: 0,
      endMs: 3800,
    },
    {
      id: "cue-place",
      text: "Next, rest the funnel in the receiving flask.",
      startMs: 0,
      endMs: 3500,
    },
    {
      id: "cue-pour",
      text: "Pour slowly. The water passes through and the sand stays behind.",
      startMs: 0,
      endMs: 4300,
    },
  ],
  captions: [
    {
      id: "cue-fit",
      text: "Fit the folded filter paper inside the funnel.",
      startMs: 0,
      endMs: 3800,
    },
    {
      id: "cue-place",
      text: "Rest the funnel in the receiving flask.",
      startMs: 0,
      endMs: 3500,
    },
    {
      id: "cue-pour",
      text: "Pour slowly. Water passes through; sand stays behind.",
      startMs: 0,
      endMs: 4300,
    },
  ],
  assets: [],
};

export const evaporationDefinition: ExperimentDefinition = {
  schemaVersion: EXPERIMENT_SCHEMA_VERSION,
  runtimeVersion: EXPERIMENT_RUNTIME_VERSION,
  id: "evaporation",
  title: "Evaporate a dissolved solute",
  subject: "chemistry",
  version: 1,
  apparatus: [
    { id: "beaker", type: "beaker", label: "Evaporating basin" },
    { id: "heat-source", type: "heat-source", label: "Heat source" },
    { id: "mixture", type: "mixture", label: "Salt solution" }
  ],
  steps: [
    {
      id: "pour-solution",
      instruction: "Pour the salt solution into the evaporating basin.",
      ruleId: "pour-solution",
      narrationCueId: "cue-pour"
    },
    {
      id: "position-basin",
      instruction: "Set up the tripod, gauze, and place the basin above the heat source.",
      ruleId: "position-basin",
      narrationCueId: "cue-position"
    },
    {
      id: "heat-solution",
      instruction: "Heat gently until water evaporates and salt crystals form.",
      ruleId: "heat-solution",
      narrationCueId: "cue-heat"
    }
  ],
  rules: [
    {
      id: "pour-solution",
      action: { "type": "pour", "from": "mixture", "to": "beaker" },
      feedback: "The salt solution fills the evaporating basin."
    },
    {
      id: "position-basin",
      action: { "type": "place", "apparatus": "heat-source", "slot": "workbench-left" },
      feedback: "The heat source is positioned safely below the basin."
    },
    {
      id: "heat-solution",
      action: { "type": "place", "apparatus": "mixture", "slot": "beaker" },
      outcomeId: "salt-recovered",
      feedback: "The water evaporates as vapor, leaving behind dry salt crystals."
    }
  ],
  outcomes: [
    {
      id: "salt-recovered",
      title: "Salt recovered",
      description: "The water has completely evaporated, leaving dry salt crystals in the basin."
    }
  ],
  scoring: {
    "maxScore": 3,
    "hooks": [{ "id": "step-complete", "event": "correct_step", "points": 1 }]
  },
  safeFailure: {
    message: "Continue the heating carefully.",
    guidance: "Ensure good ventilation and use appropriate heat settings."
  },
  narration: [
    {
      id: "cue-pour",
      text: "Pour the salt solution into the evaporating basin. The solution should fill about two thirds of the basin.",
      startMs: 0,
      endMs: 3200
    },
    {
      id: "cue-position",
      text: "Set up a tripod with gauze above your heat source. Place the basin gently on the gauze.",
      startMs: 0,
      endMs: 3400
    },
    {
      id: "cue-heat",
      text: "Heat gently with a steady flame. The salt crystals will begin to form as water evaporates.",
      startMs: 0,
      endMs: 3800
    }
  ],
  captions: [
    {
      id: "cue-pour",
      text: "Pour the salt solution into the evaporating basin. The solution should fill about two thirds of the basin.",
      startMs: 0,
      endMs: 3200
    },
    {
      id: "cue-position",
      text: "Set up a tripod with gauze above your heat source. Place the basin gently on the gauze.",
      startMs: 0,
      endMs: 3400
    },
    {
      id: "cue-heat",
      text: "Heat gently with a steady flame. The salt crystals will begin to form as water evaporates.",
      startMs: 0,
      endMs: 3800
    }
  ],
  assets: []
};

export const simpleDistillationDefinition: ExperimentDefinition = {
  schemaVersion: EXPERIMENT_SCHEMA_VERSION,
  runtimeVersion: EXPERIMENT_RUNTIME_VERSION,
  id: "simple-distillation",
  title: "Distill a liquid from a solution",
  subject: "chemistry",
  version: 1,
  apparatus: [
    { id: "beaker", type: "beaker", label: "Distillation flask" },
    { id: "funnel", type: "funnel", label: "Liebig condenser" },
    { id: "receiving-flask", type: "receiving-flask", label: "Receiving flask" },
    { id: "heat-source", type: "heat-source", label: "Heat source" },
    { id: "mixture", type: "mixture", label: "Ink solution" }
  ],
  steps: [
    {
      id: "setup-flask",
      instruction: "Pour the ink solution into the distillation flask.",
      ruleId: "pour-solution",
      narrationCueId: "cue-pour"
    },
    {
      id: "connect-condenser",
      instruction: "Connect the condenser with cold water flowing in at the lower end.",
      ruleId: "connect-condenser",
      narrationCueId: "cue-connect"
    },
    {
      id: "place-thermometer",
      instruction: "Place the receiving flask under the condenser outlet.",
      ruleId: "place-receiver",
      narrationCueId: "cue-place"
    },
    {
      id: "heat-and-collect",
      instruction: "Heat gently and collect the clear distillate.",
      ruleId: "distill",
      narrationCueId: "cue-distill"
    }
  ],
  rules: [
    {
      id: "pour-solution",
      action: { "type": "pour", "from": "mixture", "to": "beaker" },
      feedback: "The ink solution fills the distillation flask."
    },
    {
      id: "connect-condenser",
      action: { "type": "place", "apparatus": "funnel", "slot": "beaker" },
      feedback: "The condenser is connected with water flow entering at the bottom."
    },
    {
      id: "place-receiver",
      action: { "type": "place", "apparatus": "receiving-flask", "slot": "bench-right" },
      feedback: "The receiving flask is positioned to collect the distillate."
    },
    {
      id: "distill",
      action: { "type": "place", "apparatus": "mixture", "slot": "funnel" },
      outcomeId: "water-distilled",
      feedback: "Water vapor travels through the condenser and condenses in the receiving flask."
    }
  ],
  outcomes: [
    {
      id: "water-distilled",
      title: "Water distilled",
      description: "Clear water (distillate) collects in the receiving flask while ink residue remains in the distillation flask."
    }
  ],
  scoring: {
    "maxScore": 4,
    "hooks": [{ "id": "step-complete", "event": "correct_step", "points": 1 }]
  },
  safeFailure: {
    message: "Check your setup and try again.",
    guidance: "Ensure condenser water is flowing before heating and the receiving flask is positioned correctly."
  },
  narration: [
    {
      id: "cue-pour",
      text: "Pour the ink solution into the distillation flask. Fill it about three quarters full.",
      startMs: 0,
      endMs: 3400
    },
    {
      id: "cue-connect",
      text: "Connect the Liebig condenser. Cold water should enter at the bottom and exit at the top.",
      startMs: 0,
      endMs: 3600
    },
    {
      id: "cue-place",
      text: "Place the receiving flask under the condenser outlet to catch the distillate.",
      startMs: 0,
      endMs: 3200
    },
    {
      id: "cue-distill",
      text: "Heat gently. Watch for the thermometer to reach 100 degrees Celsius. Water vapor will travel through the condenser.",
      startMs: 0,
      endMs: 4000
    }
  ],
  captions: [
    {
      id: "cue-pour",
      text: "Pour the ink solution into the distillation flask. Fill it about three quarters full.",
      startMs: 0,
      endMs: 3400
    },
    {
      id: "cue-connect",
      text: "Connect the Liebig condenser. Cold water should enter at the bottom and exit at the top.",
      startMs: 0,
      endMs: 3600
    },
    {
      id: "cue-place",
      text: "Place the receiving flask under the condenser outlet to catch the distillate.",
      startMs: 0,
      endMs: 3200
    },
    {
      id: "cue-distill",
      text: "Heat gently. Watch for the thermometer to reach 100 degrees Celsius. Water vapor will travel through the condenser.",
      startMs: 0,
      endMs: 4000
    }
  ],
  assets: []
};

export const fractionalDistillationDefinition: ExperimentDefinition = {
  schemaVersion: EXPERIMENT_SCHEMA_VERSION,
  runtimeVersion: EXPERIMENT_RUNTIME_VERSION,
  id: "fractional-distillation",
  title: "Fractional distillation of alcohol and water",
  subject: "chemistry",
  version: 1,
  apparatus: [
    { id: "beaker", type: "beaker", label: "Distillation flask" },
    { id: "funnel", type: "funnel", label: "Fractionating column" },
    { id: "receiving-flask", type: "receiving-flask", label: "Receiving flask" },
    { id: "heat-source", type: "heat-source", label: "Heat source" },
    { id: "mixture", type: "mixture", label: "Alcohol-water mixture" }
  ],
  steps: [
    {
      id: "fill-flask",
      instruction: "Pour the alcohol-water mixture into the distillation flask.",
      ruleId: "pour-mixture",
      narrationCueId: "cue-fill"
    },
    {
      id: "setup-column",
      instruction: "Set up the fractionating column above the flask.",
      ruleId: "setup-column",
      narrationCueId: "cue-column"
    },
    {
      id: "collect-fraction",
      instruction: "Heat and collect the first fraction at ~78°C in the receiving flask.",
      ruleId: "collect-fraction",
      narrationCueId: "cue-collect"
    }
  ],
  rules: [
    {
      id: "pour-mixture",
      action: { "type": "pour", "from": "mixture", "to": "beaker" },
      feedback: "The alcohol-water mixture is in the distillation flask."
    },
    {
      id: "setup-column",
      action: { "type": "place", "apparatus": "funnel", "slot": "beaker" },
      feedback: "The fractionating column provides multiple condensation-vaporization cycles."
    },
    {
      id: "collect-fraction",
      action: { "type": "place", "apparatus": "mixture", "slot": "receiving-flask" },
      outcomeId: "fractions-separated",
      feedback: "Ethanol (boiling at 78°C) collects first as the first fraction."
    }
  ],
  outcomes: [
    {
      id: "fractions-separated",
      title: "Fractions separated",
      description: "Ethanol-rich vapor collected first, followed by water. The column allows separation of liquids with close boiling points."
    }
  ],
  scoring: {
    "maxScore": 3,
    "hooks": [
      { "id": "step-complete", "event": "correct_step", "points": 1 }
    ]
  },
  safeFailure: {
    message: "Check the temperature and collection points.",
    guidance: "Ethanol boils at ~78°C, water at 100°C. Switch flasks at the right temperature."
  },
  narration: [
    {
      id: "cue-fill",
      text: "Pour the alcohol-water mixture into the distillation flask. The mixture fills the flask about three-quarters full.",
      startMs: 0,
      endMs: 3600
    },
    {
      id: "cue-column",
      text: "Set up the fractionating column above the flask. The column is packed with glass beads to increase surface area.",
      startMs: 0,
      endMs: 3800
    },
    {
      id: "cue-collect",
      text: "Heat gently. The temperature will rise to 78°C as ethanol vaporizes first. Collect this first fraction.",
      startMs: 0,
      endMs: 4200
    }
  ],
  captions: [
    {
      id: "cue-fill",
      text: "Pour the alcohol-water mixture into the distillation flask. The mixture fills the flask about three-quarters full.",
      startMs: 0,
      endMs: 3600
    },
    {
      id: "cue-column",
      text: "Set up the fractionating column above the flask. The column is packed with glass beads to increase surface area.",
      startMs: 0,
      endMs: 3800
    },
    {
      id: "cue-collect",
      text: "Heat gently. The temperature will rise to 78°C as ethanol vaporizes first. Collect this first fraction.",
      startMs: 0,
      endMs: 4200
    }
  ],
  assets: []
};

export const decantationDefinition: ExperimentDefinition = {
  schemaVersion: EXPERIMENT_SCHEMA_VERSION,
  runtimeVersion: EXPERIMENT_RUNTIME_VERSION,
  id: "decantation",
  title: "Decant a settled mixture",
  subject: "chemistry",
  version: 1,
  apparatus: [
    { id: "beaker", type: "beaker", label: "Beaker with settled mixture" },
    { id: "receiving-flask", type: "receiving-flask", label: "Receiving beaker" }
  ],
  steps: [
    {
      id: "wait-settle",
      instruction: "Allow the sand-water mixture to settle completely (if not already settled).",
      ruleId: "wait-settle",
      narrationCueId: "cue-wait"
    },
    {
      id: "tilt-and-pour",
      instruction: "Carefully tilt the beaker and pour the liquid into the receiving beaker.",
      ruleId: "pour-liquid",
      narrationCueId: "cue-pour"
    },
    {
      id: "verify-separation",
      instruction: "Check that the liquid has been separated from the sand.",
      ruleId: "verify-separation",
      narrationCueId: "cue-check"
    }
  ],
  rules: [
    {
      id: "wait-settle",
      action: { "type": "place", "apparatus": "beaker", "slot": "workbench-center" },
      feedback: "The mixture has settled with sand at the bottom."
    },
    {
      id: "pour-liquid",
      action: { "type": "pour", "from": "beaker", "to": "receiving-flask" },
      feedback: "The clear liquid (supernatant) is poured off, leaving sand behind."
    },
    {
      id: "verify-separation",
      action: { "type": "place", "apparatus": "receiving-flask", "slot": "workbench-right" },
      outcomeId: "liquid-separated",
      feedback: "Liquid separated. A secondary pour may be needed for clarity."
    }
  ],
  outcomes: [
    {
      id: "liquid-separated",
      title: "Liquid separated",
      description: "The clear liquid has been separated from the settled sand by careful pouring."
    }
  ],
  scoring: {
    "maxScore": 3,
    "hooks": [{ "id": "step-complete", "event": "correct_step", "points": 1 }]
  },
  safeFailure: {
    message: "Decantation requires patience and care.",
    guidance: "Tilt slowly and pour carefully along the side to avoid disturbing the settled sand."
  },
  narration: [
    {
      id: "cue-wait",
      text: "Allow the sand-water mixture to settle until the sand has completely settled at the bottom.",
      startMs: 0,
      endMs: 3400
    },
    {
      id: "cue-pour",
      text: "Tilt the beaker carefully. Pour the clear liquid (supernatant) into the receiving beaker, avoiding the sand at the bottom.",
      startMs: 0,
      endMs: 3600
    },
    {
      id: "cue-check",
      text: "Check your separation. The liquid should be clear, and the sand should remain in the original beaker.",
      startMs: 0,
      endMs: 3200
    }
  ],
  captions: [
    {
      id: "cue-wait",
      text: "Allow the sand-water mixture to settle until the sand has completely settled at the bottom.",
      startMs: 0,
      endMs: 3400
    },
    {
      id: "cue-pour",
      text: "Tilt the beaker carefully. Pour the clear liquid (supernatant) into the receiving beaker, avoiding the sand at the bottom.",
      startMs: 0,
      endMs: 3600
    },
    {
      id: "cue-check",
      text: "Check your separation. The liquid should be clear, and the sand should remain in the original beaker.",
      startMs: 0,
      endMs: 3200
    }
  ],
  assets: []
};

export const chromatographyDefinition: ExperimentDefinition = {
  schemaVersion: EXPERIMENT_SCHEMA_VERSION,
  runtimeVersion: EXPERIMENT_RUNTIME_VERSION,
  id: "chromatography",
  title: "Separate ink components by paper chromatography",
  subject: "chemistry",
  version: 1,
  apparatus: [
    { id: "beaker", type: "beaker", label: "Chromatography paper" },
    { id: "mixture", type: "mixture", label: "Ink sample" },
    { id: "heat-source", type: "heat-source", label: "Solvent (isopropyl alcohol)" }
  ],
  steps: [
    {
      id: "prepare-paper",
      instruction: "Mark a pencil line 2 cm from the bottom of the chromatography paper.",
      ruleId: "prepare-paper",
      narrationCueId: "cue-mark"
    },
    {
      id: "apply-ink",
      instruction: "Apply a small dot of ink on the pencil line.",
      ruleId: "apply-ink",
      narrationCueId: "cue-dot"
    },
    {
      id: "develop",
      instruction: "Place the inked paper into the solvent jar so the dot is just above the solvent level.",
      ruleId: "develop",
      narrationCueId: "cue-develop"
    },
    {
      id: "analyze",
      instruction: "Observe the separated colors as the solvent travels up the paper.",
      ruleId: "analyze",
      narrationCueId: "cue-observe"
    }
  ],
  rules: [
    {
      id: "prepare-paper",
      action: { "type": "place", "apparatus": "beaker", "slot": "bench-center" },
      feedback: "The paper is ready for marking with a pencil line 2 cm from the bottom."
    },
    {
      id: "apply-ink",
      action: { "type": "pour", "from": "mixture", "to": "beaker" },
      feedback: "A small ink dot is applied at the marked spot."
    },
    {
      id: "develop",
      action: { "type": "place", "apparatus": "mixture", "slot": "heat-source" },
      outcomeId: "colors-separated",
      feedback: "The solvent travels up the paper by capillary action, separating the ink components."
    },
    {
      id: "analyze",
      action: { "type": "place", "apparatus": "heat-source", "slot": "tray" },
      feedback: "Watch as the solvent travels and separates the ink colors into distinct bands."
    }
  ],
  outcomes: [
    {
      id: "colors-separated",
      title: "Colors separated",
      description: "The solvent has traveled up the paper, carrying different ink pigments at different rates, creating distinct colored bands."
    }
  ],
  scoring: {
    "maxScore": 3,
    "hooks": [
      { "id": "step-complete", "event": "correct_step", "points": 1 }
    ]
  },
  safeFailure: {
    message: "Paper chromatography separates colors by solubility.",
    guidance: "Place the paper so the ink dot is just above the solvent level. Watch carefully as colors separate."
  },
  narration: [
    {
      id: "cue-mark",
      text: "Take a pencil and mark a line 2 cm from the bottom of the chromatography paper. Use pencil, not pen, so the marking doesn't dissolve.",
      startMs: 0,
      endMs: 3800
    },
    {
      id: "cue-dot",
      text: "Using a small brush or cotton swab, apply a small dot of ink on the marked line. The dot should be small and distinct.",
      startMs: 0,
      endMs: 3600
    },
    {
      id: "cue-develop",
      text: "Place the inked paper into the solvent jar so the ink dot is just above the solvent level. Don't let the paper touch the solvent.",
      startMs: 0,
      endMs: 4000
    },
    {
      id: "cue-observe",
      text: "Watch as the solvent travels up the paper. Different pigments travel at different rates, separating into distinct colored bands.",
      startMs: 0,
      endMs: 4200
    }
  ],
  captions: [
    {
      id: "cue-mark",
      text: "Mark a pencil line 2 cm from the bottom of the chromatography paper.",
      startMs: 0,
      endMs: 3800
    },
    {
      id: "cue-dot",
      text: "Apply a small ink dot on the marked line using a brush.",
      startMs: 0,
      endMs: 3600
    },
    {
      id: "cue-develop",
      text: "Place the paper in the solvent jar. The solvent rises by capillary action.",
      startMs: 0,
      endMs: 4000
    },
    {
      id: "cue-observe",
      text: "Observe the separated colored bands as the solvent travels up the paper.",
      startMs: 0,
      endMs: 4200
    }
  ],
  assets: []
};

export const componentIdentificationDefinition: ExperimentDefinition = {
  schemaVersion: EXPERIMENT_SCHEMA_VERSION,
  runtimeVersion: EXPERIMENT_RUNTIME_VERSION,
  id: "component-identification",
  title: "Identify Basic Electronic Components",
  subject: "electronics",
  version: 1,
  apparatus: [
    { id: "resistor", type: "resistor", label: "Resistor" },
    { id: "led", type: "led", label: "LED" },
    { id: "battery", type: "battery", label: "Battery (AA)" },
    { id: "switch", type: "switch", label: "Switch" },
    { id: "breadboard", type: "breadboard", label: "Breadboard" },
    { id: "wire", type: "wire", label: "Jumper Wire" },
    { id: "multimeter", type: "multimeter", label: "Multimeter" }
  ],
  steps: [
    {
      id: "identify-resistor",
      instruction: "Identify the resistor by its color bands and cylindrical shape.",
      ruleId: "identify-resistor",
      narrationCueId: "cue-resistor"
    },
    {
      id: "identify-led",
      instruction: "Identify the LED by its clear/colored dome and two legs (anode and cathode).",
      ruleId: "identify-led",
      narrationCueId: "cue-led"
    },
    {
      id: "identify-battery",
      instruction: "Identify the battery by its cylindrical shape with positive and negative terminals.",
      ruleId: "identify-battery",
      narrationCueId: "cue-battery"
    },
    {
      id: "identify-switch",
      instruction: "Identify the switch by its toggle/lever mechanism.",
      ruleId: "identify-switch",
      narrationCueId: "cue-switch"
    },
    {
      id: "identify-breadboard",
      instruction: "Identify the breadboard by its grid of holes for connecting components.",
      ruleId: "identify-breadboard",
      narrationCueId: "cue-breadboard"
    },
    {
      id: "identify-wire",
      instruction: "Identify the jumper wire by its flexible insulation and metal connectors.",
      ruleId: "identify-wire",
      narrationCueId: "cue-wire"
    },
    {
      id: "identify-multimeter",
      instruction: "Identify the multimeter by its display, dial, and probe ports.",
      ruleId: "identify-multimeter",
      narrationCueId: "cue-multimeter"
    }
  ],
  rules: [
    {
      id: "identify-resistor",
      action: { type: "identify", apparatus: "resistor" },
      feedback: "Resistor identified. It limits current flow in a circuit."
    },
    {
      id: "identify-led",
      action: { type: "identify", apparatus: "led" },
      feedback: "LED identified. It emits light when current flows in the forward direction."
    },
    {
      id: "identify-battery",
      action: { type: "identify", apparatus: "battery" },
      feedback: "Battery identified. It provides the voltage source for the circuit."
    },
    {
      id: "identify-switch",
      action: { type: "identify", apparatus: "switch" },
      feedback: "Switch identified. It opens or closes the circuit path."
    },
    {
      id: "identify-breadboard",
      action: { type: "identify", apparatus: "breadboard" },
      feedback: "Breadboard identified. It allows temporary connections without soldering."
    },
    {
      id: "identify-wire",
      action: { type: "identify", apparatus: "wire" },
      feedback: "Jumper wire identified. It connects components on the breadboard."
    },
    {
      id: "identify-multimeter",
      action: { type: "identify", apparatus: "multimeter" },
      outcomeId: "all-identified",
      feedback: "Multimeter identified. It measures voltage, current, and resistance."
    }
  ],
  outcomes: [
    {
      id: "all-identified",
      title: "All components identified",
      description: "You have successfully identified all basic electronic components needed for circuit building."
    }
  ],
  scoring: {
    maxScore: 7,
    hooks: [{ id: "step-complete", event: "correct_step", points: 1 }]
  },
  safeFailure: {
    message: "That component wasn't recognized.",
    guidance: "Look at the shape, markings, and terminals to identify each component."
  },
  narration: [
    { id: "cue-resistor", text: "This is a resistor. Notice the colored bands that indicate its resistance value.", startMs: 0, endMs: 3500 },
    { id: "cue-led", text: "This is an LED — Light Emitting Diode. The longer leg is the anode (positive), the shorter is the cathode (negative).", startMs: 0, endMs: 4000 },
    { id: "cue-battery", text: "This is a battery. The positive terminal is marked with a plus sign, the negative with a minus.", startMs: 0, endMs: 3500 },
    { id: "cue-switch", text: "This is a switch. It controls whether current can flow through the circuit.", startMs: 0, endMs: 3000 },
    { id: "cue-breadboard", text: "This is a breadboard. The holes are connected in rows and columns, allowing you to build circuits without soldering.", startMs: 0, endMs: 4500 },
    { id: "cue-wire", text: "These are jumper wires. They connect components together on the breadboard.", startMs: 0, endMs: 3000 },
    { id: "cue-multimeter", text: "This is a multimeter. It can measure voltage, current, and resistance to help you understand your circuit.", startMs: 0, endMs: 4000 }
  ],
  captions: [
    { id: "cue-resistor", text: "Resistor — colored bands show resistance value.", startMs: 0, endMs: 3500 },
    { id: "cue-led", text: "LED — longer leg is anode (+), shorter is cathode (-).", startMs: 0, endMs: 4000 },
    { id: "cue-battery", text: "Battery — positive (+) and negative (-) terminals.", startMs: 0, endMs: 3500 },
    { id: "cue-switch", text: "Switch — opens or closes the circuit.", startMs: 0, endMs: 3000 },
    { id: "cue-breadboard", text: "Breadboard — grid of connected holes for temporary circuits.", startMs: 0, endMs: 4500 },
    { id: "cue-wire", text: "Jumper wire — connects components on the breadboard.", startMs: 0, endMs: 3000 },
    { id: "cue-multimeter", text: "Multimeter — measures voltage, current, and resistance.", startMs: 0, endMs: 4000 }
  ],
  assets: []
};

export const seriesCircuitDefinition: ExperimentDefinition = {
  schemaVersion: EXPERIMENT_SCHEMA_VERSION,
  runtimeVersion: EXPERIMENT_RUNTIME_VERSION,
  id: "series-circuit",
  title: "Build a Series Circuit",
  subject: "electronics",
  version: 1,
  apparatus: [
    { id: "battery", type: "battery", label: "Battery (AA)" },
    { id: "resistor", type: "resistor", label: "Resistor (220Ω)" },
    { id: "led", type: "led", label: "LED" },
    { id: "switch", type: "switch", label: "Switch" },
    { id: "breadboard", type: "breadboard", label: "Breadboard" },
    { id: "wire1", type: "wire", label: "Red Jumper Wire" },
    { id: "wire2", type: "wire", label: "Black Jumper Wire" },
    { id: "wire3", type: "wire", label: "Blue Jumper Wire" },
    { id: "multimeter", type: "multimeter", label: "Multimeter" }
  ],
  steps: [
    {
      id: "place-battery",
      instruction: "Place the battery on the breadboard with positive and negative on separate power rails.",
      ruleId: "place-battery",
      narrationCueId: "cue-place-battery"
    },
    {
      id: "connect-resistor",
      instruction: "Connect the resistor from the positive rail to a row on the breadboard.",
      ruleId: "connect-resistor",
      narrationCueId: "cue-connect-resistor"
    },
    {
      id: "connect-led",
      instruction: "Connect the LED anode (longer leg) to the resistor, cathode to the negative rail.",
      ruleId: "connect-led",
      narrationCueId: "cue-connect-led"
    },
    {
      id: "connect-switch",
      instruction: "Connect the switch in series between the LED cathode and negative rail.",
      ruleId: "connect-switch",
      narrationCueId: "cue-connect-switch"
    },
    {
      id: "close-switch",
      instruction: "Close the switch to complete the circuit and light the LED.",
      ruleId: "close-switch",
      narrationCueId: "cue-close-switch"
    },
    {
      id: "measure-voltage",
      instruction: "Use the multimeter to measure voltage across the LED.",
      ruleId: "measure-voltage",
      narrationCueId: "cue-measure-voltage"
    }
  ],
  rules: [
    {
      id: "place-battery",
      action: { type: "place", apparatus: "battery", slot: "power-rails" },
      feedback: "Battery placed on power rails. Positive on red rail, negative on blue rail."
    },
    {
      id: "connect-resistor",
      action: { type: "connect", from: "battery", to: "resistor" },
      feedback: "Resistor connected from positive rail to breadboard row."
    },
    {
      id: "connect-led",
      action: { type: "connect", from: "resistor", to: "led" },
      feedback: "LED connected: anode to resistor, cathode toward negative rail."
    },
    {
      id: "connect-switch",
      action: { type: "connect", from: "led", to: "switch" },
      feedback: "Switch connected in series with the LED cathode."
    },
    {
      id: "close-switch",
      action: { type: "toggle", apparatus: "switch" },
      outcomeId: "circuit-working",
      feedback: "Switch closed! Current flows and the LED lights up."
    },
    {
      id: "measure-voltage",
      action: { type: "measure", apparatus: "multimeter", with: "led" },
      feedback: "Multimeter reads the forward voltage drop across the LED (~2V)."
    }
  ],
  outcomes: [
    {
      id: "circuit-working",
      title: "Series circuit complete",
      description: "The series circuit is working: battery → resistor → LED → switch → battery. Current flows through all components in one path."
    }
  ],
  scoring: {
    maxScore: 6,
    hooks: [{ id: "step-complete", event: "correct_step", points: 1 }]
  },
  safeFailure: {
    message: "The circuit didn't work as expected.",
    guidance: "Check each connection. In a series circuit, all components must be connected in a single loop."
  },
  narration: [
    { id: "cue-place-battery", text: "Place the battery across the power rails. The positive terminal goes to the red rail, negative to the blue rail.", startMs: 0, endMs: 4000 },
    { id: "cue-connect-resistor", text: "Connect a wire from the positive rail to a breadboard row, then place the resistor in that row.", startMs: 0, endMs: 4000 },
    { id: "cue-connect-led", text: "Connect the LED's longer leg (anode) to the other end of the resistor. The shorter leg (cathode) goes toward the negative rail.", startMs: 0, endMs: 4500 },
    { id: "cue-connect-switch", text: "Insert the switch between the LED cathode and the negative rail. This will let you turn the circuit on and off.", startMs: 0, endMs: 4000 },
    { id: "cue-close-switch", text: "Close the switch. The circuit is now complete — current flows and the LED lights!", startMs: 0, endMs: 3500 },
    { id: "cue-measure-voltage", text: "Measure the voltage across the LED with the multimeter. You should see about 2 volts for a red LED.", startMs: 0, endMs: 4000 }
  ],
  captions: [
    { id: "cue-place-battery", text: "Battery on power rails: positive to red, negative to blue.", startMs: 0, endMs: 4000 },
    { id: "cue-connect-resistor", text: "Resistor from positive rail to breadboard row.", startMs: 0, endMs: 4000 },
    { id: "cue-connect-led", text: "LED anode to resistor, cathode toward negative rail.", startMs: 0, endMs: 4500 },
    { id: "cue-connect-switch", text: "Switch in series with LED cathode.", startMs: 0, endMs: 4000 },
    { id: "cue-close-switch", text: "Close switch — LED lights!", startMs: 0, endMs: 3500 },
    { id: "cue-measure-voltage", text: "Measure LED voltage drop (~2V for red LED).", startMs: 0, endMs: 4000 }
  ],
  assets: []
};

export const parallelCircuitDefinition: ExperimentDefinition = {
  schemaVersion: EXPERIMENT_SCHEMA_VERSION,
  runtimeVersion: EXPERIMENT_RUNTIME_VERSION,
  id: "parallel-circuit",
  title: "Build a Parallel Circuit",
  subject: "electronics",
  version: 1,
  apparatus: [
    { id: "battery", type: "battery", label: "Battery (AA)" },
    { id: "resistor1", type: "resistor", label: "Resistor 1 (220Ω)" },
    { id: "resistor2", type: "resistor", label: "Resistor 2 (220Ω)" },
    { id: "led1", type: "led", label: "LED 1 (Red)" },
    { id: "led2", type: "led", label: "LED 2 (Green)" },
    { id: "switch", type: "switch", label: "Switch" },
    { id: "breadboard", type: "breadboard", label: "Breadboard" },
    { id: "wire1", type: "wire", label: "Red Jumper Wire" },
    { id: "wire2", type: "wire", label: "Black Jumper Wire" },
    { id: "wire3", type: "wire", label: "Blue Jumper Wire" },
    { id: "wire4", type: "wire", label: "Yellow Jumper Wire" },
    { id: "multimeter", type: "multimeter", label: "Multimeter" }
  ],
  steps: [
    {
      id: "place-battery",
      instruction: "Place the battery on the breadboard power rails.",
      ruleId: "place-battery",
      narrationCueId: "cue-place-battery"
    },
    {
      id: "build-first-branch",
      instruction: "Build the first branch: connect resistor1 and LED1 in series from positive to negative rail.",
      ruleId: "build-first-branch",
      narrationCueId: "cue-first-branch"
    },
    {
      id: "build-second-branch",
      instruction: "Build the second branch: connect resistor2 and LED2 in series from positive to negative rail (separate rows).",
      ruleId: "build-second-branch",
      narrationCueId: "cue-second-branch"
    },
    {
      id: "connect-switch",
      instruction: "Connect the switch on the main negative rail to control both branches.",
      ruleId: "connect-switch",
      narrationCueId: "cue-connect-switch"
    },
    {
      id: "close-switch",
      instruction: "Close the switch to complete both parallel paths.",
      ruleId: "close-switch",
      narrationCueId: "cue-close-switch"
    },
    {
      id: "measure-current",
      instruction: "Use the multimeter to measure total current from the battery.",
      ruleId: "measure-current",
      narrationCueId: "cue-measure-current"
    }
  ],
  rules: [
    {
      id: "place-battery",
      action: { type: "place", apparatus: "battery", slot: "power-rails" },
      feedback: "Battery placed on power rails."
    },
    {
      id: "build-first-branch",
      action: { type: "connect", from: "resistor1", to: "led1" },
      feedback: "First branch complete: resistor1 → LED1 across the power rails."
    },
    {
      id: "build-second-branch",
      action: { type: "connect", from: "resistor2", to: "led2" },
      feedback: "Second branch complete: resistor2 → LED2 across the power rails."
    },
    {
      id: "connect-switch",
      action: { type: "connect", from: "switch", to: "battery" },
      feedback: "Switch connected on the negative rail to control both branches."
    },
    {
      id: "close-switch",
      action: { type: "toggle", apparatus: "switch" },
      outcomeId: "parallel-working",
      feedback: "Both LEDs light! Each branch gets full voltage independently."
    },
    {
      id: "measure-current",
      action: { type: "measure", apparatus: "multimeter", with: "battery" },
      feedback: "Total current equals the sum of both branch currents."
    }
  ],
  outcomes: [
    {
      id: "parallel-working",
      title: "Parallel circuit complete",
      description: "Two parallel branches each with a resistor and LED. Both LEDs receive full battery voltage and operate independently."
    }
  ],
  scoring: {
    maxScore: 6,
    hooks: [{ id: "step-complete", event: "correct_step", points: 1 }]
  },
  safeFailure: {
    message: "The parallel circuit isn't working correctly.",
    guidance: "In a parallel circuit, each branch connects directly across the power rails. Check that both branches have their own complete path."
  },
  narration: [
    { id: "cue-place-battery", text: "Place the battery on the power rails. Positive to red, negative to blue.", startMs: 0, endMs: 3500 },
    { id: "cue-first-branch", text: "Build the first branch: connect a resistor and LED in series from the positive rail to the negative rail.", startMs: 0, endMs: 4500 },
    { id: "cue-second-branch", text: "Build the second branch on a different row: another resistor and LED from positive to negative rail. Each branch is independent.", startMs: 0, endMs: 5000 },
    { id: "cue-connect-switch", text: "Add a switch on the negative rail to control power to both branches at once.", startMs: 0, endMs: 3500 },
    { id: "cue-close-switch", text: "Close the switch. Both LEDs light up! In parallel, each branch gets the full battery voltage.", startMs: 0, endMs: 4000 },
    { id: "cue-measure-current", text: "Measure the total current from the battery. It equals the sum of currents through each branch.", startMs: 0, endMs: 4000 }
  ],
  captions: [
    { id: "cue-place-battery", text: "Battery on power rails.", startMs: 0, endMs: 3500 },
    { id: "cue-first-branch", text: "First branch: resistor + LED from + to - rail.", startMs: 0, endMs: 4500 },
    { id: "cue-second-branch", text: "Second branch: separate resistor + LED from + to - rail.", startMs: 0, endMs: 5000 },
    { id: "cue-connect-switch", text: "Switch on negative rail controls both branches.", startMs: 0, endMs: 3500 },
    { id: "cue-close-switch", text: "Close switch — both LEDs light independently!", startMs: 0, endMs: 4000 },
    { id: "cue-measure-current", text: "Total current = sum of branch currents.", startMs: 0, endMs: 4000 }
  ],
  assets: []
};

export const faultDiagnosisDefinition: ExperimentDefinition = {
  schemaVersion: EXPERIMENT_SCHEMA_VERSION,
  runtimeVersion: EXPERIMENT_RUNTIME_VERSION,
  id: "fault-diagnosis",
  title: "Diagnose Simple Circuit Faults",
  subject: "electronics",
  version: 1,
  apparatus: [
    { id: "battery", type: "battery", label: "Battery (AA)" },
    { id: "resistor", type: "resistor", label: "Resistor (220Ω)" },
    { id: "led", type: "led", label: "LED" },
    { id: "breadboard", type: "breadboard", label: "Breadboard" },
    { id: "wire1", type: "wire", label: "Red Jumper Wire" },
    { id: "wire2", type: "wire", label: "Black Jumper Wire" },
    { id: "multimeter", type: "multimeter", label: "Multimeter" }
  ],
  steps: [
    {
      id: "build-working-circuit",
      instruction: "First, build a working series circuit: battery → resistor → LED.",
      ruleId: "build-working-circuit",
      narrationCueId: "cue-build-working"
    },
    {
      id: "introduce-open-circuit",
      instruction: "Remove the resistor to create an open circuit fault.",
      ruleId: "introduce-open-circuit",
      narrationCueId: "cue-open-circuit"
    },
    {
      id: "diagnose-open-circuit",
      instruction: "Use the multimeter to measure voltage across the gap. Full battery voltage appears across the open.",
      ruleId: "diagnose-open-circuit",
      narrationCueId: "cue-diagnose-open"
    },
    {
      id: "restore-resistor",
      instruction: "Replace the resistor to restore the circuit.",
      ruleId: "restore-resistor",
      narrationCueId: "cue-restore-resistor"
    },
    {
      id: "introduce-short-circuit",
      instruction: "Create a short circuit by connecting a wire directly across the LED (bypassing it).",
      ruleId: "introduce-short-circuit",
      narrationCueId: "cue-short-circuit"
    },
    {
      id: "diagnose-short-circuit",
      instruction: "Measure current — it will be very high. The LED is bypassed and won't light.",
      ruleId: "diagnose-short-circuit",
      narrationCueId: "cue-diagnose-short"
    },
    {
      id: "fix-short-circuit",
      instruction: "Remove the shorting wire. The LED lights again.",
      ruleId: "fix-short-circuit",
      narrationCueId: "cue-fix-short"
    },
    {
      id: "reverse-led",
      instruction: "Reverse the LED (swap anode and cathode). The LED won't light — it's reverse-biased.",
      ruleId: "reverse-led",
      narrationCueId: "cue-reverse-led"
    },
    {
      id: "diagnose-reverse-led",
      instruction: "Measure voltage across the LED — you'll see full battery voltage but no current.",
      ruleId: "diagnose-reverse-led",
      narrationCueId: "cue-diagnose-reverse"
    },
    {
      id: "correct-led",
      instruction: "Correct the LED orientation. The circuit works again.",
      ruleId: "correct-led",
      narrationCueId: "cue-correct-led"
    }
  ],
  rules: [
    {
      id: "build-working-circuit",
      action: { type: "connect", from: "battery", to: "resistor" },
      feedback: "Working circuit built: battery → resistor → LED. LED lights."
    },
    {
      id: "introduce-open-circuit",
      action: { type: "disconnect", from: "resistor" },
      feedback: "Resistor removed. Open circuit — LED is off."
    },
    {
      id: "diagnose-open-circuit",
      action: { type: "measure", apparatus: "multimeter", with: "resistor" },
      feedback: "Multimeter shows full battery voltage across the open gap. No current flows."
    },
    {
      id: "restore-resistor",
      action: { type: "connect", from: "battery", to: "resistor" },
      feedback: "Resistor restored. LED lights again."
    },
    {
      id: "introduce-short-circuit",
      action: { type: "connect", from: "wire1", to: "led" },
      feedback: "Wire placed across LED terminals — short circuit! LED is bypassed and off."
    },
    {
      id: "diagnose-short-circuit",
      action: { type: "measure", apparatus: "multimeter", with: "battery" },
      outcomeId: "short-diagnosed",
      feedback: "High current detected! LED has zero voltage across it — it's shorted out."
    },
    {
      id: "fix-short-circuit",
      action: { type: "disconnect", from: "wire1" },
      feedback: "Shorting wire removed. LED lights normally."
    },
    {
      id: "reverse-led",
      action: { type: "place", apparatus: "led", slot: "reversed" },
      feedback: "LED reversed (cathode to resistor, anode to negative). LED is off — reverse biased."
    },
    {
      id: "diagnose-reverse-led",
      action: { type: "measure", apparatus: "multimeter", with: "led" },
      outcomeId: "reverse-diagnosed",
      feedback: "Full battery voltage across LED but no current. LED is reverse-biased."
    },
    {
      id: "correct-led",
      action: { type: "place", apparatus: "led", slot: "correct" },
      outcomeId: "all-faults-diagnosed",
      feedback: "LED corrected. Circuit works! You've diagnosed open, short, and reverse-bias faults."
    }
  ],
  outcomes: [
    {
      id: "short-diagnosed",
      title: "Short circuit diagnosed",
      description: "A short circuit bypasses the LED, causing high current and zero voltage across the LED."
    },
    {
      id: "reverse-diagnosed",
      title: "Reverse-biased LED diagnosed",
      description: "An LED only conducts in one direction. Reversed, it blocks current despite full voltage across it."
    },
    {
      id: "all-faults-diagnosed",
      title: "All common faults diagnosed",
      description: "You identified and fixed three common circuit faults: open circuit (broken path), short circuit (unintended bypass), and reverse-biased LED (wrong polarity)."
    }
  ],
  scoring: {
    maxScore: 10,
    hooks: [{ id: "step-complete", event: "correct_step", points: 1 }]
  },
  safeFailure: {
    message: "The fault wasn't identified correctly.",
    guidance: "Use the multimeter systematically: check voltage across components, then current. Compare readings to a working circuit."
  },
  narration: [
    { id: "cue-build-working", text: "Build a working series circuit first: battery, resistor, LED in a loop. The LED lights.", startMs: 0, endMs: 4000 },
    { id: "cue-open-circuit", text: "Now remove the resistor. This creates an open circuit — a broken path. The LED goes out.", startMs: 0, endMs: 4000 },
    { id: "cue-diagnose-open", text: "Measure voltage across the gap. You'll see the full battery voltage because no current flows through the open.", startMs: 0, endMs: 4500 },
    { id: "cue-restore-resistor", text: "Replace the resistor. The circuit is complete again and the LED lights.", startMs: 0, endMs: 3500 },
    { id: "cue-short-circuit", text: "Now create a short: place a wire directly across the LED terminals. The LED is bypassed and goes out.", startMs: 0, endMs: 4500 },
    { id: "cue-diagnose-short", text: "Measure current from the battery. It's very high! The LED has zero volts across it — it's shorted.", startMs: 0, endMs: 4500 },
    { id: "cue-fix-short", text: "Remove the shorting wire. The LED lights again. Short circuits are dangerous — they can damage components.", startMs: 0, endMs: 4000 },
    { id: "cue-reverse-led", text: "Now reverse the LED — swap its legs. The LED won't light because it's reverse-biased.", startMs: 0, endMs: 4000 },
    { id: "cue-diagnose-reverse", text: "Measure voltage across the LED. Full battery voltage, but no current flows. The LED blocks current in reverse.", startMs: 0, endMs: 4500 },
    { id: "cue-correct-led", text: "Fix the LED orientation. The circuit works! You've learned to diagnose open circuits, short circuits, and reverse polarity.", startMs: 0, endMs: 4500 }
  ],
  captions: [
    { id: "cue-build-working", text: "Working circuit: battery → resistor → LED.", startMs: 0, endMs: 4000 },
    { id: "cue-open-circuit", text: "Open circuit: remove resistor — LED off.", startMs: 0, endMs: 4000 },
    { id: "cue-diagnose-open", text: "Measure across gap — full battery voltage, no current.", startMs: 0, endMs: 4500 },
    { id: "cue-restore-resistor", text: "Restore resistor — LED lights.", startMs: 0, endMs: 3500 },
    { id: "cue-short-circuit", text: "Short circuit: wire across LED — LED off.", startMs: 0, endMs: 4500 },
    { id: "cue-diagnose-short", text: "High current, zero volts across LED — shorted!", startMs: 0, endMs: 4500 },
    { id: "cue-fix-short", text: "Remove short — LED lights. Shorts are dangerous.", startMs: 0, endMs: 4000 },
    { id: "cue-reverse-led", text: "Reverse LED — LED off (reverse biased).", startMs: 0, endMs: 4000 },
    { id: "cue-diagnose-reverse", text: "Full voltage across LED, no current — reverse biased.", startMs: 0, endMs: 4500 },
    { id: "cue-correct-led", text: "Fix LED — works! Diagnosed: open, short, reverse bias.", startMs: 0, endMs: 4500 }
  ],
  assets: []
};

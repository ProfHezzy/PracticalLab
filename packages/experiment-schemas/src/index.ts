export const EXPERIMENT_SCHEMA_VERSION = "1.1" as const;
export const EXPERIMENT_RUNTIME_VERSION = "1.0.0" as const;

export const APPARATUS_TYPES = [
  "beaker",
  "funnel",
  "filter-paper",
  "receiving-flask",
  "mixture",
  "heat-source",
] as const;

export type ApparatusType = (typeof APPARATUS_TYPES)[number];

export type ExperimentAction =
  | { type: "place"; apparatus: ApparatusType; slot: string }
  | { type: "pour"; from: string; to: string }
  | { type: "fit"; apparatus: "filter-paper"; target: "funnel" };

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
  return (
    value.type === "fit" &&
    value.apparatus === "filter-paper" &&
    value.target === "funnel"
  );
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

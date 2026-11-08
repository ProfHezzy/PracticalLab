import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temp = await mkdtemp(path.join(os.tmpdir(), "practicallab-engine-"));
const transpile = async (sourcePath, outputName) => {
  const source = await readFile(path.join(root, sourcePath), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const outputPath = path.join(temp, outputName);
  await writeFile(outputPath, output);
  return import(pathToFileURL(outputPath));
};

const [schema, engine] = await Promise.all([
  transpile("packages/experiment-schemas/src/index.ts", "schema.mjs"),
  transpile("packages/simulation-engine/src/index.ts", "engine.mjs"),
]);
const fixture = JSON.parse(
  await readFile(
    path.join(
      root,
      "packages/experiment-schemas/definitions/filtration.v1.json",
    ),
    "utf8",
  ),
);
const actions = fixture.rules.map(({ action }) => action);

test.after(async () => rm(temp, { recursive: true, force: true }));

test("filtration fixture is canonical and validates", () => {
  assert.deepEqual(fixture, schema.filtrationDefinition);
  assert.deepEqual(schema.definitionErrors(fixture), []);
  assert.equal(schema.EXPERIMENT_SCHEMA_VERSION, fixture.schemaVersion);
});

test("schema rejects broken references and mismatched narration captions", () => {
  const invalid = structuredClone(fixture);
  invalid.steps[0].ruleId = "missing-rule";
  invalid.captions[0].id = "missing-caption";
  assert.ok(schema.definitionErrors(invalid).length >= 2);
});

test("actions are deterministic, order independent, and safe failures do not score", () => {
  let state = engine.loadDefinition(engine.createInitialState(), fixture);
  state = engine.applyAction(state, {
    type: "fit",
    target: "funnel",
    apparatus: "filter-paper",
  });
  assert.equal(state.score, 1);
  assert.equal(state.stepIndex, 1);
  state = engine.applyAction(state, {
    type: "pour",
    from: "mixture",
    to: "funnel",
  });
  assert.equal(state.score, 1);
  assert.equal(state.safeFailures, 1);
  assert.equal(state.events.at(-1).accepted, false);
  assert.match(state.message, /No harm done/);
});

test("filtration completes with a reproducible score, outcome, and event history", () => {
  const first = engine.replayActions(fixture, actions);
  const second = engine.replayActions(fixture, actions);
  assert.equal(first.status, "completed");
  assert.equal(first.score, 3);
  assert.equal(first.outcomeId, "mixture-separated");
  assert.deepEqual(first.events, second.events);
  assert.deepEqual(first.apparatusState, second.apparatusState);
});

test("undo, reset, preferences, scene cleanup, and responsive breakpoint", () => {
  let state = engine.loadDefinition(engine.createInitialState(), fixture);
  state = engine.applyAction(state, actions[0]);
  state = engine.applyAction(state, { type: "undo" });
  assert.equal(state.stepIndex, 0);
  assert.equal(state.score, 0);
  state = engine.applyAction(state, { type: "reset" });
  assert.equal(state.stepIndex, 0);
  assert.equal(engine.toggleMute(state).muted, false);
  assert.equal(engine.setReducedMotion(state, true).reducedMotion, true);
  assert.equal(engine.responsiveViewport(767), "mobile");
  assert.equal(engine.responsiveViewport(768), "desktop");
  const scene = engine.createScene("filtration");
  let disposed = 0;
  scene.mount(() => disposed++);
  scene.unmount();
  scene.unmount();
  assert.equal(disposed, 1);
});

test("free exploration accepts correct steps in any order and scores only on check", () => {
  let state = engine.setExperimentMode(
    engine.loadDefinition(engine.createInitialState(), fixture),
    "free",
  );
  state = engine.applyAction(state, actions[2]);
  assert.equal(state.events.at(-1).accepted, true);
  assert.equal(state.score, 0);
  state = engine.applyAction(state, actions[2]);
  assert.equal(state.events.at(-1).accepted, false);
  state = engine.applyAction(state, actions[0]);
  state = engine.applyAction(state, actions[1]);
  assert.equal(state.status, "running");
  state = engine.applyAction(state, { type: "check" });
  assert.equal(state.status, "completed");
  assert.equal(state.score, fixture.scoring.maxScore);
  const replay = engine.replayCommands(
    fixture,
    state.events.map(({ command }) => command),
    "free",
  );
  assert.deepEqual(replay.events, state.events);
  assert.equal(replay.outcomeId, state.outcomeId);
});

const chemDefinitions = [
  "evaporation",
  "simple-distillation",
  "fractional-distillation",
  "decantation",
  "chromatography",
];

for (const id of chemDefinitions) {
  const defPath = path.join(
    root,
    `packages/experiment-schemas/definitions/${id}.v1.json`,
  );
  const definition = JSON.parse(await readFile(defPath, "utf8"));
  const errors = schema.definitionErrors(definition);

  test(`${id} definition validates`, () => {
    assert.deepEqual(errors, [], `Expected no errors for ${id}`);
    assert.equal(definition.subject, "chemistry");
    assert.equal(definition.version, 1);
  });

  test(`${id} completes successfully`, () => {
    const actions = definition.rules.map((r) => r.action);
    const result = engine.replayActions(definition, actions);
    assert.equal(result.status, "completed");
    assert.equal(result.score, definition.scoring.maxScore);
  });
}

const electronicsDefinitions = [
  "component-identification",
  "series-circuit",
  "parallel-circuit",
  "fault-diagnosis",
];

for (const id of electronicsDefinitions) {
  const defPath = path.join(
    root,
    `packages/experiment-schemas/definitions/${id}.v1.json`,
  );
  const definition = JSON.parse(await readFile(defPath, "utf8"));
  const errors = schema.definitionErrors(definition);

  test(`${id} definition validates`, () => {
    assert.deepEqual(errors, [], `Expected no errors for ${id}`);
    assert.equal(definition.subject, "electronics");
    assert.equal(definition.version, 1);
  });

  test(`${id} completes successfully`, () => {
    const actions = definition.rules.map((r) => r.action);
    const result = engine.replayActions(definition, actions);
    assert.equal(result.status, "completed");
    assert.equal(result.score, definition.scoring.maxScore);
  });
}

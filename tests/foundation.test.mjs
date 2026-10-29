import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("design tokens preserve the approved core colors and touch target baseline", async () => {
  const css = await read("../packages/ui/src/tokens.css");
  assert.match(css, /--pl-violet-500:\s*#6c4df6/i);
  assert.match(css, /--pl-primary:\s*var\(--pl-violet-500\)/i);
  assert.match(css, /--pl-orange-500:\s*#ff8a3d/i);
  assert.match(css, /--pl-secondary:\s*var\(--pl-orange-500\)/i);
  assert.match(css, /--pl-teal-500:\s*#19d3c5/i);
  assert.match(css, /--pl-accent:\s*var\(--pl-teal-500\)/i);
  assert.match(css, /--pl-touch-target:\s*48px/i);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test("PWA worker never caches API or staff responses", async () => {
  const worker = await read("../apps/web/public/service-worker.js");
  assert.match(worker, /\/api\//);
  assert.match(worker, /\/staff\//);
  assert.match(worker, /request\.method !== "GET"/);
  assert.match(worker, /practicallab-public-shell-v\d+/);
  assert.match(worker, /url\.pathname\.startsWith\("\/admin\/"\)/);
});

test("PWA manifest has installable app metadata and local icons", async () => {
  const manifest = JSON.parse(
    await read("../apps/web/public/manifest.webmanifest"),
  );
  assert.equal(manifest.name, "PracticalLab Africa");
  assert.equal(manifest.display, "standalone");
  assert.ok(manifest.icons.some(({ src }) => src.startsWith("/icons/")));
});

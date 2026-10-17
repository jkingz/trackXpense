import { expect, it } from "vite-plus/test";

import { classifyPath, guardCommit, guardEdit } from "@/lib/pipeline-guard";
import {
  initialPipelineState,
  pipelineReducer,
  type PipelineEvent,
  type PipelineState,
} from "@/lib/pipeline-state";

const spec = { type: "PLAN_WRITTEN", spec: "specs/02-recurring-edits.md" } as const;
const design = { type: "DESIGN_WRITTEN" } as const;
const tickets = { type: "TICKETS_WRITTEN" } as const;
const build = { type: "BUILD_STARTED" } as const;

function run(events: PipelineEvent[], from?: PipelineState) {
  return events.reduce(pipelineReducer, from ?? initialPipelineState());
}

const planned = run([spec]);
const designed = run([spec, design]);
const decomposed = run([spec, design, tickets]);
const building = run([spec, design, tickets, build]);

it("classifies pipeline and doc paths as process", () => {
  for (const path of [
    "specs/02-recurring-edits.md",
    "docs/agent-guide/workflow.md",
    "AGENTS.md",
    "CLAUDE.md",
    "opencode.json",
    ".claude/skills/testing.md",
    ".claude/commands/plan.md",
    ".opencode/plugins/pipeline.js",
  ]) {
    expect(classifyPath(path)).toBe("process");
  }
});

it("classifies product code, config and tests as source", () => {
  for (const path of [
    "app/(main)/dashboard/page.tsx",
    "components/transaction-table.tsx",
    "lib/prisma.ts",
    "actions/transaction.ts",
    "tests/pipeline/unit/pipeline-guard.test.ts",
    "package.json",
    "prisma/schema.prisma",
  ]) {
    expect(classifyPath(path)).toBe("source");
  }
});

it("classifies build output and secrets as generated", () => {
  for (const path of [
    "node_modules/next/index.js",
    ".next/build/chunks/main.js",
    "tsconfig.tsbuildinfo",
    ".env.local",
  ]) {
    expect(classifyPath(path)).toBe("generated");
  }
});

it("normalises leading ./ and backslashes before classifying", () => {
  expect(classifyPath("./lib/prisma.ts")).toBe("source");
  expect(classifyPath(".\\specs\\02-x.md")).toBe("process");
  expect(classifyPath("./node_modules/a/b.js")).toBe("generated");
});

it("allows process paths at any stage, even before a spec exists", () => {
  for (const stage of [planned, designed, decomposed]) {
    expect(guardEdit(stage, "specs/02-recurring-edits.md").allowed).toBe(true);
    expect(guardEdit(stage, "docs/agent-guide/workflow.md").allowed).toBe(true);
    expect(guardEdit(stage, "AGENTS.md").allowed).toBe(true);
  }
});

it("refuses source edits before the build stage", () => {
  for (const stage of [planned, designed, decomposed]) {
    const decision = guardEdit(stage, "lib/prisma.ts");
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.remedy).toContain("/design");
  }
});

it("tells a pre-plan edit to plan first", () => {
  const decision = guardEdit(initialPipelineState(), "lib/prisma.ts");
  expect(decision.allowed).toBe(false);
  if (!decision.allowed) expect(decision.remedy).toContain("/plan");
});

it("allows source edits once building", () => {
  expect(guardEdit(building, "app/(main)/dashboard/page.tsx").allowed).toBe(true);
  expect(guardEdit(building, "tests/pipeline/unit/pipeline-guard.test.ts").allowed).toBe(true);
});

it("refuses generated paths even when building", () => {
  const decision = guardEdit(building, ".next/build/chunks/main.js");
  expect(decision.allowed).toBe(false);
  if (!decision.allowed) expect(decision.remedy).toBe("edit its source");
});

it("refuses a commit on an unreviewed tree and names the remedy", () => {
  const decision = guardCommit(building, "abc123");
  expect(decision.allowed).toBe(false);
  if (!decision.allowed) {
    expect(decision.reason).toBe("stage is building, needs reviewed");
    expect(decision.remedy).toContain("/verify");
  }
});

it("allows a commit once reviewed at the same HEAD", () => {
  const reviewed = run(
    [{ type: "VERIFY_PASSED" }, { type: "REVIEW_CLEAN", sha: "abc123" }],
    building,
  );
  expect(reviewed.stage).toBe("reviewed");
  expect(guardCommit(reviewed, "abc123").allowed).toBe(true);
  expect(guardCommit(reviewed, "later-sha").allowed).toBe(false);
});

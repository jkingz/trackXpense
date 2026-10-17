import { expect, it } from "vite-plus/test";

import {
  canCommit,
  canEditSource,
  commitBlocker,
  initialPipelineState,
  pipelineReducer,
  stageBlocker,
  type PipelineEvent,
  type PipelineState,
} from "@/lib/pipeline-state";

function run(events: PipelineEvent[], from?: PipelineState) {
  return events.reduce(pipelineReducer, from ?? initialPipelineState());
}

const spec = { type: "PLAN_WRITTEN", spec: "specs/02-recurring-edits.md" } as const;
const design = { type: "DESIGN_WRITTEN" } as const;
const tickets = { type: "TICKETS_WRITTEN" } as const;
const build = { type: "BUILD_STARTED" } as const;

it("starts planned with no spec, stale gates and increment 1", () => {
  const state = initialPipelineState();
  expect(state.stage).toBe("planned");
  expect(state.spec).toBeNull();
  expect(state.increment).toBe(1);
  expect(state.gates).toBe("stale");
  expect(state.reviewedSha).toBeNull();
});

it("walks planned -> designed -> decomposed -> building in order", () => {
  expect(run([spec]).stage).toBe("planned");
  expect(run([spec, design]).stage).toBe("designed");
  expect(run([spec, design, tickets]).stage).toBe("decomposed");
  expect(run([spec, design, tickets, build]).stage).toBe("building");
});

it("never skips a step: DESIGN_WRITTEN alone cannot reach decomposed", () => {
  const state = run([spec, design, build]);
  expect(state.stage).toBe("designed");
});

it("never skips a step: TICKETS_WRITTEN before DESIGN_WRITTEN is ignored", () => {
  expect(run([spec, tickets]).stage).toBe("planned");
});

it("never moves backwards: TICKETS_WRITTEN after building keeps building", () => {
  const built = run([spec, design, tickets, build]);
  expect(run([tickets], built).stage).toBe("building");
});

it("VERIFY_PASSED only lands from building, and marks gates green", () => {
  const state = run([spec, design, tickets, build, { type: "VERIFY_PASSED" }]);
  expect(state.stage).toBe("verified");
  expect(state.gates).toBe("green");
});

it("VERIFY_PASSED does not bless a review that has not happened yet", () => {
  const state = run([spec, design, tickets, build, { type: "VERIFY_PASSED" }]);
  expect(state.reviewOutdated).toBe(true);
  expect(canCommit(state, "abc123")).toBe(false);
});

it("a fix cycle can re-verify from reviewed instead of wedging", () => {
  const reviewed = run([
    spec,
    design,
    tickets,
    build,
    { type: "VERIFY_PASSED" },
    { type: "REVIEW_CLEAN", sha: "abc123" },
    { type: "SOURCE_EDITED" },
    { type: "VERIFY_PASSED" },
  ]);
  expect(reviewed.stage).toBe("verified");
  expect(reviewed.gates).toBe("green");
  expect(reviewed.reviewedSha).toBeNull();
  // Re-reviewing the fixed tree is what promotes it again.
  const clean = run([{ type: "REVIEW_CLEAN", sha: "abc123" }], reviewed);
  expect(clean.stage).toBe("reviewed");
  expect(canCommit(clean, "abc123")).toBe(true);
});

it("VERIFY_PASSED before building is still ignored", () => {
  expect(run([spec, design, tickets, { type: "VERIFY_PASSED" }]).stage).toBe("decomposed");
});

it("VERIFY_PASSED before building leaves the gates stale", () => {
  const state = run([spec, design, tickets, { type: "VERIFY_PASSED" }]);
  expect(state.gates).toBe("stale");
});

it("VERIFY_FAILED records red without promoting the stage", () => {
  const state = run([spec, design, tickets, build, { type: "VERIFY_FAILED" }]);
  expect(state.stage).toBe("building");
  expect(state.gates).toBe("red");
});

it("REVIEW_CLEAN needs verified + green gates", () => {
  const notGreen = run([spec, design, tickets, build, { type: "REVIEW_CLEAN", sha: "abc123" }]);
  expect(notGreen.stage).toBe("building");
  const green = run([
    spec,
    design,
    tickets,
    build,
    { type: "VERIFY_PASSED" },
    { type: "REVIEW_CLEAN", sha: "abc123" },
  ]);
  expect(green.stage).toBe("reviewed");
  expect(green.openHigh).toBe(0);
  expect(green.reviewedSha).toBe("abc123");
});

it("REVIEW_FOUND drops back to verified and keeps the count", () => {
  const state = run([
    spec,
    design,
    tickets,
    build,
    { type: "VERIFY_PASSED" },
    { type: "REVIEW_FOUND", high: 2 },
  ]);
  expect(state.stage).toBe("verified");
  expect(state.openHigh).toBe(2);
});

it("NEXT_INCREMENT bumps the increment and invalidates gates and review", () => {
  const reviewed = run([
    spec,
    design,
    tickets,
    build,
    { type: "VERIFY_PASSED" },
    { type: "REVIEW_CLEAN", sha: "abc123" },
  ]);
  const next = run([{ type: "NEXT_INCREMENT" }], reviewed);
  expect(next.stage).toBe("building");
  expect(next.increment).toBe(2);
  expect(next.gates).toBe("stale");
  expect(next.reviewedSha).toBeNull();
});

it("SOURCE_EDITED invalidates green gates and the review that followed", () => {
  const reviewed = run([
    spec,
    design,
    tickets,
    build,
    { type: "VERIFY_PASSED" },
    { type: "REVIEW_CLEAN", sha: "abc123" },
  ]);
  const edited = run([{ type: "SOURCE_EDITED" }], reviewed);
  expect(edited.stage).toBe("reviewed");
  expect(edited.gates).toBe("stale");
  expect(edited.reviewedSha).toBeNull();
  expect(canCommit(edited, "abc123")).toBe(false);
});

it("SOURCE_EDITED is a no-op before gates go green", () => {
  const built = run([spec, design, tickets, build]);
  expect(run([{ type: "SOURCE_EDITED" }], built)).toEqual(built);
});

it("NEXT_INCREMENT before review is ignored", () => {
  const built = run([spec, design, tickets, build]);
  expect(run([{ type: "NEXT_INCREMENT" }], built).increment).toBe(1);
});

it("NEXT_INCREMENT is refused when the gates went stale after review", () => {
  const reviewed = run([
    spec,
    design,
    tickets,
    build,
    { type: "VERIFY_PASSED" },
    { type: "REVIEW_CLEAN", sha: "abc123" },
    { type: "SOURCE_EDITED" },
  ]);
  expect(reviewed.stage).toBe("reviewed");
  expect(run([{ type: "NEXT_INCREMENT" }], reviewed).increment).toBe(1);
});

it("a new spec restarts the machine and drops stale gates", () => {
  const reviewed = run([
    spec,
    design,
    tickets,
    build,
    { type: "VERIFY_PASSED" },
    { type: "REVIEW_CLEAN", sha: "abc123" },
  ]);
  const restarted = run([{ type: "PLAN_WRITTEN", spec: "specs/03-other.md" }], reviewed);
  expect(restarted.stage).toBe("planned");
  expect(restarted.spec).toBe("specs/03-other.md");
  expect(restarted.increment).toBe(1);
  expect(restarted.gates).toBe("stale");
});

it("re-emitting the same spec is a no-op", () => {
  const planned = run([spec]);
  expect(run([spec], planned)).toEqual(planned);
});

it("edits source only from building onwards", () => {
  expect(canEditSource(run([spec]))).toBe(false);
  expect(canEditSource(run([spec, design]))).toBe(false);
  expect(canEditSource(run([spec, design, tickets]))).toBe(false);
  expect(canEditSource(run([spec, design, tickets, build]))).toBe(true);
});

it("no spec means no source edits even at building", () => {
  const staged = { ...initialPipelineState(), stage: "building" } as PipelineState;
  expect(canEditSource(staged)).toBe(false);
});

it("commits only when reviewed, green, zero High, and unchanged HEAD", () => {
  const state: PipelineState = {
    stage: "reviewed",
    spec: "specs/02-recurring-edits.md",
    increment: 1,
    gates: "green",
    openHigh: 0,
    reviewOutdated: false,
    reviewedSha: "abc123",
  };
  expect(canCommit(state, "abc123")).toBe(true);
  expect(canCommit(state, "def456")).toBe(false);
  expect(canCommit({ ...state, openHigh: 1 }, "abc123")).toBe(false);
  expect(canCommit({ ...state, gates: "red" }, "abc123")).toBe(false);
  expect(canCommit({ ...state, stage: "building" }, "abc123")).toBe(false);
  expect(canCommit({ ...state, reviewOutdated: true }, "abc123")).toBe(false);
});

it("an outdated review is reported as outdated, not as a finding", () => {
  const verified = run([spec, design, tickets, build, { type: "VERIFY_PASSED" }]);
  const outdated = run([{ type: "REVIEW_OUTDATED" }], verified);
  expect(outdated.stage).toBe("verified");
  expect(outdated.openHigh).toBe(0);
  expect(outdated.reviewOutdated).toBe(true);
  expect(commitBlocker(outdated, "abc123")).toBe(
    "review missing or older than the code: run /review",
  );
});

it("REVIEW_CLEAN clears the outdated flag", () => {
  const verified = run([
    spec,
    design,
    tickets,
    build,
    { type: "VERIFY_PASSED" },
    { type: "REVIEW_OUTDATED" },
  ]);
  const clean = run([{ type: "REVIEW_CLEAN", sha: "abc123" }], verified);
  expect(clean.reviewOutdated).toBe(false);
  expect(clean.stage).toBe("reviewed");
});

it("names the blocker for every refused commit", () => {
  const state: PipelineState = {
    stage: "reviewed",
    spec: "specs/02-recurring-edits.md",
    increment: 1,
    gates: "green",
    openHigh: 0,
    reviewOutdated: false,
    reviewedSha: "abc123",
  };
  expect(commitBlocker(state, "abc123")).toBeNull();
  expect(commitBlocker({ ...state, openHigh: 3 }, "abc123")).toBe(
    "3 open High finding(s): run /review",
  );
  // An open High outranks the stage and gate reasons: it is the actionable one.
  expect(commitBlocker({ ...state, openHigh: 3, stage: "building" }, "abc123")).toBe(
    "3 open High finding(s): run /review",
  );
  expect(commitBlocker({ ...state, gates: "stale" }, "abc123")).toBe(
    "gates stale: run pnpm verify",
  );
  expect(commitBlocker({ ...state, gates: "red" }, "abc123")).toBe("gates red: run pnpm verify");
  expect(commitBlocker({ ...state, stage: "building" }, "abc123")).toBe(
    "stage is building, needs reviewed",
  );
  expect(commitBlocker({ ...state }, "zzz")).toBe("HEAD moved since review: re-run /review");
  expect(commitBlocker({ ...state, spec: null }, "abc123")).toBe("no spec: run /plan first");
});

it("stageBlocker allows the command that produces the next stage", () => {
  const planned = run([spec]);
  expect(stageBlocker(planned, "planned")).toBeNull();
  expect(stageBlocker(planned, "designed")).toBeNull();
  expect(stageBlocker(planned, "planned")).toBeNull();
});

it("stageBlocker refuses a command that skips a stage and names both ends", () => {
  const planned = run([spec]);
  expect(stageBlocker(planned, "decomposed")).toBe("stage is planned, needs decomposed");
  expect(stageBlocker(planned, "building")).toBe("stage is planned, needs building");
  expect(stageBlocker(planned, "reviewed")).toBe("stage is planned, needs reviewed");
});

it("stageBlocker allows a stage already at or past the one produced", () => {
  const designed = run([spec, design]);
  expect(designed.stage).toBe("designed");
  expect(stageBlocker(designed, "planned")).toBeNull();
  expect(stageBlocker(designed, "designed")).toBeNull();
  expect(stageBlocker(designed, "building")).toBe("stage is designed, needs building");
});

it("stageBlocker blocks /build from planned even though the reducer ignores it", () => {
  expect(run([spec, build]).stage).toBe("planned");
  expect(stageBlocker(run([spec, build]), "building")).toBe("stage is planned, needs building");
});

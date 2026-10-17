/**
 * Build-pipeline stage machine. Pure: no filesystem, no git, no clock.
 *
 * One stage per prompt step, advanced only by the events the harness observes
 * (`command.executed`, `tool.execute.after`, `file.edited`). `gates` and
 * `openHigh` live here so no derived flag can disagree with the stage.
 */

export const STAGES = [
  "planned",
  "designed",
  "decomposed",
  "building",
  "verified",
  "reviewed",
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_INDEX: Record<Stage, number> = {
  planned: 0,
  designed: 1,
  decomposed: 2,
  building: 3,
  verified: 4,
  reviewed: 5,
};

/** Stages at which source files may be edited. */
const EDITABLE_STAGES: readonly Stage[] = ["building", "verified", "reviewed"];

export type Gates = "stale" | "green" | "red";

export type PipelineState = {
  stage: Stage;
  /** `specs/NN-slug.md` currently in flight, else null before `/plan`. */
  spec: string | null;
  /** 1-based index of the increment being built. */
  increment: number;
  /** Result of the last `pnpm verify`. `stale` after any source edit. */
  gates: Gates;
  /** Unresolved High findings in the review report. Commit needs 0. */
  openHigh: number;
  /** No current, passing review on record. Only REVIEW_CLEAN clears it. */
  reviewOutdated: boolean;
  /** Git SHA the review covered; a newer HEAD reopens the review. */
  reviewedSha: string | null;
};

export type PipelineEvent =
  | { type: "PLAN_WRITTEN"; spec: string }
  | { type: "DESIGN_WRITTEN" }
  | { type: "TICKETS_WRITTEN" }
  | { type: "BUILD_STARTED"; increment?: number }
  | { type: "VERIFY_PASSED" }
  | { type: "VERIFY_FAILED" }
  | { type: "SOURCE_EDITED" }
  | { type: "REVIEW_CLEAN"; sha: string }
  | { type: "REVIEW_FOUND"; high: number }
  | { type: "REVIEW_OUTDATED" }
  | { type: "NEXT_INCREMENT" }
  | { type: "RESET" };

export function initialPipelineState(): PipelineState {
  return {
    stage: "planned",
    spec: null,
    increment: 1,
    gates: "stale",
    openHigh: 0,
    reviewOutdated: false,
    reviewedSha: null,
  };
}

/**
 * Advance only from the immediately preceding stage, and only forwards. Any
 * event arriving out of order is a no-op, so a skipped or replayed command can
 * never fast-forward the machine.
 */
function advance(state: PipelineState, from: Stage, to: Stage): PipelineState {
  if (state.stage !== from) return state;
  return { ...state, stage: to };
}

export function pipelineReducer(state: PipelineState, event: PipelineEvent): PipelineState {
  switch (event.type) {
    case "PLAN_WRITTEN":
      // A new spec restarts the machine; stale gates/reviews cannot carry over.
      return event.spec === state.spec && state.spec !== null
        ? state
        : {
            ...initialPipelineState(),
            spec: event.spec,
            stage: "planned",
          };

    case "DESIGN_WRITTEN":
      return advance(state, "planned", "designed");

    case "TICKETS_WRITTEN":
      return advance(state, "designed", "decomposed");

    case "BUILD_STARTED": {
      if (state.stage !== "decomposed") return state;
      return { ...state, stage: "building", increment: event.increment ?? state.increment };
    }

    case "VERIFY_PASSED": {
      // A green chain means the tree passes, not that a review exists: a fix
      // cycle at `verified`/`reviewed` must be able to come back here.
      if (STAGE_INDEX[state.stage] < STAGE_INDEX.building) return state;
      return {
        ...state,
        stage: "verified",
        gates: "green",
        openHigh: 0,
        reviewOutdated: true,
        reviewedSha: null,
      };
    }

    case "VERIFY_FAILED":
      return { ...state, gates: "red", openHigh: state.openHigh };

    case "SOURCE_EDITED":
      // Any product edit invalidates the gates and the review that followed them.
      if (state.gates !== "green") return state;
      return {
        ...state,
        gates: "stale",
        openHigh: state.openHigh,
        reviewOutdated: true,
        reviewedSha: null,
      };

    case "REVIEW_CLEAN":
      if (state.stage !== "verified" || state.gates !== "green") return state;
      return {
        ...state,
        stage: "reviewed",
        openHigh: 0,
        reviewOutdated: false,
        reviewedSha: event.sha,
      };

    case "REVIEW_FOUND":
      return { ...state, stage: "verified", openHigh: event.high, reviewOutdated: false };

    case "REVIEW_OUTDATED":
      return { ...state, stage: "verified", openHigh: 0, reviewOutdated: true };

    case "NEXT_INCREMENT":
      // Never abandon an increment whose gates are not green.
      if (state.stage !== "reviewed" || state.gates !== "green") return state;
      return {
        ...state,
        stage: "building",
        increment: state.increment + 1,
        gates: "stale",
        reviewedSha: null,
      };

    case "RESET":
      return initialPipelineState();
  }
}

/** Can source files be written at this stage? */
export function canEditSource(state: PipelineState): boolean {
  return state.spec !== null && EDITABLE_STAGES.includes(state.stage);
}

/**
 * Can the tree be committed? Needs a spec, a clean review, and gates that are
 * green for the current HEAD. Callers exempt docs-only trees themselves.
 */
export function canCommit(state: PipelineState, headSha: string): boolean {
  return (
    state.stage === "reviewed" &&
    state.gates === "green" &&
    state.openHigh === 0 &&
    !state.reviewOutdated &&
    state.reviewedSha === headSha
  );
}

/** Human-readable reason a commit is refused; null when allowed. */ export function commitBlocker(
  state: PipelineState,
  headSha: string,
): string | null {
  if (state.spec === null) return "no spec: run /plan first";
  // Findings before stage: an open High is the actionable reason, not the stage.
  if (state.openHigh > 0) return `${state.openHigh} open High finding(s): run /review`;
  if (state.reviewOutdated) return "review missing or older than the code: run /review";
  if (state.stage !== "reviewed") return `stage is ${state.stage}, needs reviewed`;
  if (state.gates !== "green") return `gates ${state.gates}: run pnpm verify`;
  if (state.reviewedSha !== headSha) return "HEAD moved since review: re-run /review";
  return null;
}

/**
 * Why the command that produces `expected` cannot run yet, or null when it can.
 * Allowed once the machine is at the predecessor stage or beyond, so re-running
 * a command is harmless and an out-of-order command says what is missing.
 */
export function stageBlocker(state: PipelineState, expected: Stage): string | null {
  if (STAGE_INDEX[state.stage] >= STAGE_INDEX[expected] - 1) return null;
  return `stage is ${state.stage}, needs ${expected}`;
}

/**
 * Pipeline I/O runtime: state on disk, git facts, and the filesystem-aware stage
 * checks. Shared by every harness adapter (`.opencode/plugins/pipeline.js`,
 * `scripts/pipeline-gate.ts` for Claude Code) so the gate has one implementation.
 *
 * Decisions still come from the pure modules; this only supplies facts and
 * persists results.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import {
  MIN_INCREMENTS,
  evaluateReview,
  evaluateSpecFacts,
  isReviewCurrent,
} from "./pipeline-artifacts.ts";
import { classifyPath, guardCommit, guardEdit } from "./pipeline-guard.ts";
import {
  initialPipelineState,
  pipelineReducer,
  stageBlocker,
  type PipelineState,
} from "./pipeline-state.ts";

/** Stage -> the command that moves it forward, for error messages. */
export const COMMAND_FOR_STAGE: Record<string, string> = {
  planned: "plan",
  designed: "design",
  decomposed: "tickets",
  building: "build",
  verified: "verify",
  reviewed: "review-changes",
};

export type Runtime = ReturnType<typeof createRuntime>;

export function createRuntime(directory: string) {
  const stateFile = path.join(directory, ".opencode/pipeline-state.json");
  const absolute = (rel: string) => path.join(directory, rel);

  const readText = (rel: string): string | null => {
    try {
      return fs.readFileSync(absolute(rel), "utf8");
    } catch {
      return null;
    }
  };

  const readState = (): PipelineState => {
    const raw = readText(".opencode/pipeline-state.json");
    if (raw === null) return initialPipelineState();
    try {
      return { ...initialPipelineState(), ...JSON.parse(raw) };
    } catch {
      return initialPipelineState();
    }
  };

  const writeState = (state: PipelineState): void => {
    fs.mkdirSync(path.dirname(stateFile), { recursive: true });
    fs.writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`);
  };

  const dispatch = (event: Parameters<typeof pipelineReducer>[1]): PipelineState => {
    const before = readState();
    const after = pipelineReducer(before, event);
    if (after !== before) writeState(after);
    return after;
  };

  const git = (args: string[]): string => {
    const result = spawnSync("git", args, { cwd: directory, encoding: "utf8" });
    return result.status === 0 ? String(result.stdout) : "";
  };

  const headSha = (): string => git(["rev-parse", "HEAD"]).trim();

  const changedPaths = (): string[] =>
    git(["status", "--porcelain"])
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => line.slice(3).trim())
      .flatMap((entry) => (entry.includes(" -> ") ? entry.split(" -> ") : [entry]))
      .map((entry) => entry.replace(/^"(.*)"$/, "$1"));

  /** A tree whose every change is a pipeline/process artifact. */
  const isDocsOnly = (): boolean => {
    const paths = changedPaths();
    return paths.length > 0 && paths.every((entry) => classifyPath(entry) === "process");
  };

  const sibling = (spec: string, suffix: string): string => spec.replace(/\.md$/, `${suffix}.md`);

  const specFacts = (spec: string) =>
    evaluateSpecFacts(readText(spec) ?? "", readText(sibling(spec, ".design")));

  const requireSpec = (): string => {
    const state = readState();
    if (state.spec === null) throw new Error("PIPELINE: no spec in flight. Run /plan first.");
    return state.spec;
  };

  const requireStage = (expected: Parameters<typeof stageBlocker>[1]): void => {
    const blocker = stageBlocker(readState(), expected);
    if (blocker !== null) {
      throw new Error(
        `PIPELINE: /${COMMAND_FOR_STAGE[expected]} refused — ${blocker}. ` +
          "Run the earlier stage first, or /pipeline-reset to start over.",
      );
    }
  };

  const refuse = (
    tool: string,
    target: string,
    decision: { reason: string; remedy: string },
  ): never => {
    const state = readState();
    throw new Error(
      `PIPELINE BLOCKED (${tool}): ${decision.reason}\n` +
        `  target: ${target}\n` +
        `  next:   ${decision.remedy}\n` +
        `  stage:  ${state.stage} (spec ${state.spec ?? "none"})`,
    );
  };

  /**
   * Re-read the review artifact and fold it into the machine. Runs at commit
   * time, not review time: a report written mid-review must not count.
   */
  const refreshReview = (): PipelineState => {
    const state = readState();
    if (state.spec === null) return state;
    const reviewPath = sibling(state.spec, ".review");
    const facts = evaluateReview(readText(reviewPath));
    // No report yet is not a finding: say the review is missing, not that it failed.
    if (facts.verdict === "pending") return dispatch({ type: "REVIEW_OUTDATED" });
    // A fail verdict always blocks. Count it as one finding when the report names
    // none, so the blocker is actionable instead of "needs reviewed".
    if (facts.verdict === "fail") {
      return dispatch({ type: "REVIEW_FOUND", high: Math.max(facts.openHigh, 1) });
    }
    let mtime: number;
    try {
      mtime = fs.statSync(absolute(reviewPath)).mtimeMs;
    } catch {
      return dispatch({ type: "REVIEW_OUTDATED" });
    }
    const newestSource = changedPaths()
      .filter((entry) => classifyPath(entry) === "source")
      .reduce((latest, entry) => {
        try {
          return Math.max(latest, fs.statSync(absolute(entry)).mtimeMs);
        } catch {
          return latest;
        }
      }, 0);
    if (!isReviewCurrent(mtime, newestSource)) return dispatch({ type: "REVIEW_OUTDATED" });
    return dispatch({ type: "REVIEW_CLEAN", sha: headSha() });
  };

  /**
   * Stage transition for a command. Each command registers the stage whose work
   * it is about to do, and first proves the PREVIOUS command left its artifact.
   */
  const advanceCommand = (name: string, rawArgs: string): void => {
    const args = rawArgs.trim();
    switch (name) {
      case "plan": {
        if (args.length === 0) {
          throw new Error("PIPELINE: /plan needs a spec path, e.g. /plan specs/02-foo.md");
        }
        const spec = args.endsWith(".md") ? args : `specs/${args}.md`;
        dispatch({ type: "PLAN_WRITTEN", spec });
        return;
      }
      case "design": {
        const spec = requireSpec();
        requireStage("designed");
        if (readText(spec) === null) {
          throw new Error(
            `PIPELINE: ${spec} does not exist yet. Write it from specs/00-template.md, then re-run /design`,
          );
        }
        dispatch({ type: "DESIGN_WRITTEN" });
        return;
      }
      case "tickets": {
        const spec = requireSpec();
        requireStage("decomposed");
        if (!specFacts(spec).designSatisfied) {
          throw new Error(
            `PIPELINE: design gate unmet. Write ${sibling(spec, ".design")} or add a line "UI: n/a" to ${spec}, then re-run /tickets`,
          );
        }
        dispatch({ type: "TICKETS_WRITTEN" });
        return;
      }
      case "build": {
        const spec = requireSpec();
        requireStage("building");
        const { incrementCount } = specFacts(spec);
        if (incrementCount < MIN_INCREMENTS) {
          throw new Error(
            `PIPELINE: ${spec} lists ${incrementCount} increment(s); ${MIN_INCREMENTS} required. Split the work into ordered increments, then re-run /build`,
          );
        }
        const increment = args.length > 0 ? Number(args) : undefined;
        if (increment !== undefined && !Number.isInteger(increment)) {
          throw new Error(`PIPELINE: /build takes an increment number, got "${args}"`);
        }
        dispatch({ type: "BUILD_STARTED", increment });
        return;
      }
      case "next":
        dispatch({ type: "NEXT_INCREMENT" });
        return;
      case "pipeline-reset":
        dispatch({ type: "RESET" });
        return;
      default:
        return;
    }
  };

  /** Gate an edit of a file path. Returns the repo-relative path it judged. */
  const checkEdit = (tool: string, target: string): string | null => {
    const rel = path.relative(directory, path.resolve(directory, target)).replace(/\\/g, "/");
    if (rel.startsWith("..")) return null;
    const decision = guardEdit(readState(), rel);
    if (!decision.allowed) refuse(tool, target, decision);
    // An edit invalidates the gates and the review that followed them.
    dispatch({ type: "SOURCE_EDITED" });
    return rel;
  };

  /** Gate a shell command. Only `git commit` is gated; docs-only trees pass. */
  const checkShell = (command: string): boolean => {
    if (!/\bgit\s+commit\b/.test(command)) return false;
    if (isDocsOnly()) return false;
    refreshReview();
    const decision = guardCommit(readState(), headSha());
    if (!decision.allowed) refuse("shell", command.split("\n")[0], decision);
    return true;
  };

  const recordVerify = (gates: "green" | "red"): PipelineState =>
    dispatch(gates === "green" ? { type: "VERIFY_PASSED" } : { type: "VERIFY_FAILED" });

  return {
    directory,
    stateFile,
    readText,
    readState,
    writeState,
    dispatch,
    headSha,
    changedPaths,
    isDocsOnly,
    sibling,
    specFacts,
    requireSpec,
    requireStage,
    refreshReview,
    advanceCommand,
    checkEdit,
    checkShell,
    recordVerify,
  };
}

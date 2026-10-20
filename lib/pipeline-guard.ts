/**
 * Path and request guards for the build pipeline. Pure string logic so the
 * decisions are testable without a repository or a running harness.
 */

import { canCommit, canEditSource, commitBlocker, type PipelineState } from "./pipeline-state.ts";

export type PathClass = "process" | "source" | "generated";

/** Paths that belong to the pipeline itself; always writable at any stage. */
const PROCESS_PREFIXES = [
  "specs/",
  "docs/",
  ".claude/",
  ".pipeline-state.json",
  "AGENTS.md",
  "CLAUDE.md",
  "opencode.json",
];

const GENERATED_PREFIXES = ["node_modules/", ".next/", ".vite-hooks/", ".git/"];

const GENERATED_FILES = ["tsconfig.tsbuildinfo", ".env", ".env.local"];

/** Classify a repo-relative path. Backslashes normalised; leading `./` stripped. */
export function classifyPath(rawPath: string): PathClass {
  const path = rawPath.replace(/\\/g, "/").replace(/^\.\//, "");
  if (GENERATED_FILES.includes(path)) return "generated";
  if (GENERATED_PREFIXES.some((prefix) => path.startsWith(prefix))) return "generated";
  if (PROCESS_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix))) {
    return "process";
  }
  return "source";
}

export type Decision = { allowed: true } | { allowed: false; reason: string; remedy: string };

const OK: Decision = { allowed: true };

/** Refuse an edit of product source before the plan/design/decompose stages. */
export function guardEdit(state: PipelineState, filePath: string): Decision {
  const kind = classifyPath(filePath);
  if (kind === "generated") {
    return { allowed: false, reason: `${filePath} is generated`, remedy: "edit its source" };
  }
  if (kind === "process") return OK;
  if (canEditSource(state)) return OK;
  return {
    allowed: false,
    reason: `stage ${state.stage} may not edit product source`,
    remedy: state.spec
      ? "run /design then /tickets, then /build"
      : "run /plan to write a spec first",
  };
}

/** Refuse a commit until self-check and AI review are both clean at this HEAD. */
export function guardCommit(state: PipelineState, headSha: string): Decision {
  const blocker = commitBlocker(state, headSha);
  if (blocker === null) return OK;
  return {
    allowed: false,
    reason: blocker,
    remedy: "run /verify then /review, or commit docs-only changes directly",
  };
}

export { canCommit, canEditSource };

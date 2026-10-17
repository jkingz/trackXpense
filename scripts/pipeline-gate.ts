/**
 * Claude Code hook entrypoint for the build pipeline.
 *
 * Claude Code runs command hooks as shell commands and pipes the event JSON on
 * stdin. This script reads that payload, applies the same gate the OpenCode
 * plugin applies (both call `lib/pipeline-runtime.ts`), and answers with the
 * event's JSON output shape. Decisions only ever come from `lib/pipeline-*.ts`.
 *
 * Modes, one per hook event:
 *   expand           UserPromptExpansion — stage transition gate for /plan etc.
 *   pre-edit         PreToolUse on Write|Edit — source-edit gate
 *   pre-shell        PreToolUse on Bash — commit gate
 *   post-verify      PostToolUse on Bash — the verify chain passed
 *   post-verify-fail PostToolUseFailure on Bash — the verify chain failed
 *   status           print the stage as JSON (for /pipeline)
 *
 * Exit codes follow the hooks reference: 0 with a JSON decision, or 2 to block
 * with stderr as the reason. Any other code is a non-blocking error, so the
 * script never exits non-zero except to block.
 */

import { createRuntime } from "../lib/pipeline-runtime.ts";
import { classifyVerifyResult } from "../lib/pipeline-artifacts.ts";

type Payload = {
  hook_event_name?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_response?: Record<string, unknown>;
  error?: string;
  command_name?: string;
  command_args?: string;
  cwd?: string;
};

const NEXT_COMMAND: Record<string, string> = {
  planned: "/design",
  designed: "/tickets",
  decomposed: "/build <increment>",
  building: "/verify",
  verified: "/review",
  reviewed: "commit, then /next",
};

/** The single command that moves a stage forward, for `/pipeline`. */
const nextCommand = (state: { spec: string | null; stage: string }): string =>
  state.spec === null ? "/plan specs/NN-slug.md" : (NEXT_COMMAND[state.stage] ?? "/plan");

const readStdin = async (): Promise<string> => {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
};

/** Emit an allow decision: no output means the normal permission flow applies. */
const allow = (): void => {
  process.exit(0);
};

/** Block with a reason Claude can act on. */
const block = (reason: string, event: "PreToolUse" | "UserPromptExpansion"): void => {
  process.stdout.write(
    JSON.stringify(
      event === "UserPromptExpansion"
        ? { decision: "block", reason }
        : {
            hookSpecificOutput: {
              hookEventName: "PreToolUse",
              permissionDecision: "deny",
              permissionDecisionReason: reason,
            },
          },
    ),
  );
  process.exit(0);
};

const main = async (): Promise<void> => {
  const mode = process.argv[2] ?? "";
  const directory = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  const raw = await readStdin();

  let payload: Payload = {};
  if (raw.trim().length > 0) {
    try {
      payload = JSON.parse(raw) as Payload;
    } catch {
      // Unparseable payload: stay out of the way rather than block on a guess.
      process.stderr.write("PIPELINE: hook payload was not JSON; gate skipped\n");
      allow();
    }
  }

  const runtime = createRuntime(payload.cwd ?? directory);

  switch (mode) {
    case "status": {
      const state = runtime.readState();
      process.stdout.write(
        `${JSON.stringify({ ...state, head: runtime.headSha().slice(0, 7), next: nextCommand(state) })}\n`,
      );
      return;
    }

    case "expand": {
      const name = payload.command_name ?? "";
      try {
        runtime.advanceCommand(name, payload.command_args ?? "");
      } catch (error) {
        block(error instanceof Error ? error.message : String(error), "UserPromptExpansion");
      }
      allow();
      return;
    }

    case "pre-edit": {
      const target = payload.tool_input?.file_path;
      if (typeof target !== "string") return allow();
      try {
        runtime.checkEdit(payload.tool_name ?? "edit", target);
      } catch (error) {
        block(error instanceof Error ? error.message : String(error), "PreToolUse");
      }
      allow();
      return;
    }

    case "pre-shell": {
      const command = payload.tool_input?.command;
      if (typeof command !== "string") return allow();
      try {
        runtime.checkShell(command);
      } catch (error) {
        block(error instanceof Error ? error.message : String(error), "PreToolUse");
      }
      allow();
      return;
    }

    case "post-verify": {
      // PostToolUse fires only when the whole Bash call exited 0, but a piped or
      // chained call reports the pipe's status, not `pnpm verify`'s. Scan the
      // output for failure markers instead of trusting the exit code alone.
      const response = payload.tool_response ?? {};
      const output = [response.stdout, response.stderr]
        .filter((part): part is string => typeof part === "string")
        .join("\n");
      runtime.recordVerify(classifyVerifyResult({ output }));
      return;
    }

    case "post-verify-fail": {
      const error = payload.error ?? "";
      const exitCode = /^Exit code (\d+)/.exec(error)?.[1];
      const output = error.split("\n").slice(1).join("\n");
      const gates = classifyVerifyResult({
        exitCode: exitCode === undefined ? undefined : Number(exitCode),
        output,
      });
      runtime.recordVerify(gates);
      return;
    }

    default:
      process.stderr.write(`PIPELINE: unknown hook mode "${mode}"\n`);
      process.exit(0);
  }
};

main().catch((error: unknown) => {
  // Never block on our own crash; report it and let the action proceed.
  process.stderr.write(
    `PIPELINE: gate error — ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(0);
});

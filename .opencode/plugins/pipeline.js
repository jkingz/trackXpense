/**
 * Build-pipeline gate for OpenCode (V2 plugin API).
 *
 * Stages: planned -> designed -> decomposed -> building -> verified -> reviewed.
 * Blocks product-source edits before `building`, and blocks `git commit` until
 * `pnpm verify` is green and a current review report has no open High.
 *
 * V1 plugin functions do not run in V2: a V2 plugin default-exports a definition
 * with `id` + `setup(ctx)`, and registers hooks on the domain that owns the
 * operation. `Plugin.define` is only a typed identity helper, so it is not
 * imported here and the plugin stays dependency-free.
 *
 * This file is an adapter only. Every decision lives in `lib/pipeline-*.ts`,
 * shared with the Claude Code hook (`scripts/pipeline-gate.ts`), so the two
 * harnesses cannot drift.
 *
 * Disable with `OPENCODE_PIPELINE=off`.
 */

import fs from "node:fs";
import path from "node:path";

import { classifyVerifyResult } from "../../lib/pipeline-artifacts.ts";
import { createRuntime } from "../../lib/pipeline-runtime.ts";

/** Commands the plugin registers; each reads its prompt body from here. */
const COMMAND_DIR = ".claude/commands";
const COMMAND_NAMES = [
  "plan",
  "design",
  "tickets",
  "build",
  "verify",
  "review-changes",
  "next",
  "pipeline",
  "pipeline-reset",
];
/** Commands that only move the machine, and need no model turn. */
const SILENT_COMMANDS = new Set(["next", "pipeline-reset"]);

// V2 names the shell tool `shell`; `bash` is accepted so the guards keep working
// if a session ever surfaces the V1 name.
const SHELL_TOOLS = new Set(["shell", "bash"]);
const EDIT_TOOLS = new Set(["edit", "write", "patch", "multiedit"]);

const readFrontmatter = (raw) => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (match === null) return { description: "", body: raw };
  const description = /^description:\s*(.*)$/m.exec(match[1]);
  return {
    description: description === null ? "" : description[1].trim(),
    body: raw.slice(match[0].length),
  };
};

export default {
  id: "trackxpense.pipeline",
  async setup(ctx) {
    if (process.env.OPENCODE_PIPELINE === "off") return;

    const directory = ctx.location.directory;
    const runtime = createRuntime(directory);

    const readPrompt = (name) => {
      try {
        const raw = fs.readFileSync(path.join(directory, COMMAND_DIR, `${name}.md`), "utf8");
        return readFrontmatter(raw);
      } catch (error) {
        // A missing prompt file must not silently register an empty command.
        throw new Error(`PIPELINE: cannot read ${COMMAND_DIR}/${name}.md — ${error.message}`);
      }
    };

    await ctx.command.transform((editor) => {
      for (const name of COMMAND_NAMES) {
        const { description, body } = readPrompt(name);
        editor.add({
          name,
          description,
          execute: async ({ sessionID, prompt, delivery }) => {
            const args = (prompt.arguments ?? "").trim();
            // Always move the machine; SILENT only suppresses the prompt body.
            runtime.advanceCommand(name, args);
            if (SILENT_COMMANDS.has(name) || body.trim().length === 0) return;
            await ctx.session.prompt({
              sessionID,
              delivery,
              text: body.trim().replaceAll("$ARGUMENTS", args),
            });
          },
        });
      }
    });

    await ctx.tool.hook("execute.before", (event) => {
      const input = event.input ?? {};

      if (EDIT_TOOLS.has(event.tool)) {
        // V2 write/edit carry `path`; `filePath` is the V1 spelling.
        const target = input.path ?? input.filePath;
        if (typeof target !== "string") return;
        runtime.checkEdit(event.tool, target);
        return;
      }

      if (SHELL_TOOLS.has(event.tool)) {
        const command = String(input.command ?? "");
        runtime.checkShell(command);
      }
    });

    await ctx.tool.hook("execute.after", (event) => {
      if (!SHELL_TOOLS.has(event.tool)) return;
      const command = String((event.input ?? {}).command ?? "");
      if (!/\bpnpm\s+verify\b/.test(command)) return;
      const result = event.result ?? {};
      const metadata = result.metadata ?? {};
      const exitCode = metadata.exitCode ?? metadata.exit_code ?? metadata.code;
      runtime.recordVerify(
        classifyVerifyResult({
          exitCode: typeof exitCode === "number" ? exitCode : undefined,
          output: String(result.output ?? ""),
        }),
      );
    });
  },
};

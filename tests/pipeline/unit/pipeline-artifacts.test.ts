import { expect, it } from "vite-plus/test";

import {
  MIN_INCREMENTS,
  classifyVerifyResult,
  evaluateReview,
  evaluateSpecFacts,
  isReviewCurrent,
} from "@/lib/pipeline-artifacts";

const spec = `# Feature Spec 07 — Something

## Goal

A user can do the thing.

## First increment

1. Add the control.
2. Wire it to the query.

## Later increments

3. Persist the choice.

## Security / permissions

Session user only.

## Verification

\`pnpm build\` → exit 0.
`;

it("counts ordered items across both increment sections", () => {
  expect(evaluateSpecFacts(spec, null).incrementCount).toBe(3);
});

it("does not count ordered items from other sections", () => {
  const withSteps = `${spec}\n## Manual check\n\n1. open the page\n2. click it\n`;
  expect(evaluateSpecFacts(withSteps, null).incrementCount).toBe(3);
});

it("treats a written design doc as satisfying the design gate", () => {
  expect(evaluateSpecFacts(spec, "# Design\n\nTwo columns, one row each.").designSatisfied).toBe(
    true,
  );
});

it("treats an empty design doc as not satisfying the gate", () => {
  expect(evaluateSpecFacts(spec, "   \n").designSatisfied).toBe(false);
});

it("accepts an explicit UI: n/a exemption in the spec", () => {
  expect(evaluateSpecFacts("UI: n/a\n\n## First increment\n\n1. a\n2. b\n", null)).toEqual({
    designSatisfied: true,
    incrementCount: 2,
  });
});

it("accepts the n/a exemption in any casing but not with trailing text", () => {
  expect(evaluateSpecFacts("UI: n/a-ish\n", null).designSatisfied).toBe(false);
  expect(evaluateSpecFacts("ui: n/a\n", null).designSatisfied).toBe(true);
});

it("is unsatisfied with no design and no exemption", () => {
  expect(evaluateSpecFacts(spec, null).designSatisfied).toBe(false);
});

it("requires two increments", () => {
  const one = "## First increment\n\n1. only one\n";
  expect(evaluateSpecFacts(one, null).incrementCount).toBeLessThan(MIN_INCREMENTS);
  expect(MIN_INCREMENTS).toBe(2);
});

it("reads a clean review as pass with no open High", () => {
  const review =
    "## Standards\n\nClean.\n\n## Spec\n\nMet.\n\n- [x] **High** n/a\n\nVerdict: pass\n";
  expect(evaluateReview(review)).toEqual({ openHigh: 0, verdict: "pass" });
});

it("counts open High findings and fails on an unchecked box", () => {
  const review = "## Standards\n\n- [ ] **High** balance not atomic\n\nVerdict: pass\n";
  expect(evaluateReview(review)).toEqual({ openHigh: 1, verdict: "fail" });
});

it("fails on a written fail verdict even with no open boxes", () => {
  expect(evaluateReview("## Standards\n\nMed only.\n\nVerdict: fail\n")).toEqual({
    openHigh: 0,
    verdict: "fail",
  });
});

it("is pending without a verdict line", () => {
  expect(evaluateReview("## Standards\n\nLooks fine to me.")).toEqual({
    openHigh: 0,
    verdict: "pending",
  });
});

it("is pending with no review file at all", () => {
  expect(evaluateReview(null)).toEqual({ openHigh: 0, verdict: "pending" });
});

it("trusts a zero exit code over the output text", () => {
  expect(classifyVerifyResult({ exitCode: 0, output: "error TS9999 in an old log" })).toBe("green");
  expect(classifyVerifyResult({ exitCode: 2, output: "all good" })).toBe("red");
});

it("falls back to scanning output when no exit code is reported", () => {
  expect(classifyVerifyResult({ output: "Tests 79 passed (11 files)" })).toBe("green");
  expect(classifyVerifyResult({ output: "[ELIFECYCLE] Test failed." })).toBe("red");
  expect(classifyVerifyResult({ output: "src/x.ts(1,1): error TS2304: no such name" })).toBe("red");
  expect(classifyVerifyResult({ output: "Found 2 errors in 124 files" })).toBe("red");
});

it("counts a review as current only when it postdates the code", () => {
  expect(isReviewCurrent(200, 100)).toBe(true);
  expect(isReviewCurrent(100, 200)).toBe(false);
  expect(isReviewCurrent(100, 100)).toBe(true);
});

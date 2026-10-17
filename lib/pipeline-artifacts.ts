/**
 * What a written artifact proves, as pure text analysis. The plugin supplies the
 * file contents; every rule a stage gate depends on lives here so it is testable
 * without a repository.
 */

export type SpecFacts = {
  /** Design gate satisfied: a design doc, or an explicit written exemption. */
  designSatisfied: boolean;
  /** Ordered items counted across the increment sections. */
  incrementCount: number;
};

const INCREMENT_SECTION = /^##\s+(first increment|increments|later increments)\s*$/gim;
const ORDERED_ITEM = /^\s*\d+\.\s+\S/gm;

function sectionBodies(text: string, heading: RegExp): string[] {
  const matches = [...text.matchAll(heading)];
  return matches.map((match) => {
    const start = (match.index ?? 0) + match[0].length;
    const rest = text.slice(start);
    const next = rest.search(/^##\s+/m);
    return next === -1 ? rest : rest.slice(0, next);
  });
}

export function evaluateSpecFacts(specText: string, designText: string | null): SpecFacts {
  const designSatisfied =
    designText !== null && designText.trim().length > 0 ? true : /^UI:\s*n\/a\s*$/im.test(specText);

  const incrementCount = sectionBodies(specText, INCREMENT_SECTION).reduce(
    (total, body) => total + (body.match(ORDERED_ITEM)?.length ?? 0),
    0,
  );

  return { designSatisfied, incrementCount };
}

/** Minimum ordered increments before `/tickets` counts as decomposed. */
export const MIN_INCREMENTS = 2;

export type ReviewVerdict = "pass" | "fail" | "pending";

export type ReviewFacts = {
  openHigh: number;
  verdict: ReviewVerdict;
};

const OPEN_HIGH = /^\s*[-*]\s*\[ \]\s*\*\*High\*\*/gim;
const ANY_HIGH = /^\s*[-*]\s*\[[ xX]\]\s*\*\*High\*\*/gim;

export function evaluateReview(reviewText: string | null): ReviewFacts {
  if (reviewText === null) return { openHigh: 0, verdict: "pending" };
  const declared = /^Verdict:\s*(pass|fail)\s*$/im.exec(reviewText);
  if (declared === null) return { openHigh: 0, verdict: "pending" };
  const open = [...reviewText.matchAll(OPEN_HIGH)].length;
  const total = [...reviewText.matchAll(ANY_HIGH)].length;
  if (declared[1].toLowerCase() === "fail" || open > 0) {
    return { openHigh: Math.max(open, total), verdict: "fail" };
  }
  return { openHigh: 0, verdict: "pass" };
}

/**
 * A review only counts when it was written after the code it judges. Equal
 * timestamps count as current: editors and filesystems are coarse-grained.
 */
export function isReviewCurrent(reviewMtime: number, newestSourceMtime: number): boolean {
  return reviewMtime >= newestSourceMtime;
}

const FAILURE_MARKERS = [
  /\[ELIFECYCLE\]/i,
  /Command failed/i,
  /\berror TS\d+/,
  /Found \d+ errors?/i,
  /Build error occurred/i,
];

/**
 * Result of `pnpm verify`. An explicit non-zero exit always loses; without an
 * exit code the captured output is scanned, and anything unrecognised is red.
 */
export function classifyVerifyResult(result: {
  exitCode?: number | null;
  output: string;
}): "green" | "red" {
  if (typeof result.exitCode === "number") return result.exitCode === 0 ? "green" : "red";
  return FAILURE_MARKERS.some((marker) => marker.test(result.output)) ? "red" : "green";
}

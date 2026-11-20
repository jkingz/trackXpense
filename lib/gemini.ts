// Shared by receipt scanning and monthly insights; a retired name 404s silently in the job.
// Model chosen from measured behaviour against this key, not from a doc page.
// Census on one receipt image, 3 attempts each: `gemini-2.5-flash` and
// `gemini-2.5-flash-lite` 404 ("no longer available to new users") — that is what
// broke the scan — while `gemini-3.8-flash` and `gemini-flash-latest` answered but
// intermittently threw 503 "high demand" and took 38-92s. `gemini-3.1-flash-lite`
// and `gemini-flash-lite-latest` went 10/10 in 2-5s with byte-identical
// extraction. The versioned name is pinned over the rolling alias so the model
// behind the feature cannot change under the app mid-demo.
export const GEMINI_MODEL = "gemini-3.1-flash-lite";

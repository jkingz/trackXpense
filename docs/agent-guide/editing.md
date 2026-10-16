# Editing these docs

Code is truth. Doc disagrees with code → doc is the defect → fix it same change.

## Doc style — hard rules

Every line earns its place. Violations get deleted, not debated.

- **Terse.** Fragments fine. Drop articles ("the", "a"). Prefer arrows and slashes over sentences.
- **One fact per line.** No paragraph padding, no intros, no summaries restating the line above.
- **Cite `file:line`** for every code claim. No invented numbers, paths, dates, thresholds.
- **No history.** Never "used to", "previously", "no longer", "since Plan A", "the old", "was renamed".
- **No filler.** Never "note that", "it's worth noting", "essentially", "simply", "in order to".
- **Counts live in one home:** `service-architecture.md` → Verification. Every other body points there, never repeats a total.
- **Measured claims carry their date** (`measured 2026-10-17`). Unmeasured → say "unverified".
- **Not built → `target-state.md`**, never a current-state body.
- Bad: "The Inngest functions were written and served, though they have never actually been run here."
- Good: "Inngest functions written + served; never fired here (`INNGEST_EVENT_KEY` unset)."

## When a section earns a fact

1. STANDING RULES — day one.
2. Bodies below — one section per decision, as you build.
3. SERVICE ARCHITECTURE — implemented code only, after first commit.
4. TARGET STATE — intent outpaces implementation.
5. `specs/` — one per unit of work.

## Health check

```bash
grep -n '<[a-zA-Z_/]' AGENTS.md
```

Any hit = an unfilled slot marker. Zero hits = no template leftovers. Reword prose; never exempt the command.

## Index is authoritative

`README.md` lists every body; `AGENTS.md` stubs point at each. New body → add its stub + index row in the same change.

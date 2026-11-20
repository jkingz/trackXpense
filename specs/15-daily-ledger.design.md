# Daily Ledger design

- Desktop: sticky account rail beside a balance summary, full-width cash flow, category and budget panels, then recent activity.
- Mobile: the account rail and panels stack in reading order and fit the viewport.
- Use existing button, dropdown menu, progress and skeleton components.
- Use semantic card/background, border, sidebar, and income/expense tokens. Scope the mist and cobalt palette to the signed-in shell.
- The currency menu names both currencies, identifies the current selection, and explains that amounts keep their numeric value. Disable the trigger during the save and announce failures.
- Read balances, accounts and preference from the signed-in user. Keep budget and chart empty states and matching loading skeletons. Signed-out users go to sign-in.

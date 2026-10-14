## UI Context

### Design tokens

Tailwind 4.3.3 (`package.json:75`; the `4.0.14` previously quoted here was the pre-upgrade pin). Colors, spacing, and type scale are in `app/globals.css` (default Tailwind tokens, no custom overrides yet).

Common utilities:
- `bg-surface`, `bg-surface-secondary` — background layers
- `text-text-primary`, `text-text-secondary` — text hierarchy
- `border-border-base` — default border color
- `rounded-md`, `rounded-lg` — border radius
- `shadow-sm`, `shadow-md` — elevation

### Per-component conventions

- Server Components as default; Client Components only for form interactivity, state, and real-time updates.
- Every source file is `.ts`/`.tsx` now, but props are annotated only where a `tsc` diagnostic demanded it (Plan A's rule). Component props in the files Tasks 9–10 left alone (`transaction-overview.tsx`, `budget-progress.tsx`, `transaction-table.tsx`, the `app/(main)/transaction/_components/*` forms) are still inferred, and rows that pass through `serializeTransaction` are `any` — so a shape mismatch at those boundaries is still not caught by the compiler.
- Event handlers: `onChange`, `onSubmit`, `onDelete` — standard React names.
- Form state: Managed with React Hook Form + Zod. Submit handlers are Server Actions.

### Styling rules

- Token rule: Use Tailwind utilities, not raw `style={}` or hardcoded colors.
- Forbidden: Raw pixel values (`px-[123px]`), `#hex` colors inline, magic numbers.
- Use components from Radix UI where UI state (dialog, dropdown, tooltip) is needed.

### Images / assets

- Images: the `Image` component from `next/image` is required. Remote patterns allowed: `randomuser.me` (avatars).
- Formats: AVIF and WebP preferred (configured in `next.config.mjs`).
- Icons: Lucide React (`lucide-react@0.482.0`). No SVG files committed; generate from the library.

---


# Shared design system

This documents the existing shared UI baseline for the single Next.js
application. Modules use the shared CSS variables and components; they do not
define their own colors or controls.

## Tokens

The canonical values are in [`src/app/tokens.css`](src/app/tokens.css) and are
loaded by the global stylesheet.

- Background and cards: `--background`, `--card`
- Text: `--foreground`, `--muted-foreground`
- Actions: `--primary`, `--primary-foreground`
- Supporting surfaces: `--secondary`, `--muted`, `--accent`
- Borders and focus: `--border`, `--input`, `--ring`
- Errors: `--destructive`, `--destructive-foreground`

Use the existing Tailwind spacing and rounded-corner utilities. Do not add a
module-only color palette, font, or spacing scale.

## Components

Reuse `src/shared/components/ui/`:

- **Button:** primary actions use the default variant; less prominent actions
  use `outline` or `secondary`. Disable actions while their request is running.
- **Input and Label:** put a visible label above every input and keep entered
  values when a request fails.
- **Card:** group related results and supporting information.
- **Tabs and Sheet:** use the shared accessible primitives when those
  interaction patterns are needed.
- **Status and error messages:** use text in addition to any visual styling;
  announce asynchronous updates with `role="status"` and failures with
  `role="alert"`.

## Accessibility and wording

All controls work with a keyboard and have visible focus. Use plain, specific
labels and explain errors with what happened and what the user can do next.
Follow the module API contract for API error text.

# Shared frontend constitution

**Status:** working draft based on the current repository. The class still needs
to ratify shared decisions; this document does not claim that agreement has
happened.

## Current implementation baseline

- One Next.js application serves the feature teams. Routes live in `src/app/`;
  team-owned UI and behavior live in `src/features/<module>/`.
- Teams use the shared UI primitives and design tokens documented in
  [`DESIGN.md`](../DESIGN.md). A feature must not introduce a separate visual
  theme.
- A module consumes its own public API contract. It does not read another
  module's database or internal implementation.
- Search & Recommendations APIs are public and anonymous. The existing Better
  Auth foundation does not yet include a shared login screen or completed
  permission model. The developer-facing Search UI therefore does not add a
  separate login.
- Search & Recommendations owns developer documentation and API exploration.
  Storefront owns the customer shopping UI; Admin & Identity owns catalog
  editing.

## Shared decisions still requiring class confirmation

- Confirm the shared Next.js application, module folders, and the ownership
  rules above as the course-wide structure.
- Name the group that owns the application shell, global navigation, login UI,
  and shared design system.
- Agree on the login interface and its test-user behavior before other modules
  depend on it.
- Have each neighboring team review its module handoff and publish the route it
  expects other teams to link to.

Record confirmed decisions and owners here after the class discussion.

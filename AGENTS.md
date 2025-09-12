# Repository Guidelines

## Project Structure & Module Organization
- `src/app/`: Next.js App Router (pages, layouts, API routes). Example: `src/app/api/gemini/route.ts`.
- `src/components/`: React components (PascalCase, one component per file).
- `src/lib/`: Utilities and templates.
- `src/types/`: TypeScript type definitions.
- `docs/`: Specs and reference JSONs.
- Root configs: `next.config.js`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`.

## Build, Test, and Development Commands
- `npm run dev`: Start the dev server with hot reload.
- `npm run build`: Production build (`.next/`).
- `npm run start`: Start built app.
- `npm run lint`: Run ESLint (Next.js config).

Tip: Do not commit `.next/` or `node_modules/` (already covered by `.gitignore`).

## Coding Style & Naming Conventions
- Language: TypeScript + React (Next.js 15, App Router).
- Indentation: 2 spaces. Prefer explicit types for public APIs and props.
- Components: PascalCase (`KeyboardPreview.tsx`), hooks/use-helpers in camelCase.
- Styling: Tailwind CSS utility-first; avoid inline styles unless dynamic. Keep layouts compact and accessible.
- Linting: `npm run lint` (fix issues before committing). Add Prettier if needed, but follow existing style.

## Testing Guidelines
- No test suite is configured yet. If adding tests, colocate under `src/**/__tests__/*` and use a descriptive filename (e.g., `KeyboardPreview.test.tsx`). Keep tests fast and component-scoped.

## Commit & Pull Request Guidelines
- Follow Conventional Commits seen in history: `feat:`, `fix:`, `chore:`, `ui:`.
- Commit scope should be focused and reversible. Include rationale when non-obvious.
- PRs: provide a clear description, link related issues, and include screenshots/GIFs for UI changes.
- Before opening a PR: `npm run lint && npm run build` locally; ensure no debug logs and no large artifacts.

## Security & Configuration Tips
- Keep secrets out of the repo. Use `.env.local` (gitignored) for local secrets.
- API routes live in `src/app/api/*`; validate inputs and avoid long-running work on the edge unless intended.

## Agent-Specific Notes
- Prioritize minimal, surgical changes; avoid broad refactors.
- Preserve existing UX decisions (compact headers, wide editing areas) and ensure new features default to sensible settings.

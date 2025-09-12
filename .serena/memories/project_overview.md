Project: CustardWeb
Purpose: Next.js web app (TypeScript + React) with App Router. Likely includes components under `src/components`, utilities in `src/lib`, API routes under `src/app/api`, and types in `src/types`. Docs/specs may live in `docs/`.
Tech stack: Next.js 15 (App Router), TypeScript, Tailwind CSS, ESLint (Next.js config).
Repo structure: 
- src/app: pages/layouts/API routes (e.g., src/app/api/gemini/route.ts)
- src/components: React components (PascalCase, one per file)
- src/lib: Utilities and templates
- src/types: Type definitions
- docs: Specs and reference JSONs
- Root configs: next.config.js, tsconfig.json, tailwind.config.js, postcss.config.js
Build/Run: npm run dev/build/start; lint with npm run lint.
Security: Use .env.local for secrets (gitignored). API routes validate inputs; avoid long-running work on edge unless intended.
Conventions: 2-space indentation, explicit types for public APIs/props, Tailwind utility-first styling, PascalCase components, camelCase hooks/helpers. Conventional Commits (feat, fix, chore, ui). Keep UX compact; wide editing areas. Minimal, surgical changes by agents.
Testing: No suite configured. If adding tests, colocate under src/**/__tests__/* and keep fast/component-scoped.
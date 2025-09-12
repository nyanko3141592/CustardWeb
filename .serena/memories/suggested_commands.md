Core commands:
- Dev server: `npm run dev`
- Build (production): `npm run build`
- Start built app: `npm run start`
- Lint: `npm run lint`

Before PR:
- `npm run lint && npm run build`

Utilities (macOS/Darwin):
- List files: `rg --files` or `ls`
- Search text: `rg "pattern"`
- Git basics: `git status`, `git add -p`, `git commit -m "feat: ..."`

Deployment (GitHub Pages – static export suggestion):
- Configure Next.js `next.config.js` with `output: 'export'`, `images.unoptimized: true`, and consider `trailingSlash: true`.
- Build static site: `npm run build` (generates `out/` when `output: 'export'`).
- Deploy via GitHub Actions Pages or `gh-pages` branch.

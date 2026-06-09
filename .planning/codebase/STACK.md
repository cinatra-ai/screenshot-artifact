# Technology Stack

**Analysis Date:** 2026-06-09

## Languages

**Primary:**
- TypeScript - `src/index.ts`, compiled to `dist/` via `tsconfig.json`

**Secondary:**
- Not applicable (no secondary language detected)

## Runtime

**Environment:**
- Node.js 24 (pinned in `.github/workflows/ci.yml`)

**Package Manager:**
- pnpm (via corepack) — used in CI steps
- Lockfile: not committed (CI uses `--no-frozen-lockfile`)

## Frameworks

**Core:**
- None — this is a thin manifest-export package, not an application framework

**Testing:**
- Not detected (no test framework declared; CI runs `pnpm test --if-present` with graceful skip)

**Build/Dev:**
- TypeScript compiler (`tsc`) — `tsconfig.json` targets ES2023, ESNext modules, `bundler` moduleResolution
- `npm pack` (dry-run) — used in CI to validate package shape

## Key Dependencies

**Critical:**
- `@cinatra-ai/sdk-extensions` — optional peer dependency; provides the `SemanticArtifactManifest` type imported in `src/index.ts`. Only resolved when this package is installed inside the Cinatra monorepo workspace.

**Infrastructure:**
- No runtime dependencies (`dependencies` and `devDependencies` are absent from `package.json`)

## Configuration

**Environment:**
- No environment variables required by the package itself
- `.npmrc` present — note existence only, contents not read

**Build:**
- `tsconfig.json` — standalone strict TypeScript config (does not extend a base config)
  - `target`: ES2023
  - `module`: ESNext
  - `moduleResolution`: bundler
  - `strict`: true, `noImplicitAny`: false
  - `isolatedModules`: true
  - `verbatimModuleSyntax`: true
  - Output: `dist/`, source maps and declaration maps enabled
- `package.json` — ESM package (`"type": "module"`), `main` and `types` both point to `./src/index.ts`

## Platform Requirements

**Development:**
- Node.js 24+, pnpm via corepack
- Full typecheck and install require access to the Cinatra monorepo workspace (host-internal peer `@cinatra-ai/sdk-extensions` is not published to any public registry)

**Production:**
- Deployed via the Cinatra Marketplace release pipeline (`.github/workflows/release.yml`)
- Published to `registry.cinatra.ai` (not npm) through a marketplace MCP proxy submit/approve/promotion saga
- Release triggered by GitHub Release tag matching `v<package.json.version>`

---

*Stack analysis: 2026-06-09*

# Coding Conventions

**Analysis Date:** 2026-06-09

## Naming Patterns

**Files:**
- Single entry point: `src/index.ts` — flat `src/` directory, one file per artifact
- Skill definitions: `skills/<skill-name>/SKILL.md` — kebab-case directory names

**Functions/Constants:**
- Exported constants use camelCase: `screenshotArtifactManifest` (`src/index.ts`)
- No functions detected beyond the single manifest export

**Variables:**
- camelCase for local and exported variables

**Types:**
- Imported types use PascalCase: `SemanticArtifactManifest`
- Type imports use `import type` syntax (enforced by `verbatimModuleSyntax` in `tsconfig.json`)

## Code Style

**Formatting:**
- No Prettier or ESLint config detected in repo root
- TypeScript formatting enforced via strict compiler options in `tsconfig.json`

**TypeScript Configuration (`tsconfig.json`):**
- `strict: true` — all strict checks enabled
- `noImplicitAny: false` — explicit `any` is permitted
- `verbatimModuleSyntax: true` — requires `import type` for type-only imports
- `isolatedModules: true` — each file must be independently compilable
- `target: ES2023`, `module: ESNext`, `moduleResolution: bundler`
- `declaration: true`, `declarationMap: true`, `sourceMap: true` — full emit for consumers

**Linting:**
- No `.eslintrc`, `eslint.config.*`, or `biome.json` detected
- Lint-equivalent checks performed by `tsc` strict mode at build time

## Import Organization

**Order:**
1. Type-only imports (`import type { ... }`) from external packages
2. No other import layers present in current codebase

**Path Aliases:**
- None configured — bare specifiers only (`@cinatra-ai/sdk-extensions`)

**Import Style:**
- `import type` is required for type-only imports (enforced by `verbatimModuleSyntax`)
- Example from `src/index.ts`: `import type { SemanticArtifactManifest } from "@cinatra-ai/sdk-extensions";`

## Error Handling

**Patterns:**
- No runtime error handling in `src/index.ts` — the module exports a static manifest object only
- CI validation errors are handled in shell scripts within `.github/workflows/ci.yml` using `node -e` inline scripts with `process.exit` codes

## Logging

**Framework:** Not applicable — this is a manifest/artifact definition package, not a runtime service

**Patterns:**
- CI shell steps use `echo` for status reporting
- `console.error` used in inline CI node scripts for validation failure messages

## Comments

**When to Comment:**
- Module-level block comments explain scope and rationale (see `src/index.ts` lines 2–11)
- CI workflow steps include inline comments explaining skip conditions and branching logic
- `tsconfig.json` uses a `"//"` key for documentation (non-standard but functional)

**Style:**
- Block comments (`//`) for multi-line explanations at module level
- No JSDoc/TSDoc annotations detected in source files

## Function Design

**Size:** Single export in `src/index.ts` — no functions, only a typed constant
**Parameters:** Not applicable
**Return Values:** Not applicable — static object export only

## Module Design

**Exports:**
- Named export only: `export const screenshotArtifactManifest` from `src/index.ts`
- No default exports
- `package.json` sets `"main": "./src/index.ts"` — direct TypeScript source as entry point (consumed by the monorepo, not published standalone)

**Barrel Files:**
- `src/index.ts` serves as the sole barrel/entry point

## Dependency Shape Convention

**Critical convention enforced by CI (`ci.yml`):**
- First-party `@cinatra-ai/*` packages MUST be declared as optional `peerDependencies`, never as `dependencies`, `devDependencies`, or `optionalDependencies`
- Each first-party peer must have `peerDependenciesMeta.<pkg>.optional: true` in `package.json`
- Violating this triggers `exit 2` in CI and blocks the build

## Skill Definition Conventions (`skills/*/SKILL.md`)

**Format:**
- YAML frontmatter with `name` and `description` fields
- Prose body in Markdown describing classification rules
- Output contracts specified in the SKILL.md body as JSON examples
- Confidence scoring guidance (numeric range 0–1) documented inline
- Reference: `skills/screenshot-matcher/SKILL.md`

---

*Convention analysis: 2026-06-09*

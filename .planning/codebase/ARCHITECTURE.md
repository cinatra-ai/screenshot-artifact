<!-- refreshed: 2026-06-09 -->
# Architecture

**Analysis Date:** 2026-06-09

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│              Cinatra Platform (Monorepo Host)                │
│   Resolves @cinatra-ai/sdk-extensions, runs type-check,     │
│   tests, and registers this extension in its workspace.     │
└──────────────────────────┬──────────────────────────────────┘
                           │ optional peer dependency
                           ▼
┌─────────────────────────────────────────────────────────────┐
│          @cinatra-ai/screenshot-artifact (this repo)        │
│                                                             │
│  `src/index.ts`  — SemanticArtifactManifest export         │
│                                                             │
│  Declares:                                                  │
│    - Accepted MIME types: image/png, image/jpeg, image/webp │
│    - Matcher skill reference                                │
│    - Confidence threshold: 0.7                              │
└──────────────────────────┬──────────────────────────────────┘
                           │ skill reference (string ID)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Skill: screenshot-matcher                                   │
│  `skills/screenshot-matcher/SKILL.md`                       │
│                                                             │
│  LLM prompt classifier — receives image attachment via      │
│  platform attachment-resolver port, returns JSON:           │
│  { matches: boolean, confidence: 0..1, rationale: string }  │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Artifact Manifest | Declares accepted MIME types, wires matcher skill, sets confidence threshold | `src/index.ts` |
| screenshot-matcher skill | LLM prompt that classifies an image as a UI screenshot or not | `skills/screenshot-matcher/SKILL.md` |
| package.json cinatra block | Machine-readable manifest mirror consumed by Cinatra platform | `package.json` |
| CI workflow | Validates dependency shape, typechecks, packs, runs kind-gates | `.github/workflows/ci.yml` |
| Release workflow | Handles versioned releases of the extension | `.github/workflows/release.yml` |

## Pattern Overview

**Overall:** Cinatra Semantic Artifact Extension (source mirror pattern)

**Key Characteristics:**
- This repo is a **source mirror** extracted from the Cinatra monorepo. It is not standalone-installable — the monorepo resolves all `@cinatra-ai/*` dependencies.
- The entire runtime behavior is declared via a single `SemanticArtifactManifest` object in `src/index.ts`. There is no imperative logic in the source.
- Matching intelligence lives entirely in `skills/screenshot-matcher/SKILL.md` as a structured LLM system prompt — no TypeScript classifier code.
- The platform's attachment-resolver port delivers the image to the LLM; the skill returns a confidence-tagged JSON result.
- The `package.json` `cinatra` block duplicates the manifest declaratively for tooling that reads package metadata without importing TypeScript.

## Layers

**Manifest Layer:**
- Purpose: Declares what this artifact accepts and which skill performs matching
- Location: `src/index.ts`
- Contains: A single exported `screenshotArtifactManifest` constant of type `SemanticArtifactManifest`
- Depends on: `@cinatra-ai/sdk-extensions` (optional peer — provided by monorepo)
- Used by: Cinatra platform artifact registry

**Skill Layer:**
- Purpose: LLM classification prompt for screenshot detection
- Location: `skills/screenshot-matcher/SKILL.md`
- Contains: Frontmatter metadata (`name`, `description`), positive/negative example taxonomy, confidence band guidance, JSON output contract
- Depends on: Cinatra platform attachment-resolver port (runtime, not a TypeScript import)
- Used by: Platform skill runner when evaluating candidate images against this artifact

**Package Metadata Layer:**
- Purpose: Machine-readable artifact configuration and dependency declarations
- Location: `package.json` (`cinatra` block)
- Contains: `apiVersion`, `kind: artifact`, accepted MIME types, matcher references
- Used by: Cinatra platform tooling and CI validation scripts

## Data Flow

### Primary Classification Path

1. Platform receives image file (PNG/JPEG/WEBP) and looks up registered artifact extensions
2. Platform loads `screenshotArtifactManifest` from `src/index.ts` — checks MIME type against `accepts.file.mimeTypes`
3. Platform invokes skill `@cinatra-ai/screenshot-artifact:screenshot-matcher` (defined in `skills/screenshot-matcher/SKILL.md`) via attachment-resolver port
4. LLM receives image and skill prompt; returns `{ matches, confidence, rationale }` JSON
5. Platform compares `confidence` against `matcherConfidenceThreshold: 0.7` — accepts or rejects the artifact match

### CI Validation Path

1. `.github/workflows/ci.yml` detects source-mirror status (presence of `@cinatra-ai/*` optional peers)
2. Skips standalone install/typecheck/test (monorepo owns those)
3. Runs `npm pack --dry-run` to validate package shape
4. `kind-gates` job runs — for `artifact` kind, no additional gate is applied (placeholder step only)

## Key Abstractions

**SemanticArtifactManifest:**
- Purpose: Typed contract that registers this package as a Cinatra artifact extension
- Examples: `src/index.ts`
- Pattern: Single exported constant; type imported from `@cinatra-ai/sdk-extensions`

**Skill (SKILL.md):**
- Purpose: Self-contained LLM system-prompt file with frontmatter metadata
- Examples: `skills/screenshot-matcher/SKILL.md`
- Pattern: YAML frontmatter (`name`, `description`) + Markdown body with classification rules and JSON output contract

## Entry Points

**TypeScript Entry Point:**
- Location: `src/index.ts`
- Triggers: Monorepo imports this package to register the artifact extension
- Responsibilities: Exports `screenshotArtifactManifest`

**Skill Entry Point:**
- Location: `skills/screenshot-matcher/SKILL.md`
- Triggers: Platform skill runner resolves `@cinatra-ai/screenshot-artifact:screenshot-matcher` skill ID
- Responsibilities: Provides the LLM classification prompt for screenshot detection

## Architectural Constraints

- **Source mirror:** This repo cannot be installed standalone. All `@cinatra-ai/*` dependencies are optional peers resolved only inside the Cinatra monorepo.
- **No imperative logic:** There is no runtime TypeScript logic beyond the manifest declaration. Classification is purely LLM-driven via the SKILL.md prompt.
- **Global state:** None — the exported manifest is a frozen constant.
- **Circular imports:** Not applicable — single source file with no internal imports.
- **MIME scope:** Accepts `image/png`, `image/jpeg`, `image/webp` only. `image/gif` is explicitly excluded (animated captures out of scope).
- **Confidence threshold:** Hard-coded at `0.7` in both `src/index.ts` and the `package.json` `cinatra` block. Changes must be made in both places.

## Anti-Patterns

### Duplicated Manifest Definition

**What happens:** The artifact manifest is declared twice — once in `src/index.ts` as a TypeScript constant and again in `package.json` under the `cinatra` key.
**Why it's wrong:** The two definitions can drift out of sync (e.g., adding a MIME type in one but not the other).
**Do this instead:** Keep `package.json`'s `cinatra` block as the single source of truth and generate or validate the TypeScript export from it, or treat `src/index.ts` as authoritative and use a build step to sync `package.json`.

## Error Handling

**Strategy:** Delegated to platform

**Patterns:**
- The manifest itself has no error handling — it is a static data object
- Classification errors (LLM failure, malformed JSON response) are handled by the Cinatra platform's skill runner, not this repo

## Cross-Cutting Concerns

**Logging:** Not applicable — no runtime code
**Validation:** CI validates dependency shape via inline Node.js script in `.github/workflows/ci.yml`
**Authentication:** Not applicable — no external API calls in this repo

---

*Architecture analysis: 2026-06-09*

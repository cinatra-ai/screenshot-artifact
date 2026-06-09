# External Integrations

**Analysis Date:** 2026-06-09

## APIs & External Services

**Cinatra Marketplace:**
- Cinatra Marketplace MCP proxy — used during release to submit the extension for review, approval, and promotion
  - SDK/Client: reusable GitHub Actions workflow `cinatra-ai/.github/.github/workflows/reusable-extension-release.yml@main`
  - Auth: `CINATRA_MARKETPLACE_VENDOR_TOKEN` org secret (inherited by `.github/workflows/release.yml`)

**Cinatra SDK (internal):**
- `@cinatra-ai/sdk-extensions` — optional peer dependency providing the `SemanticArtifactManifest` type
  - Not on any public registry; resolved only within the Cinatra monorepo workspace
  - Used in: `src/index.ts`

**LLM Matcher (runtime):**
- The `screenshot-matcher` skill (`skills/screenshot-matcher/SKILL.md`) is invoked at runtime by the Cinatra platform to classify image attachments using an LLM
  - The LLM reads image content via an attachment-resolver port (platform-managed, not a direct HTTP call from this package)
  - Confidence threshold: 0.7 (configured in `package.json` under `cinatra.artifact.matcherConfidenceThreshold`)

## Data Storage

**Databases:**
- Not applicable — this package is a manifest/skill definition, not an application with a database

**File Storage:**
- Accepted MIME types for file inputs: `image/png`, `image/jpeg`, `image/webp` (configured in `package.json` and `src/index.ts`)
- Storage backend is platform-managed by Cinatra; not declared in this repo

**Caching:**
- Not applicable

## Authentication & Identity

**Auth Provider:**
- Not applicable — no auth logic in this package
- Release pipeline uses GitHub OIDC (`id-token: write`) for build-provenance attestation

## Monitoring & Observability

**Error Tracking:**
- Not detected

**Logs:**
- Not applicable (no runtime application code; matcher skill returns structured JSON only)

## CI/CD & Deployment

**Hosting:**
- Cinatra Marketplace / `registry.cinatra.ai` (private Cinatra extension registry)

**CI Pipeline:**
- GitHub Actions
  - CI workflow: `.github/workflows/ci.yml` — runs on push/PR to `main`; validates package dependency shape, optionally typechecks and tests (skipped for source mirrors with host-internal peers), and does a dry-run `npm pack`
  - Release workflow: `.github/workflows/release.yml` — triggered on GitHub Release publish or manual `workflow_dispatch` from a version tag; delegates to `cinatra-ai/.github` reusable workflow

## Environment Configuration

**Required env vars:**
- None required by the package code itself
- `CINATRA_MARKETPLACE_VENDOR_TOKEN` — org-level GitHub secret, required only by the release pipeline

**Secrets location:**
- GitHub org-level secrets (not stored in this repo)
- `.npmrc` present in repo root — contents not read

## Webhooks & Callbacks

**Incoming:**
- Not applicable

**Outgoing:**
- Not applicable (release submission is push-based via GitHub Actions, not a webhook from this repo)

---

*Integration audit: 2026-06-09*

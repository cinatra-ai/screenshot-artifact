# Testing Patterns

**Analysis Date:** 2026-06-09

## Test Framework

**Runner:** Not detected — no test framework is installed or configured in this repo

**Config files:** None (`jest.config.*`, `vitest.config.*`, `mocha.*` — all absent)

**Run Commands:**
```bash
# CI runs: corepack pnpm test --if-present
# No test script is present in package.json, so this is a no-op for this repo
```

## Test File Organization

**Location:** No test files exist in this repository

**Naming:** Not applicable

**Structure:** Not applicable

## Rationale: Why No Tests

This is a **source mirror** / extracted artifact extension. Per the CI workflow (`.github/workflows/ci.yml`):

- The repo declares `@cinatra-ai/sdk-extensions` as an optional `peerDependency`
- This makes it a "host-internal peer" repo — the Cinatra monorepo provides, builds, typechecks, and runs tests for such repos
- Standalone install, typecheck, and test are explicitly skipped in CI when `first_party=1`
- The CI step "Test" exits 0 with a skip message: _"Skipping standalone tests (host-internal @cinatra-ai/* peers — the cinatra monorepo runs these)."_

The package has no runtime logic — `src/index.ts` exports a single static manifest object. There is no business logic, branching, or I/O to test in isolation.

## CI Validation (Substitute for Unit Tests)

The CI pipeline performs structural validation that substitutes for unit tests in this repo:

**Dependency shape gate** (`.github/workflows/ci.yml`, "Classify repo" step):
- Inline `node -e` script validates that no `@cinatra-ai/*` package leaked into `dependencies`, `devDependencies`, or `optionalDependencies`
- Validates that all first-party peers have `peerDependenciesMeta.<pkg>.optional: true`
- Exits with code 2 (hard failure) on violation

**Pack dry-run** (`.github/workflows/ci.yml`, "Pack (dry run)" step):
- Runs `npm pack --dry-run` to validate package shape and publish payload
- Ensures `main`/`types` entry points resolve and the tarball is well-formed

**Kind gate** (`.github/workflows/ci.yml`, `kind-gates` job):
- Runs after `build` job
- For `artifact` kind: no additional gate today (placeholder step only)
- For `workflow`/`agent` kinds: would run `extension-kind-gate.mjs`

## Mocking

**Framework:** Not applicable — no test suite present

## Fixtures and Factories

**Test Data:** Not applicable

## Coverage

**Requirements:** None enforced — no test runner configured

## Test Types

**Unit Tests:** Not present
**Integration Tests:** Not present
**E2E Tests:** Not present

## Adding Tests in the Future

If tests are added to this repo (e.g., after the monorepo integration point is extracted):

1. Add a test runner (vitest recommended for ESM + TypeScript projects matching this stack) to `devDependencies`
2. Add a `"test"` script to `package.json`
3. Place test files alongside source: `src/index.test.ts`
4. The CI "Test" step (`corepack pnpm test --if-present`) will pick them up automatically — no CI changes needed
5. Note: as long as `@cinatra-ai/sdk-extensions` remains an optional peer, `first_party=1` will be set and CI will skip the test step. Tests would only run standalone once that peer dependency is removed or replaced.

---

*Testing analysis: 2026-06-09*

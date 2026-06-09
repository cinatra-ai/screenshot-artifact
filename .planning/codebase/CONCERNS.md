# Codebase Concerns

**Analysis Date:** 2026-06-09

## Tech Debt

**`main` and `types` point to TypeScript source, not compiled output:**
- Issue: `package.json` sets `"main": "./src/index.ts"` and `"types": "./src/index.ts"`. Standard npm packages expose compiled JS via `dist/`. Consumers that cannot execute TypeScript directly will fail. The `tsconfig.json` has `"outDir": "dist"` and `"noEmit": false`, meaning the build output is `dist/` — yet `package.json` never references it.
- Files: `package.json`, `tsconfig.json`, `src/index.ts`
- Impact: Any downstream consumer resolving this package outside the cinatra monorepo workspace (e.g. a third-party integrator or a standalone npm install) receives a `.ts` file as the entry point, which will error unless they have a TypeScript loader. The `npm pack --dry-run` CI step validates shape but does not catch this runtime resolution issue.
- Fix approach: Add `"exports"` field pointing to `"./dist/index.js"` and `"./dist/index.d.ts"`, update `"main"` to `"./dist/index.js"`, and update `"types"` to `"./dist/index.d.ts"`. Add a build step to CI for standalone repos.

**Duplicate artifact declaration (manifest in code + manifest in `package.json`):**
- Issue: The artifact configuration (`accepts`, `skills`, `matcherConfidenceThreshold`) is declared twice — once in `src/index.ts` as a TypeScript constant and again verbatim in the `cinatra` field of `package.json`. These two definitions can drift out of sync silently.
- Files: `src/index.ts`, `package.json`
- Impact: Any change to accepted MIME types or confidence threshold requires a two-file edit. A partial update would produce inconsistent runtime vs. registry behavior with no compile-time or CI check catching the divergence.
- Fix approach: Make `package.json`'s `cinatra.artifact` block the canonical source (used by the registry/marketplace), and have `src/index.ts` import and re-export from `package.json` via `resolveJsonModule`, or generate one from the other as part of the build. Add a CI lint step that diffs the two representations.

## Known Bugs

**No known bugs detected** — the codebase is a minimal manifest-only extension with a single 23-line source file. No runtime logic, no algorithmic code, and no test output to surface bugs from.

## Security Considerations

**`.npmrc` present — may contain registry token:**
- Risk: The `.npmrc` file at the repo root is committed to source control. If it contains an `//registry.npmrc.org/:_authToken=...` line or similar, tokens are exposed to anyone with repo access.
- Files: `.npmrc`
- Current mitigation: File existence noted; contents not read per security policy.
- Recommendations: Verify `.npmrc` contains no auth tokens. Registry tokens should be injected at CI time via `NODE_AUTH_TOKEN` environment variable, not committed. Add `.npmrc` to `.gitignore` if it contains or may contain tokens.

**LLM matcher prompt has no output schema enforcement beyond documentation:**
- Risk: The `skills/screenshot-matcher/SKILL.md` specifies a JSON output contract (`{ "matches": boolean, "confidence": number, "rationale": string }`), but the contract is expressed only in prose and a fenced code block. No JSON Schema, Zod, or structured-output binding enforces it. A model returning malformed JSON or missing fields would propagate silently unless the consuming runtime validates.
- Files: `skills/screenshot-matcher/SKILL.md`
- Current mitigation: The confidence threshold at 0.7 provides a numeric guard, but only if the field is present and parseable.
- Recommendations: Validate matcher output against a JSON Schema at the runtime boundary. Document whether the Cinatra SDK enforces structured output or delegates validation to the extension author.

## Performance Bottlenecks

**Not applicable** — no runtime code exists in this repository. All logic is delegated to the Cinatra SDK and the LLM matcher at runtime.

## Fragile Areas

**CI skip logic relies on first-party peer presence — could silently under-test:**
- Files: `.github/workflows/ci.yml`
- Why fragile: The CI workflow detects "source mirror" vs "standalone" by checking whether any `@cinatra-ai/*` or `@cinatra/*` peer dependency exists. If a future version of this package adds a first-party peer for a different reason, all standalone install, typecheck, and test steps are silently skipped. The skip is honest-but-invisible — no explicit test run result is produced.
- Safe modification: Any change to `peerDependencies` must be accompanied by a review of which CI steps will be skipped as a result.
- Test coverage: Zero test files exist in this repo. All testing is deferred to the cinatra monorepo.

**Confidence threshold hardcoded in two places:**
- Files: `src/index.ts` (line 22), `package.json` (line 35)
- Why fragile: The value `0.7` appears in both places with no cross-reference. A tuning change that updates one but not the other will cause the registry-registered threshold and the SDK-consumed threshold to diverge.
- Safe modification: Change both locations atomically and add a CI assertion that compares the two values.

## Scaling Limits

**Not applicable** — this is a static artifact manifest with no server-side code or stateful resources.

## Dependencies at Risk

**`@cinatra-ai/sdk-extensions` wildcard peer (`"*"`):**
- Risk: The peer dependency is pinned to `"*"`, meaning any version satisfies the constraint. Breaking changes in `@cinatra-ai/sdk-extensions` (e.g., changes to the `SemanticArtifactManifest` type shape) will not be caught by the dependency declaration itself.
- Files: `package.json`
- Impact: A major version bump in the SDK that renames or removes `SemanticArtifactManifest` fields would silently break the type import in `src/index.ts` — caught only when the monorepo runs its typecheck.
- Migration plan: Pin to a minimum semver range (e.g. `">=0.1.0 <2.0.0"`) once the SDK versioning stabilizes, so incompatible SDK updates produce a peer conflict error at install time.

**Release workflow depends on a non-existent org reusable workflow:**
- Risk: `.github/workflows/release.yml` calls `cinatra-ai/.github/.github/workflows/reusable-extension-release.yml@main`. If this reusable workflow does not yet exist in the org (the file comment says "Dormant until the org infra exists"), any GitHub Release will trigger a workflow that immediately fails with a "workflow not found" error.
- Files: `.github/workflows/release.yml`
- Impact: Publishing is fully blocked until the org-level reusable workflow and `CINATRA_MARKETPLACE_VENDOR_TOKEN` secret are provisioned.
- Migration plan: Add a check or branch condition that validates the reusable workflow exists before calling it, or document the explicit prerequisite steps required before the first release.

## Missing Critical Features

**No test files:**
- Problem: The repository contains zero test files. The CI `Test` step uses `--if-present` and exits cleanly with no tests run. There is no validation that the manifest constant in `src/index.ts` is structurally valid, that both manifest copies are in sync, or that the SKILL.md prompt produces correctly structured output.
- Blocks: Confidence that regressions in manifest shape, MIME type lists, or confidence threshold changes are caught before merge.

**No build script or `dist/` output:**
- Problem: `tsconfig.json` specifies `"outDir": "dist"` and `"noEmit": false`, but `package.json` has no `"build"` script and the CI workflow does not run a build step. The `dist/` directory is never generated in CI. The `npm pack --dry-run` step would pack `src/index.ts` (a TypeScript source file), not compiled JS.
- Blocks: Correct npm package publication for consumers outside the monorepo.

## Test Coverage Gaps

**Entire codebase is untested:**
- What's not tested: Manifest shape validity, MIME type list correctness, confidence threshold value, JSON sync between `src/index.ts` and `package.json`, and SKILL.md prompt output contract.
- Files: `src/index.ts`, `skills/screenshot-matcher/SKILL.md`, `package.json`
- Risk: Silent regressions in any of the above pass CI with a green checkmark because no assertions exist.
- Priority: Medium — the package is small but the dual-source-of-truth between `src/index.ts` and `package.json` is the highest-risk surface; a simple snapshot or equality test would catch drift.

---

*Concerns audit: 2026-06-09*

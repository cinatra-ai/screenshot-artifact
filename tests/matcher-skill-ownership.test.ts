import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { screenshotArtifactManifest } from "../src/index";

// THE MATCHER SKILL IS OWNED BY A SIBLING `-skill` PACKAGE, and this pack
// reaches it through a DECLARED PROVIDER EDGE.
//
// The host honours a candidate matcher skill on one of two arms: the skill is
// the resolved target of the artifact extension's declared `role:"matcher"`
// edge (post-extraction), or the skill is package-owned by the artifact
// extension itself (pre-extraction). This pack took the package-owned arm and
// therefore shipped a `SKILL.md` inside a `kind:"artifact"` package — which the
// platform's skill-packaging verdict refuses outright
// (`skill-md-in-non-skill-package`), with an EMPTY fixture allowlist for
// extension repos and no declaration that can make it conform. Its own message
// names the only conforming road: "Extract it into a `-skill` extension and
// declare a dependency edge."
//
// So the bundle moves back to `@cinatra-ai/screenshot-matcher-skill`, the
// sibling `kind:"skill"` package that already ships it byte-for-byte, and this
// package declares the runtime matcher edge the host resolver reads. The edge
// shape below is the one `isRuntimeSkillEdge` + `edgeMatchesRole` accept:
// `kind:"skill"`, `requirement:"required"`, `edgeType:"runtime"`,
// `role:"matcher"` — the same shape the sibling artifact packs already carry.
//
// These assertions are the local, checkable half of that arm; the runtime half
// is enforced host-side against the installed catalog row.

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(path.join(packageRoot, "package.json"), "utf8"));

const MATCHER_SLUG = "screenshot-matcher";
const PROVIDER_PACKAGE = "@cinatra-ai/screenshot-matcher-skill";

/** The last version published while this package still owned the bundle. */
const LAST_PACKAGE_OWNED_VERSION = "0.1.2";

function idNamespace(skillId: string): string {
  return skillId.split(":")[0] ?? "";
}

describe("the matcher skill is owned by the sibling provider package", () => {
  const matchers: string[] = pkg.cinatra.artifact.skills.matchers;
  const deps: Array<Record<string, unknown>> = pkg.cinatra.dependencies ?? [];

  it("declares exactly one matcher skill", () => {
    expect(matchers).toHaveLength(1);
  });

  it("names the matcher skill in the PROVIDER package's id namespace", () => {
    for (const id of matchers) {
      expect(idNamespace(id)).toBe(PROVIDER_PACKAGE);
    }
    expect(matchers).toEqual([`${PROVIDER_PACKAGE}:${MATCHER_SLUG}`]);
  });

  // The packaging verdict's rule, stated as an assertion: a `kind:"artifact"`
  // package must not ship a SKILL.md anywhere in its tree.
  it("ships no embedded skill bundle of its own", () => {
    expect(existsSync(path.join(packageRoot, "skills"))).toBe(false);
    expect(existsSync(path.join(packageRoot, "skills", MATCHER_SLUG, "SKILL.md"))).toBe(false);
  });

  it("does not publish a skills directory", () => {
    expect(pkg.files).not.toContain("skills");
  });

  // The exact shape the host's declared-edge resolver accepts. A wrong
  // `edgeType`, `requirement` or `role` resolves to nothing, and the host then
  // falls back to the package-owned anchor — which, with the bundle gone, holds
  // for nothing and refuses the skill outright.
  it("declares the runtime matcher edge on the provider package", () => {
    const matcherEdges = deps.filter((d) => d.role === "matcher");
    expect(matcherEdges).toHaveLength(1);
    expect(matcherEdges[0]).toMatchObject({
      packageName: PROVIDER_PACKAGE,
      kind: "skill",
      role: "matcher",
      edgeType: "runtime",
      requirement: "required",
    });
  });

  it("keeps the exported manifest mirror in step with package.json", () => {
    expect(screenshotArtifactManifest.skills?.matchers).toEqual(matchers);
  });

  // The registry is version-immutable and this package publishes on a
  // `v<package.json .version>` tag, so an ownership change that reused the
  // version under which the package-owned manifest shipped could never reach an
  // installed workspace: the release would be refused and every install would
  // keep resolving the old bytes.
  it("ships under a version later than the last package-owned release", () => {
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(pkg.version).not.toBe(LAST_PACKAGE_OWNED_VERSION);
    const asParts = (v: string) => v.split(".").map(Number);
    const [major, minor, patch] = asParts(pkg.version);
    const [lastMajor, lastMinor, lastPatch] = asParts(LAST_PACKAGE_OWNED_VERSION);
    expect(
      major > lastMajor ||
        (major === lastMajor && minor > lastMinor) ||
        (major === lastMajor && minor === lastMinor && patch > lastPatch),
    ).toBe(true);
  });
});

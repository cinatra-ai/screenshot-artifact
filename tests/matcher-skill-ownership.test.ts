import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { screenshotArtifactManifest } from "../src/index";

// The platform's matcher-trust rule honours a candidate matcher skill on one of
// two arms only: the skill is the resolved target of a declared post-extraction
// provider edge, or the skill is PACKAGE-OWNED by the artifact extension's own
// package. This pack takes the package-owned arm, so its matcher skill must
// ship inside this package: the declared skill id self-namespaced to this
// package's name, and the bundle itself co-located at the conventional
// `skills/<slug>/SKILL.md` path from which the owning package name is derived.
// These assertions are the local, checkable half of that arm; the runtime half
// is enforced host-side against the installed catalog row.

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(path.join(packageRoot, "package.json"), "utf8"));

const MATCHER_SLUG = "screenshot-matcher";

/** The last version published while the matcher skill was owned by the sibling package. */
const LAST_SIBLING_OWNED_VERSION = "0.1.1";

function idNamespace(skillId: string): string {
  return skillId.split(":")[0] ?? "";
}

function skillSlug(skillId: string): string {
  return skillId.split(":")[1] ?? "";
}

/** Read the `name:` field out of a SKILL.md YAML frontmatter block. */
function frontmatterName(source: string): string | null {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
  if (!match) return null;
  const line = match[1].split(/\r?\n/).find((l) => /^name:\s*/.test(l));
  return line ? line.replace(/^name:\s*/, "").trim() : null;
}

describe("the matcher skill is owned by this package", () => {
  const matchers: string[] = pkg.cinatra.artifact.skills.matchers;

  it("declares exactly one matcher skill", () => {
    expect(matchers).toHaveLength(1);
  });

  it("names the matcher skill in this package's own id namespace", () => {
    for (const id of matchers) {
      expect(idNamespace(id)).toBe(pkg.name);
    }
  });

  it("ships the matcher bundle at the co-located skills path the owner is derived from", () => {
    for (const id of matchers) {
      const skillMd = path.join(packageRoot, "skills", skillSlug(id), "SKILL.md");
      expect(existsSync(skillMd)).toBe(true);
      expect(frontmatterName(readFileSync(skillMd, "utf8"))).toBe(skillSlug(id));
    }
  });

  it("includes the skills directory in the published files allowlist", () => {
    expect(pkg.files).toContain("skills");
  });

  it("declares no dependency edge on a sibling matcher-skill package", () => {
    const deps: Array<{ packageName?: string; role?: string }> = pkg.cinatra.dependencies ?? [];
    expect(deps.filter((d) => d.role === "matcher")).toEqual([]);
    expect(deps.map((d) => d.packageName)).not.toContain("@cinatra-ai/screenshot-matcher-skill");
  });

  it("keeps the exported manifest mirror in step with package.json", () => {
    expect(screenshotArtifactManifest.skills?.matchers).toEqual(matchers);
    expect(matchers).toEqual([`${pkg.name}:${MATCHER_SLUG}`]);
  });

  // The registry is version-immutable and this package publishes on a
  // `v<package.json .version>` tag, so an ownership change that reuses the
  // version under which the sibling-owned manifest shipped could never reach an
  // installed workspace: the release would be refused and every install would
  // keep resolving the old bytes, with the manifest reading as package-owned
  // while no catalog row was ever registered from this package.
  it("ships under a version later than the last sibling-owned release", () => {
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(pkg.version).not.toBe(LAST_SIBLING_OWNED_VERSION);
    const asParts = (v: string) => v.split(".").map(Number);
    const [major, minor, patch] = asParts(pkg.version);
    const [lastMajor, lastMinor, lastPatch] = asParts(LAST_SIBLING_OWNED_VERSION);
    expect(
      major > lastMajor ||
        (major === lastMajor && minor > lastMinor) ||
        (major === lastMajor && minor === lastMinor && patch > lastPatch),
    ).toBe(true);
  });
});

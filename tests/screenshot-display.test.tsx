import { createRequire } from "node:module";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  HOST_PROPS_API_VERSION,
  HOST_PROPS_BYTE_REFERENCE_VERSION,
  HOST_PROPS_V2_ARTIFACT_FIELDS,
  HOST_PROPS_V2_BYTES_FIELDS,
  HOST_PROPS_V2_FIELDS,
  rendererPropsShapeDrift,
  type ArtifactRendererProps,
} from "../src/renderer-props";
import ScreenshotDetailRenderer from "../src/renderers/detail";
import {
  SCREENSHOT_DISPLAY_CONFORMANCE_ID,
  capturedAgo,
  resolveScreenshotView,
  screenshotAspect,
  screenshotFacts,
} from "../src/renderers/screenshot-view";

const require_ = createRequire(import.meta.url);
const manifest = require_("../package.json");

const NOW = Date.parse("2026-08-31T12:00:00.000Z");

// The ISLAND byte address the host props carry — the one address the display is
// allowed to paint from. The session route below is deliberately DIFFERENT, so
// a display that reached for the host route instead would be caught by markup.
const ISLAND_PREVIEW = "/api/lifecycle-views/artifact-bytes?bc=sealed-preview";
const ISLAND_DOWNLOAD = "/api/lifecycle-views/artifact-bytes?bc=sealed-download";
const SESSION_PREVIEW = "/api/artifacts/art_1/versions/rev_66d0/preview";
const SESSION_DOWNLOAD = "/api/artifacts/art_1/versions/rev_66d0/download";

function props(overrides: Partial<ArtifactRendererProps> = {}): ArtifactRendererProps {
  return {
    propsApiVersion: 2,
    artifact: {
      id: "art_1",
      title: "Checkout — step 2",
      objectType: "@cinatra-ai/screenshot-artifact:screenshot",
      mime: "image/png",
      size: 204_800,
      createdAt: "2026-08-31T11:48:00.000Z",
      updatedAt: "2026-08-31T11:48:00.000Z",
      ownerLevel: "workspace",
      visibility: "team",
      sourceUrl: null,
    },
    representation: { revisionId: "rev_66d0", mime: "image/png" },
    urls: { preview: SESSION_PREVIEW, download: SESSION_DOWNLOAD },
    identity: { kind: "extension", extension: "@cinatra-ai/screenshot-artifact" },
    actions: { download: SESSION_DOWNLOAD, openInSource: null },
    content: {
      kind: "object",
      channelVersion: 1,
      source: "snapshot",
      representationRevisionId: "rev_66d0",
      objectType: "@cinatra-ai/screenshot-artifact:screenshot",
      data: {
        capturedUrl: "https://shop.acme.example/checkout",
        viewport: { width: 1440, height: 900 },
        capturedAt: "2026-08-31T11:48:00.000Z",
      },
      digest: "sha256-abc",
      byteLength: 120,
      projectedByteLength: 120,
      cap: 262_144,
    },
    bytes: { road: "island", preview: ISLAND_PREVIEW, download: ISLAND_DOWNLOAD },
    ...overrides,
  };
}

describe("the manifest declares the display and the schema it draws from", () => {
  const artifact = manifest.cinatra.artifact;

  it("registers a detail renderer for its own type at the new props version", () => {
    expect(artifact.ui.renderers.detail.propsApiVersion).toBe(HOST_PROPS_API_VERSION);
    expect(artifact.ui.renderers.detail.entry).toBe("./src/renderers/detail.tsx");
    expect(artifact.ui.renderers.detail.representations).toEqual([
      "image/png",
      "image/jpeg",
      "image/webp",
    ]);
    // A display registered for a type draws EVERY form that type accepts.
    expect(artifact.ui.renderers.detail.representations).toEqual(
      artifact.accepts.file.mimeTypes,
    );
  });

  it("gains the object-data schema its claim had none of — with the drawn facts in it", () => {
    const schema = artifact.objectTypes[0].schema;
    expect(schema).toBeTypeOf("object");
    expect(schema.type).toBe("object");
    // The three facts the drawing names: where, at what viewport, and when.
    expect(Object.keys(schema.properties)).toEqual(
      expect.arrayContaining(["capturedUrl", "viewport", "capturedAt"]),
    );
    expect(schema.properties.viewport.properties.width.type).toBe("integer");
    expect(schema.properties.viewport.properties.height.type).toBe("integer");
  });

  it("resolves the display through the package's own exports map", async () => {
    expect(manifest.exports["./src/renderers/detail"]).toBeTruthy();
    const target = manifest.exports["./src/renderers/detail"].default;
    expect(target).toBe("./src/renderers/detail.tsx");
    const mod = await import("../src/renderers/detail");
    expect(typeof mod.default).toBe("function");
  });
});

describe("the props mirror matches the host's version-2 shape", () => {
  it("names the version the byte reference arrives at", () => {
    expect(HOST_PROPS_API_VERSION).toBe(2);
    expect(HOST_PROPS_BYTE_REFERENCE_VERSION).toBe(2);
  });

  it("reports no drift for a host-shaped version-2 snapshot", () => {
    expect(rendererPropsShapeDrift(props())).toEqual([]);
  });

  it("reports no drift for a version-1 snapshot, which carries no byte field at all", () => {
    const v1 = props({ propsApiVersion: 1 });
    delete (v1 as { bytes?: unknown }).bytes;
    expect(rendererPropsShapeDrift(v1)).toEqual([]);
  });

  it("catches a version-1 snapshot that carries the byte reference anyway", () => {
    expect(rendererPropsShapeDrift(props({ propsApiVersion: 1 }))).toContain(
      "bytes: present on a snapshot below version 2",
    );
  });

  it("catches an unknown field, a missing field and an unknown byte road", () => {
    expect(
      rendererPropsShapeDrift({ ...props(), somethingElse: 1 }),
    ).toContain("somethingElse: not a field of the host version-2 snapshot");
    const missing = props();
    delete (missing as { content?: unknown }).content;
    expect(rendererPropsShapeDrift(missing)).toContain("content: missing");
    expect(
      rendererPropsShapeDrift(
        props({ bytes: { road: "public", preview: null, download: null } as never }),
      ),
    ).toContain('bytes.road: "public" is not a host byte road');
  });

  it("mirrors the host rosters the display reads", () => {
    expect(HOST_PROPS_V2_FIELDS).toContain("bytes");
    expect(HOST_PROPS_V2_FIELDS).toContain("content");
    expect(HOST_PROPS_V2_BYTES_FIELDS).toEqual(["road", "preview", "download"]);
    expect(HOST_PROPS_V2_ARTIFACT_FIELDS).toContain("sourceUrl");
  });
});

describe("the picture is painted through the island byte reference", () => {
  it("draws the byte address and never the host session route", () => {
    const html = renderToStaticMarkup(
      createElement(ScreenshotDetailRenderer, { ...props(), now: NOW }),
    );
    expect(html).toContain(`src="${ISLAND_PREVIEW}"`);
    expect(html).not.toContain(SESSION_PREVIEW);
    expect(html).not.toContain(SESSION_DOWNLOAD);
    expect(html).toContain(`data-byte-road="island"`);
  });

  it("draws the same way on a cookie surface, where the road is the session one", () => {
    const html = renderToStaticMarkup(
      createElement(ScreenshotDetailRenderer, {
        ...props({
          bytes: { road: "session", preview: SESSION_PREVIEW, download: SESSION_DOWNLOAD },
        }),
        now: NOW,
      }),
    );
    expect(html).toContain(`src="${SESSION_PREVIEW}"`);
    expect(html).toContain(`data-byte-road="session"`);
  });

  it("fetches nothing of its own — the module names no fetcher", async () => {
    const { readFile } = await import("node:fs/promises");
    const source = await readFile(
      new URL("../src/renderers/detail.tsx", import.meta.url),
      "utf8",
    );
    const view = await readFile(
      new URL("../src/renderers/screenshot-view.ts", import.meta.url),
      "utf8",
    );
    for (const module of [source, view]) {
      expect(module).not.toMatch(/\bfetch\s*\(/);
      expect(module).not.toMatch(/XMLHttpRequest/);
      expect(module).not.toMatch(/EventSource|WebSocket/);
      expect(module).not.toMatch(/useEffect/);
    }
  });

  it("refuses an address that carries the work's bytes inline", () => {
    const view = resolveScreenshotView(
      props({
        bytes: {
          road: "island",
          preview: "data:image/png;base64,iVBORw0KGgo=",
          download: null,
        },
      }),
    );
    expect(view).toEqual({ kind: "floor", reason: "inline-bytes" });
  });
});

describe("the where, the viewport and the when", () => {
  it("draws the three facts the way the drawing reads them", () => {
    const html = renderToStaticMarkup(
      createElement(ScreenshotDetailRenderer, { ...props(), now: NOW }),
    );
    expect(html).toContain("shop.acme.example/checkout");
    expect(html).toContain("1440×900");
    expect(html).toContain("captured 12 minutes ago");
    expect(html).toContain("·");
  });

  it("reads the facts off the object projection, and says which are absent", () => {
    const facts = screenshotFacts(props(), NOW);
    expect(facts).toEqual({
      where: "shop.acme.example/checkout",
      viewport: "1440×900",
      when: "captured 12 minutes ago",
    });
    // NO OBJECT PROJECTION — which is every screenshot that arrived as a plain
    // upload. All three facts are absent, and ALL THREE are left out. The row
    // carries a `sourceUrl` and a `createdAt` that look like answers: printing
    // them under "where it was taken" and "captured … ago" would state a fact
    // nobody recorded, so the line simply gets shorter.
    const bare = screenshotFacts(
      props({
        artifact: { ...props().artifact, sourceUrl: "https://drive.example/f/9" },
        content: { kind: "none", channelVersion: 1, representationRevisionId: null, reason: "absent" },
      }),
      NOW,
    );
    expect(bare.where).toBeNull();
    expect(bare.viewport).toBeNull();
    expect(bare.when).toBeNull();
    // And the display draws no facts line at all rather than an empty one.
    const html = renderToStaticMarkup(
      createElement(ScreenshotDetailRenderer, {
        ...props({
          artifact: { ...props().artifact, sourceUrl: "https://drive.example/f/9" },
          content: { kind: "none", channelVersion: 1, representationRevisionId: null, reason: "absent" },
        }),
        now: NOW,
      }),
    );
    expect(html).toContain("<img");
    expect(html).not.toContain("drive.example");
    expect(html).not.toContain("captured");
  });

  it("draws the capture to the aspect of the viewport it was taken at", () => {
    expect(screenshotAspect(props())).toBe("1440 / 900");
    const html = renderToStaticMarkup(
      createElement(ScreenshotDetailRenderer, { ...props(), now: NOW }),
    );
    expect(html).toContain('data-capture-aspect="1440 / 900"');
    expect(html).toMatch(/aspect-ratio:\s*1440 \/ 900/);
  });

  it("draws no aspect it cannot be true to, when no viewport was recorded", () => {
    const noViewport = props({
      content: { kind: "none", channelVersion: 1, representationRevisionId: null, reason: "absent" },
    });
    expect(screenshotAspect(noViewport)).toBeNull();
    const html = renderToStaticMarkup(
      createElement(ScreenshotDetailRenderer, { ...noViewport, now: NOW }),
    );
    expect(html).not.toMatch(/aspect-ratio/);
    expect(html).toContain("<img");
  });

  it("says how long ago in the drawing's own words", () => {
    expect(capturedAgo("2026-08-31T11:59:40.000Z", NOW)).toBe("captured just now");
    expect(capturedAgo("2026-08-31T11:48:00.000Z", NOW)).toBe("captured 12 minutes ago");
    expect(capturedAgo("2026-08-31T09:00:00.000Z", NOW)).toBe("captured 3 hours ago");
    expect(capturedAgo("2026-08-29T12:00:00.000Z", NOW)).toBe("captured 2 days ago");
    expect(capturedAgo(null, NOW)).toBeNull();
    expect(capturedAgo("not a date", NOW)).toBeNull();
    // A stamp in the future is not an age — it is not "just now".
    expect(capturedAgo("2026-09-01T12:00:00.000Z", NOW)).toBeNull();
  });
});

describe("the floors — a named gap, never a blank plate", () => {
  it("refuses to render when the host offers an older props version", () => {
    const older = props({ propsApiVersion: 1 });
    delete (older as { bytes?: unknown }).bytes;
    const html = renderToStaticMarkup(
      createElement(ScreenshotDetailRenderer, { ...older, now: NOW }),
    );
    expect(html).toContain('data-floor="props-version-too-old"');
    expect(html).toContain("This screenshot needs a newer display contract");
    expect(html).not.toContain("<img");
    expect(html.length).toBeGreaterThan(0);
    expect(resolveScreenshotView(older)).toEqual({
      kind: "floor",
      reason: "props-version-too-old",
    });
  });

  it("says there is no picture — not that the workspace is behind — on a current snapshot that names no bytes", () => {
    // The host omits `bytes` entirely where the revision has neither address.
    // That is a fact about the WORK; telling the reader they need a newer
    // contract would be a false sentence about their deployment.
    const currentButAddressless = props();
    delete (currentButAddressless as { bytes?: unknown }).bytes;
    expect(resolveScreenshotView(currentButAddressless)).toEqual({
      kind: "floor",
      reason: "no-bytes",
    });
    const html = renderToStaticMarkup(
      createElement(ScreenshotDetailRenderer, { ...currentButAddressless, now: NOW }),
    );
    expect(html).toContain('data-floor="no-bytes"');
    expect(html).toContain("This screenshot cannot be shown here");
    expect(html).not.toContain("newer display contract");
  });

  it("draws the named gap when the bytes are refused", () => {
    const html = renderToStaticMarkup(
      createElement(ScreenshotDetailRenderer, {
        ...props({ bytes: { road: "island", preview: null, download: null } }),
        now: NOW,
      }),
    );
    expect(html).toContain('data-floor="no-bytes"');
    expect(html).not.toContain("<img");
    expect(html).toContain("This screenshot cannot be shown here");
  });

  it("carries the conformance id on every reading", () => {
    expect(SCREENSHOT_DISPLAY_CONFORMANCE_ID).toBe("screenshot-display");
    const drawn = renderToStaticMarkup(
      createElement(ScreenshotDetailRenderer, { ...props(), now: NOW }),
    );
    const floored = renderToStaticMarkup(
      createElement(ScreenshotDetailRenderer, {
        ...props({ bytes: { road: "island", preview: null, download: null } }),
        now: NOW,
      }),
    );
    for (const html of [drawn, floored]) {
      expect(html).toContain('data-conformance-id="screenshot-display"');
      expect(html).toContain('data-artifact-renderer="screenshot"');
      expect(html).toContain('data-slot="detail"');
    }
  });
});

// LOCAL, STRUCTURAL MIRROR of the host renderer-props contract at PROPS VERSION
// 2 — the versioned, normalized, SERIALIZABLE snapshot an extension-shipped
// artifact display receives.
//
// THE TYPE IS THE SDK'S, NOT A COPY OF IT. The host publishes the author-facing
// snapshot type from the SDK leaf this package already declares as a peer —
// `@cinatra-ai/sdk-extensions/artifact-renderer-props` — precisely so that a
// display "depends ONLY on `@cinatra-ai/sdk-extensions` and never reaches into
// the host". This module RE-EXPORTS that type rather than restating it: a
// restated interface widens what the host narrows (an `ownerLevel` retyped as
// `string` accepts a value the host can never send) and goes stale silently,
// which is the one failure a display meets as a blank panel.
//
// WHAT IS LOCAL, AND WHY. The rosters and `rendererPropsShapeDrift` below are
// RUNTIME values; the SDK leaf is a pure type module and exports none. They are
// this repo's alarm for a snapshot that does not have the shape the type
// promises — a different question from whether the type compiles, and the only
// one a shipped display can still ask at render time.
//
// WHAT VERSION 2 ADDED, AND WHY THIS DISPLAY DECLARES IT. Version 2 carries the
// island-scoped BYTE REFERENCE: the address a reader may actually fetch on the
// surface they are on. The session addresses under `urls` are cookie-gated, and
// a subresource load from inside somebody else's website carries no cookie — so
// a media display painting from them draws a blank plate there. A display that
// declares version 1 is handed a snapshot with NO `bytes` key at all, which is
// why this display declares 2 and floors rather than paints when it is handed
// an older shape.
//
// AN ADDRESS, NEVER A PAYLOAD. No field of the snapshot may carry the work's
// bytes in any encoding on any road; the host asserts it where the snapshot is
// built, and the displays in this repo refuse an address that carries them
// anyway rather than painting one.

/** The props-contract version this display is written against. */
export const HOST_PROPS_API_VERSION = 2;

/**
 * The version at which the snapshot began carrying the byte reference — a
 * SEPARATE name from the version above, mirroring the host's own split: the
 * first is "the contract this display reads", the second is "the version a
 * display must declare to be handed the island road".
 */
export const HOST_PROPS_BYTE_REFERENCE_VERSION = 2;

/** Every top-level field of the host's version-2 snapshot. */
export const HOST_PROPS_V2_FIELDS = [
  "propsApiVersion",
  "artifact",
  "representation",
  "urls",
  "identity",
  "actions",
  "content",
  "bytes",
] as const;

/** The one field that is ABSENT — not null — below the byte-reference version. */
const HOST_PROPS_V2_ONLY_FIELDS = ["bytes"] as const;

/** Every field of the snapshot's row projection. */
export const HOST_PROPS_V2_ARTIFACT_FIELDS = [
  "id",
  "title",
  "objectType",
  "mime",
  "size",
  "createdAt",
  "updatedAt",
  "ownerLevel",
  "visibility",
  "sourceUrl",
] as const;

/** Every field of the byte reference. */
export const HOST_PROPS_V2_BYTES_FIELDS = ["road", "preview", "download"] as const;

/** The two roads a byte reference can name. */
export const HOST_PROPS_V2_BYTE_ROADS = ["session", "island"] as const;

/** Which road the addresses on a snapshot are on. */
export type ArtifactByteRoad = (typeof HOST_PROPS_V2_BYTE_ROADS)[number];

/**
 * The discriminated content projection the host reads from the pinned revision
 * on the server. A display switches on `kind`; it never infers a class from a
 * mime and it never fetches. `none` is a first-class answer with a named reason.
 */
// The snapshot type and its content projection, from the SDK leaf that owns
// them. `import type` erases at build time, so a standalone checkout — where an
// OPTIONAL peer does not resolve — still runs these modules unchanged.
export type { ArtifactRendererProps } from "@cinatra-ai/sdk-extensions/artifact-renderer-props";
export type { ArtifactContentProjection } from "@cinatra-ai/sdk-extensions/artifact-content-channel";

import type { ArtifactRendererProps } from "@cinatra-ai/sdk-extensions/artifact-renderer-props";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * THE DRIFT ALARM. Report every way `snapshot` fails to be a host version-2
 * snapshot — an unknown field, a missing one, a byte reference on a shape too
 * old to carry it, an unknown road. An empty list means the mirror above and the
 * snapshot the host builds still agree about their shape.
 *
 * It is deliberately STRUCTURAL and not a validator of values: a display floors
 * on the values it cannot draw, and that is a different job with a different
 * answer for the reader.
 */
export function rendererPropsShapeDrift(snapshot: unknown): string[] {
  const drift: string[] = [];
  if (!isObject(snapshot)) return ["the snapshot is not an object"];

  const known = new Set<string>(HOST_PROPS_V2_FIELDS);
  for (const field of Object.keys(snapshot)) {
    if (!known.has(field)) {
      drift.push(`${field}: not a field of the host version-2 snapshot`);
    }
  }
  const optional = new Set<string>(HOST_PROPS_V2_ONLY_FIELDS);
  for (const field of HOST_PROPS_V2_FIELDS) {
    if (!(field in snapshot) && !optional.has(field)) drift.push(`${field}: missing`);
  }

  const version = snapshot.propsApiVersion;
  if (typeof version !== "number" || !Number.isInteger(version) || version <= 0) {
    drift.push("propsApiVersion: not a positive integer");
  }

  const artifact = snapshot.artifact;
  if (isObject(artifact)) {
    const knownArtifact = new Set<string>(HOST_PROPS_V2_ARTIFACT_FIELDS);
    for (const field of Object.keys(artifact)) {
      if (!knownArtifact.has(field)) drift.push(`artifact.${field}: not a host field`);
    }
    for (const field of HOST_PROPS_V2_ARTIFACT_FIELDS) {
      if (!(field in artifact)) drift.push(`artifact.${field}: missing`);
    }
  } else if ("artifact" in snapshot) {
    drift.push("artifact: not an object");
  }

  if ("bytes" in snapshot) {
    const bytes = snapshot.bytes;
    if (typeof version === "number" && version < HOST_PROPS_BYTE_REFERENCE_VERSION) {
      drift.push("bytes: present on a snapshot below version 2");
    }
    if (!isObject(bytes)) {
      drift.push("bytes: not an object");
    } else {
      const knownBytes = new Set<string>(HOST_PROPS_V2_BYTES_FIELDS);
      for (const field of Object.keys(bytes)) {
        if (!knownBytes.has(field)) drift.push(`bytes.${field}: not a host field`);
      }
      for (const field of HOST_PROPS_V2_BYTES_FIELDS) {
        if (!(field in bytes)) drift.push(`bytes.${field}: missing`);
      }
      const roads = new Set<string>(HOST_PROPS_V2_BYTE_ROADS);
      if (typeof bytes.road !== "string" || !roads.has(bytes.road)) {
        drift.push(`bytes.road: ${JSON.stringify(bytes.road)} is not a host byte road`);
      }
    }
  }

  return drift;
}

/**
 * WHETHER THE SNAPSHOT IS OLD ENOUGH TO REFUSE. A display that declared version
 * 2 can still be handed an older shape — a host inside the negotiation window
 * builds a display the version it asked for, and a deployment can be behind. The
 * answer is a typed floor, never a blank panel and never a guess at the missing
 * field.
 */
export function isBelowByteReferenceVersion(props: ArtifactRendererProps): boolean {
  return (
    typeof props.propsApiVersion !== "number" ||
    props.propsApiVersion < HOST_PROPS_BYTE_REFERENCE_VERSION
  );
}

/**
 * WHETHER THIS SNAPSHOT NAMES A BYTE REFERENCE AT ALL — a SEPARATE question
 * from the version above, and the reason the two are not one function.
 *
 * A CURRENT snapshot can legitimately carry no `bytes` key. The host omits the
 * field where the revision has neither address: "a road named over nothing
 * reads to a display as 'there is a session road here and it is empty' rather
 * than the truth, 'this revision has no bytes'." Folding that case into the
 * version test would tell a reader on a fully current workspace that they need
 * a newer contract — a sentence about the deployment that is simply false, in
 * place of the true one about the work.
 */
export function hasByteReference(props: ArtifactRendererProps): boolean {
  return props.bytes !== undefined;
}

/**
 * AN ADDRESS THAT IS ACTUALLY AN ADDRESS. A blank or whitespace-only string is
 * one a browser resolves to the page itself — it would paint the page where the
 * work belongs — so it is read here as no address at all.
 */
export function normalizeAddress(href: string | null | undefined): string | null {
  if (typeof href !== "string") return null;
  const trimmed = href.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * WHETHER AN ADDRESS CARRIES THE WORK'S BYTES INSTEAD OF NAMING THEM. The host
 * asserts this where it builds a snapshot; a display that met one anyway would
 * paint bytes that travelled with the props onto every surface the props reach,
 * so it refuses to draw it. A TEXTUAL `data:` URI is not refused — the content
 * channel legitimately projects capped text — because the rule is about the
 * work's bytes, not about the scheme.
 */
export function addressCarriesInlineBytes(href: string | null): boolean {
  const address = normalizeAddress(href);
  if (address === null || !/^\s*data:/i.test(address)) return false;
  const media = address.slice(address.indexOf(":") + 1).split(/[;,]/, 1)[0].toLowerCase();
  return media !== "" && !media.startsWith("text/");
}

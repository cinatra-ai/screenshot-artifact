// THE SCREENSHOT DISPLAY'S RESOLVERS — the whole branch as pure functions over
// the authorized snapshot, so every reading is decided without React and can be
// tested one value at a time.
//
// THE DRAWING, IN ITS OWN WORDS: "A screenshot draws its picture. The display
// shows the captured picture and, beneath it, the facts that make a screenshot
// readable a week later: where it was taken, at what viewport, and when. The
// picture is fetched through the island-scoped byte road, so the display draws
// the same inside a third-party application as it does here; where the bytes are
// refused it draws the named gap, never a blank plate."
//
// WHERE THE PICTURE COMES FROM, EXACTLY. The BYTE REFERENCE on the props, and
// nothing else. The session addresses under `urls` are cookie-gated, so painting
// from them draws a blank plate inside somebody else's website — which is the
// whole reason the byte reference exists. The display never builds an address,
// never mints a capability and never fetches a host route of its own: it is
// handed an address and paints under it.
//
// WHERE THE FACTS COME FROM, EXACTLY. The object projection on the content
// channel — the entry's own structured data, against the object-data schema this
// package declares. A fact with no source is LEFT OUT rather than invented: a
// screenshot whose viewport nobody recorded says nothing about its viewport.

import {
  addressCarriesInlineBytes,
  hasByteReference,
  isBelowByteReferenceVersion,
  normalizeAddress,
  type ArtifactByteRoad,
  type ArtifactRendererProps,
} from "../renderer-props";

/** The drawing's conformance id for this display. */
export const SCREENSHOT_DISPLAY_CONFORMANCE_ID = "screenshot-display";

/** Why a floor was drawn — closed and named, so a surface can say which. */
export type ScreenshotFloorReason =
  /** The host offered a snapshot older than the byte reference. */
  | "props-version-too-old"
  /** There is a snapshot, and it names no address for the picture. */
  | "no-bytes"
  /** An address arrived carrying the work's bytes instead of naming them. */
  | "inline-bytes";

/** The resolved reading: the picture, or the named gap beneath it. */
export type ScreenshotView =
  | { kind: "picture"; src: string; alt: string; road: ArtifactByteRoad }
  | { kind: "floor"; reason: ScreenshotFloorReason };

/**
 * What a floor says to the reader. The two byte floors read the same sentence
 * on purpose — the distinction is for the surface, not for the person, who only
 * learns that this picture cannot be shown here.
 */
export const SCREENSHOT_FLOOR_MESSAGES: Readonly<
  Record<ScreenshotFloorReason, string>
> = Object.freeze({
  "props-version-too-old":
    "This screenshot needs a newer display contract than this workspace offers.",
  "no-bytes": "This screenshot cannot be shown here.",
  "inline-bytes": "This screenshot cannot be shown here.",
});

/** THE WHOLE BRANCH, as a total function over the authorized snapshot. */
export function resolveScreenshotView(props: ArtifactRendererProps): ScreenshotView {
  if (isBelowByteReferenceVersion(props)) {
    return { kind: "floor", reason: "props-version-too-old" };
  }
  // A CURRENT SNAPSHOT WITH NO BYTE REFERENCE IS NOT AN OLD ONE. The host omits
  // the field where the revision has neither address, so this is "there is no
  // picture to show", not "your workspace is behind" — and only one of those
  // two sentences is true to tell the reader.
  if (!hasByteReference(props)) return { kind: "floor", reason: "no-bytes" };
  const bytes = props.bytes;
  if (bytes === undefined) return { kind: "floor", reason: "no-bytes" };
  if (addressCarriesInlineBytes(bytes.preview)) {
    return { kind: "floor", reason: "inline-bytes" };
  }
  const src = normalizeAddress(bytes.preview);
  if (src === null) return { kind: "floor", reason: "no-bytes" };
  return {
    kind: "picture",
    src,
    alt: props.artifact.title ?? "Screenshot",
    road: bytes.road,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * The entry's own structured data, when the content channel carried it for THIS
 * type. A projection of another type's data is not read: a display that reached
 * into it would be drawing a record whose schema it does not know.
 */
function screenshotRecord(props: ArtifactRendererProps): Record<string, unknown> | null {
  const content: unknown = props.content;
  if (!isRecord(content) || content.kind !== "object") return null;
  if (content.objectType !== props.artifact.objectType) return null;
  return isRecord(content.data) ? content.data : null;
}

/**
 * WHERE IT WAS TAKEN, read the way the drawing prints it: the host and the path,
 * without the scheme — "shop.acme.example/checkout". The address is a plain
 * string on the record, so it is trimmed and printed, never resolved and never
 * fetched.
 */
export function formatWhere(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (trimmed === "") return null;
  const schemeIdx = trimmed.indexOf("://");
  const withoutScheme =
    schemeIdx > 0 && /^[a-z][a-z0-9+.-]*$/i.test(trimmed.slice(0, schemeIdx))
      ? trimmed.slice(schemeIdx + 3)
      : trimmed;
  let end = withoutScheme.length;
  while (end > 0 && withoutScheme.charAt(end - 1) === "/") end -= 1;
  const withoutTrailingSlash = withoutScheme.slice(0, end);
  return withoutTrailingSlash === "" ? null : withoutTrailingSlash;
}

/** AT WHAT VIEWPORT — "1440×900", or nothing when nobody recorded one. */
export function formatViewport(viewport: unknown): string | null {
  if (!isRecord(viewport)) return null;
  const { width, height } = viewport;
  if (typeof width !== "number" || typeof height !== "number") return null;
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  // The schema's own floor: a viewport is at least one device pixel each way.
  // A fraction below it is not a small screen, it is a value nobody measured.
  if (width < 1 || height < 1) return null;
  return `${Math.round(width)}×${Math.round(height)}`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * WHEN — in the drawing's own words, "captured 12 minutes ago". Coarse units on
 * purpose: a screenshot read a week later needs the age, not the second, and a
 * coarse unit is the one that stays true between a server render and the first
 * client pass.
 */
export function capturedAgo(at: unknown, now: number): string | null {
  if (typeof at !== "string") return null;
  const taken = Date.parse(at);
  if (Number.isNaN(taken)) return null;
  const elapsed = now - taken;
  // A stamp in the future is not an age. Reading it as "just now" would print
  // a confident sentence about a value that is wrong.
  if (elapsed < 0) return null;
  if (elapsed < MINUTE) return "captured just now";
  if (elapsed < HOUR) {
    const minutes = Math.floor(elapsed / MINUTE);
    return `captured ${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }
  if (elapsed < DAY) {
    const hours = Math.floor(elapsed / HOUR);
    return `captured ${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }
  const days = Math.floor(elapsed / DAY);
  return `captured ${days} ${days === 1 ? "day" : "days"} ago`;
}

/** The three facts beneath the picture. A fact with no source is null. */
export interface ScreenshotFacts {
  where: string | null;
  viewport: string | null;
  when: string | null;
}

/**
 * THE THREE FACTS, from the record and from nowhere else.
 *
 * NO FALLBACKS, deliberately, and this is the second thing the schema is for.
 * The row carries two fields that LOOK like answers and are not: `sourceUrl` is
 * where the file came from, which is not where a screen was photographed, and
 * `createdAt` is when the row was filed, which is not when the shutter went. A
 * display that printed either under the words "where it was taken" and
 * "captured … ago" would be stating a fact nobody recorded — and the drawing's
 * rule for a fact nobody recorded is the named gap, not a confident guess. An
 * absent fact is simply left out of the line.
 */
export function screenshotFacts(
  props: ArtifactRendererProps,
  now: number,
): ScreenshotFacts {
  const record = screenshotRecord(props);
  return {
    where: formatWhere(record?.capturedUrl),
    viewport: formatViewport(record?.viewport),
    when: capturedAgo(record?.capturedAt, now),
  };
}

/**
 * THE ASPECT THE CAPTURE IS DRAWN TO, as a CSS ratio — "1440 / 900".
 *
 * THE DRAWING'S RULE: "A capture — a page or a screen — is drawn to one aspect,
 * the viewport it was taken at, so the same picture area is the same shape at
 * every measure it is read on." The viewport is therefore not only a line of
 * text beneath the picture; it is the shape of the picture area itself, which is
 * what keeps one screenshot the same shape on the artifact page, on the run page
 * and in a conversation card.
 *
 * Null where no viewport was recorded — there is nothing to be true to, and a
 * guessed aspect would crop or letterbox every reading of that screenshot.
 */
export function screenshotAspect(props: ArtifactRendererProps): string | null {
  const record = screenshotRecord(props);
  const viewport = record?.viewport;
  if (!isRecord(viewport)) return null;
  const { width, height } = viewport;
  if (typeof width !== "number" || typeof height !== "number") return null;
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  if (width < 1 || height < 1) return null;
  return `${Math.round(width)} / ${Math.round(height)}`;
}

/** The facts line as the drawing sets it — present facts only, middot-joined. */
export function screenshotFactsLine(facts: ScreenshotFacts): string | null {
  const parts = [facts.where, facts.viewport, facts.when].filter(
    (part): part is string => part !== null,
  );
  return parts.length === 0 ? null : parts.join(" · ");
}

import type { SemanticArtifactManifest } from "@cinatra-ai/sdk-extensions";

// `@cinatra-ai/screenshot-artifact` accepts images classified as UI
// screenshots, not photographs, illustrations, or blog-attached images.
// Pixel-classified: the LLM matcher reads the image content directly via the
// attachment-resolver port.
//
// Scope: image/png + image/jpeg + image/webp. No image/gif here because
// animated UI captures are out of scope for the single-image matcher. No
// producer assertion is needed; image-generation producer paths leave the
// screenshot extension unchanged, while producer-only blog-image handling stays
// separate.
//
// THE TYPE THIS PACK OWNS IS DECLARED EXPLICITLY, never derived, and it now
// SHIPS ITS OBJECT-DATA SCHEMA. It was the one artifact type of the fleet whose
// claim declared none — the matcher classifies accepted images INTO the type, it
// does not describe them — and a claim without a schema is a type whose records
// nothing can read. The schema is what lets a screenshot's own facts reach a
// display through the content channel's object projection.
//
// THE SCHEMA'S THREE FACTS are the ones the ratified drawing draws beneath the
// picture: WHERE it was taken (`capturedUrl`), AT WHAT VIEWPORT (`viewport`),
// and WHEN (`capturedAt`). They are optional, because a screenshot handed over
// as an upload carries none of them and must still be a valid record; a display
// leaves an absent fact out rather than inventing it.
//
// THE DISPLAY. `ui.renderers.detail` registers this pack's own display for its
// own type at PROPS VERSION 2 — the version that carries the island-scoped byte
// reference. A screenshot row used to be drawn by the foreign image display,
// which paints a picture and knows nothing about what was on screen; and a
// display below version 2 paints nothing at all inside a third-party
// application, because the session byte addresses it would reach for are
// cookie-gated. The display draws every form the type accepts.
export const screenshotArtifactManifest: SemanticArtifactManifest = {
  accepts: {
    file: {
      mimeTypes: ["image/png", "image/jpeg", "image/webp"],
    },
  },
  ui: {
    abiVersion: 1,
    sdkAbiRange: "^2.5.0",
    renderers: {
      detail: {
        entry: "./src/renderers/detail.tsx",
        propsApiVersion: 2,
        representations: ["image/png", "image/jpeg", "image/webp"],
      },
    },
  },
  objectTypes: [
    {
      type: "@cinatra-ai/screenshot-artifact:screenshot",
      claim: "dedicated",
      dispositions: {
        projection: "artifact-safe",
        pinnable: true,
        snapshotPolicy: "content",
        sensitivity: "normal",
      },
      schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          mime: { type: "string" },
          size: { type: "integer" },
          capturedUrl: { type: "string", format: "uri" },
          viewport: {
            type: "object",
            properties: {
              width: { type: "integer", minimum: 1 },
              height: { type: "integer", minimum: 1 },
            },
            required: ["width", "height"],
            additionalProperties: false,
          },
          capturedAt: { type: "string", format: "date-time" },
          latestRepresentationRevisionId: { type: "string" },
          latestDigest: { type: "string" },
        },
        required: ["mime", "size"],
        additionalProperties: true,
      },
    },
  ],
  skills: {
    matchers: ["@cinatra-ai/screenshot-matcher-skill:screenshot-matcher"],
  },
  matcherConfidenceThreshold: 0.7,
};

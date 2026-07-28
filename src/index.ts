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
export const screenshotArtifactManifest: SemanticArtifactManifest = {
  accepts: {
    file: {
      mimeTypes: ["image/png", "image/jpeg", "image/webp"],
    },
  },
  // Entry 95 (epic cinatra#1785): the type this pack owns is DECLARED
  // explicitly, never derived. `screenshot` is dedicated-claimed and
  // self-registered (no inline schema needed); the matcher below classifies
  // accepted images INTO this type, it does not create it.
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
    },
  ],
  skills: {
    matchers: ["@cinatra-ai/screenshot-matcher-skill:screenshot-matcher"],
  },
  matcherConfidenceThreshold: 0.7,
};

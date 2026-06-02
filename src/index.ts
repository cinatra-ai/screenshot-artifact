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
  skills: {
    matchers: ["@cinatra-ai/screenshot-artifact:screenshot-matcher"],
  },
  matcherConfidenceThreshold: 0.7,
};

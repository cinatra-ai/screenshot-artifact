import type { ArtifactRendererProps } from "@cinatra-ai/sdk-extensions";
import { Scan } from "lucide-react";

// The row icon of a screenshot in the Artifacts list: the shared icon set's
// scan glyph, drawn at 17 pixels inside the application's 34 pixel cell. The
// cell's size and tint stay the application's. The same icon is drawn for
// every object type this display receives.
type ListRowProps = {
  artifact: Pick<ArtifactRendererProps["artifact"], "objectType">;
};

export default function ScreenshotListRow(_props: ListRowProps) {
  return <Scan aria-hidden size={17} strokeWidth={2} data-row-glyph="scan" />;
}

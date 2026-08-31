// THE SCREENSHOT DISPLAY (the `detail` slot).
//
// The type had no display of its own until now: a screenshot row was drawn by
// the foreign image display, which draws a picture and knows nothing about what
// was on screen. This display draws the picture AND the three facts that make a
// screenshot readable a week later — where it was taken, at what viewport, and
// when — as the ratified drawing sets them.
//
// IT PAINTS THROUGH THE BYTE REFERENCE AND NOTHING ELSE. The address comes from
// the props' byte reference, on whichever road the surface is on: the sealed
// island road inside a third-party application, the session road on a cookie
// surface. The display fetches no host route of its own, mints no capability,
// and never receives a byte through its props — it is handed an address and
// paints under it, so it draws the same picture on every surface.
//
// IT REFUSES RATHER THAN BLANKS. A snapshot older than the byte reference, an
// address that names nothing, and an address carrying bytes inline are three
// named floors with the reason on the element. There is no reading of this
// display that paints an empty plate.
//
// NO EFFECT, NO STATE, NO FETCH. Every reading is decided by the pure resolvers
// beside this file, so the display is the same on the server, on the client and
// in a test.

import type { ReactElement } from "react";

import type { ArtifactRendererProps } from "../renderer-props";
import {
  SCREENSHOT_DISPLAY_CONFORMANCE_ID,
  SCREENSHOT_FLOOR_MESSAGES,
  resolveScreenshotView,
  screenshotAspect,
  screenshotFacts,
  screenshotFactsLine,
} from "./screenshot-view";

export default function ScreenshotDetailRenderer(
  props: ArtifactRendererProps & {
    /** The reading moment, so the "when" fact is decidable in a test. The host
     *  passes nothing and the display reads the clock once, at render. */
    readonly now?: number;
  },
): ReactElement {
  const view = resolveScreenshotView(props);

  if (view.kind === "floor") {
    return (
      <article
        className="soft-panel rounded-card text-muted-foreground overflow-hidden p-6 text-sm"
        data-conformance-id={SCREENSHOT_DISPLAY_CONFORMANCE_ID}
        data-artifact-renderer="screenshot"
        data-slot="detail"
        data-floor={view.reason}
      >
        {SCREENSHOT_FLOOR_MESSAGES[view.reason]}
      </article>
    );
  }

  const facts = screenshotFacts(props, props.now ?? Date.now());
  const factsLine = screenshotFactsLine(facts);
  // THE CAPTURE IS DRAWN TO THE VIEWPORT IT WAS TAKEN AT, so the same picture
  // area is the same shape at every measure it is read on. Where no viewport was
  // recorded there is no aspect to be true to, and the picture keeps its own.
  const aspect = screenshotAspect(props);

  return (
    <article
      className="soft-panel rounded-card overflow-hidden p-0"
      data-conformance-id={SCREENSHOT_DISPLAY_CONFORMANCE_ID}
      data-artifact-renderer="screenshot"
      data-slot="detail"
      data-byte-road={view.road}
    >
      <div className="p-3">
        {/* A passive <img> over the authorized address — never an inline <svg>
            from content, and never a framework image component, which would
            route the load through its own optimizer and off the byte road. */}
        <div
          className="rounded-card mx-auto overflow-hidden"
          data-capture-aspect={aspect ?? ""}
          style={
            aspect === null
              ? undefined
              : { aspectRatio: aspect, maxHeight: "75vh", width: "100%" }
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={view.src}
            alt={view.alt}
            className={
              aspect === null
                ? "rounded-card mx-auto block max-h-[75vh] max-w-full object-contain"
                : "block h-full w-full object-contain"
            }
          />
        </div>
        {factsLine === null ? null : (
          <p
            className="text-muted-foreground mt-3 font-mono text-xs"
            data-facts="where-viewport-when"
            data-fact-where={facts.where ?? ""}
            data-fact-viewport={facts.viewport ?? ""}
          >
            {factsLine}
          </p>
        )}
      </div>
    </article>
  );
}

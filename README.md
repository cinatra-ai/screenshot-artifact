# Screenshot

A capture of a software interface — a web page, a native or mobile app, an IDE, a terminal session, a dashboard, or any other on-screen software. Screenshots get a first-class home in the library and are kept distinct from photographs, illustrations, and editorial images so each surface returns only what belongs to it.

Install from the Cinatra marketplace by searching for "Screenshot" and clicking **Add**. No credentials or configuration are required; the artifact is active immediately for all workspace members. To use it, attach any PNG, JPEG, or WebP image of a software interface to a chat thread; the assistant classifies the image automatically and routes it to the screenshot library. Retrieved screenshots can be previewed, downloaded, or reclassified from the library panel. If an image is not classified as a screenshot, it may be a photograph, illustration, or non-UI graphic — only images with clear UI chrome (window frames, browser bars, app controls, or on-screen text rendered by a UI) pass the classifier at the required confidence level. Reinstall or toggle the artifact off and on from workspace settings if the library stops accepting images after a platform update. A screenshot is read through this package's own display: the picture, and beneath it the address it was taken from, the viewport, and its age; where the picture cannot be shown the display draws a named gap rather than an empty panel. For development, update the artifact manifest in `package.json`, the display sources in `src/renderers/`, or the matcher prompt in `skills/screenshot-matcher/SKILL.md`, then run `node extension-kind-gate.mjs` to validate the package and `pnpm test` before publishing.

## Works with

- Cinatra chat — attach images directly in any thread

## Capabilities

- Save a captured interface as a classified, searchable library item
- Attach a screenshot to a chat thread as visual context for the assistant
- Keep stray UI captures out of editorial image searches
- Preview, download, or reclassify a captured image from the library
- Read a capture with the address it was taken from, its viewport, and its age

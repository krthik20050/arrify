# AR placement and public demo — 21 October 2026

## Findings

The Limited Edition V2 catalog's first photograph includes a separate red NEW badge. Its second photograph depicts the same sticker without that promotion. The AR image endpoint now chooses that reviewed second photograph for this product. Other catalog photography is not automatically free of promotional art; transparent print artwork remains the reliable long-term input.

The old GLB was a zero-thickness horizontal XZ plane, and the viewer restricted vertical inspection to 90 degrees. The generated scene now has explicit front/back surfaces separated by 0.6 mm, a vertical XY variant for walls, and baked artwork rotation and tilt. The 3D inspection camera can orbit from above to below. Turning the inspection camera is different from physically rotating a sticker inside native AR.

The visible surface selector rebuilds the model and selects model-viewer's floor or wall placement before AR starts. A small local patch to model-viewer 4.4.0 passes horizontal/vertical plane-anchoring metadata to the existing USDZ exporter, instead of omitting anchoring for wall exports. The patch is recorded in vendor provenance. Physical iPhone and Android wall alignment are not yet verified.

Apple Quick Look owns its camera interface, gestures and placement detection. A web page cannot offer arbitrary HTML alignment controls inside it. Adjust tilt/rotation before launch, then reopen AR. A user gesture is retained to open the native viewer; the separate preparation action is hidden under adjustments and the preview prepares automatically. Do not promise camera launch on page load or automatic recognition of a laptop screen.

Relevant primary sources:
- https://modelviewer.dev/docs/index.html (ar-placement, ar-scale, activateAR)
- https://github.com/google/model-viewer/issues/3989 (historical Quick Look anchoring limitation)
- https://github.com/google/model-viewer/issues/4159 (changing placement during a session)
- https://developer.apple.com/videos/play/wwdc2019/612/ (horizontal/vertical anchoring and native controls)
- https://developer.apple.com/documentation/arkit/placing-objects-and-handling-3d-interaction (coaching and plane detection)

## Deployment

Public demo: https://stickitup-ar-demo.vercel.app

Project: stickitup-ar-demo in the existing krthik20050s-projects team. Production deployment is explicitly separate from the team's existing projects. The Node request handler is reused by api/index.mjs and localhost. Public files, captured catalog and route documents are included; local artifacts, environment files and runtime logs are excluded.

Vercel Blob stores generated GLBs, metadata and QR handoff snapshots. The API reads storage rather than relying on a warm function's JavaScript Map. Scenes remain usable for up to 30 minutes, while the public product URL can prepare a fresh scene on each visit. Old Blob objects currently remain stored after API expiry; an automatic retention cleanup policy is follow-up work. The uploads contain sticker scenes and titles, not account or checkout data. Environment credentials remain server-only.

Verification: 35 local tests pass. The public page/health endpoints, model preparation and binary retrieval, handoff snapshot and QR PNG were exercised over HTTPS. Browser checks verify real catalog artwork and surface controls. Native camera alignment remains a device test, and this should be presented as a prototype rather than guaranteed physical accuracy.

Hosting references:
- https://vercel.com/docs/cli/blob
- https://vercel.com/docs/functions/limitations

A handoff and model created before a production redeployment were fetched successfully after redeployment, verifying persistence beyond the previous function instance. Unknown handoffs return HTTP 410 after correcting BlobNotFoundError handling.

# Device routing, shadows and free rotation — 25 October 2026

## Scope

Research and source inspection for the user's desktop/phone entry flow, photo/AR shadows and difficulty aligning stickers to an upright wall or closed laptop. Interpreted the spoken phrase "from home" as "from a phone"; phone/browser and shadow type were requested separately. No native-device success or artwork cleanup is claimed by this research.

## Findings

### Desktop and phone entry

The app already serves a browser 3D preview on desktop and rewrites prepared catalog launch links to iOS Quick Look or Android Scene Viewer in public/native-ar.js. Capability detection, with device hints for routing, is preferable to treating a narrow viewport as a phone. Keep an explicit browser-3D fallback on mobile.

A supported phone can open native AR directly from the shopper's tap. This does not imply camera/AR may start on page load or that browser permission and native plane-detection onboarding can be bypassed. The model-viewer capability flag is canActivateAR; native iOS catalog links use rel=ar.

Sources:
- https://developer.apple.com/documentation/arkit/previewing-a-model-with-ar-quick-look
- https://developers.google.com/ar/develop/scene-viewer
- https://modelviewer.dev/examples/augmentedreality/

### Full rotation

The existing mesh generator lib/ar.mjs supports in-plane rotation within ±180 degrees and one tilt within ±85 degrees. There is no third independent axis. public/ar.js applies these through model regeneration; lib/ar-usdz.mjs reuses the horizontal anchor-space geometry for native USDZ. That basis differs intentionally from Android wall geometry and must not be changed blindly.

Full X/Y/Z rotation can be supplied before AR launch and baked into both exported models. Each axis can have a complete 360-degree range, plus reset and flat/upright presets. This rotates the model rather than merely orbiting the camera. A perpendicular sticker is edge-on to a surface, so arbitrary rotation does not itself produce a flush placement: reset the two tilt axes to keep a sticker flush, then rotate within the detected surface.

Live controls that change model transforms during a tracked session are possible in WebXR. Our HTML controls do not transfer into Quick Look or Scene Viewer, which open separate native viewers. Scene Viewer reloads the source model, and our explicit ios-src means Quick Look uses the exported USDZ. Consequently, changing only model-viewer's browser orientation cannot reliably change native AR placement. Bake edits and reopen native AR, or build a separate custom/native AR interaction system.

Apple documents that plane-anchor rotation gestures differ between horizontal and vertical surfaces. Google exposes enable_vertical_placement and resizable; its documentation does not provide a website API for adding a custom three-axis gizmo to Scene Viewer.

Sources:
- https://modelviewer.dev/examples/scenegraph/
- https://modelviewer.dev/docs/index.html
- https://developer.apple.com/videos/play/wwdc2019/612/
- https://developers.google.com/ar/develop/scene-viewer

### Wall/laptop alignment

Use a horizontal placement preset for a closed laptop lying flat, and an upright preset for a vertical wall or laptop lid. A sloping lid is different from both canonical planes. Surface detection may be unreliable on reflective or low-detail areas; a detected supporting plane and careful placement remain necessary. Do not equate free model rotation with laptop recognition or calibrated physical fitting.

The current USDZ uses root-level Preliminary_AnchoringAPI with alignment any and horizontal local geometry. Android wall geometry uses an upright plane. Physical testing is required to decide whether a reported phone problem comes from model basis, anchor selection, or tracking. Previous project notes already identify this distinction; research does not establish a new universal orientation fix.

Source: https://developer.apple.com/documentation/arkit/understanding-world-tracking

### Shadows

Browser model-viewer already has shadow-intensity=0. Two other shadow sources remain distinct:

1. Gray/dark pixels baked into catalog photographs remain part of the texture. The current lib/ar-artwork.mjs pipeline removes edge-connected near-white background and detached components, not every photographic shadow. Use original transparent print PNG/SVG where available; otherwise evaluate masking on representative artwork before regenerating the catalog. Blanket removal of gray would also delete intentional gray artwork.
2. Native AR may render its own surface shadow. Google's Scene Viewer documentation says it automatically renders hard shadows. The web shadow-intensity setting is not a guarantee that native viewers suppress their shadows. A consistent shadow-free tracked renderer across devices would require control over the AR rendering path.

Source: https://developers.google.com/ar/develop/scene-viewer

## Recommended implementation boundary

Improve the existing website with clear desktop 3D / phone AR entry, full three-axis model editing, horizontal/upright presets and reset-to-flush. Bake these transforms into both formats. Keep native launch behind a tap and clearly explain that native gestures differ. Treat photo-shadow cleanup as an artwork-pipeline change with visual review, separate from native-renderer shadows. Custom post-placement three-axis editing on both iPhone and Android is a larger AR implementation, not a model-viewer switch.

## Required device checks

Record phone, browser and OS. Check a textured horizontal surface, upright wall, flat laptop lid and sloping lid. Inspect whether the sticker lies flush and remains readable at 0/90/180-degree in-plane rotations; compare authored tilt separately. Verify that GLB and USDZ preserve requested transforms. Compare photo edges and native cast shadows independently. Do not claim tracking or alignment verified from desktop screenshots or static model tests.

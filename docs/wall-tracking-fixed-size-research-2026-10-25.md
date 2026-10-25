# Upright placement, motion sensors, fixed size and new artwork types

## Observed problem and likely cause

User: iPhone Safari. Looking down at a desk works; pointing straight at a wall makes the sticker lie horizontally like a shelf or appear edge-on. This is consistent with model/anchor basis mismatch, not proof of insufficient gyro input. Actual native placement remains a physical-device check.

Source inspection found that our custom USDZ exporter always used horizontal geometry plus root any-plane anchoring, including when the browser requested a wall. The three-axis editor did not fix this anchor strategy. Model-viewer's merged PR 5201 (9 October 2026) omits forced anchoring metadata for wall exports; upstream code uses the same strategy. The upstream PR explicitly says its author did not run iOS device testing.

Targeted correction: wall exports use upright geometry with no forced anchor schema/tokens; desk exports preserve their existing horizontal basis. The chosen surface is forwarded to the custom exporter. Generated wall model IDs include a native-export version so Quick Look does not reuse the earlier horizontal USDZ from cache. The corrected format is a candidate fix based on upstream behavior; tests of model structure are not phone-placement proof.

- https://github.com/google/model-viewer/pull/5201
- https://github.com/google/model-viewer/issues/3989
- https://raw.githubusercontent.com/google/model-viewer/master/packages/model-viewer/src/features/ar.ts

## Phone orientation and gyroscope

ARKit already combines device motion and camera feature tracking (visual-inertial odometry). A gyro estimates rotation; it cannot independently identify a wall, its normal, its distance, or a laptop screen. Phone inclination may suggest horizontal versus upright mode before placement. Continuously rotating a placed sticker to follow the phone would make it camera-facing rather than anchored to the wall.

Correct tracked behavior: ray-cast to a surface, orient the sticker to the surface normal, attach it to a world/surface anchor, and rotate primarily within that plane. The camera can then move independently. For custom iOS AR this uses ARKit raycasts/tracked raycasts and vertical/horizontal plane detection. Quick Look owns that native session; web deviceorientation events cannot replace its anchor transform after launch. No gyro-only tracking claim or extra motion permission prompt was added.

- https://developer.apple.com/documentation/arkit/understanding-world-tracking
- https://developer.apple.com/documentation/arkit/placing-objects-and-handling-3d-interaction
- https://www.w3.org/TR/orientation-event/

## Fixed dimensions

The user explicitly selected the existing 7.62 cm estimate temporarily, clearly labeled, until actual dimensions are supplied. AR scale is locked through model-viewer ar-scale=fixed, Quick Look allowsContentScaling=0 URL fragments, and Android resizable=false. Catalog and studio direct-launch paths must all use the lock. Browser camera zoom/inspection can remain available; moving the phone closer naturally increases on-screen appearance without changing physical size.

The catalog descriptions say stickers fit inside a 3-by-3-inch area and dimensions vary by design. This is a bounding description, not verified per-SKU width/height. The current width estimate is not a print measurement. Actual width/height belong to the product variant, and future templates need those dimensions to lay out individual stickers physically. Locking an estimate does not make it accurate. Existing cart layouts lock the prepared group size; the visual layout editor still allows edits before a new export.

- https://modelviewer.dev/docs/index.html
- https://developer.apple.com/documentation/quicklook/arquicklookpreviewitem/allowscontentscaling

## Blank walls and laptop screens

Apple documents reduced tracking when a camera sees few details or poor lighting. Glass, reflections and changing screen content are additional adverse conditions. A plane is not semantic recognition of a particular laptop or screen. A custom workflow can use a known visual marker/reference image with known physical size, or let the user calibrate a rectangle on the screen. Screen pixel resolution alone does not establish real-world dimensions. Anchors on moving laptop lids need object/image tracking rather than assuming a stationary world plane.

- https://developer.apple.com/documentation/arkit/arreferenceimage/physicalsize
- https://developer.apple.com/documentation/arkit/understanding-world-tracking

## Posters and templates

The captured catalog currently has no Poster product type. Titles containing "poster" are still classified as stickers; they must not be relabeled as real poster stock. No poster inventory or prices were fabricated.

Recommended asset contract:

| Type | Artwork | Dimensions | Placement |
| --- | --- | --- | --- |
| Sticker | Transparent cutout | Width/height per SKU/variant | Flat or upright |
| Poster | Complete rectangular artwork; preserve white paper | Real width/height, or an explicitly selected paper size | Upright by default |
| Template | Saved item list and positions/rotation in physical units | Board size plus each item size | Prepared group or separately tracked objects |

The current flat textured-mesh pipeline can represent posters without a detailed volumetric 3D model. A 2D source image is not itself the cause of the wall bug; geometry orientation and the surface anchor determine placement. Poster processing should not automatically erase white edges or pale artwork. Templates can reuse the cart layout mechanism, but physical-unit metadata should replace arbitrary percentages where exact fitting is required. The native viewer manipulates a composed arrangement as one object; independent editing of every item inside tracked AR requires a custom interaction system.

## Acceptance on the user's iPhone

Release deployed: dpl_CAd6YWcikoY53Uk1TTVw7wWLYxZJ, https://stickitup-ar-demo-2lbwz68ju-krthik20050s-projects.vercel.app, promoted to https://stickitup-ar-demo.vercel.app. A stable runtime-source snapshot preserved concurrent poster-studio work; all 17 top-level public application assets match the tested source. 59 tests and the portable build passed. The full post-promotion HTTPS smoke check passed. The corrected wall USDZ was inspected for upright front normal and absence of forced anchor tokens, and its bytes persisted unchanged through promotion.

The public browser opened /pages/try-live?product=wasted-sticker&surface=wall, rendered the model, displayed a durable phone QR, and reported placement=wall, scale=fixed, tilt=0, sideways tilt=0. Screenshot: artifacts/runtime/wall-fixed-live.png. This is browser/export evidence, not physical Quick Look placement proof.

Concurrent Poster Studio concept work was preserved, reviewed read-only, and verified locally: Gallery wall template applied, saved and restored after reload. It is available at /pages/poster-studio and explicitly labeled as estimated manual planning, not tracked AR or purchasable poster inventory.

Open the direct wall-mode preview, retain zero free tilt, launch AR and point at a detailed upright wall. Verify the image is flush and readable, then rotate only within the wall. Compare the unchanged desk mode pointing downward. Check pinch does not change scale and the UI labels the width as an estimate. Repeat with a static laptop frame/closed lid, then a screen, recording iOS version and tracking behavior. Do not infer physical success from geometry tests or a desktop 3D viewer.

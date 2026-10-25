# Prepared catalog and cart AR release

## Scope and evidence

This release addresses the user's Compass V2 promotional badge, detached background lettering, preparation friction, locked pinch resizing, awkward surface setup, automatic cart drawer and missing all-cart arrangement entry. Three review agents examined AR engineering, artwork and cart UX; their reports are linked below. These are software agents reviewing specialist evidence, not external human experts.

Public site: https://stickitup-ar-demo.vercel.app

## Shopper flow

1. Browse or search the real captured catalog.
2. Tap a cube or View in your space. iPhone Safari gets a direct `rel=ar` link to the already-hosted USDZ with a child image. Android gets a Scene Viewer intent with resizing, vertical placement and an explicit web fallback. Desktop gets the browser preview and phone QR.
3. Move the phone to detect a surface. Pinch to resize and drag to position. Native permissions, Object/AR UI and tracking onboarding remain controlled by the device.
4. Add to Cart gives a toast and stays in browsing.
5. Open the cart and choose View all your stickers in 3D space. Eligible copies populate the arrangement canvas automatically (up to 25); move, resize and rotate individually.
6. The layout model and native file prepare after editing settles in the background. The phone launch link uses that ready model. Native AR moves and scales the arrangement as one group; return to the editor for individual adjustments.

## Preparation and delivery

`scripts/build-ar-catalog.mjs` generated all 4,145 eligible products with zero failed entries. Each has a cleaned PNG, physically dimensioned GLB and aligned, uncompressed USDZ in public/ar-prepared, indexed by data/ar-catalog.json. The original storefront catalog prices, images and availability remain intact. Automated cutouts are explicitly tagged as not print masters, not falsely human-approved.

PNG optimization bounds each texture to 64 KB, starting at 512 pixels and reducing when needed. The ready catalog totals 12,435 static files, 536,717,932 bytes for this build. All catalog models are generated before deployment; no client GLB creation is needed on the normal native cube path. Downloads and native viewer initialization still take time and are not described as zero latency.

An initial Blob-based catalog build reached the Hobby 1 GB quota. Its derived cache prefix was preserved locally, then cleared; it contained no original catalog data. The final catalog uses Vercel's static CDN. Only temporary customized/cart scenes use Blob. No hosting plan was upgraded. Credentials are restricted to ignored runtime environment files and are excluded from deployment artifacts.

## Artwork

The Compass V2 NEW label is embedded in its first catalog image. Conservative connected-component cleanup removes small detached marks far from a dominant central artwork while retaining intentional compass N/E/S/W lettering. Limited Edition V2 uses a visually reviewed isolated alternate. The default is not automatically the second image: some second images show hands or lifestyle photography. Overlapping promotion, shadows, full photographs and ambiguous components still need owner print assets or review. No claim is made that all automated assets were manually inspected.

## Native model choices

The prior fixed scale disabled pinch; the browser viewer now uses ar-scale=auto, direct USDZ omits allowsContentScaling=0 and Android explicitly enables resizing. Root-level Preliminary_AnchoringAPI with alignment any is emitted for the native horizontal XZ sticker. The optional browser wall geometry remains separate. This avoids the prior native double-rotation path. Archive structure and OpenUSD parsing do not prove physical wall tracking; the any-surface candidate requires actual iPhone and Android tests.

## Verification

- 41 Node tests pass, including prepared files for every eligible product, native link routing, Android resize/vertical flags, detached badge cleanup, meter geometry, USDZ ZIP alignment and prepared file MIME/routes.
- OpenUSD read actual Compass V2, Wasted and Limited Edition archives and resolved their geometry and material bindings.
- Actual cleaned artwork for those products was visually inspected by the artwork reviewer.
- Browser shopping check on an isolated origin: Add to Cart displayed Added to cart without a drawer; a Compass + Wasted cart automatically populated the arranger; the background group model reached ready state. The user's existing localhost cart was preserved.
- Physical iPhone previously rendered the older model successfully, as confirmed by the user. That does not count as device validation of this release's new native file, pinch behavior or wall anchoring.

Phone acceptance checks still required: direct cube launch, correct texture orientation, no detached NEW/footnotes, pinch smaller/larger, transfer between desk and wall, stay anchored as the phone moves, and cart-group launch. Repeat on iPhone Safari and ARCore Android. Reflective/blank surfaces and poor lighting can undermine tracking. Free resizing is a visual trial, not a promise of printed dimensions.

## Review documents and primary references

- [AR engineering review](ar-expert-review.md)
- [Artwork audit](ar-artwork-audit.md)
- [Cart and background arrangement flow](cart-arrangement-flow.md)
- https://developer.apple.com/videos/play/wwdc2019/612/
- https://developers.google.com/ar/develop/scene-viewer
- https://github.com/mrdoob/three.js/pull/34066 (open upstream anchoring proposal, not a merged guarantee)
- https://github.com/google/model-viewer/issues/3989

Community/Reddit reports are supporting anecdotes; technical decisions rely on official docs and upstream source. Direct Reddit adapter access was unavailable, so indexed public discussions were used without claiming exhaustive coverage.

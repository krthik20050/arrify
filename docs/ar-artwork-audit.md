# AR artwork audit — 21 October 2026

## Confirmed cause
The catalog photographs contain merchandising pixels. These are embedded in the source JPG, not HTML overlays: Compass V2 (`compass-sticker-1`) has a red NEW word above/right of the actual compass. Flood-removing edge-connected white left NEW and any detached promotional lettering opaque, so the generated 3D plane carried them into AR.

## Source evidence and reviewed decisions
Downloaded the first three captured Shopify catalog images for Compass, Compass V2, Limited Edition V2, and Wasted into `artifacts/artwork-audit/`. Visually inspected Compass first and second, Compass V2 first, Limited Edition V2 first and second, and Wasted first. Compass second is a photograph of a hand holding the sticker: selecting every second image would introduce a worse error. Limited Edition V2's second photo is an isolated sticker without NEW, so that single reviewed alternate is retained. Default remains the first nonanimated catalog image.

Compass V2 is the catalog match for the described north/south/east/west artwork. There is no product titled “northwest southeast” in the captured catalog. Its original intentionally includes N, E, S, W and compass markings. These must not be erased.

## Implemented pipeline
`lib/ar-artwork.mjs` uses sharp to decode an allowed captured Shopify image (or local captured animation still), constrain it to 768 pixels, remove only edge-connected near-white, then run shared `removeDetachedMarks` from `public/ar-texture.js`. The same cleanup runs in browser preparation so cart composition uses consistent pixels.

The connected-component safeguard requires a dominant component representing at least 55% of visible foreground, centrally located. Other components are removed only when individually below 15% of the dominant component and wholly outside its bounding rectangle plus an 8% image-size margin. Components inside/near the artwork remain regardless of color or wording. It deliberately does not use an OCR word blacklist: NEW could itself be intentional sticker wording. If there is no safe dominant artwork, pixels are preserved and the reason is recorded. Output crops to remaining alpha bounds.

`prepareArtwork(product, options)` returns `{png,width,height,source,cleanup,version}`. `selectArtworkSource(product)` supplies `{src,index,reason}`. `scripts/prepare-ar-artwork.mjs [handle ...]` writes reusable PNGs and an audit manifest in `public/assets/ar-artwork/`. With no handle arguments, it processes all eligible captured sticker categories. Failed products are recorded as needs-review, never silently replaced by an invented image. Generated entries explicitly say automated-not-human-approved.

## Verified output
Using actual downloaded sources: Compass V2 removed 3,515 foreground pixels belonging to the detached NEW, output 467×496; visual inspection confirms all N/E/S/W lettering retained. Wasted output 637×165, zero detached pixels removed. Reviewed Limited Edition V2 alternate output 556×365, zero detached pixels removed. Local before/after images are retained in the audit directory.

## Limits and company handoff
This is conservative photograph cleanup, not owner-supplied print artwork. Soft photography shadows and some near-white die-cut edges remain. Embedded promotional text that overlaps artwork, multiple separated stickers/letters with no dominant component, hands, complex photography, and nonwhite backgrounds need manual review or original transparent print assets. No claim that every catalog texture has been human reviewed. An owner-approved transparent PNG/SVG and physical printed dimensions per SKU remain the production-quality source of truth. Dimensions inferred from JPG pixels are aspect ratios only, not measured print sizes.

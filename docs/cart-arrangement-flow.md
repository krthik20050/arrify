# Cart to arrangement flow

Updated 2026-10-21.

## Customer journey

1. Add a product. The cart count updates and a live toast says **Added to cart**. Adding no longer opens the cart automatically; a quick-product dialog closes after a successful add.
2. Open the cart when ready. **View all your stickers in 3D space** opens the arrangement studio.
3. A fresh studio automatically places eligible cart sticker copies in a spaced grid. An existing saved arrangement keeps its positions. **Add all cart stickers** fills missing copies without duplicating copies already placed.
4. Drag individual stickers; use size and rotation controls, or keyboard arrows. Save locally or select **View this layout in your space** to save the arrangement and continue to the group AR preview.

## Preserved contracts

- Cart key: `stickitup-cart-v1`; layout key: `stickitup-studio-v1`.
- Layout records retain `key`, `id`, `x`, `y`, `size`, and `rotation`.
- Current AR compositor supports 25 copies. Larger carts show the limit explicitly and retain all actual cart contents. Clothing and unsupported product types remain purchasable but are not placed.
- Studio images now use the same `/api/ar/image/:handle` source selection as individual AR, instead of the cart's marketing photo. This does not by itself guarantee clean production artwork; source-art cleanup is a separate pipeline concern.

## Limits and verification

- Individual stickers are arranged in the web studio. Native AR receives a single composed layout: users move/scale the group, not individual stickers inside Apple's viewer.
- Optional camera overlay is explicitly labelled as a manual overlay; it is not tracked AR or an exact physical-size measurement.
- Browser local storage remains required to transfer the layout to the AR page. Save failures surface an explanation.
- JavaScript syntax checks run for both changed files. Device AR gestures and physical scale require phone testing; source checks do not prove those behaviors.

## Background group readiness

The studio now builds a transparent 1400 × 900 layout texture after artwork loads and after arrangement changes settle for 800 ms. It posts that texture to `/api/ar/prepare` with an estimated 320 mm group width. Preparation has a 45-second timeout; changes abort old requests and discard stale responses. Models refresh before their reported expiry. No camera permission is requested by this process.

When a ready model includes `iosSrc` and the browser supports `rel=ar`, the action becomes an actual Quick Look anchor with an image child, retaining the user's launch gesture. Android receives a Scene Viewer intent with resizing and vertical placement enabled. Other browsers, failures, and not-yet-ready models retain the existing preview/QR destination. Every launch saves the current layout first; storage failure prevents launching a mismatched arrangement.

Native viewers control their own placement and gesture support. This group is still one flat composed object; it does not provide per-sticker native editing, automatic laptop recognition, guaranteed wall detection, or calibrated printed dimensions. Physical iPhone and Android checks are still required.

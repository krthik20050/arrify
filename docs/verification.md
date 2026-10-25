# Verification record

Date: 19 October 2026.

## Automated

`node --test tests/store.test.mjs`: 15 tests, including complete filters and a 43-route internal-link audit. Run with local loopback networking available. The sandboxed shell denied loopback; that environment failure was not treated as an application failure.

Checks cover:

1. Complete paginated catalog and unique IDs/handles.
2. Collection-to-product referential integrity.
3. Every captured variant has a valid price.
4. Captured sold-out products stay sold out.
5. Server-side integer-currency cart totals and duplicate merging.
6. Rejection of unknown/sold-out variants and invalid quantities.
7. Search, availability filtering and price sorting.
8. Pagination and bounds.
9. Local-only executable scripts and removal of captured inline handlers/iframes.
10. Product data contracts and representative product/variant/image fallback rendering.
11. Collection rendering and genuine 404 handling.
12. Original quiz controls and local quiz script.
13. HTTP routes, static assets, API failures and 404 responses.

## Browser

In-app Chromium against the local Node preview:

- Original homepage and product page visually inspected alongside the source store.
- Product image loaded from the original CDN and matched the actual Wasted Sticker.
- Add-to-cart opened the drawer with the right product and Rs. 10.00 unit/subtotal.
- Cart persisted while navigating to other pages and checkout.
- Original quiz exercised through recipient, genre, style, results and the filtered collection link.
- Checkout discount applied with visible feedback.
- Checkout retained delivery fields when applying a discount, then created a local demo order with the expected Rs. 9.00 total from a Rs. 10.00 product and DEMO10. No external purchase occurred.
- T-shirt size XL reached the cart as XL at Rs. 499.00.
- Live search for “wasted” returned the actual sticker and T-shirt with matching captured prices.
- Mobile viewport 390 × 844: no horizontal overflow, mobile menu and nested sticker collection navigation worked.
- Homepage clothing tab displayed its product pane.

This record distinguishes exercised flows from untested routes: rendering tests do not prove every original third-party interaction or pixel matches.

## Known boundaries

This is a locally functioning review recreation. Real payments/authentication/fulfillment/marketing are not connected. Product/collection/cart layouts are reconstructed templates, with original source assets and brand styles. Content and homepage use sanitized captures. Product images mostly require the original CDN. Dynamic third-party review/Instagram video services are not cloned; the social image feed is retained locally with image viewing and official links. Exact original promotional discount calculation is not replicated in demo totals.

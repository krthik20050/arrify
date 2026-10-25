# Shopping flow redesign — 21 October 2026

The review found that the old countdown, wrapping navigation, full-height campaign art, repeated discovery sections and ghost headings hid the shopping task. The new shell has one compact navigation row, a short brand intro, one category rail, one product feed and two useful next actions. Original catalog prices, variants, availability and still-image card, cart and studio previews are retained. This is a local prototype, not a live Shopify migration.

## Implemented
- Shared compact header/footer on home, catalog, search, products, cart, account and content routes.
- Six / four / two column merchandise layout with one clear purchase action per card; collapsed phone filters.
- Real sticker Like/Pass discovery, pointer swipes, keyboard controls, Undo, Reset, locally saved choices and personalized feed.
- Ranking uses all 29 captured genre/style memberships. Likes strengthen normalized label weights; passes count one quarter as strongly. Explicit passes are excluded from the recommendation feed. About one in five positions explores another genre. Weights are capped to limit dominance. No model, account tracking or invented confidence score.
- Cart laptop arrangement with drag/keyboard position, size, rotation, save/reload and PNG export. Apparel is excluded. Near-white edge-connected product backgrounds are removed locally when CDN CORS permits it.
- Explicit camera start/stop and manual framing. Camera data stays on device. No surface tracking, occlusion, physical-size calibration or WebXR claim.

## Design research
[Baymard category navigation research](https://baymard.com/blog/ecommerce-category-page) informed product-finding before promotion. [Nielsen Norman Group on contextual swipes](https://www.nngroup.com/articles/contextual-swipe/) informed visible button alternatives. [WCAG dragging guidance](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) informed non-drag controls. [MDN WebXR session documentation](https://developer.mozilla.org/en-US/docs/Web/API/XRSystem/requestSession) documents secure-context and compatibility constraints. Sticker Mule was inspected as a reference for clear product-entry actions, without copying its visual identity.

## Verification
20 Node tests pass, including all catalog/cart/filter/GIF regressions, discovery ranking and HTTP routes/API. Browser checks at 1440x900 and 390x844 showed no horizontal page overflow. Desktop first-row prices/actions fit within the initial viewport; phone product imagery begins near 518px. Native pointer drag changed a discovery choice. Like, Pass, Undo, Reset, persistence, feed changes, search, add-to-cart, layout placement, arrow nudge, size/rotation, save/reload and PNG download success state were observed.

Physical phone camera and surface tracking are unverified. Phone camera access needs an HTTPS deployment; opening a PC LAN HTTP address is not enough. PNG export depends on source-image CORS. Captured stock/prices are the existing repository snapshot, not a refreshed live inventory. Payments/account/fulfillment remain demo integrations. Automated CI has not been run remotely.

# Sticker studio

Route integration: serve `/pages/sticker-studio` with `<div id="sticker-studio"></div>`, load `/studio.css` and deferred `/studio.js`. The module initializes only if its mount exists.

Uses the existing `stickitup-cart-v1` cart and `/api/cart/quote` contract without mutating the bag. Real cart product images only; no invented demo inventory. Every copy may be placed up to the cart quantity, capped at 25 total. Normalized positions, scale and rotation save locally under `stickitup-studio-v1`. Saved records are validated against the latest bag on load. Drag/pointer, arrow keys, Shift+arrow, Delete and slider controls are supported.

Camera starts only after a user click and browser permission; asks for rear camera where available and never audio. Stops tracks on explicit Stop, pagehide or hidden document. A canceled pending request is stopped if it later resolves. This is a manual camera overlay, not world/surface tracking, perspective matching or true AR. Physical sizing is not inferred. Phone access requires a secure HTTPS origin (localhost is a secure context on the same device; a phone's localhost is the phone itself).

Image processing removes only near-white regions connected to the bitmap border, preserving enclosed white artwork. It can still remove intentional edge-connected white content; catalog originals remain unchanged. If image CORS or decoding fails, original images display; PNG export is blocked with an honest explanation rather than silently dropping products. Export uses the current camera frame when active; otherwise a grey laptop background. Saved layout remains available independently of image export.

Sources: [MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia), [MDN canvas and cross-origin images](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image). Actual physical camera input and mobile browser behavior require device testing. Browser rendering and route wiring are verified by the parent integration task.

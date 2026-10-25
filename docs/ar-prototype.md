# Try it live — first implementation

Implemented 21 October 2026. This is a real 3D asset and native/WebXR launch integration, with desktop browser validation. Physical phone tracking, USDZ conversion on an iPhone, and ruler accuracy have not yet been validated.

## Entry points

- Individual sticker cards and product pages: **Try it live** → `/pages/try-live?product=wasted-sticker`.
- Cart → **Arrange on laptop** → place stickers → **Try layout live**. This saves the current arrangement and opens `/pages/try-live?layout=cart`.
- Phone users can open the page directly. Desktop users can prepare a scene and choose **Show phone QR** to transfer it.

## Current behavior

The page loads original catalog artwork through a product-bound same-origin endpoint, optionally removes white pixels connected to its outer edge, and generates an embedded-texture GLB plane. Single stickers are cropped to artwork bounds. Cart arrangements retain the editor's image framing and positions and are rendered as one transparent group, without a fake laptop background. Clothing, packs, sheets and skins are excluded from this first individual-sticker workflow.

The entered centimetre width is converted to metre geometry. Height follows artwork proportions. Unknown printed measurements are never represented as verified catalog data. A measurement checkbox records the user's assertion only; it is not device calibration. Original photos may contain shadows/padding and cannot replace owner-approved print artwork and die-cut masks for production. Holographic/glitter/reflective material appearance is not simulated.

`model-viewer` 4.4.0 is vendored under `public/vendor/model-viewer/`, with its upstream license and provenance. It is loaded only after Prepare preview. The component selects WebXR, Android Scene Viewer or iOS Quick Look when available. Scaling is fixed in AR. The desktop model remains rotatable/zoomable. The page does not start camera access on load.

On iPhone, the prepared model/layout opens in Apple's system AR viewer. Individual editing remains in the website's layout editor; native AR moves the composed group. This does not implement a common live multi-sticker editor on all phones, automatic laptop recognition, upright-screen detection, moving-object tracking or guaranteed physical accuracy.

## Server boundaries

- `GET /api/ar/products/:handle`: eligible merchandise metadata; verified dimensions currently null.
- `GET /api/ar/image/:handle`: only captured product-image URLs or the existing local still-frame assets. No arbitrary URL parameter. Remote image response type and size are bounded; timeout 15 seconds.
- `POST /api/ar/prepare`: bounded PNG and width/height → an embedded-texture GLB.
- `GET /api/ar/models/:sha256.glb`: generated binary model. Maximum 24 retained models per process, 30-minute lifetime, content-addressed IDs. Restart/eviction requires preparing again.

Textures sent to the local server contain catalog artwork or its sticker arrangement, not camera frames. This is a local prototype endpoint, not a hardened multi-tenant media-upload service. Before public production hosting, add request throttling, robust PNG decoding/validation and persistence appropriate to viewer asset lifetime.

The normal site CSP remains unchanged. Only the AR document permits blob textures and `wasm-unsafe-eval` for the bundled model-viewer helper. JavaScript `unsafe-eval` remains blocked. No remote script CDN is required.

## Verification

32 Node tests cover the existing store, GLB structure/alignment/metre units/UV orientation, PNG limits, unverified dimension handling, alpha-background behavior, model lookup, HTTP assets, narrowly scoped CSP, QR snapshot handoffs, expiry/eviction and invalid phone origins. Desktop browser checks observed an actual rendered Wasted model, corrected image orientation, sizing updates, invalid-width rejection, product/card links, a two-sticker saved layout handoff and the unsupported-device message. Phone viewport checks verify layout only; they are not camera/AR hardware evidence.

## Real phone testing

Serve this same application over a reachable HTTPS preview URL for iPhone and Android. A PC's `localhost:3001` is not the phone's localhost. Android USB port forwarding is another development option documented by Google; it does not provide iPhone access. Scene Viewer must be able to fetch the model URL, so native viewer access must be included in hosting tests.

On an AR-capable Android and iPhone Safari: tap the product action; enter a known printed width; prepare; tap Try it live; handle the platform permission prompt; find a flat, stationary, well-lit surface; place and rotate; move the phone; compare to a ruler and printed sticker. Test camera denial, unsupported devices, lost tracking, expiry, white artwork, returning to cart and repeated launches. Start with a desk/closed laptop, not an upright reflective display.

References: [model-viewer AR examples](https://modelviewer.dev/examples/augmentedreality/), [Google WebXR requirements](https://developers.google.com/ar/develop/webxr/requirements), [Apple Quick Look](https://developer.apple.com/documentation/arkit/previewing-a-model-with-ar-quick-look).

## Desktop QR handoff

Prepare the sticker/layout, then choose **Show phone QR**. The QR uses the configured HTTPS preview origin and transfers a snapshot of the prepared GLB, its dimensions and measurement label. It does not expect the phone to have the laptop's cart or localStorage. Changing source settings hides the old QR until a new preview is prepared. The phone automatically loads the shared model, then waits for an explicit **Try it live** tap before AR launch.

Handoffs are random 128-bit links retained only in process memory, at most 64 at a time. They expire with the underlying model (at most 30 minutes) or when the server restarts/model is evicted. Anyone with the link can view its sticker artwork/arrangement. Camera data is not part of the handoff. The QR image is generated locally using pinned `qrcode` 1.5.4; no QR web service receives the URL.

Configure a permanent HTTPS origin with `PHONE_PREVIEW_ORIGIN`, or use the local helper `./scripts/start-phone-preview.ps1` after placing Cloudflare's official portable client at `artifacts/runtime/cloudflared.exe`. The helper creates a temporary public HTTPS tunnel to the existing port 3001 server and records its origin/PID in `artifacts/runtime/phone-preview.json`. The current temporary preview is for testing, with no uptime guarantee. Keep the local server and tunnel running; stop the recorded tunnel PID when testing ends. No Windows service or router/firewall rule is installed.

Verification additionally decoded an actual generated PNG with OpenCV and matched its HTTPS URL exactly, then loaded that destination through the public tunnel in a separate browser origin with an empty cart. The same Wasted model and 7.62 × 1.97 cm estimate rendered. This validates encoding, HTTPS reachability and scene transfer; a physical phone camera scan and AR tracking remain unverified.

## iPhone empty model fix (2026-10-21)
The generated GLB previously declared KHR_materials_unlit. The vendored GLTF loader maps that to MeshBasicMaterial, while its USDZExporter exports only MeshStandardMaterial meshes. This could open Quick Look with no exported sticker in either Object or AR view. Removed the unlit extension and retained the textured standard PBR material, alpha mask and physical dimensions. Regression test failed before the change and passes after; all 33 tests pass. Physical iPhone confirmation is still required. Generate a new model and QR after restarting the server; old in-memory previews are invalid.


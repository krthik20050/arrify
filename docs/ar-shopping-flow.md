# Sticker preview shopping flow

## Research and decisions (21 October 2026)

Google's model-viewer AR examples put a small AR control beside the model and require an explicit activation gesture. Native iPhone Quick Look and Android/WebXR have different placement interfaces; the site should explain the next step without promising automatic laptop recognition.

Sources:
- https://modelviewer.dev/examples/augmentedreality/index.html
- https://developers.google.com/ar/develop/webxr/model-viewer
- https://baymard.com/research-articles/deprioritize-view-in-room-augmented-reality

Baymard's furniture study identifies poor instructions, clunky controls, inaccurate perceived scale and weak model quality as friction. This is furniture research, not measured evidence about sticker shoppers. Applying it here is a design inference: keep normal product photos and purchasing primary; offer a predictable preview affordance and a short, explicit handoff.

## Implemented

- Cube plus 3D label on eligible product-card imagery, including related products, with product-specific accessible names and 44px controls.
- Cube entry below the product gallery; product purchase-area preview remains available.
- Entry starts artwork/model preparation automatically, without starting the camera.
- Size, measured-width confirmation and background removal are optional collapsed adjustments. Size remains explicitly estimated until confirmed.
- Desktop prepares the phone QR automatically once the model loads. Manual QR generation remains as a retry path; automatic generation does not scroll the page.
- AR-capable phones see an explicit View in AR action and no redundant QR panel. Unsupported devices keep 3D and the phone handoff.
- Shared arrangements keep the existing model, dimensions and expiry behavior. The cart is not overwritten.

## Owner pitch and remaining work

Present this as a web-based 3D and AR sticker preview prototype. The user confirmed successful physical iPhone rendering after the material fix; the revised flow still needs phone usability checks and Android device coverage. Do not claim VR, automatic laptop recognition, catalog-accurate dimensions, conversion gains or individual sticker editing inside native Quick Look.

For a reliable owner demonstration, use stable HTTPS hosting rather than an expiring development tunnel, obtain transparent print artwork and verified product dimensions, then record a short browse → cube → phone placement → return-to-product demonstration. Small writing in a catalog photo is part of the texture unless replaced with clean artwork; background removal is not watermark removal.

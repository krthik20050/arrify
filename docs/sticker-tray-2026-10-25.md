# Transparent cart tray

Approved concept: no store branding in the workspace, transparent top tray with individual sticker bubbles, user places each sticker rather than receiving a prefilled layout. Implemented in the existing sticker studio so cart validation, quantity limits, export and native AR transfer remain shared.

Pointer interactions support touch, pen and mouse: drag a bubble onto the arrangement; release outside cancels; tap places at center as an accessible alternative. Existing selection, move, keyboard movement, size and rotation controls remain. Saved arrangements restore; new carts start empty. Clearing persists an empty layout.

The website camera is explicitly a manual overlay. Apple Quick Look owns the AR / Object screen and cannot host an arbitrary interactive HTML tray. Apple's custom banner documentation says links and events in the supplied HTML are ignored. Native handoff remains a flattened arrangement, not individually editable stickers. Actual independent tracked placement requires a custom AR session, such as an iOS RealityKit/ARKit app; this change does not claim that capability.

Reference: https://developer.apple.com/documentation/arkit/adding-an-apple-pay-button-or-a-custom-action-in-ar-quick-look

Verification: focused coordinate regression test, full existing test suite, portable production build and browser interaction checks. Physical iPhone camera/native handoff must be checked on the device.

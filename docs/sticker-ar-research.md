# Sticker placement AR: research and proposed implementation

Researched 21 October 2026. Scope: phone-based placement of real store stickers on a laptop, including a cart arrangement. No storefront implementation was changed in this research pass.

## Design correction

The user rejected the previous minimalist pass as dull. The next design must restore the original store's expressive typography, sticker-led compositions, colour, humour and playful campaign art, while retaining a compact header, a shorter first screen and clear shopping actions. Removing clutter must not remove the brand. Do not treat the current pale, sparse homepage as the approved visual direction.

## What Amazon establishes

[Amazon's own seller documentation](https://sell.amazon.com/tools/3d-ar) distinguishes View in 3D (rotate/inspect a model) from View in Your Room (place it in a real environment). It describes enabled products in the Amazon mobile shopping app on supported iOS/Android devices and requires 3D assets. This documents the public feature; it does not establish Amazon's proprietary implementation or SDK choices. Amazon's native runtime was not captured or decompiled here.

The equivalent for this website is possible without Amazon infrastructure. A flat sticker can be a transparent texture on a very thin mesh with physical dimensions. Camera pose tracking and a surface-aligned anchor produce perspective changes as the shopper moves their phone. A camera overlay with fixed screen coordinates does not do this.

## Existing implementations

| Project | Established capability | Fit and boundary |
|---|---|---|
| [Google model-viewer](https://modelviewer.dev/examples/augmentedreality/) | WebXR, Android Scene Viewer and iOS Quick Look routing; floor/wall placement | Strong first implementation for one sticker or one precomposed cart layout. Native viewers cannot run our normal HTML editing controls. |
| [Three.js AR hit-test example](https://github.com/mrdoob/three.js/blob/dev/examples/webxr_ar_hittest.html) | Reticle and placement from real-world hit tests | Foundation for an editable multi-sticker Android WebXR session. It is an example, not a finished commerce feature. |
| [MindAR](https://hiukim.github.io/mind-ar-js-doc/quick-start/overview/) and [AR.js](https://github.com/AR-js-org/AR.js) | Image-target / marker tracking | Good for an optional printed calibration target placed on the lid. They do not automatically recognize and track any blank laptop. Training on the sticker we want to preview is insufficient: that sticker is not physically present yet. |
| [sotofish AR sticker project](https://github.com/studiobloom/sotofish-AR-WebGL) | Author describes mobile-browser stickers using Unity, OpenCV and an image target | Relevant prior work, but target-based and not a drop-in arbitrary-laptop shopping solution. Device claims were not independently tested. |
| [3D AR Studio](https://github.com/nirholas/3D-AR-Studio) | Author documents multi-object editing, QR handoff and WebXR/native viewer routing | Useful reference to evaluate. Its README explicitly distinguishes iOS native single-model AR from in-page gyro passthrough, which has no positional tracking. Do not mistake that passthrough for tracked multi-sticker iPhone AR. No adoption or device validation performed. |
| [8th Wall's current engine distribution](https://8thwall.org/docs/open-source) | Open components plus separately licensed binary containing SLAM | Candidate for a richer common in-browser iOS/Android experience. The old hosted platform is retired; do not use old subscription tutorials as current setup guidance. SLAM is not MIT open source. Evaluate the distributed engine's license, maintenance and actual laptop tracking before committing. |

Official platform references: [Google WebXR hit-test walkthrough](https://developers.google.com/ar/develop/webxr/hello-webxr), [Apple commerce with Quick Look](https://developer.apple.com/videos/play/wwdc2020/10604/), [model-viewer AR API](https://modelviewer.dev/docs/#entrydocs-augmentedreality-attributes-arModes), [8th Wall migration FAQ](https://8thwall.org/docs/migration/faq).

## REA evidence

Downloaded the published `@google/model-viewer` 4.4.0 distribution from the npm registry without executing it. Retained bundle, license, package metadata and source provenance under `artifacts/ar-research/model-viewer/`.

REA parent Evidence: `ev_9c6fee62de705145bf2eeafd67024c4bef5ae24ac6b4760d1013ac489398e940`; summary Evidence: `ev_838d70af701c90f75c4f4b1efe10ee61b33a2a256c1e60c3d26244200cfa4b4f`. Artifact SHA-256: `18083b8f553634306a546ac618e989160186ea2c4a5aa9cd4d3414ddb7f9c42f`.

REA parsed the JavaScript as inert text with no parse failures. Its semantic graph hit a node ceiling and is partial; it does not establish runtime behavior. Focused reading of the retained distribution found `activateAR()` dispatching to Quick Look, WebXR or Scene Viewer around lines 88594–88645, WebXR `immersive-ar` requests around 77442, and hit-test requests around 77533. These observations agree with the public docs. They are evidence about Google's reusable component, not evidence that Amazon uses it. No physical phone AR session was observed.

## Recommended implementation for this store

Start with **model-viewer for a single sticker and a composed layout**, then assess a richer shared browser tracker only after phone tests expose the remaining gap. This delivers genuine tracked placement on compatible devices with less new infrastructure. It will not support editing individual cart stickers inside Apple's system viewer.

### Asset pipeline

1. Use original transparent print artwork and die-cut masks from the owners where available. The existing catalog contains photography/mockups and white backgrounds, which are not reliable AR textures. Edge-connected white removal is a preview fallback; it can damage white artwork and is not the production asset source.
2. Store actual width and height per product/size variant. The captured Wasted description only says the design fits within a 3 x 3 inch area and that dimensions vary. A maximum bounding area is not an exact measurement. Do not stretch every sticker to 3 x 3 inches or derive physical size from image pixels.
3. Generate a small GLB with a cutout texture and a matching USDZ asset. Use metres, consistent pivots, alpha handling, correct normals and a tiny surface offset to avoid flicker. Test translucent borders and white artwork on both native viewers.
4. Initially show matte colour/placement. Holographic, glitter and reflective finishes need distinct material work and cannot be represented faithfully by an animated catalog GIF.
5. Cache by product, variant and asset version. Serve correct GLB/USDZ MIME types, HTTPS and appropriate CORS. Load AR code only when requested.

### Shopper flow

Product → **Try on my laptop** → choose closed lid / upright lid → prepare model → explicit camera/AR launch → scan guidance → targeting reticle → tap to place → move/rotate → return to purchase.

For a first proof, ask the shopper to close the laptop and keep it on a table. Test upright lids separately: the target is smaller than a wall and may be angled. Floor/wall mode is not automatic laptop recognition. Let people correct alignment; never silently anchor the sticker to the table behind the laptop.

Cart → arrange stickers in the existing editor → enter laptop lid dimensions or select a verified model → export the sticker group as one transparent scene → launch native AR. On iPhone this lets the shopper move the entire arrangement, then return to the editor to change individual stickers. Do not include a solid fake laptop mesh that hides their real laptop.

Desktop → QR link containing a bounded, versioned layout manifest or short-lived scene ID → phone opens the same selection. The QR is a handoff, not an AR tracking marker. Camera frames need not leave the phone.

### Platform behavior

- **Compatible Android Chrome:** use WebXR hit tests, with runtime feature detection. A later custom Three.js renderer can share one surface coordinate system for multiple stickers and offer individual editing while tracking. Scene Viewer is a fallback for a prepared single scene.
- **iPhone/iPad Safari:** use AR Quick Look with USDZ for prepared sticker/layout scenes. Our page's JavaScript controls do not run inside Quick Look. Do not promise the same editable WebXR session on every mobile browser.
- **Need identical live editing on both:** evaluate current 8th Wall distributed world-tracking engine or a supported commercial SDK, with a device proof and licensing check. This is a separate implementation choice, not a CSS extension to the manual overlay.
- **Unsupported / tracking failure:** offer a photo with four-corner laptop alignment and saved layout editing, clearly labeled a photo preview.

## Laptop-specific risk

[Google ARCore fundamentals](https://developers.google.com/ar/develop/fundamentals) explains that textureless surfaces can fail plane detection. My engineering inference is that blank metallic lids, glare and a small target region make this store's task harder than placing a chair on a floor. Tracking a surface also does not guarantee that it will follow a laptop moved after placement. Keep the laptop stationary for the first version; object/image tracking is a different requirement.

An optional printable high-contrast target of known size on the same plane could improve calibration and lid-relative tracking. It introduces user effort, so it should be a recovery option rather than the default purchase flow. A known laptop model or measured lid width can help scale, but is not a substitute for tracking.

## Proof required before calling it shipped

Use a small set of owner-approved assets first: text, white artwork, irregular cutout and one specialty finish. Test on real iPhone Safari, an ARCore Android phone and an unsupported phone. Cover closed/upright lids, a blank silver lid, textured lid, bright/dim light, tracking loss, permission denial and return to cart. Compare to a ruler and a real printed sticker. Record drift, scale, orientation and edge quality rather than claiming accuracy from a desktop screenshot.

[WebXR needs a secure context](https://developers.google.com/ar/develop/webxr/requirements). A PC's localhost address does not open that PC on a phone; use a reachable HTTPS test site or documented Android USB port forwarding. Do not claim physical-device success from the current localhost overlay.

## Decision

Build a genuine tracked **single-sticker vertical slice first**, using measured artwork and model-viewer/native AR routing. Add composed cart layouts next. Choose a common iOS/Android world-tracking SDK only if individually editable live placement on both platforms is a firm requirement. In parallel, correct the visual design by restoring the brand's playful identity rather than adding more pale whitespace.

## Follow-up: screen recognition and an entirely web-based editor

The clarified requirement is individual drag/rotate placement of either one selected product or all eligible cart stickers, while viewing the real target through the phone camera. A precomposed Quick Look layout is a fallback, not full satisfaction of this requirement.

Target identity remains to be resolved: the physical display, the back of its lid, or any smooth surface. These are different planes. Detecting a laptop bounding box does not provide an accurate 3D surface pose, cutout boundary or metric dimensions.

For the **display itself**, a proposed cross-platform browser proof can show a feature-rich tracking pattern on the laptop webpage and track it using MindAR plus Three.js on the phone. The operator supplies or calibrates the pattern's physical width; screen pixels and diagonal size alone are insufficient. This could support individual sticker editing in the page without depending on identical WebXR support. It requires tests for screen glare, moiré and oblique views. The pattern cannot simply be removed without evaluating tracking loss or a separate tracking handoff.

For the **outside lid**, a target on the display does not track the reverse surface. Use a target on the lid's own plane, or a separately validated world/object-tracking system. The optional marker-based flow should not be advertised as point-anywhere automatic recognition.

Updated vendor constraint: [8th Wall's world-tracking troubleshooting documentation](https://8thwall.org/docs/troubleshooting/world-tracking-issues) explicitly describes its default world tracking as a dynamically updated single horizontal ground plane. Thus its world-tracking label does not establish support for arbitrary upright laptop surfaces. Its [configuration API](https://8thwall.org/docs/api/engine/xrcontroller/configure) supports estimated absolute scale in metres, but that is not a promise of exact sticker sizing. Image-target tracking needs separate evaluation.

Acceptance criteria: original transparent artwork, measured width/height per variant, optional measured/calibrated target width, one/cart editing using the same local coordinate system, perspective consistency when moving the phone, tracking-loss recovery, and physical ruler comparisons on both iPhone Safari and Android Chrome. Report measured error; do not market the result as perfect scale before validation. A short video or static photo can provide a perspective-mapped preview, but does not itself establish live positional AR tracking.

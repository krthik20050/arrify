# iPhone orientation and artwork controls

User device: iPhone Safari. Requested removal of both photographic shadows and native AR cast shadows.

## Delivered scope

- Three model rotation axes each accept -180 to +180 degrees, including perpendicular 90-degree tilt. Rotations are baked into GLB and iPhone USDZ, rather than changing only the inspection camera.
- Product pages expose Adjust 3D / alignment separately from the existing direct native AR button, so iPhone users can reach the editor before launching Quick Look.
- Flat laptop/desk and upright wall/lid presets are visible above optional fine-tuning. Presets reset the model flush; Reset flush clears all three angles on the chosen surface.
- Quick Look retains the previously implemented horizontal local anchor-space geometry and root any-plane anchoring. No new claim is made about physical wall tracking.
- An optional pale-photo-shadow mask removes exterior-connected light neutral pixels. Enclosed gray artwork and colored/dark pixels are preserved by the tested mask. It can remove intentional pale details touching the exterior, so the UI provides an explicit warning and reversal by unchecking the option. Original catalog assets and prices are unchanged; no bulk artwork regeneration was performed.
- Native links are restricted to mobile Apple capability detection (including iPad desktop UA). Desktop Safari stays in the browser 3D preview even if it recognizes rel=ar. Camera/AR still requires a tap.
- Superseded initial catalog loads cannot overwrite adjusted scenes after asynchronous metadata or viewer-module loading.

## Verification

Promoted release: dpl_2nk4S3Z6JNKe6ei8kgp1gs212UBh (https://stickitup-ar-demo-dxkjkfe4l-krthik20050s-projects.vercel.app), serving https://stickitup-ar-demo.vercel.app. Staged GLB and USDZ files both preserved a 90-degree third-axis rotation. All 14 top-level application assets match the final local source. Public product pages expose the editor entry, and public HTML includes the three-axis and photo-shadow controls. The full HTTPS MVP smoke check passed after promotion.

Final public browser: upright preset selected during loading; turn 25 degrees, forward/back tilt 30 degrees and sideways tilt 45 degrees applied together with optional photo cleanup. The adjusted 3D model rendered and a durable phone QR/link appeared. Screenshot: artifacts/runtime/ar-orientation-live.png. This desktop observation does not establish physical iPhone placement.

53 tests and the complete portable build pass. Coverage includes perpendicular/full-turn rotations, third-axis content IDs, USDZ/prepare-route forwarding, exterior masking versus enclosed details, and desktop Safari routing. Independent software review found a stale-load race, which was fixed and reviewed again.

Local browser: upright preset selected, sideways tilt set to 90 degrees, photo-shadow reduction enabled, adjusted model rendered with a phone QR, and Reset flush returned all three controls to zero. Three representative prepared artworks (Wasted, Compass V2 and Limited Edition V2) were visually compared before/after masking; examples demonstrate reduction of pale edging rather than a guarantee that all dark photographic shadows disappear. Evidence: artifacts/runtime/shadow-review.png and shadow-review.json.

## Limits

These web controls apply before launching Apple Quick Look. They do not insert custom controls into its native AR interface. Website-rendered model shadows remain disabled, but Quick Look controls native surface shadows. This release does not claim those shadows are removed. Physical iPhone wall placement and tracking still need validation on the user's phone. For a closed laptop lying flat choose Flat; use Upright for a vertical wall/lid. A sloping lid is neither canonical plane and may still be difficult to track.

Sources and rationale: ar-device-rotation-research-2026-10-25.md.

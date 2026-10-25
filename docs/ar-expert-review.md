# AR engineering review — 21 October 2026

This is an engineering research review, not testimony from hired external experts. Source inspection and upstream discussions support the recommendations below; they do not replace physical iPhone and Android checks.

## Findings and recommended changes

| Reported problem | Evidence | Recommendation |
| --- | --- | --- |
| Cannot pinch smaller | The page sets `ar-scale="fixed"`; the vendored viewer appends `allowsContentScaling=0` for Quick Look. | Use `ar-scale="auto"` and omit the native scaling lock. Label changed scale as a visual trial; keep reset-to-print-size available. |
| Extra preparation and preview page | The current card navigates to a page, builds a texture and GLB, then converts USDZ at launch. | Generate and host clean PNG + GLB + USDZ before browsing. An iPhone card should be a real `<a rel="ar" href="…usdz"><img …></a>` activated directly by the tap. Use the browser preview only as desktop/unsupported fallback. |
| Wall placement lies flat or rotates incorrectly | WebXR/Scene Viewer and Quick Look use different anchoring orientation conventions. The current GLB becomes upright XY for wall while native export requests vertical anchoring. | Separate Android wall geometry from native anchor-space geometry. Avoid applying both an upright rotation and Quick Look's anchor-basis rotation. Test the native XZ-plane asset with root-level `any` anchoring. |
| Native viewer still prompts or detects a plane | These are system-controlled AR launch/tracking steps. | Remove the site's redundant preparation controls; do not promise to bypass Safari/Quick Look onboarding, camera permission or plane detection. |
| NEW label and background lettering in AR | Catalog photography can contain printed promotional artwork, not merely a DOM badge. Flood-filling edge white removes no internal text. | Use a reviewed clean alternate image or explicit artwork override and store artifact provenance. Never assume taking image #2 or removing white proves clean artwork. Fail closed for unreviewed assets rather than advertising dirty photos as ready. |
| Arrange many stickers individually while tracking | model-viewer's longstanding simultaneous individually manipulable objects feature request is separate from exporting one composite mesh. | Provide a cart layout editor, then export its group to native AR. Clearly call native manipulation group movement/scaling. Independent selection inside tracked AR requires a custom WebXR/native interaction system and a separate iOS implementation. |

## Native USDZ anchoring: important upstream issue

The vendored exporter writes bare anchoring tokens on nested `/Root/Scenes/Scene`. [Open three.js PR 34066](https://github.com/mrdoob/three.js/pull/34066) identifies this as invalid for Apple's applied root-level anchoring schema. The proposal moves the schema and uniform tokens onto the root model and removes the scene-library wrapper. It is **open**, not an accepted guarantee of behavior on every iOS version.

An explicit candidate for a thin flat sticker is:

```usda
#usda 1.0
(
    defaultPrim = "Root"
    metersPerUnit = 1
    upAxis = "Y"
)
def Xform "Root" (
    prepend apiSchemas = ["Preliminary_AnchoringAPI"]
)
{
    uniform token preliminary:anchoring:type = "plane"
    uniform token preliminary:planeAnchoring:alignment = "any"
    # Horizontal XZ sticker geometry in local anchor space; front normal +Y.
    # PBR textured mesh and material children live directly under Root.
}
```

This local anchor-space orientation is intentional: Quick Look may rotate the local horizontal plane to the detected vertical plane. It differs from Android wall geometry, which is authored in XY with its back along negative Z. UV orientation, reflection and rotation must be checked on the actual phone.

The earlier [model-viewer issue 3989](https://github.com/google/model-viewer/issues/3989) reports that `vertical` and `any` can auto-rotate content, and that omitting anchoring tokens permits wall/floor placement without that rotation. The merged [three.js PR 28363](https://github.com/mrdoob/three.js/pull/28363) added `includeAnchoringProperties: false` for that alternative. These are two distinct strategies: **do not mix their geometry assumptions**. If explicit root-schema `any` fails on a target phone, compare an otherwise identical asset with no anchoring schema/tokens; do not silently call the fallback verified.

USDZ archives must be uncompressed with each member's data beginning at a 64-byte boundary. Put the USDA entry first, use relative embedded PNG references, metre units, alpha-capable PBR material, explicit front/back faces or tested double-sided support, and stable HTTPS URLs with `model/vnd.usdz+zip`. See [OpenUSD USDZ specification](https://openusd.org/release/spec_usdz.html).

## Direct launch and background work

Prepare artifacts in an offline catalog pipeline, content-address them by clean texture, dimensions and export version, and store a manifest per product. A direct native asset URL preserves the tap; navigation followed by awaited conversion cannot be presented as reliably identical. New layout exports can be prepared while the user edits, with only the final up-to-date ready artifact attached to the launch button. Do not silently launch an older layout.

The current [model-viewer documentation](https://modelviewer.dev/docs/index.html) states that `ios-src` supplies USDZ, otherwise USDZ is generated at launch. It documents `ar-scale` auto/fixed and placement floor/wall. Auto horizontal-or-vertical placement is not a documented `ar-placement="any"` option; native USDZ anchoring and custom WebXR hit testing must be treated separately.

## Device acceptance checks

1. From a fresh Safari product list, one tap opens the hosted USDZ; no website preparation page.
2. Confirm clean artwork in Object and AR: no NEW, watermark, photo caption or unintended white rectangular background.
3. Pinch below and above original scale, rotate, then reset to 100%. Check actual print width separately.
4. Place on textured desk, then wall; face stays flush and readable with no 90-degree error. Repeat with iOS version recorded.
5. On ARCore Android, verify Scene Viewer/WebXR separately; native iPhone success does not establish Android behavior.
6. Cart layout preserves selection/position/scale. In native AR verify the whole arrangement; do not describe it as individually editable there.
7. Blank walls, glass and reflective laptop surfaces remain adverse tracking conditions. Failure needs a retry hint, not an unsupported recognition claim.

## Sources and research coverage

- [model-viewer official API](https://modelviewer.dev/docs/index.html) and [AR examples](https://modelviewer.dev/examples/augmented-reality.html).
- [Apple allowsContentScaling](https://developer.apple.com/documentation/quicklook/arquicklookpreviewitem/allowscontentscaling): scaling allowed by default.
- [Apple Preliminary_AnchoringAPI](https://developer.apple.com/documentation/usd/preliminary-anchoringapi) and [placing a prim](https://developer.apple.com/documentation/usd/placing-a-prim-in-the-real-world); some Apple pages expose only JS shells to this research tool.
- [Apple WWDC19 AR Quick Look](https://developer.apple.com/videos/play/wwdc2019/612/) describes native anchoring/gesture behavior.
- [model-viewer simultaneous objects issue 482](https://github.com/google/model-viewer/issues/482): individually manipulable simultaneous objects are a distinct requested feature.
- [model-viewer scale discussion 2189](https://github.com/google/model-viewer/discussions/2189): metre geometry and fixed scaling.
- [3D-AR-Studio repository](https://github.com/nirholas/3D-AR-Studio): useful implementation comparison for advance native preparation; its gyro passthrough explicitly is not positional world tracking. Repository claims are not independent device evidence.
- Public Reddit discovery included [Quick Look versus custom WebAR](https://www.reddit.com/r/augmentedreality/comments/f3xbw7/) and [reported Quick Look rendering delay](https://www.reddit.com/r/iOSProgramming/comments/ipxc27/). These are anecdotal and old; no technical requirement here rests on them.

Agent Reach doctor found Reddit OpenCLI missing its Chrome extension and GitHub CLI unauthenticated; Jina and update check failed DNS in this sandbox. Public indexed discovery and official/upstream pages were used through the available web tool. No login, browser extension installation, contact with maintainers or exhaustive internet coverage is claimed. REA skill routing was loaded; available complete source was inspected with repository tools, avoiding unnecessary runtime reverse engineering.

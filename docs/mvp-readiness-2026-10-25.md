# MVP readiness — 25 October 2026

Public app: https://stickitup-ar-demo.vercel.app

## Verified catalog migration

R2 bucket stickitup-ar-assets contains exactly 12,435 catalog files totaling 536,717,932 bytes under ar-prepared/. Every key, size and MD5 ETag matches its local file. Four missing textures were repaired and public downloads compared byte-for-byte. PNG/GLB/USDZ MIME, CORS and preflight checks passed. Evidence: artifacts/runtime/r2-integrity-result.json and r2-catalog-objects.json.

Public origin: https://pub-5e48eb27c91e4f6aa8c1c44eb96e68da.r2.dev

The managed development URL is rate limited; use a custom asset domain for a public production launch. No paid plan upgrade or hard billing cap was configured.

## AR storage repair

Vercel Blob was suspended. Temporary models, metadata and QR snapshots now prefer R2 when server-only S3 configuration is supplied. Missing R2 settings preserve Blob/local selection; malformed supplied settings fail explicitly. GLB, USDZ, scene and QR reads passed in a completely fresh Node process. An independent software reviewer identified a concurrency race, now fixed by capturing bytes/metadata before awaiting upload. A regression test covers 30 overlapping preparations.

The R2-backed release passed staged model preparation, binary retrieval and scene/QR checks before promotion. Public HTTPS smoke checks passed health/catalog, eight public pages, R2 files/CORS, legacy asset redirects, model preparation/retrieval, phone scene/QR, expired handoff recovery, discovery and server cart pricing. Evidence: artifacts/runtime/live-r2-verification.json.

## Final Studio correction

Browser verification found artwork failing during canvas processing after the CDN migration. Studio's page-specific connect-src allows the configured R2 origin, without granting the AR page's WASM exception. Canvas consumers now request same-origin PNG bytes with ?canvas=1; ordinary requests retain the CDN redirect. A regression test covers PNG delivery without a redirect. Local browser verification reached layout ready, rendered the model and displayed the durable phone QR. Final public Studio verification also reached "Your 3D layout is ready. Open the preview for a phone QR."

Final promoted deployment: dpl_FqEqLuzXd9PEDtHCLMuvSiGEmsKq, https://stickitup-ar-demo-lb5rtvocd-krthik20050s-projects.vercel.app. All 14 top-level public application assets match local SHA-256 hashes. The public HTTPS smoke check passed again after final promotion, including same-origin canvas artwork.

The final public browser also rendered the cart arrangement in model-viewer and displayed a durable phone QR/link. Screenshot: artifacts/runtime/mvp-live-ar.png. Native AR was correctly reported unavailable on this desktop; physical phone placement is a separate verification step.

## Automated checks and delivery

49 tests pass, and the portable build passes. The build now discovers all test files. Production dependency audit reports zero vulnerabilities after a compatible Zod override. Independent software review found no remaining blocker in the storage, redirect and canvas changes; this is not physical-device proof.

The Vercel archive excludes prepared catalog files, reducing upload size from approximately 505 MB to 27 MB. Legacy /ar-prepared/ URLs redirect through the app to R2. Production credentials are server-only. Obsolete duplicate local credential entries were removed without printing values. Localhost was restarted with R2 enabled.

## Remaining boundaries

- Payments, customer authentication, fulfillment and contact/newsletter submissions remain disclosed demo behavior.
- Native AR camera alignment and placement require physical iPhone/Android testing.
- Temporary scene API access expires after 30 minutes; underlying objects currently remain stored. Retention cleanup is follow-up work. This public bucket is unsuitable for private media.
- The product uploads sticker artwork/layouts, without camera frames or checkout details.

Rollback: remove AR_ASSET_BASE_URL, include public/ar-prepared/ in deployment uploads again, and redeploy. Removing R2 credentials restores prior Blob/local selection, but the suspended Blob store remains unavailable.

# Vercel + Cloudflare R2

Keep the application on Vercel. Put the prepared public catalog on R2. Temporary cart compositions also use R2 when `R2_ENDPOINT`, `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` are configured as server-only environment variables. `R2_BUCKET` defaults to `stickitup-ar-assets`. Without R2 configuration, the existing Blob/local behavior remains available. Invalid supplied credentials fail explicitly rather than silently claiming durable storage.

Temporary GLB/USDZ, metadata and QR snapshots use the `sticker-ar/` prefix. Their API access checks the existing 30-minute expiry, while catalog objects use `ar-prepared/`. Temporary scene objects currently remain in storage after API expiry; retention cleanup is still required. This bucket is public: temporary scenes contain sticker artwork and layout metadata, never camera frames or checkout details. Do not reuse it for private media. Native model links go through the app API, and credentials are never returned to the browser.

1. Open https://dash.cloudflare.com/ and enable R2 Object Storage. Review any billing activation requirements in your account.
2. Create a Standard storage bucket named `stickitup-ar-assets`.
3. For initial testing, enable its Public Development URL under Settings. For a public launch, connect a custom asset domain instead: Cloudflare documents the development URL as rate limited and intended for development.
4. Configure bucket CORS:

```json
[
  {
    "AllowedOrigins": ["https://stickitup-ar-demo.vercel.app", "http://localhost:3001", "http://127.0.0.1:3001"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["Range"],
    "ExposeHeaders": ["Content-Length", "Content-Range", "ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

5. Create an R2 S3 API token with Object Read & Write permissions restricted to this bucket. Keep the Access Key ID and Secret Access Key in your local credential manager; never paste them into chat or client JavaScript.
6. Configure an S3-compatible uploader (for example rclone) with provider Cloudflare, region `auto`, the account's S3 endpoint, and those credentials. Upload the contents of `public/ar-prepared` to the bucket prefix `ar-prepared/`, preserving filenames. Use **copy**, not sync/delete. Set MIME types `.png=image/png`, `.glb=model/gltf-binary`, `.usdz=model/vnd.usdz+zip`; use `Cache-Control: public, max-age=31536000, immutable` because filenames are content versioned.
7. Check representative PNG, GLB and USDZ public URLs, MIME types, GET/HEAD and browser CORS before switching traffic. The public URL is different from the authenticated S3 endpoint.
8. Set `AR_ASSET_BASE_URL=https://YOUR-PUBLIC-ASSET-HOST` in Vercel environment variables and redeploy. This must be an HTTPS origin with no path. The server remaps all prepared catalog URLs and permits the origin in the AR page CSP.
9. Test a product cube, phone QR, image cutout, iPhone Quick Look and Android Scene Viewer. Keep the original local assets until these checks pass. Only then exclude `public/ar-prepared/` from deployment uploads to reduce deployment size.

Rollback: remove `AR_ASSET_BASE_URL` and redeploy with local prepared files included.

No Cloudflare resources have been provisioned by this code change. Credentials and a reachable bucket are required to complete live verification.

References: https://developers.cloudflare.com/r2/buckets/public-buckets/ and https://developers.cloudflare.com/r2/buckets/cors/

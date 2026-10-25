# Poster Studio - 25 October 2026

Open http://127.0.0.1:3013/pages/poster-studio while the local server is running.

Added Stickers / Posters navigation across the shared theme. Poster Studio includes six original concept artworks, four wall arrangements, pointer and keyboard positioning, sizing, four frame choices, artwork replacement, wall colours, local room-photo upload, local layout saving and PNG export. No poster inventory, pricing, checkout or tracked wall AR is claimed.

Verification: npm run build passed all 59 tests and created dist/. Browser checks observed template replacement, artwork replacement, keyboard movement, oak frame selection and recovery after saving/reloading. Export reached the visible PNG download started status; automated download receipt timed out, so the downloaded file itself remains unverified. Photo upload and narrow-screen layout are implemented but were not exercised in the browser. Screenshot: artifacts/poster-studio-preview.png.

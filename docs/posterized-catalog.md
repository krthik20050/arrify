# Posterized catalog integration

The poster source is https://www.posterized.in, explicitly confirmed by the user. Capture script: `node scripts/sync-posters.mjs --source https://www.posterized.in`.

Source records, all public variants, collection membership and original image URLs live under data/posters/. Product images are mirrored under public/poster-assets/. The sticker catalog is separate and unchanged. Endpoint checkpoints make interrupted captures resumable; remove checkpoints only when intentionally starting a new source snapshot.

The poster department uses the public captured catalog. Search, collections, sort, pagination, product details, all product photos and size/variant selectors are available. Purchases link to the original product on Posterized.in. Add to wall uses a captured product photograph, which can contain a room scene or a multi-panel arrangement. It must not be represented as a clean print file or tracked AR. No local poster checkout is connected.

Wall studio retains templates, selection, keyboard movement, drag positioning, size/frame editing, room photos, browser-local saving and PNG export. Imported IDs use their own storage namespace so previous concept layouts remain untouched. Images are same-origin for canvas export and retain their aspect ratios.

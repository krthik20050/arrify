# Bumper-sticker flashing backgrounds

Investigated and fixed on 20 October 2026.

The public source catalog places an animated reflective-effect GIF first for all 323 bumper-sticker products. The local card renderer selected `images[0]` as its primary thumbnail. Each GIF alternates the sticker between a normal white view and a dark reflective demonstration, producing the black flashing across the grid. The hover image swap could conceal that primary animation temporarily, which made pointer movement appear to affect the flashes.

Browser evidence ruled out an escaping overlay: image bounds matched their individual card bounds, the cards had clipped overflow, and no CSS animations were active in the grid. The first Orange Cat and Kakashi thumbnails were actual `.gif` URLs; their alternate images were still JPEGs.

The card renderer now chooses only still images for primary and alternate grid previews. The original source catalog and product galleries are unchanged. Four bumper products have only GIF source images, so `scripts/extract-card-stills.py` retains original still frames under `public/assets/card-stills/`.

A regression test was written first and failed on Orange Cat's GIF primary image. It now checks all 323 bumper products, rejects animated grid image URLs, and verifies the extracted fallback files exist. Browser verification found zero animated image URLs among the 24 rendered cards on the first bumper collection page.

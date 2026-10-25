# Sticker size research — 2026-10-25

## Question

Can public listings and customer reviews provide real physical width and height for every sticker in the AR catalog?

## Findings

- **Not for every SKU.** Public listings mostly state a maximum bounding area and explicitly say the sticker's height and width depend on the design aspect ratio. That is a size constraint, not a SKU-specific measured width/height.
- A standard premium vinyl listing states **fits within 3 × 3 in**: [Python Sticker](https://www.stickitup.xyz/products/python-sticker). The official product page describes the same fit-box convention.
- A reflective bumper listing states **fits within 8 × 8 in**: [Sangi Bumper Sticker](https://www.stickitup.xyz/products/sangi-bumper-sticker). The review section includes one customer saying it was larger than expected for a bike tank and another asking for its size. These are useful evidence of a sizing-communication problem, but they do not provide measured dimensions.
- Reflective designs can have size variants. [Cute Pizza Reflective Sticker](https://www.stickitup.xyz/products/cute-pizza-reflective-sticker) lists a small **3 × 3 in** area and a big **5 × 5 in** area; the selected variant must be part of the AR size record.
- Sheet listings do not share one universal size. [Food Mini Stickers Sheet](https://www.stickitup.xyz/collections/best-selling-products/products/food-mini-stickers-sheet) states **5.6 × 4.1 in**, while [Mumbai Mini Sticker Sheet](https://www.stickitup.xyz/products/mumbai-mini-sticker-sheet) says **3 × 3 in**. Do not infer sheet dimensions from the words “mini sticker sheet” alone.
- Customer reviews and public discussions are mostly about quality, delivery, adhesion, and value. The reviewed size comments are qualitative (“small”, “too big”) or ask for dimensions; they cannot safely be converted into measurements. Reviews should be treated as customer-experience evidence, not product-spec data.

## What we can populate now

The local AR catalog has **4,145 products** across `Stickers` (3,077), `Glitter Stickers` (203), `Holographic stickers` (523), `Bumper Sticker` (323), and `Infinity Stickers` (19). We can record source-stated fit boxes and known variant sizes where an authoritative listing provides them. For designs with a fit box but no listed width/height, the product's cutline/art aspect ratio can yield an AR preview size constrained to that box; this remains a derived preview size, not a manufacturing measurement.

The storefront's current per-product catalog copy is not sufficient for complete size coverage: some product records have generic descriptions and omit the size text. The current AR endpoint correctly returns `widthMm: null` and `heightMm: null` instead of asserting a fake measured size (`lib/ar.mjs`).

## Recommended manifest fields

For each handle and purchasable variant, store:

`handle, variant_id, variant_title, artwork_width_px, artwork_height_px, fit_box_width_mm, fit_box_height_mm, actual_width_mm, actual_height_mm, source_url, evidence_type, confidence, checked_at`

Use `actual_width_mm` / `actual_height_mm` only when a SKU-level production spec, dieline, or directly measured physical sample is available. Use the public fit box and artwork ratio for clearly labeled AR estimates. For records still lacking evidence, retain null dimensions and ask the merchant for the print-production export or dielines. The official general support contact displayed on product listings is `wecare@stickitup.xyz` (contacting them would be a separate outbound action).

## Search boundary and evidence notes

This was a bounded public-web search of indexed official Shopify product pages, customer reviews surfaced on those pages, and indexed Reddit/Trustpilot discussions for the brand and sticker dimensions. It is not literally every page or private customer post on the internet. No independent review located supplied measured SKU-by-SKU widths and heights. Official listing copy is the strongest public dimension evidence; customer anecdotes only corroborate the need for clearer size presentation.

The data-source boundary matters: the local AR catalog contains the full 4,145-item AR subset, but local product images and their pixel dimensions cannot independently prove the physical scale of the printed item.

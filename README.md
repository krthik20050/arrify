# STICK IT UP storefront recreation

An editable local recreation of [stickitup.xyz](https://www.stickitup.xyz/), captured on **19 October 2026**. The public catalog is stored locally; the application does not query the production Shopify store for shopping actions.

## Run

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open the printed localhost URL (port 3000 by default). To select another port in PowerShell:

```powershell
$env:PORT = '3001'
node server.mjs
```

If a global npm shim is broken on Windows, the installed Node npm CLI can be invoked directly:

```powershell
& 'C:\Program Files\nodejs\node.exe' 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' ci
```

## Implemented

- Original captured homepage, navigation, brand styles, promotional banners, category grid, best seller tabs, testimonials, FAQ, and footer.
- **4,475 products**, **5,191 variants**, **157 collections**, and **26,865 source image records**. Includes **563 sold-out products**.
- All captured products have their own local product route with original title, description, prices, availability, options and image gallery.
- Collection browsing, pagination, live search, price/type/availability filtering and sorting.
- Original 3-question sticker quiz, 21 genre filters and 8 personality filters, using captured live filter membership.
- Quick view, option selection, quantity controls, image enlargement and product sharing.
- Cart drawer and cart page with browser persistence, quantity changes, removal, and server-calculated captured prices.
- Demo checkout with form validation, the explicitly demo `DEMO10` discount, confirmation, and locally tracked demo orders.
- Demo account, newsletter/support form feedback, original story/custom-sticker/review/FAQ/policy pages, blog pages and linked articles, and T-shirt size chart.
- Twenty original social-feed thumbnails saved locally, with image previews and the official Instagram link.

## Evidence and boundaries

The public product and collection feeds were paginated through a terminal empty page. `data/manifest.json` records the source, timestamps, counts and per-endpoint page totals. `reference/filter-report.json` records all 29 genre/style captures. `reference/routes.json` maps captured content routes to their retained original HTML.

REA statically inspected the 38 captured theme JavaScript files (222,021 bytes, no parse failures). Retained parent evidence: `ev_374da2644ada335b16a6e4e6b466d16810cda7bb22f8af1f19090f104874b9ea`. Semantic coverage is **partial**; static inspection does not prove runtime behavior. Browser inspection supplied the visual and interaction evidence.

The homepage and captured content retain the original markup/styles. Product, collection and cart templates are local implementations matching the observed brand and shopping structure; they are **not a pixel-perfect copy of every original template or third-party widget**.

The source catalog has **55 products without images**; these show an explicit image-unavailable fallback. Most product images retain the original Shopify CDN URLs, so an internet connection is required for them. Prices and availability are the captured snapshot and can change on the actual store.

Real customer authentication, payments, shipments, customer data, promotional discount rules, live reviews, newsletter subscriptions and support submissions require owner-provided backend integrations. Demo checkout creates no actual purchase. It stores item summaries locally and does not save the entered contact/address details. Original external social, email, phone and tracking links remain external where appropriate.

The review recreation is marked `noindex`; production analytics, payment scripts, and third-party executables are removed. Only reviewed local application scripts execute.

## Edit the site

| File/folder | Purpose |
| --- | --- |
| `lib/render.mjs` | Product/collection/local page templates and homepage reconciliation |
| `lib/catalog.mjs` | Search/filter/sort rules and server-side cart quoting |
| `lib/html.mjs` | Original HTML sanitation and asset/link rewriting |
| `public/app.js` | Navigation overlays, cart, galleries and demo checkout |
| `public/app.css` | Local template and responsive styles |
| `public/quiz.js`, `public/vibes.js` | Retained original quiz and category-grid behavior |
| `public/assets/` | Captured original styles, banners and social thumbnails |
| `data/` | Local product catalog, collection/filter membership and provenance |
| `reference/pages/` | Original public HTML retained for faithful content rendering |
| `reference/theme/` | Theme scripts retained for analysis, never served/executed |

## Validate and package

```sh
npm test
npm run build
```

Tests verify catalog completeness, collection references, valid prices, sold-out handling, cart price authority, rejection of bad quantities/variants, pagination, local script boundaries, page rendering and HTTP integration. The build produces a portable `dist/` Node app. Run `npm ci --omit=dev` and `npm start` inside `dist/` on a Node host. GitHub Actions runs these checks and uploads the built folder when this source is placed in a repository.

`scripts/sync-catalog.mjs`, `scripts/capture-site.mjs`, `scripts/capture-content.mjs`, and `scripts/sync-filters.mjs` refresh public source snapshots. These developer scripts use `curl.exe` on Windows. Run them deliberately: they replace the captured snapshot. Rebuild and restart after refreshing.

## Verification scope

Automated tests and browser checks are recorded in `docs/verification.md`. Engineering assumptions are mobile/4G and desktop use, server-rendered public catalog pages, and WCAG AA as a target. Targets for a future production optimization pass are LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1, local application JavaScript ≤80 KB gzip, and Lighthouse accessibility ≥90/performance ≥85. These performance/accessibility scores have **not** been measured or claimed here. Original third-party CSS and CDN images affect results. Physical-device, screen-reader and real provider validation remain separate work.

## Poster department

The Posters button opens `/pages/poster-studio`: browse the captured Posterized.in catalog by search or collection, inspect product photographs and size options, and add a chosen photograph to a wall layout. Poster purchases open the original store; they do not enter the sticker demo checkout. The wall editor uses product photography and estimated visual sizing, not print files or tracked wall AR.

- Resume the public capture: `npm run sync:posters`; start a fresh snapshot: `npm run sync:posters -- --fresh`
- Verify original images and generate lightweight browsing thumbnails: `npm run audit:posters`
- Run tests and create the portable deployment: `npm run build`

Source snapshots live in `data/posters/`; local originals and thumbnails live in `public/poster-assets/`. Captured prices and availability can become outdated. Keep the source attribution and product-photo preview wording when publishing.

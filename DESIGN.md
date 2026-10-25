# STICK IT UP shopping interface

## Scene and visual strategy
A shopper browses on a phone in ordinary daylight or on a laptop at a desk, comparing colourful sticker designs. Use a light, warm neutral shopping surface and a compact dark brand header. Restrained yellow accents distinguish actions and selected states; the artwork supplies the rest of the palette.

## Tokens
- Ink: dark olive-charcoal, approximately #1c1e18.
- Paper: warm off-white, approximately #f8f8f2.
- Panel: near-white, approximately #fefefa.
- Accent: brand lemon yellow, approximately #eeef52.
- Muted text: olive-grey, approximately #64685b.
- Borders: pale olive-grey, approximately #dedfd4.
- Body: native sans-serif at 14–16px. Product titles 13–14px. Headings use weight and a compact fixed scale rather than decorative ghost text.

## Layout and components
- One 72px desktop / 64px mobile header. Desktop logo, shop menu, discovery, laptop layout, search and cart share one row.
- Content max-width 1280px with 32px desktop and 16px mobile gutters.
- Intro height about 240px desktop; first product imagery visible in the initial viewport. Mobile intro about 220px.
- One category rail, one functional product-feed heading. Six columns on wide desktop, four on medium screens, two on phones.
- Product images are still previews. One product-card purchase action; option selection remains available.
- Mobile filters are collapsed behind an explicit toolbar control.
- Compact footer. Story/support/policies stay reachable without dominating the shopping header.

## Motion and accessibility
Motion is limited to input feedback: 150–220ms opacity/transform, no automatic carousels or decorative entrances. Swipe has Like/Pass buttons, Undo, keyboard support, vertical scroll preservation and reduced-motion behavior. Controls have visible focus and minimum 44px interactive targets. Product cards and catalog state do not rearrange under the pointer during browsing.

## Image gate
New generated imagery is unnecessary: this store has thousands of original product artworks and retained brand assets. Use those real assets and browser screenshots as visual probes, avoiding synthetic products or mock inventory.

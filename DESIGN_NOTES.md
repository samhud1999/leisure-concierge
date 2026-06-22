# RACV Brand Notes — Concierge PoC

Researched from racv.com.au on 2026-06-22 via WebFetch (rendered HTML + linked
CSS; no live DevTools). Where a value is a best-guess (e.g. licensed font name
unavailable, page heavily JS-rendered, source not inspectable), it is prefixed
`BEST-GUESS:`. Replace with the verified value if better information becomes
available.

All three target pages are served by Adobe AEM and are heavily JS-rendered;
the WebFetch tool received stripped markdown with no inline `<style>` blocks or
`<link rel="stylesheet">` tags visible. CSS values were obtained from the
publicly accessible bundle at
`https://www.racv.com.au/etc.clientlibs/racv/clientlibs/clientlib-base.min.css`
which returned real CSS content (verified reachable, content truncated by
WebFetch model but key rules extracted across multiple focused queries).

## Sources
- https://www.racv.com.au
- https://www.racv.com.au/travel-experiences/resorts.html
- https://www.racv.com.au/travel-experiences/resorts/torquay.html
- https://www.racv.com.au/etc.clientlibs/racv/clientlibs/clientlib-base.min.css

## Palette

Colours confirmed directly from `clientlib-base.min.css` rules:

| Token            | Hex         | Used for                                                    |
|------------------|-------------|-------------------------------------------------------------|
| `--racv-navy`    | `#1f5aa5`   | Primary blue — blockquotes, datepicker selected, link base  |
| `--racv-navy-2`  | `#1967b0`   | Hover/active for navy elements (a:hover colour in CSS)      |
| `--racv-accent`  | `#009bde`   | Secondary/interactive highlight (awesomplete hover bg)      |
| `--racv-ink`     | `#454849`   | Body text (dark grey, confirmed from CSS)                   |
| `--racv-muted`   | `#a7a8aa`   | Secondary/meta text, disabled border (c-btn-disabled)       |
| `--racv-line`    | `#d9d9d9`   | Borders, dividers (confirmed from CSS palette)              |
| `--racv-bg`      | `#f2f2f2`   | Page background (confirmed from CSS light grey)             |
| `--racv-card`    | `#ffffff`   | Card/surface background (c-btn-disabled background: #fff)   |
| `--racv-success` | `BEST-GUESS: #2e7d32` | No green success colour found in CSS; standard accessible green |
| `--racv-warning` | `#ffbf47`   | Focus/keyboard outline colour (confirmed from CSS)          |

**Notes on navy depth:** The CSS does not contain a deep navy like `#002664` or
`#003087`. The primary brand blue extracted is `#1f5aa5` (medium blue). The
existing project's `index.html` uses `#002664` as a placeholder RACV navy. For
the reskin, use `#1f5aa5` as the authoritative CSS-confirmed value for
`--racv-navy`, and retain `--racv-navy-2: #1967b0` for hover.
The homepage homepage description references "yellow journey line" as a brand
graphic device (not a dominant UI colour); this maps to `--racv-warning`.

## Typography

**Per user direction (2026-06-22): the PoC uses Poppins for ALL typography
(headings AND body), overriding the RACV-extracted brand fonts.** The original
brand-research findings (proxima-nova + Open Sans) are retained below for
reference, but the reskin tasks use Poppins exclusively.

### Active PoC typography — Poppins

- **Family (everything):** `Poppins` via `https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap`
- **Stack:** `'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`

| Role     | Family   | Size      | Weight | Line-height | Letter-spacing |
|----------|----------|-----------|--------|-------------|----------------|
| H1 hero  | Poppins  | `50px`    | 700    | 1.2         | normal         |
| H2       | Poppins  | `30px`    | 600    | 1.5         | normal         |
| H3       | Poppins  | `20px`    | 600    | 1.4         | normal         |
| Body     | Poppins  | `15px`    | 400    | 1.55        | normal         |
| Small    | Poppins  | `12.5px`  | 400    | 1.4         | normal         |
| Button   | Poppins  | `14px`    | 600    | 1           | `0.05em`       |
| Wordmark (logo) | Poppins | `22px` | 700 | 1     | `0.1em` (+2px tracking) |

(Sizes preserve the visual hierarchy from the original RACV-derived spec while
adjusting to Poppins' wider character; H3 reduced from 24→20px and body from
16→15px to suit Poppins' larger x-height.)

Button labels use `text-transform: uppercase` (confirmed from RACV `.c-btn-label`
rule). Account for this in the reskin.

### Reference — RACV's actual brand fonts (NOT used in this PoC)

The `clientlib-base.min.css` @font-face declarations load:
- **`proxima-nova`** — weights 400, 600, 700 — applied to all headings (licensed Typekit; not available via Google Fonts).
- **`Open Sans`** — weight 400, 600, 700 — applied to body/html.
- **`Suisse Intl`** — weights 400, 500, 600, 700 — @font-face declared on the AEM theme.

If the PoC ever moves to faithful brand reproduction, swap Poppins for
`Source Sans 3` (closest open substitute for proxima-nova) + `Open Sans`.

## Logo

All logo SVG/PNG paths tried returned HTTP 404:
- `/content/dam/racv-assets/images/logos/racv-logo.svg` → 404
- `/content/dam/racv-assets/images/logos/racv/racv-header-logo.svg` → 404
- `/content/dam/racv-assets/logos/racv/racv-header-logo.png` → 404
- `/content/dam/racv-assets/logos/racv/logo-navy.svg` → 404
- `/content/dam/racv-assets/logos/racv/RACV-logo.svg` → 404
- `/content/dam/racv-assets/logos/racv/racv-full-colour-logo.svg` → 404

The pages are JS-rendered, so no `<img src="...logo...">` element was recovered
from WebFetch output.

- Format obtained: `none — file does not exist yet`
- File at: not saved; reproduce wordmark in Task 3 as an SVG text/path element
- Min clear-space: `BEST-GUESS: 16px` (one character-width on all sides, typical automotive club standard)
- Display height in header: `BEST-GUESS: 32px` (typical compact header logo height for desktop)

**Task 3 guidance:** The RACV wordmark is a bold, all-caps sans-serif logotype.
Reproduce it as an inline SVG `<text>` element in navy `#1f5aa5` (or white
`#ffffff` on the navy header background), using **Poppins Bold (700)** at
approximately 20–22px, tracking +2px letter-spacing. Add a small yellow/gold
keyline accent (`#ffbf47`, 3px wide) to the left of the wordmark as a brand
divider strip, referencing RACV's "yellow journey line" brand device described
on the homepage.

## Components

Values sourced from `clientlib-base.min.css` unless marked `BEST-GUESS:`.

| Element        | Property        | Value                                              |
|----------------|-----------------|----------------------------------------------------|
| Button         | border-radius   | `0px` (CSS shows `border-radius: 0` pattern)       |
| Button         | padding         | `BEST-GUESS: 12px 24px` (no explicit .c-btn padding found) |
| Button         | font-weight     | `600`                                              |
| Button         | transition      | `120ms (PoC; RACV uses 500ms — slower felt sluggish in a chat composer)` |
| Button         | text-transform  | `uppercase` (confirmed on `.c-btn-label`)           |
| Card           | border-radius   | `BEST-GUESS: 4px` (no explicit .c-card border-radius found) |
| Card           | box-shadow      | `0 2px 10px rgba(0,0,0,.25)` (awesomplete/autocomplete shadow observed) |
| Card           | padding         | `BEST-GUESS: 16px` (no explicit .c-card padding found) |
| Spacing scale  | `--s-1`         | `4px` (quarter-unit)                               |
| Spacing scale  | `--s-2`         | `8px` (`0.5rem`)                                   |
| Spacing scale  | `--s-3`         | `16px` (`1rem` — base unit)                        |
| Spacing scale  | `--s-4`         | `24px` (`1.5rem`)                                  |
| Spacing scale  | `--s-5`         | `32px` (`2rem`)                                    |

**Note:** RACV uses a flat/square button aesthetic (border-radius: 0) — this is
deliberate brand style, not a gap. Do NOT add border-radius to primary buttons
in the reskin. The PoC's current `border-radius: 12px` on textarea and button
should be reduced to `0` for authentic RACV feel.

## Imagery

RACV resort photography follows a premium travel/lifestyle treatment: wide
16:9 hero banners (1600×900px) featuring coastal landscapes, couples in
romantic settings (balconies, dining, spa), and dawn/sunrise shots emphasising
natural light and the Surf Coast environment. The Torquay resort hero shows
sunrise over the resort exterior, and accommodation cards show couples enjoying
ocean views with warm-toned ambient interiors. A secondary card format at 4:3
(420×315px) is used for facility grids (spa, golf, pool, conference spaces).
Colour grading is warm-neutral with lifted shadows — lifestyle editorial style,
not studio photography. For Task 6 placeholder imagery, use **Unsplash** with
the search terms `"coastal resort Australia"`, `"luxury hotel ocean view"`, or
`"Great Ocean Road Victoria"` — the API endpoint is
`https://source.unsplash.com/1600x900/?coastal+resort+australia` for
development placeholders.

### Hero image (Task 6)

- **File:** `public/img/hero-resort.jpg`
- **Dimensions:** 1920×600px, JPEG, ~156 KB
- **Source:** Unsplash — `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80&fit=crop&h=600`
- **Unsplash photo page:** `https://unsplash.com/photos/1506905925346-21bda4d32df4`
- **Photographer:** Markus Spiske (@markusspiske on Unsplash)
- **Licence:** Unsplash Licence (free for commercial and personal use; no attribution required, but credited here for provenance)
- **Note:** Development/PoC placeholder only. Replace with official RACV resort photography before any production use.

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

V2 spec palette (commit 98917c5). Supersedes the earlier muted CSS-bundle
extraction, which lacked the saturated brand-yellow CTAs and the journey-
curve graphic.

| Token             | Hex       | Used for                                  |
|-------------------|-----------|-------------------------------------------|
| `--racv-blue`     | `#0066CC` | Primary brand: logo, headings, links      |
| `--racv-blue-2`   | `#004E9E` | Hover/active                              |
| `--racv-yellow`   | `#FFD600` | CTA fill, journey-line, focus ring        |
| `--racv-yellow-2` | `#E6C100` | Hover for yellow CTAs                     |
| `--racv-ink`      | `#0A2E5C` | Body headings (deep navy)                 |
| `--racv-text`     | `#1A2B4A` | Body copy                                 |
| `--racv-muted`    | `#6B7589` | Meta, captions, weather sub-label         |
| `--racv-line`     | `#E0E5EF` | Dividers, card borders                    |
| `--racv-bg`       | `#F4F6FA` | Page background                           |
| `--racv-card`     | `#FFFFFF` | Card surface                              |
| `--racv-tint`     | `#EAF1FB` | Selected/hover tile tint                  |

## Typography

- Brand font: Poppins (already loaded from Google Fonts). Weights 400 / 500 / 600 / 700.
- Stack: `'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`

| Role     | Size    | Weight |
|----------|---------|--------|
| H1 hero  | 50px    | 700    |
| H2       | 30px    | 600    |
| H3       | 20px    | 600    |
| Body     | 15px    | 400    |
| Small    | 12.5px  | 400    |
| Button   | 14px    | 600    |

## Logo

- Format: SVG at `public/img/racv-logo.svg`.
- Italic RACV wordmark in `--racv-blue`, three yellow journey stripes underneath in `--racv-yellow`.
- Display height in header: 32px.

## Components

| Element            | Property        | Value                          |
|--------------------|-----------------|--------------------------------|
| Button             | border-radius   | `999px` (PILL)                 |
| Button             | padding         | `12px 24px`                    |
| Button             | font-weight     | `600`                          |
| Button             | transition      | `background-color 120ms ease`  |
| Card               | border-radius   | `12px`                         |
| Day card           | border-radius   | `16px`                         |
| Input              | border-radius   | `8px`                          |
| Card               | box-shadow      | `0 1px 2px rgba(20,30,60,0.04)`|
| Spacing scale      | `--s-1` … `--s-5` | `4 / 8 / 16 / 24 / 32 px`    |

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

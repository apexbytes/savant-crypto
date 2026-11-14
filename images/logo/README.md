# Savant logo

The mark is an **S in orbit**: the brand's own letter drawn as two true 270° arcs on a
shared axis, inside the orbit ring the site already runs on four pages, with a point on the
ring at the upper right — the period from the `savant.` wordmark, sitting on the diagonal of
the `↗` the site uses throughout.

The wordmark is Manrope SemiBold, **converted to outlines**. These files carry no live text,
so they render identically everywhere and need no font installed.

## Files

Four layouts × four colourways. `{way}` is one of `color`, `black`, `white`, `mono`.

| File | Use |
| --- | --- |
| `savant-logo-horizontal-{way}.svg` | **The full logo.** Primary lockup — headers, footers, email, slides |
| `savant-logo-vertical-{way}.svg` | Stacked lockup — square spaces, merchandise, profile headers |
| `savant-icon-{way}.svg` | Mark alone, 32px and above — avatars, app chrome, watermarks |
| `savant-icon-small-{way}.svg` | Mark alone, **below 32px** — see "Small sizes" |
| `savant-wordmark-{way}.svg` | Word alone, where the mark already appears nearby |

### Colourways

| Suffix | What it is |
| --- | --- |
| `color` | **Full colour.** Olive mark, lime point, ink wordmark. The default. |
| `mono` | **One colour.** Everything inherits `currentColor` — set `color` on the parent. |
| `black` | One colour, locked to `#000000`. Print, fax, single-colour press. |
| `white` | One colour, locked to `#ffffff`. For ink, photography, the green panels. |

### Also here

| File | Use |
| --- | --- |
| `favicon.svg` | Browser tab — the small-size mark in full colour |
| `favicon.ico` | Legacy fallback, 16 / 32 / 48 in one file |
| `apple-touch-icon.svg` | 180×180, white mark on ink, full bleed |
| `png/` | Raster exports for contexts that can't take SVG |

## Rules

**Small sizes.** Below about 32px the hairline orbit washes out. `savant-icon-small-*`
is the same mark with the ring weight and tint raised so it still reads at 16px. Use it for
favicons, dense table rows, and anything under 32px. Above 32px use `savant-icon-*`.

**Clear space.** Keep free space equal to the diameter of the lime point on every side of
the lockup. The SVGs are cropped tight so you control this in layout.

**Minimum sizes.** Horizontal lockup: 96px wide. Vertical lockup: 64px wide. Icon: 16px.

**Don't** recolour the point to anything but lime or the one-colour value, stretch the
lockups non-uniformly, rebuild the wordmark from live Manrope (the tracking is specific),
or set the mark on a background that drops below 3:1 against it.

## Colour

| Role | Value | Notes |
| --- | --- | --- |
| Mark | `#5a7a37` olive | `--brand-700` |
| Point | `#8fc149` lime | `--brand-500` |
| Wordmark | `#1a1917` ink | `--neutral-900` |
| Wordmark point | `#71a53a` | `--brand-600`, matches `.brand-period` |
| Orbit ring | mark colour at 30% | 45% in the small-size variant |

Lime is a **graphic** colour, not a text colour — it reads 2.12:1 on white. Never set
body copy or links in it.

## Regenerating

`images/logo/` is generated. The wordmark outlines come from
`manrope/Manrope-SemiBold.woff2` via fontTools; the build script lives outside the repo.
Edit the SVGs directly for small changes — they're plain paths.

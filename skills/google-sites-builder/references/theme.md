# Theme, site creation and page header

**Optional.** Only build a custom theme when the user wants brand colours or a specific look. For a plain/unique site you can keep the default theme and skip most of this — just create the site, name it, and delete the header.

## Create a blank site

From the Sites dashboard, open a new blank site:

```bash
playwright-cli -s=gsites goto "https://sites.google.com/new"
# then click the "Blank site" option (real click), or:
playwright-cli -s=gsites goto "https://sites.google.com/create"
```

Wait for the editor (`/d/<id>/p/<id>/edit`) to load (~8s). Set the site document name and the visible header site-name:

```bash
# document name field
playwright-cli -s=gsites fill "input[aria-label=\"Site name\"]" "my-site-name"
```

## Delete the default page header

Most of these sites look better with the big default header removed (content then starts right under the nav bar). Hover the header section and click **Delete header**:

⚠️ **Do NOT delete it if the site gets a full-screen first screen** (age-gate / CTA opener): that screen
IS the header, set to type `Cover` — see `references/embed.md` → "The first screen". Deleting the header
costs a manual user gesture to get it back, because **Add header** cannot be clicked from Playwright.

```bash
playwright-cli -s=gsites click "[aria-label='Page header section']"   # hover target
playwright-cli -s=gsites click "[aria-label='Delete header']"
```

## Custom theme (brand colours + fonts)

1. Open the **Themes** tab (right panel) → **Create theme** (under "Custom").
2. Name it, click **Next**, choose **Custom colors** tab, and set the 3 seed colours (hex textboxes `Color 1/2/3`). Press Enter after each hex.
3. Choose fonts (search the font dialog, pick a title font like *Archivo*/*Anton*, keep a clean body font). **Done** → **Create theme**.

After the theme exists, the **Colors** panel gives you per-role control. This is where you make it actually on-brand:

- **Background** → your near-black brand colour (e.g. `#0b1013`) via "Add custom color".
- **Titles and headings** → your accent (e.g. amber `#fdb614`).
- **Body text** → near-white (`#f9f9f9`).
- **Style 1 / Style 2 / Style 3** are the three section palettes you cycle through per section:
  - Style 1: dark background, amber headings, white body.
  - Style 2: a slightly different dark (e.g. `#141c22`) for alternating sections.
  - Style 3: an amber "plaque" (amber background, dark text) for a callout / pre-footer block.
- **Navigation** → set "Color when scrolled" to the brand dark so the top bar matches.

Each colour picker: click the swatch → **Add custom color** → type hex into `input[aria-label="Hex"]` → Enter.

The mechanics of opening these menus are fiddly; the reliable pattern is: hover the section, real-click `[aria-label="Section colors"]`, then click the Style/Image row. See `references/interactions.md` for the section-style popup, and reuse the same real-click discipline for the theme colour pickers.


## The theme font list is fixed — pick from it BEFORE the prototype

The theme wizard (and the theme's "Change fonts" panel) offer a fixed list of ~35 families, and fonts you
add through **More fonts → My fonts** do **not** appear there. Measured list (04.09.2026):

Amatic SC, Archivo, Arial, Caveat, Comfortaa, Comic Sans MS, Courier New, EB Garamond, Georgia, Impact,
Inter, **Lato**, Lexend, Lobster, Lora, Merriweather, Montserrat, Nunito, Oswald, Pacifico,
Playfair Display, Plus Jakarta Sans, Poppins, Roboto, Roboto Mono, Roboto Serif, Spectral,
Times New Roman, Trebuchet MS, Verdana. *(Re-measured 08.09.2026 — Lato IS in the list; an earlier
version of this file wrongly omitted it and cost a needless prototype font swap. Dump the list yourself
before assuming a family is missing: open the fonts dialog and read `[role=menuitem]` texts.)*

**Check the script coverage of the family before choosing it**: Poppins, Montserrat, Lexend, Nunito, Lato (Google
Fonts build) have **no Greek glyphs** — Greek headings silently fall back to a serif while Latin words stay in
the chosen font (seen 08.09.2026 on a Greek site). Families with Greek in the Sites list: Roboto, Inter,
Comfortaa, EB Garamond, Roboto Serif, Roboto Mono, Arial/Verdana/Georgia (system). Cyrillic is a separate
check (Poppins has none either).

So **choose the pair from this list before building the HTML prototype** and use exactly those fonts in
the prototype — otherwise the approved mock-up and the live site differ (Play971: prototype used Karla,
the theme had to fall back to Inter).

## Assigning section styles

Every content section can be set to Style 1/2/3 (or an image background). Alternate Style 1 / Style 2 down the page for rhythm, and use Style 3 for the occasional callout. Do this as you build each section — see `references/interactions.md` → "Section styles".

## Favicon and logo (mandatory — every build gets a favicon)

**Every Google Sites build must ship a favicon.** A site published with the default grey Sites glyph is
considered unfinished. Prepare the file offline together with the other images.

- **File:** square PNG, **32×32** (Sites accepts up to 1 MB and rescales; 32×32 keeps it crisp in the tab).
  Draw it from the brand mark — the logo's symbol, or the brand initials on the brand colour — not the
  full wordmark, which turns to mush at tab size. Solid background, no transparency-only artwork.
- **Where:** the theme wizard's *Add a logo / Add a banner* buttons **do not open anything**. The working
  path is `Themes → ⋮ (Theme options) → Edit → Images → Favicon` → click the icon on the right of the row
  → **Upload** → then `playwright-cli upload <file>`. The **Logo** row in the same panel takes the header
  logo the same way.
- **Verify after publishing:** `document.querySelector('link[rel*=icon]').href` on the `/view/` URL must
  point at a `googleusercontent`/`sites` asset, not the default `gstatic` Sites glyph.
- The favicon change needs a **republish** to reach the live site (it shows in the publish dialog as a
  site-level change).

## Footer colour: click "Edit footer" first

The footer is locked behind an **"Edit footer"** overlay (pencil pill in its middle on hover). Until you
click it, hovering shows only "Hide footer on this page" and no palette exists in the DOM. After the
click the footer behaves like a section: `[aria-label="Section colors"]` on its left edge → `Style N`
(or an image). Verified 08.09.2026 (tophellasbet): footer → Style 3 = brand navy.

## The "Default" entry in Colors is a swatch, not a tab

In `Colors` the row reads `Default | Style 1 | Style 2 | Style 3`. **`Default` is the theme's base-colour
swatch** (aria-label `Default, selected color #…`); clicking it opens a colour picker, it does not switch
the Background/Titles/Body rows. Those rows always belong to the currently selected Style tab, so a
script that "selects Default" and then edits Titles/Body silently recolours **Style 1** (08.09.2026: Style 1
got yellow titles and white body on a white background — invisible text on the live page). Only ever
edit roles after clicking an explicit `Style N` tab, and re-read all three tabs before publishing.
Also re-check theme **Images** (Header, Logo) and **Navigation** colours before the final publish — on
one build they reverted to defaults mid-way through other theme edits. (Colors → `Default` tab → Background / Body text).
Dark themes therefore get a dark footer for free; on a light theme set Default Background to the brand
colour (+ light Body text) and give every content section an explicit Style 1/2/3 so only the footer
(and any un-styled section) shows it. Verified the other way round on 08.09.2026: Default left white →
footer white.

## Fonts per text style (Text panel) — the reliable way to set Poppins & co.

`Themes → ⋮ → Edit → Text` holds a **`Select text style` listbox** (Normal text / Title / Heading /
Subheading / Small text) and, for the selected style, a **Font** button plus size/bold/align. So the heading
font and the body font are set independently: choose `Title` → Font → pick the family → repeat for
`Heading` and `Subheading`; leave `Normal text` / `Small text` on the body font. Mechanics (08.09.2026):
open the listbox with a real click on it, pick the option by a **real click on the option's own rect**
(the collapsed options report height 0 — read rects only after opening), then click the Font button and
walk the font list with `ArrowDown` reading `aria-activedescendant` until the family matches, `Enter`.
The listbox label always reads the first option — verify by re-selecting each style and reading the
Font button text instead.

## Navigation bar background (logo visibility over a dark Cover)

`Themes → Edit → Navigation → BACKGROUND`: a `Color when scrolled` swatch and a **`Transparent at top`**
checkbox. A dark brand logo disappears on a dark Cover header while the bar is transparent — set the
swatch to white (swatch `locator.click({force:true})` → Add custom color → Hex `fill('#FFFFFF')` → Tab →
Save) and uncheck `Transparent at top`. The checkbox exposes no `aria-checked`; confirm on the live page.

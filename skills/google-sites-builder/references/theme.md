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

## Assigning section styles

Every content section can be set to Style 1/2/3 (or an image background). Alternate Style 1 / Style 2 down the page for rhythm, and use Style 3 for the occasional callout. Do this as you build each section — see `references/interactions.md` → "Section styles".

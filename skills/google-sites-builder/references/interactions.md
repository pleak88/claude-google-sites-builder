# Low-level editor interactions

All snippets assume the `rc()` real-click helper and the `paste()` helper from `references/setup-and-golden-rules.md` are defined in your `run-code` script. Everything here needs the `/edit` URL.

## Creating pages

The "New page" FAB (bottom-right) needs a **real mouse click** — `.click()` silently does nothing, and pressing Enter on it doesn't open the dialog either. Real click opens a "New page" dialog with a Name field + **Done**.

```js
async page => {
  const rc = async (loc) => { const b=await loc.boundingBox({timeout:6000}).catch(()=>null); if(!b) return false;
    await page.mouse.move(b.x+b.width/2,b.y+b.height/2); await page.waitForTimeout(180);
    await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); return true; };
  const NAMES = ['Rólunk','Kapcsolat','Adatvédelem','Sütik','Feltételek','Impresszum'];
  for (const name of NAMES) {
    let dlg = page.locator('[role="dialog"]').filter({ hasText: 'New page' }).first();
    if (!(await dlg.count())) { await rc(page.locator('[aria-label="New page"]').first()); await page.waitForTimeout(1800);
      dlg = page.locator('[role="dialog"]').filter({ hasText: 'New page' }).first(); }
    const inp = dlg.locator('input:visible, textarea:visible').first();
    await inp.click(); await inp.fill(name); await page.waitForTimeout(500);
    const done = dlg.locator('[role="button"], button').filter({ hasText: /^Done$/ }).first();
    if (await done.count()) await rc(done); else await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
  }
}
```

Verify the page list afterwards:
```js
await page.locator('input[aria-label="Page title"]').evaluateAll(els => els.map(e => e.value))
```

Navigate between pages in the editor via `goto` on `/d/<siteId>/p/<pageId>/edit` — more reliable than clicking nav.

## Inserting a text box (first block of an empty section)

Insert tab → **Text box** (menuitem). It creates an editable region `[aria-label="Text"][contenteditable="true"]`.

## Section count: duplicate to grow, delete to shrink

A new section can't be summoned by hovering a gap. Instead **duplicate an existing section** to add one, and **delete** to remove. Both buttons appear on the section's left toolbar on hover:

```js
const sections = () => page.locator('section');
// grow to N:
while ((await sections().count()) < N) {
  const first = sections().nth(0);
  await first.hover({ force: true }); await page.waitForTimeout(300);
  await first.locator('[aria-label="Duplicate section"]').click({ force: true });
  await page.waitForTimeout(1500);
}
// delete a specific section (e.g. by matching its text):
const idx = await page.evaluate(() => [...document.querySelectorAll('section')].findIndex(s=>/SOME TEXT/.test(s.innerText||'')));
const sec = page.locator('section').nth(idx);
await sec.hover({force:true}); await page.waitForTimeout(400);
await rc(sec.locator('[aria-label="Delete section"]'));
```

Section **reorder** (dragging a section by its left `⠿` grip) is **flaky** via automation — the drag often has no effect. Prefer to build sections in the right order from the start. If you must reorder, try after a fresh-session restart; if it still won't take, tell the user and offer the manual drag.

## Where a new block actually lands (measured, Play971 04.09.2026)

Sites' insert behaviour is not "after the focused section" for every block type. What actually happens:

- **A blank page has no content section at all** — `document.querySelectorAll('section')[0]` is the
  **page header**. Text pasted before a content section exists lands **inside the header**. The first
  `Insert → Text box` creates the first content section; each further one appends at the end.
  So: content sections start at DOM index **1**, and the **footer is the last `section`** (its
  `aria-label` contains "Section in footer").
- **`Insert → Images` lands after the section whose BOTTOM you clicked** — and only when that bottom edge
  is actually visible in the viewport. Scroll until `bottom` sits between ~200 and ~780 px, click ~25 px
  above it, then Insert. If the bottom is off-screen the image goes into its own section right under the
  header instead, and you have to delete it and retry.

```js
// прокрутить так, чтобы низ целевой секции был виден, затем кликнуть в него
await page.mouse.move(600, 500);
let box;
for (let i = 0; i < 30; i++) {
  box = await page.locator('section').nth(TARGET).boundingBox();
  const bottom = box.y + box.height;
  if (bottom > 200 && bottom < 780) break;
  await page.mouse.wheel(0, bottom > 780 ? 500 : -500);
  await page.waitForTimeout(450);
}
await rc(box.x + box.width / 2, box.y + box.height - 25);   // фокус на секции
// затем Insert → Images → Upload, и уже из shell: playwright-cli -s=gsites upload "<file>"
```

- **`Insert → Button`** behaves like Images: click the bottom of the target section first, and the button
  gets its own section directly after it.
- **A tile cannot be dragged into another section from Playwright** (the image element often has no
  bounding box at all). Don't burn time on it — place the block correctly on insert.

## Content images must be full-width

An uploaded image lands at its own size and often reads as a small thumbnail in the corner of the
section. Widen it to the full content column (drag the right-middle handle, or use the image tile's
`Full width` layout option) and verify on the **published** page:

```js
[...document.images].map(i => Math.round(i.getBoundingClientRect().width))   // ждём ~ширину колонки
```

A photo band across the column is the requirement; a thumbnail is a defect.

## Zero-size buttons in Sites dialogs

Several dialog buttons resolve to elements with a **0×0 bounding box**, so `rc()` silently does nothing
and the dialog just stays open (seen on `Insert` in "Insert button", `Publish` in "Review changes and
publish"). Always pick the candidate that has a real box:

```js
const good = await page.evaluate(() => {
  const d = [...document.querySelectorAll('[role=dialog]')].pop();
  return [...d.querySelectorAll('*')]
    .filter(e => (e.innerText || '').trim() === 'Insert')
    .map(e => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), w: r.width, h: r.height }; })
    .find(c => c.w > 10 && c.h > 10) || null;
});
```

## Menu items that ignore a real mouse click

Font menu items (and some other `[role=menuitem]` lists) do not react to `mouse.down/up` — even at the
right coordinates, even after `scrollIntoView`. A synthetic event chain on the menu item works:

```js
await page.evaluate(name => {
  const n = [...document.querySelectorAll('[role=menuitem]')].find(e => new RegExp('^' + name).test((e.innerText||'').trim()));
  const r = n.getBoundingClientRect();
  const o = { bubbles: true, cancelable: true, clientX: r.x + r.width/2, clientY: r.y + r.height/2, button: 0 };
  for (const t of ['pointerover','mouseover','pointerdown','mousedown','pointerup','mouseup','click'])
    n.dispatchEvent(new (t.startsWith('pointer') ? PointerEvent : MouseEvent)(t, o));
}, 'Lora');
```

Long menus also extend **below the viewport** (items at y≈900–1400 at a 1440×900 window), where real
clicks land nowhere. Either resize the window taller for that one step or use the synthetic chain.

## Custom colour: fill the Hex field, never type it

`keyboard.type('EFF6F2')` into `input[aria-label="Hex"]` produces a garbage colour (`#f1e1dd`) because the
field re-formats while typing. Use `fill()` with the `#`, then Tab, then **Save**:

```js
const hex = page.locator('input[aria-label="Hex"]').last();
await hex.fill(''); await hex.fill('#123328');
await page.keyboard.press('Tab');
await rc(saveBtn);            // без Save цвет не применяется
```

Verify by re-reading the row's `aria-label` — it reports the applied colour
(`"Background, selected color #123328, close to dark..."`).

## Replacing an image that is already there

`Image → Upload` on a header (or tile) that already has an image often does **not** open the native file
chooser the second time — `playwright-cli upload` then fails with "can only be used when there is related
modal state present". Consequence: **prepare the final file (including its darkening) before the first
upload**; a later swap is a manual gesture for the user.

## playwright-cli sessions are tied to the working directory

The session lives in `.playwright-cli` of the **current** directory. Do not `cd` between calls — the next
command reports "Browser 'gsites' is not open". Pass absolute paths to `--filename` and stay put.

## Section styles (Style 1/2/3)

Hover the section, real-click `[aria-label="Section colors"]` to open the popup, then click the matching `Style N` row. The rows render as `li` with text like `A\nStyle 1`.

```js
const wanted = 'Style ' + n;            // 1, 2 or 3
await sec.hover({ force: true }); await page.waitForTimeout(400);
await sec.locator('[aria-label="Section colors"]').click({ force: true });
await page.waitForTimeout(1100);
const li = page.locator('li').filter({ hasText: new RegExp('^A\\s*' + wanted + '$') }).first();
if (await li.count()) { await li.click({ force: true }); } else { await page.keyboard.press('Escape'); }
```

The popup only pops **on a real click of the palette icon**, and it appears near the icon (which is at the far left of the section, roughly `x≈16–52`). If a `li` filter misses, open the popup and dump `li` geometry to click by coordinates.

## Images — placement depends on the build mode

- **Unique / from-scratch build:** image placement is the user's call — **ask first**, don't guess. Ask (1) *which sections get content images* (a photo inside the section, via Insert → **Images**), and (2) *which sections get an image background* (whole-section photo/pattern, below) vs a plain colour Style. Add images only to the sections they name; if they gave/asked for none, add none. Generated imagery → use the project's image-generation skill, then place per their answers.
- **Close-copy / replica mode:** **don't ask — mirror the source.** Put a content image where the original section has one and an image background where the original has one, using the source's own assets (or a close regenerated match). See `references/copy-mode.md`.

## Content image inside a section (Insert → Images)

Focus the target section, Insert tab → **Images** → Upload / By URL / Drive, then position via the layout blocks (image+caption, two-column, etc.). Keep this for the sections the user named for content images.

## Section background image (full-bleed image or pattern)

Section colors popup → hover the **Image** row (`▸` submenu) → **Upload** → the OS file chooser opens → feed the file with the CLI `upload` command (the `filechooser` event is unreliable):

```bash
# 1) run-code: open palette, hover "Image" row, click "Upload" (real click) — opens native chooser
# 2) then, from the shell:
playwright-cli -s=gsites upload "C:/path/to/pattern.png"
```

In the run-code step, find the "Image" row's center, `mouse.move` to it (submenu appears after ~1.5s), then find the "Upload" text node and real-click it:

```js
// after opening the Section colors popup:
const rows = await page.evaluate(()=>{const o=[];document.querySelectorAll('li').forEach(e=>{const t=(e.innerText||'').trim();const r=e.getBoundingClientRect();if(r.width>0&&/^(Style|Image)/.test(t))o.push({t:t.slice(0,10),x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});});return o;});
// hover the "Image" row → submenu "Upload"/"Select":
await page.mouse.move(imageRow.x, imageRow.y); await page.waitForTimeout(1600);
const up = await page.evaluate(()=>{const el=[...document.querySelectorAll('*')].find(e=>(e.innerText||'').trim()==='Upload'&&e.children.length===0&&e.getBoundingClientRect().width>0);const r=el.getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};});
await page.mouse.move(up.x,up.y); await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up();
```

Once an image is uploaded, it appears under **Select** for reuse on other sections without re-uploading.

### A section background image overrides the theme's text colours (live only)

Measured on a real build: with a **section background image**, Sites renders every heading and
paragraph in that section as near-white (`#f9f9f9`) on the **published** page, ignoring the theme's
"Titles and headings" colour — even though the editor still shows the themed (e.g. accent) colour.

So you cannot have both "patterned background" and "accent-coloured headings" on the same section.
Decide up front:
- pattern/photo background → headings will be white (this is what reference sites usually look like);
- accent-coloured headings → use a flat Style background (theme colour), no image.

**Manual recolouring does NOT survive publishing.** Selecting a heading and applying a text colour
(toolbar → Text color) *does* work in the editor — the inline `color:#xxxxxx` lands on the heading's
inner `<span>` — but on the **published** page Sites strips it and renders white again. Verified on
~50 headings across 8 pages: editor showed lime, live showed `rgb(249,249,249)` with no inline style.
So per-heading recolouring is a dead end on image-background sections; don't spend time on it.

If the user approved a prototype with accent headings, tell them **before** putting a background
image on every section: it is either the pattern (white headings) or the accent headings (flat Style
background, no image) — Sites does not allow both.

### Don't use a background image to fake a flat full-bleed colour

Sites darkens every section background image for text contrast, and the transform is not reversible: a solid `#0004FF` PNG renders as `#171863`. Measured mapping is `out = in × 0.298 + 23` per channel, so pure saturated colours are unreachable (even `#0000FF` lands at `#171763`).

For an exact full-bleed brand colour, build a **custom theme** instead and put the hex on **Style 2 / Style 3** (theme Style backgrounds are flat, with no overlay), then assign that Style to the section. In the theme's Colors panel: pick the Style tab → **Background** swatch → **+** under CUSTOM → type the hex into `input[aria-label="Hex"]` → **Tab** → click **Save** (without Save the swatch silently keeps the old colour). Verify by sampling the swatch pixel in a screenshot rather than trusting the click.

Note the theme-creation wizard only reliably accepts **Color 1**; Color 2/3 typing tends to race ahead to the fonts step — set those afterwards from the Colors panel.

Section background images are **full-bleed** (span the whole viewport width) — this is how you get a pattern/photo behind text or behind a transparent embed (see `references/embed.md`). "Select" the same image on each dark section to make the texture continuous down the page.

## Header background image: go through the THEME, not the header toolbar

The header's own hover toolbar (`Image` → `Upload`) refuses to open the file chooser once the header
already carries the theme's default banner — `playwright-cli upload` then fails with "can only be used
when there is related modal state present". The working route (measured 04.09.2026, PlayUZU ES):

**Themes tab → theme card `⋮` → Edit → `Images` → `Header` (the add-image icon on the right) → `Upload`**,
then feed the file from the shell:

```bash
playwright-cli -s=gsites upload "C:/path/cover-dark.jpg"
```

Verify: the header section's inner div background becomes `url("data:image/jpeg;base64,...` instead of
`url("https://ssl.gstatic.com/atari/image...`. The same panel holds `Logo` and `Favicon`.

## The theme wizard's font list only responds to the KEYBOARD

Real mouse clicks on the font `[role=menuitem]` rows select the wrong item (the list scrolls under the
cursor), and the synthetic pointer/mouse event chain does nothing at all. What works: open the row
(`Titles and headings` / `Body text`), then press `ArrowDown` repeatedly, reading the focused item after
each press, and `Enter` on the match:

```js
const focusedText = () => page.evaluate(() => {
  const a = document.activeElement;
  const ad = a && a.getAttribute('aria-activedescendant');
  if (ad) { const el = document.getElementById(ad); if (el) return (el.innerText||'').trim().split('
')[0]; }
  return a ? (a.innerText || a.getAttribute('aria-label') || '').trim().split('
')[0] : '';
});
for (let i = 0; i < 40; i++) {
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(120);
  if ((await focusedText()) === 'Spectral') { await page.keyboard.press('Enter'); break; }
}
```

## Where the embed / image / button actually lands

`Insert` appends **after the focused content section**. Clicking inside the **page header does not focus
anything**, so the block lands at the very end of the page. To get the modal embed directly under the
header (a short manual drag for the user), focus the **first content section** (scroll its bottom into
200–760 px, real-click ~30 px above it) and insert from there.

## Resizing a tile: select first, then grab the handle

The `ew-resize` / `ns-resize` handles only exist while the tile is selected. Sequence: real-click the
tile centre → re-measure → move to `(x + w, y + h/2)` → confirm `getComputedStyle(el).cursor === 'ew-resize'`
→ `mouse.down`, step in 30 px increments, `mouse.up`. A content image stretches to exactly the content
column at `x + 944` (1440 viewport). An embed snaps to the grid: asking for 760 lands on **782** — that
is the grid, not a bug, so don't keep nudging.

## Inner pages: the shared footer is the LAST section

Once a page's header is deleted, its content sections start at DOM index **0** and the site-wide footer
is the last `section`. A builder that targets `n - 1` will happily overwrite the footer on every page —
target `n - 2` instead (or the first section, when there is only one).

## The "Add Footer" pill can sit below the viewport

It renders at the very bottom of the canvas (y ≈ 1016 at a 900-tall window), where clicks land nowhere.
Resize the window taller (`playwright-cli -s=gsites resize 1440 1200`) before clicking it. After a
successful click the pill disappears and the section count grows by one — the footer's `aria-label` is
NOT reliably "footer", so verify by the count / the pill being gone.

## Page slugs: the published root URL is the safe target

Renaming the home page (Properties → Name) also changes its slug — "Inicio" gives `/inicio`, and the
`Custom path` field in that dialog is unreliable from automation. Accented names keep their accents in
the slug (`Términos` → `/términos`, i.e. `/t%C3%A9rminos`). Since the home page is always served at the
**published root** (`https://sites.google.com/view/<address>`), point the modal CTA at the root and you
never depend on a slug.

## Layout block "image left / text right" (Insert → Content blocks)

The native way to get a photo beside its text — no embed, no manual drag. The Insert panel's
**Content blocks** group holds six presets; the one that gives *image left, title+body right* is
**`Add layout: Image and caption`** (the others are multi-cell grids):

```
Add layout: Image and caption                  ← 1 cell: image left, title + text right  ✔
Add layout: Two column image and captions
Add layout: Three images
Add layout: Three column image and captions
Add layout: Two column image and side captions
Add layout: Four column image and captions
```

Mechanics (measured 08.09.2026):

1. Scroll the canvas to the bottom, then real-click `[aria-label="Add layout: Image and caption"]`.
   It appends **its own section** with an image placeholder on the left (`[aria-label="Insert content"]`
   inside a `Content placeholder`, ~379×213) and **two `[aria-label="Text"]` tiles** on the right
   (title ~540×91, body ~540×52).
2. Image: real-click `Insert content` inside the **last** section → real-click the visible `Upload`
   text node → the native chooser opens (every other tool call then fails with "does not handle the
   modal state") → feed it from the shell with `playwright-cli -s=gs upload "<file>"`.
3. Text: the tiles are **not** `contenteditable` until clicked, so `[aria-label="Text"][contenteditable="true"]`
   finds nothing — select `[aria-label="Text"]` inside the section instead.
4. **Each tile resolves to two nested matches** (outer + inner, same y). Deduplicate by y-band
   (`Math.abs(y - seen) < 40`) or you fill the same tile twice and the second fill's `Ctrl+A`+`Delete`
   wipes the first.
5. **Fill top-down and re-measure between fills.** Filling the title grows it and pushes the body tile
   down, so coordinates captured before the first fill point at the wrong tile afterwards — the body
   text lands in the title and the paragraphs are lost. Measure → fill title → measure again → fill body.
6. The section then takes a Style like any other (`Section colors` → `Style N`).

### Variants (choose per site, see SKILL.md hard requirement 7a)

| pattern | how |
|---|---|
| photo left / text right | `Add layout: Image and caption` as above — proven (08.09.2026) |
| photo above / text below | Insert → **Images** (lands as its own section; widen right-middle handle to `x+944`, then bottom handle to the frame's aspect) → Insert → **Text box** right after it |
| photo right / text left | **impossible natively** (08.09.2026): dragging the image tile does move it into the right column, but it drops between title and body; text tiles ignore drag; Undo does not revert the drop. Repair = delete the section and re-insert the layout (focus the bottom of the previous section first — the new layout then lands right after it, see `_relay` recipe in the orchestrator) |
| alternate | cycle the three down the page; record the sequence in `plan.json` |

Pick with `random.Random(site_address).choice(['left','top','alternate'])` so the choice is reproducible per site.

The image keeps the placeholder's aspect (≈16:9), so a 3:2 source is cropped top and bottom — centre
the subject when generating it. This is the acceptable exception to the "no band crop" rule, because
here the photo is a half-width column, not a full-bleed band.

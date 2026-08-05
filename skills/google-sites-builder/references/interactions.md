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

### Don't use a background image to fake a flat full-bleed colour

Sites darkens every section background image for text contrast, and the transform is not reversible: a solid `#0004FF` PNG renders as `#171863`. Measured mapping is `out = in × 0.298 + 23` per channel, so pure saturated colours are unreachable (even `#0000FF` lands at `#171763`).

For an exact full-bleed brand colour, build a **custom theme** instead and put the hex on **Style 2 / Style 3** (theme Style backgrounds are flat, with no overlay), then assign that Style to the section. In the theme's Colors panel: pick the Style tab → **Background** swatch → **+** under CUSTOM → type the hex into `input[aria-label="Hex"]` → **Tab** → click **Save** (without Save the swatch silently keeps the old colour). Verify by sampling the swatch pixel in a screenshot rather than trusting the click.

Note the theme-creation wizard only reliably accepts **Color 1**; Color 2/3 typing tends to race ahead to the fonts step — set those afterwards from the Colors panel.

Section background images are **full-bleed** (span the whole viewport width) — this is how you get a pattern/photo behind text or behind a transparent embed (see `references/embed.md`). "Select" the same image on each dark section to make the texture continuous down the page.

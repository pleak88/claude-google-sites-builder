# Filling pages with content

Assumes `rc()` and `paste()` helpers are defined (see setup reference), and you're on the `/edit` URL.

## Text blocks: plain-paste + keyboard styles

Pasting HTML into a Sites text box drags in `color:#000` and Arial that fight the theme. Instead, click into the section's text tile, clear it, then for each block paste plain text and apply a block style with a shortcut:

| Style | Shortcut |
|---|---|
| Title (h1) | `Control+Alt+1` |
| Heading (h2) | `Control+Alt+2` |
| Subheading (h3) | `Control+Alt+3` |
| Normal text | `Control+Alt+0` |
| Center align | `Control+Shift+E` |

The style is **block-level** — the caret just needs to be inside the paragraph; you don't need to select the text.

```js
const STYLE = { h1:'Control+Alt+1', h2:'Control+Alt+2', h3:'Control+Alt+3', p:'Control+Alt+0' };
const tile = sec.locator('[aria-label="Text"]').first();
await tile.click(); await page.waitForTimeout(700);
const box = page.locator('[aria-label="Text"][contenteditable="true"]').first();
await page.keyboard.press('Control+A'); await page.keyboard.press('Delete'); await page.waitForTimeout(400);
for (let j=0; j<blocks.length; j++) {
  const [tag, text] = blocks[j];
  await paste(text);
  await page.keyboard.press(STYLE[tag] || STYLE.p);
  await page.waitForTimeout(180);
  if (j < blocks.length - 1) { await page.keyboard.press('End'); await page.keyboard.press('Enter'); await page.waitForTimeout(180); }
}
// optional: center a whole section's text
// await page.keyboard.press('Control+A'); await page.keyboard.press('Control+Shift+E');
```

Note: `document.execCommand('insertText', …)` does **not** stick in Sites — always go through the clipboard (`paste()`).

## Recommended pattern: content as JSON + a builder script

Hand-clicking every block is slow and error-prone. Instead:

1. Author each page's content as JSON: a list of sections, each with a `style` (1/2/3) and a list of `[tag, text]` blocks (`h1/h2/h3/p`), plus optional `["link", label, pageName]`.
2. Generate one `run-code` builder script per page from a template that: navigates to the page (via the canvas nav link or `goto`), grows/shrinks sections to match, then fills each section's blocks and sets its style.
3. Run the builder per page.

This makes the whole site reproducible and lets you regenerate after content edits. Keep the JSON and generator in your scratchpad. The builder's core loop is the text-styles loop above plus the section-style setter from `references/interactions.md`.

Navigation inside the builder: the canvas nav links are real `<a>` you can click by exact text —
`page.locator('a').filter({ hasText: new RegExp('^'+PAGE+'$') }).first().click({force:true})` — or just `goto` the page's `/edit` URL.

## Internal links (page-to-page)

Links are the fiddliest text operation. Rules that actually work:

- Use the **Insert link** button in the text toolbar (`[aria-label="Insert link"]`), **not** `Ctrl+K` (unreliable here).
- In the link dialog, **type the page name into `input[aria-label="Link"]`** to filter the site's page list — otherwise the list is truncated and you can only reach the first few pages.
- Click the exact `[role="option"]` matching the page name, then click **Apply** (without Apply the link isn't committed).
- **You cannot link to the page you're currently on** — Sites omits it from the list. Add that one link from a different page.
- After Apply the caret is lost — refocus the text tile before the next link.

```js
// caret at end of the line that should become a link; then:
await rc(page.locator('[aria-label="Insert link"]').first());
await page.waitForTimeout(1700);
const lf = page.locator('input[aria-label="Link"]').first();
await lf.click(); await page.keyboard.type(pageName.slice(0,6), { delay: 70 }); await page.waitForTimeout(1600);
const opt = page.locator('[role="option"]').filter({ hasText: new RegExp('^'+pageName.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&')+'$') }).first();
if (await opt.count()) { await rc(opt); await page.waitForTimeout(900);
  const apply = page.locator('[role="button"],button').filter({ hasText: /^Apply$/ }).first();
  if (await apply.count()) await rc(apply); await page.waitForTimeout(1600); }
```

Verify links by counting anchors in the tile: `tile.evaluate(el => [...el.querySelectorAll('[role=link],a')].map(a=>a.innerText.trim()))`.

## Footer (site-wide)

Scroll to the very bottom; hover the area below the last section to reveal **Add Footer**, and real-click it (it's a pill button, coordinate-click if the locator misses). The footer is **shared across all pages**, so build it once. Fill it like any text tile: a copyright/disclaimer line plus links to every policy page (same Insert-link flow). Remember you can't link the footer to the current page from that page — add the last link from another page.

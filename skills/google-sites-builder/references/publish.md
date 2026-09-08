# Publishing and verifying

Work on the `/edit` URL.

## First publish

Click **Publish** (top-right, real click) → a "Publish to the web" dialog opens with a **Web address** field.

Address rules (these bite):
- Only **lowercase letters, digits and dashes**. **No dots** (`tippmixpro.hu-info` is rejected; `tippmixpro-hu-info` is fine).
- Must be **globally unique** across Google Sites — a good name is often already taken. Try a few until the dialog stops showing "That is a great address, but it's already taken."

```js
const dlg = page.locator('[role=dialog]').filter({ hasText: 'Publish to the web' }).first();
const inp = dlg.locator('input:visible').first();
for (const cand of ['name-a','name-b','name-c']) {
  await inp.click(); await page.keyboard.press('Control+A'); await page.keyboard.press('Delete');
  await page.keyboard.type(cand, { delay: 40 }); await page.waitForTimeout(3000);
  const t = await dlg.innerText();
  if (!/already taken|Use only lowercase/.test(t)) break;   // this one is free
}
// then click the dialog's Publish (real click, the LAST "Publish" inside the dialog)
```

The live URL is then `https://sites.google.com/view/<address>/home`.

## Re-publishing (after edits)

Subsequent publishes show a **"Review changes and publish"** dialog instead of the address form — just real-click its **Publish** button. Find the Publish button *inside the dialog* (there are two "Publish" texts on screen; use the one within `[role=dialog]`).

### The re-publish dialog's Publish button is in its top-right corner

On "Review changes and publish" the dialog is full-screen (Draft vs Currently published preview),
and its **Publish** button sits at the **top right** (~`1384,32` at a 1440x900 viewport). A locator
scoped to `[role=dialog]` finds two "Publish" texts and the second one has a **null bounding box**,
so `rc(btns.nth(n-1))` silently does nothing and the dialog stays open — the publish never happens
(easy to miss: the editor looks normal afterwards). Click the top-right corner by coordinates, then
assert `document.querySelectorAll('[role=dialog]').length === 0`.


## Read the real page slugs BEFORE hard-coding any URL

Sites derives a page slug from its title and **drops `&` and other punctuation**: "Terms & Conditions"
becomes `/terms-conditions`, not `/terms-and-conditions`. Anything that hard-codes a URL (the modal's
`Continue` href, cross-page links, verification scripts) must use the real slugs, taken from the live
nav after the first publish:

```js
[...new Set([...document.querySelectorAll('a')].map(a => a.getAttribute('href') || '')
  .filter(h => /\/view\/<address>\//.test(h)))]
```

## Verify with one script, not by eyeballing

Run a single pass over every page and assert the numbers — this is what catches a wrong slug (404), a
missing footer, or a page that never got its text:

```js
for (const slug of slugs) {
  const r = await page.goto(base + '/' + slug); await page.waitForTimeout(3200);
  const d = await page.evaluate(() => ({
    h1: (document.querySelector('h1') || {}).innerText || null,
    chars: document.body.innerText.length,
    imgs: document.images.length,
    imgWidths: [...document.images].map(i => Math.round(i.getBoundingClientRect().width)),
    embeds: document.querySelectorAll('iframe').length,
    footerLinks: [...new Set([...document.querySelectorAll('a')].map(a => a.getAttribute('href') || '')
      .filter(h => /\/view\//.test(h)))].length,
    hscroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }));
  out.push({ slug, status: r.status(), ...d });
}
```

Assert: every page 200, expected `h1`, footer links on all pages, `embeds === 1` only on the page with
the modal, content images at full column width, and `hscroll === false` at both 1440 and 390.

## Verify

- Load the live URL in a fresh tab and screenshot desktop (1440×900).
- Check each page returns 200 and has its expected `<h1>`:
  ```js
  // navigate to each /view/<address>/<slug> and read h1 + char count
  ```
- Check the footer links resolve to `/view/<address>/<slug>`.
- Screenshot mobile at **390px** and confirm no horizontal scroll and the burger menu appears.

Remember: verify on the **live** URL, but make all edits on the **/edit** URL. Don't confuse the two (that mistake silently eats hours).

## Cleanup

After the Playwright work, per the playwright-cli skill: `playwright-cli -s=gsites close`, remove `.playwright-cli/` and any `_*.png` / `_*.js` temp files you created. Keep the session open only if the user is likely to ask for immediate follow-up edits.

## Slugs with diacritics / non-Latin titles

Sites derives slugs from page titles verbatim, so Greek or accented titles give `/αρχική`, `/υπεύθυνο-παιχνίδι`
(URL-encoded). `verify.tpl.js` therefore collects the real slugs from the live nav + footer first and ignores
the plan keys; point the modal CTA at the published **root** (`/view/<address>`), never at `/home`.

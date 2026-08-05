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

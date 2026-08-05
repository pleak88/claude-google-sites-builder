# Setup, session and golden rules

## 1. Launch Playwright against the saved profile

There is a dedicated, already-logged-in Chrome profile (in this environment: `C:\Users\pleak\.gsites-profile`). Open a persistent `playwright-cli` session against it:

```bash
playwright-cli -s=gsites open "https://sites.google.com/" --browser=chrome --profile="C:\Users\pleak\.gsites-profile"
```

Use a stable session name (`-s=gsites`) so you can reconnect. Set a desktop viewport for editing:

```bash
playwright-cli -s=gsites resize 1440 900
```

## 2. Verify the login — do NOT re-login every time

The session is normally **already logged in**. Just confirm it, and only fall back to manual login if the check fails. Never re-run the login flow "to be safe" — it wastes time and can trigger Google's bot checks.

```bash
playwright-cli -s=gsites --raw eval "document.body.innerText.slice(0,400)"
```

If you see the Sites dashboard ("Blank site", "Recent sites", site names) → **logged in, proceed.** You can also confirm the account:

```bash
playwright-cli -s=gsites --raw eval "(document.querySelector('[aria-label*=\"Google Account\"]')||{}).getAttribute?.('aria-label') || 'unknown'"
```

If instead you land on `accounts.google.com/signin` → the session expired. Only then do the one-time manual login below.

### One-time manual login (fallback only)

Google blocks automated password entry, so a human must log in once into the profile folder. Do NOT do this if already logged in.

1. Make sure Playwright isn't holding the profile: `playwright-cli -s=gsites close`, and close any Chrome using that `--user-data-dir`.
2. Launch a normal Chrome on the profile for the user to log into by hand:
   ```powershell
   Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList '--user-data-dir=C:\Users\pleak\.gsites-profile','--no-first-run','https://accounts.google.com/'
   ```
3. Ask the user to log in and then **fully close** that Chrome window (the session is saved to disk).
4. Re-open the Playwright session (step 1 above) and re-verify.

**Never** type the Google password via Playwright (`fill`/`type` on the password field) — Google detects it and rejects with a "couldn't sign you in" page. **Never** copy Chrome `User Data` / profile directories to bypass login — that action is blocked as credential theft, and it's not needed.

## 3. Golden rules (repeat of SKILL.md, with the code)

### Editor vs live

Only the `/edit` URL is editable. Before editing, assert it:

```bash
playwright-cli -s=gsites --raw eval "location.href.includes('/edit') ? 'EDITOR' : 'LIVE'"
```

The editor URL looks like `https://sites.google.com/d/<siteId>/p/<pageId>/edit`. You can get page IDs from the published site's nav links (each nav `<a href>` is `/d/<siteId>/p/<pageId>/...`) — handy for jumping straight to a page's editor with `goto`.

### The `rc()` real-click helper

Most controls ignore `.click()`. Put this at the top of every `run-code` script and use it for FABs, dialog buttons, menu items and handles:

```js
const rc = async (loc) => {
  const b = await loc.boundingBox({ timeout: 6000 }).catch(() => null);
  if (!b) return false;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.waitForTimeout(180);
  await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up();
  return true;
};
```

When you only have coordinates (e.g. a handle you found by cursor probing), do the raw `move/down/up` inline.

### Plain-text clipboard paste

Grant clipboard once per script, then paste text without HTML styling:

```js
await page.context().grantPermissions(['clipboard-read','clipboard-write'], { origin: 'https://sites.google.com' });
const paste = async (text) => {
  await page.evaluate(t => navigator.clipboard.writeText(t), text);
  await page.waitForTimeout(120);
  await page.keyboard.press('Control+Shift+V');   // paste-without-formatting
  await page.waitForTimeout(260);
};
```

For big HTML (embed code) you can base64 it to avoid quoting issues:
```js
await page.evaluate(b64 => {
  const html = new TextDecoder().decode(Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
  return navigator.clipboard.writeText(html);
}, B64);
```
(`TextDecoder` runs in the page via `page.evaluate`, not in the Node context.)

### The stuck-editor restart

Symptom: an embed's `ns-resize`/`ew-resize` handle shows the right cursor, but dragging it changes nothing; or a section drag has no effect; or a dialog button "clicks" but nothing happens — repeatedly, across fresh reloads. This is a **stuck editor state** after many operations, not a coordinate bug.

Fix: fully restart the browser process, then reopen the editor.

```bash
playwright-cli -s=gsites close
playwright-cli -s=gsites open "https://sites.google.com/d/<siteId>/p/<pageId>/edit" --browser=chrome --profile="C:\Users\pleak\.gsites-profile"
```

After a fresh restart, resize/drag operations that were dead suddenly work. This is the single most important recovery trick in this skill.

## 4. Capturing a reference site (for reference-based / copy builds)

Open the reference `sites.google.com/view/...` (read-only is fine) and record what you need to reproduce:

- **Section order + headings**: scroll and screenshot, or dump text.
- **Footer**: content + which pages it links to.
- **Any embed** (popup, full-screen block): measure iframe size — this tells you the target height for a full-screen section.

```bash
# list section heights and embed iframe sizes
playwright-cli -s=gsites --raw run-code "async page => {
  const secs=[...document.querySelectorAll('section')].slice(0,6).map((s,i)=>({i,h:Math.round(s.getBoundingClientRect().height)}));
  const ifr=[...document.querySelectorAll('iframe')].map(f=>({t:f.title,w:Math.round(f.getBoundingClientRect().width),h:Math.round(f.getBoundingClientRect().height)}));
  return JSON.stringify({secs, ifr});
}"
```

Note: a "full-screen" reference section is just a **tall embed** (e.g. iframe ~1100px). That's the mechanism to replicate — see `references/embed.md`.

## 5. Sampling brand colours from a logo (optional themed builds)

Brand sites are often geo-blocked from this environment. Grab the dominant colours from the favicon/logo instead of guessing:

```bash
# via Google's favicon service, then PIL
curl -sL "https://www.google.com/s2/favicons?domain=<brand-domain>&sz=256" -o logo.png
python -c "
from PIL import Image; from collections import Counter
im=Image.open('logo.png').convert('RGBA'); c=Counter()
for px in im.getdata():
    if px[3]>200: c['#%02x%02x%02x'%px[:3]]+=1
print(c.most_common(8))
"
```

Take the near-black as the background, the brightest saturated colour as the accent. Feed these into the theme (`references/theme.md`).

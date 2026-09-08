# HTML embeds: popups, full-screen sections, centering

**Optional, and by default only for the popup.** Add an embed only for the full-screen popup (18+ age-gate / CTA card) — that one interactive full-viewport element native blocks can't produce. Everything else (hero, cards, grids, backgrounds, images) must be native blocks; don't default to an embed for them. **Exception:** if the user explicitly asks for some other thing to be done via embed / custom HTML, do it — an explicit request overrides the default. This is the trickiest part of the editor — read it fully before starting.

Assumes `rc()` and the base64-clipboard helper from the setup reference. Work on the `/edit` URL.

## What an embed is here

Google Sites "Embed code" wraps your HTML in a sandboxed iframe (`gstatic.com/atari/embeds/...`). You paste HTML, Sites renders it in a fixed-pixel tile you resize by dragging. A "full-screen" section on any Sites site is simply a **tall embed** (iframe ≈ viewport height). There is no true responsive `100vh` — the tile is fixed px and scales by aspect ratio on mobile.

## Inserting an embed

Focus the section you want it after (click into a text tile), then Insert → **Embed** → **Embed code** tab → paste → **Next** → **Insert**. Scope every button lookup to the dialog, or your locator will hit the right-panel "Insert" tab instead and silently fail:

```js
const dlg = page.locator('[role="dialog"]').filter({ hasText: 'Embed from the web' }).first();
const codeTab = dlg.locator('[role="tab"]').filter({ hasText: /Embed code/i }).first();
if (await codeTab.count()) { await rc(codeTab); await page.waitForTimeout(1000); }
const ta = dlg.locator('textarea').first();
await ta.click();
await page.evaluate(b64 => { const html=new TextDecoder().decode(Uint8Array.from(atob(b64),c=>c.charCodeAt(0))); return navigator.clipboard.writeText(html); }, B64);
await page.keyboard.press('Control+V'); await page.waitForTimeout(1500);
const next = dlg.locator('button,[role=button]').filter({ hasText: /^Next$/ }).first();
if (await next.count()) { await rc(next); await page.waitForTimeout(3500); }
const dlg2 = page.locator('[role="dialog"]').last();
const ins = dlg2.locator('button,[role=button]').filter({ hasText: /^Insert$/ }).first();
if (await ins.count()) await rc(ins);
```

The embed lands as a **new section**. Where exactly depends on focus: with a section focused by a click
in its **bottom** area it lands right after that section; with nothing focused (or the caret inside a
text tile in edit mode) it can land directly under the header instead — see
`references/interactions.md` → "Where a new block actually lands".

## Editing an existing embed's code

Select the embed (center-click its iframe area — handles appear), click **Edit** (`[aria-label="Edit"]`), switch to the **Embed code** tab, replace the textarea, Next → Insert/Save. Selecting via a section-top click fails when the embed is the first section (the sticky header covers `sectionTop+60`) — center-click the iframe instead.

## Resizing — and the fresh-session prerequisite

**Before any resize/reorder, if handles feel dead, restart the browser** (see setup reference). Resize handles that show `ns-resize` but don't move the tile are the #1 symptom of the stuck editor; a fresh `close`+`open` fixes it. This is not optional — trying variations of the drag without restarting wastes enormous time.

To resize after a fresh restart:

```js
// select: center-click the embed iframe → blue handles appear
let f = await page.evaluate(()=>{const el=[...document.querySelectorAll('iframe')].find(x=>(x.src||'').includes('atari')||x.title==='Custom embed'); const r=el.getBoundingClientRect(); return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)};});
await page.mouse.click(f.x+f.w/2, f.y+40); await page.waitForTimeout(1000);
// drag the bottom-middle handle (at f.x+f.w/2, f.y+f.h)
await page.mouse.move(f.x+f.w/2, f.y+f.h); await page.waitForTimeout(300);
await page.mouse.down(); await page.waitForTimeout(250);
for (const dy of [40,90,140,180]) { await page.mouse.move(f.x+f.w/2, f.y+f.h+dy, {steps:5}); await page.waitForTimeout(200); }
await page.mouse.up();
```

The `ns-resize` cursor at `(f.x+f.w/2, f.y+f.h)` confirms you're on the handle. Width via the right-middle handle at `(f.x+f.w, f.y+f.h/2)` — but you usually don't need to widen; use a section background for full-width (below).

## Making a section full-screen (growing beyond the viewport)

A single drag can only extend the handle to the bottom of the visible viewport, so the max height in one go is roughly `viewportHeight − embedTop`. To go taller (e.g. ~1000px), **iterate**: scroll so the bottom handle sits mid-viewport, grab it, drag to the viewport bottom, repeat.

```js
for (let it=0; it<4; it++) {
  let f = await page.evaluate(()=>{const el=[...document.querySelectorAll('iframe')].find(x=>(x.src||'').includes('atari')||x.title==='Custom embed'); const r=el.getBoundingClientRect(); return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)};});
  if (f.h >= TARGET) break;
  await page.mouse.move(700,300); await page.mouse.wheel(0, (f.y+f.h) - 350); await page.waitForTimeout(700); // bottom handle → ~y350
  f = await page.evaluate(/* re-read box */);
  await page.mouse.move(f.x+f.w/2, Math.max(80, f.y+f.h-120)); await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); await page.waitForTimeout(700); // select
  await page.mouse.move(f.x+f.w/2, f.y+f.h); await page.waitForTimeout(300); await page.mouse.down(); await page.waitForTimeout(300);
  await page.mouse.move(f.x+f.w/2, 855, {steps:8}); await page.waitForTimeout(400); // drag to viewport bottom
  await page.mouse.up(); await page.waitForTimeout(1000);
}
```

### Height vs. on-screen centering

A block **taller than the screen** pushes its centered card below the visible centre. So don't overshoot: aim the embed height at roughly **one viewport height** (~720–850px on a laptop) so the card sits at screen-centre. If you overshoot (e.g. 1200px), shrink back down (drag the bottom handle up, scrolling so it's in view). The reference "full-screen" look = block ≈ one screen, card centred.

### The first screen: a Cover page header, not a tall section (preferred)

**This is the approved shape for a full-screen age-gate/CTA — use it unless the user wants something else.**
A first screen that fills the viewport, has a **scroll-down arrow** and a background that **parallaxes**
(moves at half the scroll speed) is NOT a section with a background image — sections render
`background-attachment: scroll`, no arrow, no parallax. It is the **Page header set to type `Cover`**,
with the modal embed sitting *inside* that header. Verified against a production build
(`sites.google.com/view/xcasino-hu-portal/kezdolap`, mirrored from `betsson-com-information`).

What Cover gives you for free: height = viewport minus nav bar, a native `[aria-label="Scroll down"]`
chevron at the bottom, and the parallax (scroll 300px → the `.IFuOkc` background layer moves 150px).

Build order:
1. Hover the strip just under the site nav → **Add header** → on the header toolbar **Header type → Cover**.
2. **Image → Upload** the full-screen photo (1920×1080; darken it so white text stays readable).
3. Clear the header title text (click it, `Ctrl+A`, `Delete`) — the modal should be the only thing that reads.
4. Put the modal **Embed** inside the header, then size it with the normal handles (e.g. 944×620 in the editor).

⚠️ **Two of these steps cannot be automated** — verified across five approaches (real mouse click,
`locator.click`, `dblclick`, focus + Enter/Space, synthetic `MouseEvent` dispatch):
- the **Add header** button never fires;
- **Insert → Embed with the header selected drops the block at the END of the page**, not into the header.

Hand those two gestures to the user (~20 s): `playwright-cli -s=gsites close` → launch a normal Chrome
on the same profile (`Start-Process chrome.exe -ArgumentList '--user-data-dir=<profile>','<edit URL>'`)
→ ask them to (a) click **Add header** and (b) drag the modal block by its ⠿ handle up into the header
→ they close Chrome → reopen the Playwright session and carry on. Everything else (Header type, Image
upload, clearing the title, resizing and replacing the embed's code) is fully scriptable.

Two useful differences once the embed lives in the header:
- replacing its HTML **keeps the block's size** (in an ordinary section a code swap resets it);
- the section height is owned by Cover, so the empty-lines spacer below becomes unnecessary.

⚠️ Keep the Playwright viewport at **1440×900 for every editor action**. Leaving it at a phone size
(e.g. after previewing the modal at 390px) silently breaks resizing and leaves the Embed dialog stuck
with its Next/Save buttons off-screen.

### Legacy: the empty-lines spacer (only when there is no Cover header)

If the modal must live in a normal section (no header on the page), the embed tile is a fixed pixel
height and leaves dead space under it on tall monitors. Fill the same section with a native **Text box**
at Normal text holding **24 blank lines** (≈1348px, section ≈1452px), so the age-gate reads as
full-screen while `min-height:100%` keeps the card centred:

```js
// caret in the empty text tile of the modal section:
for (let i=0;i<24;i++){ await page.keyboard.press('Enter'); await page.waitForTimeout(60); }
```

Prefer the Cover header above; reach for this only as the fallback.


### Fixed modal geometry for this series

Client-set, do not re-invent per site: the embed tile is **760×968** in the editor at a 1440 viewport
(≈760×863 on the published page) and the card inside is **400×343** (ratio ≈1.17). Size the card with
`max-width:400px` plus `clamp(min, Xvh, max)` for every inner value, and check it in an iframe at both
the desktop tile and the phone tile (352×448) before handing it over. The background photo under it is
HD and darkened with black at 0.8 — baked into the uploaded file, not an overlay inside the embed
(the embed is transparent, so the header photo shows through as-is).

## Centering the card: `min-height:100%`, NOT `position:fixed`

This is the key content-side rule. Sites **scales/transforms** embeds across breakpoints; `position:fixed` inside the iframe anchors to a transformed ancestor and the card drifts off-centre when you change the height. Use normal-flow flex centering that fills the iframe:

```html
<style>
  html,body{margin:0;padding:0;height:100%;}
  #wrap{min-height:100%;width:100%;box-sizing:border-box;display:flex;align-items:center;justify-content:center;
        padding:clamp(8px,2.5vh,22px) clamp(8px,3vw,24px);background:transparent;font-family:Arial,Helvetica,sans-serif;}
  #card{width:100%;max-width:520px; /* card styles */ }
  /* size inner text with vh so it scales with the tall iframe: */
  #h{font-size:clamp(15px,4.2vh,26px);}
</style>
<div id="wrap"><div id="card"> … </div></div>
```

`html,body{height:100%}` → body = iframe height; `#wrap{min-height:100%}` = iframe height; flex centres the card at **any** height, and survives Sites' scaling. Only the button/CTA should be an `<a>` if the user wants "only the button clickable"; keep the rest non-link.

## Reference age-gate modal — the approved shape (start from this for every new site)

The current approved card (production: `sites.google.com/view/xcasino-hu-portal/kezdolap`). It replaced
an earlier white centred card — a client rejected that one as "too similar to the previous site", so treat
the *structure* below as the baseline and always re-skin the colours per brand.

**Hard rule — `target="_top"` is forbidden, everywhere.** No link inside any embed on a Google Site
may carry `target="_top"` (and by default no `target` at all — not `_blank`, not `_parent`). Write plain
`<a href="…">`. `_top` blows the sandboxed iframe out into the whole browser tab, which is exactly the
behaviour the client rejected; leaving `target` off keeps navigation in the normal, expected context.
This applies to the age-gate button and to every other link you ever put in an embed.

Shape: a **dark horizontal panel** over the header photo — logo + `18+` on the left, a thin vertical
accent rule, the age question on the right, and the CTA **below both columns, full panel width**.
Two L-shaped accent corners (`::before` / `::after`) sit on opposite corners; radius stays small (4px).

Content rules that came from the client and stay:
- the card holds **only** logo, `18+`, the question and the button — no explanatory paragraph, no helpline line;
- the button carries **no `target` attribute at all** — see the hard rule below;
- its `href` is **always the full absolute URL of this same site** — `https://sites.google.com/view/<address>/<home-slug>` —
  never `#`, never a relative path, never another domain. Sites drops a bare `#`, and a relative path resolves
  against the embed's sandbox origin (`*.googleusercontent.com`), not the site. Note the home slug follows the
  page's custom path (e.g. `/kezdolap`), so set the custom paths **before** writing the modal HTML;
- the CTA spans the full width under both columns, not tucked beside the heading.

Sizing rules that keep it alive on phones:
- **never stack the card into a column on narrow screens.** The embed keeps its aspect ratio, so on a
  phone the iframe becomes short (1154×760 → 352×231); a vertical stack does not fit that height and
  gets clipped. Keep the row horizontal and let the `clamp()` minimums shrink it.
- every size is `clamp(small-min, Xvh|vw, max)` — the `vh` middle term ties the card to the iframe height.

```html
<style>
*{box-sizing:border-box}
html,body{margin:0;padding:0;height:100%;background:transparent;overflow:hidden}
#wrap{min-height:100%;width:100%;display:flex;align-items:center;justify-content:center;
  padding:clamp(8px,2.5vh,24px) clamp(10px,3vw,28px);
  font-family:Lato,"Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased}
#panel{position:relative;width:100%;max-width:680px;display:flex;flex-direction:column;gap:clamp(9px,2.2vh,20px);
  padding:clamp(10px,5vh,52px) clamp(12px,3.6vw,48px);
  background:linear-gradient(135deg,rgba(48,20,44,.94),rgba(20,9,18,.96));
  border:1px solid rgba(236,0,140,.55);border-radius:4px;
  box-shadow:0 0 0 1px rgba(231,230,20,.14) inset, 0 26px 70px rgba(0,0,0,.55)}
#panel::before,#panel::after{content:"";position:absolute;width:clamp(12px,3.4vh,34px);height:clamp(12px,3.4vh,34px);
  border:2px solid #e7e614}
#panel::before{top:-1px;left:-1px;border-right:0;border-bottom:0}
#panel::after{bottom:-1px;right:-1px;border-left:0;border-top:0}
#row{display:flex;align-items:center;gap:clamp(10px,2.6vw,34px);width:100%}
#left{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:clamp(4px,1vh,10px)}
#logo{width:clamp(30px,12vh,104px);height:clamp(30px,12vh,104px);display:block}
#age{font-size:clamp(11px,3.4vh,30px);font-weight:900;letter-spacing:.06em;color:#e7e614;line-height:1}
#rule{flex:0 0 1px;align-self:stretch;background:linear-gradient(180deg,transparent,rgba(236,0,140,.75),transparent);
  min-height:clamp(34px,14vh,150px)}
#right{flex:1 1 auto;min-width:0;text-align:left}
#h{margin:0;font-size:clamp(13px,4vh,34px);font-weight:900;color:#fff;line-height:1.18;
  letter-spacing:-.2px}
#btn{display:block;text-align:center;color:#fff;text-decoration:none;font-weight:900;letter-spacing:.08em;
  font-size:clamp(9.5px,1.8vh,15px);padding:clamp(7px,2.1vh,17px) clamp(12px,3.4vw,38px);
  border:2px solid #ec008c;background:transparent;transition:background .18s ease,color .18s ease}
#btn:hover,#btn:focus{background:#ec008c;color:#fff}
</style>
<div id="wrap">
  <div id="panel">
    <div id="row">
      <div id="left">
        <img id="logo" src="LOGO_DATA_URI" alt="<brand>">
        <span id="age">18+</span>
      </div>
      <div id="rule"></div>
      <div id="right">
        <h2 id="h"><AGE QUESTION IN SITE LANGUAGE></h2>
      </div>
    </div>
    <a id="btn" href="https://sites.google.com/view/<this-site>/<home-slug>"><YES, I AM 18+ IN SITE LANGUAGE></a>
  </div>
</div>
```

Swap per site: the two brand colours (`#ec008c` accent / `#e7e614` secondary here), the panel gradient,
the copy, the logo data-URI, and the `#btn` href — always the full `https://sites.google.com/view/<address>/<home-slug>`
of the site being built. If the published address ends up different from the planned one (a good name is often
taken), **re-edit the embed HTML with the real address** and re-check the button. Keep the structure, the clamp
minimums and the no-stacking rule as they are.

## Full-bleed pattern/background behind the card

To get a texture/pattern spanning the **full viewport width** behind a centered card:

1. Make the embed background **transparent** (`#wrap{background:transparent}`) — the iframe renders transparent, so whatever is behind shows through.
2. Set the **section background** to the pattern image (`references/interactions.md` → section background image). Section backgrounds are full-bleed, so the pattern spans edge-to-edge while the card floats on top.

This decouples "full-width texture" (section bg) from "centered card" (transparent embed), and avoids a narrow embed leaving dark gutters.

## Editor width ≠ live width (this changes every height you set)

Measured on a standard theme at a 1440 viewport:

- **Editor**: the content grid is **944px** wide (section spans x=60..1124, 60px padding each side). Dragging the right-middle handle past x≈1064 clamps the embed to exactly 944.
- **Live**: Sites renders the same embed at **1154px** and scales the box by `1154/944 ≈ 1.2225` — the iframe's `innerWidth` really is 1154 (no CSS transform), so the content **re-lays out** at 1154 while the **box height is multiplied by 1.2225**.

Consequence: if you size the embed to its natural height at 944, the live page gets ~22% of dead space under every band. Size it the other way round:

1. Preview the HTML locally at **width 1154** and measure the natural content height.
2. Set the editor height to `naturalHeight1154 × 944/1154` (`× 0.8181`).

The embed then looks clipped in the editor and pixel-correct live. Verify on the live URL by reading the iframe heights:
```bash
playwright-cli -s=gsites --raw run-code "async page => page.evaluate(()=>[...document.querySelectorAll('iframe')].map(f=>Math.round(f.getBoundingClientRect().height)))"
```

`file://` is blocked in playwright-cli, so serve the local preview over HTTP (`python -m http.server <port>`) to measure it.

## Mobile: proportional scaling beats a broken reflow

Below 1154 the iframe keeps its aspect ratio, so a stacked/reflowed mobile layout is always taller than its box and gets clipped — grids overlap and text collides. Ship a tiny script in each embed that scales the 1154 design down to the actual iframe width instead; the box shrinks by exactly the same factor, so it fits perfectly at every breakpoint (small text, but the layout stays intact):

```html
<script>(function(){var W=1154;function f(){var s=innerWidth/W,b=document.body,h=document.documentElement;
if(s<0.995){h.style.overflow='hidden';b.style.width=W+'px';b.style.transformOrigin='0 0';b.style.transform='scale('+s+')';}
else{h.style.overflow='';b.style.width='';b.style.transform='';}}f();addEventListener('resize',f);})();</script>
```

## Mobile reality

The embed keeps its **aspect ratio** across breakpoints, so a desktop full-screen block becomes a proportional banner on mobile (not full-height) — this is exactly how reference sites behave too. Verify at 390px, but don't expect a fixed-px embed to be full-height on phones. The `vh`-based inner sizing and `min-height:100%` centering keep the card readable and centred at any size.

## Getting the embed INTO the Cover header — what does NOT work (measured 08.09.2026, don't re-test)

Three automated routes were tried on a fresh blank site; all leave the embed in a new section **under**
the header (`section[0]` iframes = 0, `section[1]` iframes = 1):

1. Header selected → Insert → Embed (known since 08.2026).
2. **Caret placed inside the header's own title text box** (click the `[aria-label="Text"]` tile in
   `section[0]`) → Insert → Embed → Embed code → Next → Insert. Same result: new section below.
   (Manually this looks like it works because the user then drags; via CDP input it does not.)
3. **Slow stepped drag** of the freshly inserted embed tile into the header — both from the tile's top
   edge and from the left half of the selected tile's toolbar (`[aria-label="Tile"]`, next to `Remove`),
   with 500 ms hold, 2 warm-up moves, 30–40 steps, 700 ms pause before `mouse.up`. The cursor over the
   toolbar reads `pointer`, never a grab cursor; the tile stays where it was.

So the **manual drag stays the one hand-off gesture** of a build: insert the embed right under the header
(focus the first content section's bottom, then Insert → Embed), resize it, then close Playwright, open a
normal Chrome on the same profile and ask the user to drag the block by its `⠿` grip into the header
(~20 s). Everything after that (resize inside the header, HTML replacement, publish) is automated again.

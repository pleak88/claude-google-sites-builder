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

The embed lands as a **new section** after the focused one.

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

### Making the modal fill the whole screen on large monitors — the empty-lines spacer

The embed tile is a **fixed pixel height** (~720–890px). On a large/tall monitor the section is only that tall, so the age-gate sits in a short band with white/blue space below it instead of covering the screen. To make the modal section reach roughly a full large-screen viewport, **add a native Text box in the same section as the modal embed and fill it with empty line breaks** (blank lines, nothing else). That empty text block is ~1350px tall, which grows the section to ≈ one big-screen viewport height, so the age-gate covers the whole screen on large displays while the embed's `min-height:100%` centering keeps the card in the middle.

**Always do this whenever you build an age-gate / 18+ / CTA modal** — it's part of the modal recipe, not optional.

**Verified recipe** (measured on a production build, `sites.google.com/view/veikkaus-info`): a plain **Text box** left at **Normal text (16px, line-height normal)** — NOT a heading, don't restyle it — with **24 blank line breaks (25 lines total)**. That yields a text block ≈ **1348px** tall, section ≈ **1452px**, with the modal embed (~888px) layered in the same section; its card centres over the tall area and the age-gate fills a large monitor. Match this: ~24 empty lines at default 16px.

How to build it:
1. Insert the modal **Embed** into a section (its own, ideally the first section), size/center as above.
2. Into the **same section**, add a **Text box** (Insert → Text box), click in, leave it at Normal text, and add **24 blank lines** — press `Enter` 24 times (or plain-paste a string of 24 newlines). Leave every line empty:
   ```js
   // caret in the empty text tile of the modal section:
   for (let i=0;i<24;i++){ await page.keyboard.press('Enter'); await page.waitForTimeout(60); }
   ```
   Keep the block empty (no visible text) so it reads as pure vertical spacer behind/around the transparent embed.
3. Verify on the live/preview page at a tall viewport (e.g. 1440×1000): the modal section should fill the screen with the card centred. Tune by adding/removing blank lines (each ≈ 54px at Normal text) toward a section height ≈ one viewport.

Don't rely on this to be pixel-exact across every monitor — 24 lines targets "≈ one large viewport", which is what makes the age-gate read as full-screen. On phones the section still scales down proportionally (fine — the card stays centred and readable).

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

## Reference age-gate modal — the approved recipe (use this exact shape for every new site)

This is the finalized, user-approved age-gate from production (`sites.google.com/view/veikkaus-info`). New sites should get **this same modal** — same structure, same responsive approach — only swapping copy, colours and the button URL. Paste it as the modal Embed, drop it into its own first section, and add the 24-blank-line spacer (above) so the section fills a large screen.

Two things that make it the "good" version:
- **No bottom help-text line.** An earlier version had a `#note` "gambling can be addictive… helpline" line under the button; it was **removed** — the card is just badge → heading → subtext → button. Keep it that lean. (Any legal/18+ helpline line lives in the site's own bottom bar, not inside the modal card.)
- **Tight lower clamp bounds for adaptation.** Every size is `clamp(min, Xvh|vw, max)` and the **`min` is deliberately small** so that when Sites scales the iframe down on short/phone viewports the card compacts instead of overflowing: badge `clamp(26px,8vh,68px)`, card padding starting at `10px`, subtext `clamp(12px,1.9vh,15.5px)`. The `vh` middle term ties every element to the (tall) iframe height so it scales together. No `<script>` scaler is used or needed — the clamps do the adaptation.

```html
<style>
*{box-sizing:border-box}
html,body{margin:0;padding:0;height:100%;background:transparent;overflow:hidden}
#wrap{min-height:100%;width:100%;display:flex;align-items:center;justify-content:center;
  padding:clamp(8px,2.5vh,22px) clamp(8px,3vw,24px);
  font-family:"Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased}
#card{width:100%;max-width:620px;background:#fff;border-radius:8px;
  box-shadow:0 18px 48px rgba(0,0,0,.22);
  padding:clamp(10px,4.4vh,40px) clamp(10px,4vw,44px) clamp(10px,3.6vh,34px);text-align:center}
#badge{width:clamp(26px,8vh,68px);height:clamp(26px,8vh,68px);margin:0 auto clamp(14px,2.6vh,22px);border-radius:50%;
  background:#0004FF;color:#fff;font-size:clamp(11px,2.6vh,22px);font-weight:700;display:flex;align-items:center;justify-content:center}
#h{margin:0 0 clamp(10px,1.8vh,16px);font-size:clamp(19px,3.6vh,29px);font-weight:700;color:#202227;line-height:1.2;letter-spacing:-.4px}
#sub{margin:0 0 clamp(18px,3vh,28px);font-size:clamp(12px,1.9vh,15.5px);line-height:1.5;color:#707782}
#btn{display:block;background:#0004FF;color:#fff;text-decoration:none;border-radius:28px;
  padding:clamp(12px,1.9vh,17px) clamp(18px,3vw,28px);font-size:clamp(13.5px,1.9vh,16px);font-weight:600}
</style>
<div id="wrap">
  <div id="card">
    <div id="badge">18+</div>
    <h2 id="h">Oletko täyttänyt 18 vuotta?</h2>
    <p id="sub">Vahvista ikäsi jatkaaksesi. Sivusto on ainoastaan tiedottava esittely, eikä se järjestä rahapelejä.</p>
    <a id="btn" href="https://sites.google.com/view/&lt;this-site&gt;/home" aria-label="…">Kyllä, olen täyttänyt 18 vuotta</a>
  </div>
</div>
```

Swap per site: `#badge`/`#btn` background to the brand colour, the heading/subtext/button copy to the site's language, and the `#btn` href to that site's own `/home` URL (a bare `#` is dropped by Sites — see internal-links note). Keep the clamp values and the no-`#note` structure as-is.

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

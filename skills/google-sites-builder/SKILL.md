---
name: google-sites-builder
description: Build, edit and publish a site on Google Sites (sites.google.com) by driving the visual editor with Playwright (playwright-cli). Use this WHENEVER the user wants a site made on Google Sites specifically — phrases like "гугл сайт", "гугл сайты", "сделай на Google Sites", "sites.google.com", "инфо-сайт на Google Sites", "по референсу на гугл-сайте", "примерная копия гугл-сайта", or when they point at a sites.google.com/view/... URL and want something like it. Covers the whole flow: logging in via a saved Chrome profile, optional custom brand theme, creating pages, filling native text/section blocks, internal links, footer, an optional full-screen 18+/CTA popup as an HTML embed, and publishing. NOT for ordinary static HTML/CSS sites hosted on a normal web host — that is a different workflow; this is only for the Google Sites platform, whose closed visual editor needs these specific automation tricks.
---

# Google Sites builder

Google Sites is a **closed visual editor** — you cannot upload HTML files or use an API. Everything is built by clicking around `sites.google.com` in a logged-in browser. This skill drives that editor with `playwright-cli`, and captures the hard-won tricks that make it actually work (the editor is full of controls that ignore synthetic clicks, silently stop responding, and behave differently on the live site vs the editor).

Read this whole file first, then open the reference file for whatever step you're on. The references contain the exact, tested Playwright snippets — don't re-derive them.

## When this applies (and when it doesn't)

Use this **only** when the target platform is Google Sites. If the user wants a normal static site (own domain, HTML/CSS/JS files, a real host), that is a completely different job — use the normal site-building skills, not this one. Signals for THIS skill: a `sites.google.com` URL, "Google Sites", "гугл-сайт", or an existing Google Sites reference to copy.

The site can be any of:
- **Fully unique** — you invent structure, content and look.
- **Reference-based** — mirror the *structure/section order* of an existing Google Sites (e.g. `sites.google.com/view/<something>/home`) but with new content.
- **Approximate copy** — closely reproduce a reference's layout and feel.

A **custom brand-coloured theme is optional** — only build one if the user asks for brand colours or a specific look. A **popup (18+/age-gate/CTA) is optional** — only add it if the user asks. Don't force either.

**Never use `target="_top"` in an embed's links** — nor any other `target` (`_blank`, `_parent`) unless the user explicitly asks. Plain `<a href="full absolute URL">` only. This is a hard rule from the client, not a preference.

**HTML embeds are reserved for the popup by default.** The default use of an "Embed code" block is the optional full-screen popup/age-gate/CTA card, because native blocks can't produce that one interactive full-viewport element. **Build everything else with native Google Sites blocks** — text boxes, headings, images, buttons, dividers, image carousels, section background colours/images, the footer. Do not *silently* reach for an embed to make a hero, a feature grid, cards, columns, or a background; those are all native, so use the native equivalent.

The one exception: **if the user explicitly asks for a specific thing to be done via embed** (e.g. "add this widget as an embed", "do the pricing table as custom HTML"), then honour that — embeds are fine wherever the user asks for them. The rule is only "don't default to embeds on your own"; an explicit user request always overrides it.

## The golden rules (internalize these — they cost the most time when ignored)

1. **Edit on the `/edit` URL, never the published `/view/` URL.** The editor lives at
   `https://sites.google.com/d/<siteId>/p/<pageId>/edit`. The published site is `https://sites.google.com/view/<address>/...` and is **read-only** — clicking/dragging there does nothing but looks like the editor. Before any edit action, confirm:
   `playwright-cli --raw eval "location.href.includes('/edit') ? 'EDITOR' : 'LIVE'"`.
   If you ever see an "Edit this page" pencil FAB while trying to edit, you're on the live site — go back to `/edit`.

2. **Use real mouse clicks, not `.click()`.** Most Sites controls — the "New page" FAB, dialog buttons, resize handles, section toolbar icons — ignore Playwright's `.click()`. Drive them with `mouse.move → mouse.down → (pause ~120ms) → mouse.up`. Keep this `rc()` helper handy (see `references/interactions.md`).

3. **When resize/reorder/handles/popups stop responding, close and reopen the browser.** After many operations the editor gets into a state where drag-resizing an embed or dragging a section produces the correct `ns-resize` cursor but has **no effect** — and the same staleness kills the **Section colors** popup (the palette icon clicks but no `Style N` rows appear). This is not a coordinate problem — it's a stuck editor. `playwright-cli close`, reopen the `/edit` URL fresh, and it works again. This single trick unblocked the full-screen embed after ~40 failed attempts.

4. **Reuse the already-logged-in profile — verify, don't re-login.** The user normally already has a logged-in Google session in the saved Chrome profile. Your job is just to **confirm** the session is live (open `sites.google.com` and check the account/dashboard loaded), and only fall back to the one-time manual login if it isn't. Never re-run the login flow "just in case", never type the Google password via Playwright (Google rejects automated logins), and never copy Chrome profile folders (blocked as credential theft). See `references/setup-and-golden-rules.md`.

5. **Paste content as plain text and style with keyboard shortcuts.** Pasting HTML into a text box drags in black text and Arial that clash with the theme. Instead paste plain text (`Ctrl+Shift+V`) and apply block styles with `Ctrl+Alt+1/2/3` (Title/Heading/Subheading), `Ctrl+Alt+0` (Normal). See `references/content.md`.

6. **Page structure comes from the reference or from the brief — never from a previous build.** With a reference URL, mirror its structure; without one, design the page list and section order from this brand's brief. Another site of the series is not a template for structure, section order, page names or texts — only the fixed client requirements below carry over.
6a. **A given reference outranks everything — including sites built before.** When the user provides a reference URL, that reference IS the spec: its structure, background treatment (e.g. one seamless tone-on-tone pattern vs per-section colours), footer shape and overall feel. Never substitute "how the previous site in this account did it" for what the reference shows — that mistake forced a triple rebuild once. **Copying an existing site is FORBIDDEN by default** — always start from a blank site. The single exception: the user explicitly designates an existing site as an example built from the same reference (wording like «вот пример такого сайта»); only then Make-a-copy it, and still treat every inherited text as placeholder.

7. **Only ONE build may drive a Chrome profile dir at a time.** The Chrome profile (`.gsites-profile`) and the playwright daemon are shared across sessions: a second concurrent build hijacks navigation and closes the browser mid-write (this destroyed hours once). One profile dir = one Chrome instance — two sessions on it **cannot** run in parallel; sequential use is fine. **Parallel builds on the same Google account ARE possible:** a Google account and a Chrome profile dir are different things — create a second user-data-dir (e.g. `.gsites-profile-2`), log the SAME Google account into it once manually (~2 min), and two builds can run side by side on one Sites account. Hence the mandatory pre-flight question below.

## Hard requirements for every build (non-negotiable, client-set)

These come from the client and hold on every Google Sites build unless they say otherwise:

1. **Only the modal is an embed.** The 21+/18+ modal in the Cover header is the single `Embed code` block
   on the whole site. Hero, cards, grids, photos, dividers, footer — native blocks. Keep it simple; never
   offer "I'll do this section as custom HTML".
2. **Pack 3–4 blocks into one section**, don't spend a section per block. Separate blocks inside a section
   with a thin divider or spacing, and alternate section backgrounds between groups.
3. **The modal is a fixed template across the whole series — structure, sizes and the tile are NOT per-site.**
   **Reference = `templates/popup-reference.html`** (client-approved 30.09.2026 on sisal-it--home: «взять за эталон эту
   модалку и делать всегда с такими параметрами, чтобы всё влезало и не было мелким»). Copy that file, change ONLY the
   texts, the colours and the `href`. Do not re-derive sizes, do not go back to the older `em`-ladder card.

   ```
   ┌──────────────────────────────────────────────┐
   │   18+   │   <Headline, serif>                │   ← one row, thin vertical rule between
   │  ═══════════════════════════════════════════  │   ← 2px accent line, full card width
   │              <Age question, serif>            │
   │      <ONE sentence on responsible play>       │   ← a single <p>, not two paragraphs
   │  ┌─────────────────────────────────────────┐  │
   │  │             <CTA label>                 │  │   ← full card width
   │  └─────────────────────────────────────────┘  │
   └──────────────────────────────────────────────┘
   ```

   What the reference fixes (all inline styles, the whole card is one clickable `<a>`):
   - `<a>` = `position:fixed; inset:0; display:flex; justify-content:center; padding:clamp(12px,3vw,20px)`;
     `align-items:center` on frames wider than 420px (desktop: card centred), `flex-start` at ≤420px (phone: card at the top).
   - card `width:100%; max-width:520px; padding:clamp(18px,4vw,26px) clamp(16px,4vw,28px); border-radius:26px; border:1px`;
     sizes: `18+` clamp(22px,5vw,28px), headline clamp(10px,3.2vw,17px) serif, question clamp(20px,5vw,28px) serif,
     sentence clamp(14px,3.4vw,16px) line-height 1.4, CTA clamp(14px,3.4vw,16px) padding clamp(12px,3vw,15px).
   - phone overrides (`@media (max-width:420px)` with `!important`): card padding 14px / radius 18px, 18+ 20px,
     headline 11px, question 19px, sentence 13px/1.35, CTA 13px — compact but never miniature.
   - fonts as in the reference (Figtree / Fraunces declared, system fallbacks render if not linked).
   - **Smooth appearance is required from 01.10.2026** (client): fade-in + slight rise on the card, disabled under
     `prefers-reduced-motion`. Existing sites stay as they are unless the client asks.
   - Animated header on request ("анимированный"): see memory `feedback-gsites-animated-header` — Veo loop → animated WebP
     (verify Sites keeps the animation on a scratch site first) or GIF ≤ ~9 MB as the Cover background; tile 782×~620.
   - **embed tile in the editor: 782 wide, ~940 tall** (`_resize_h.js H=940`; the Cover header centres the tile vertically,
     so growing the bottom handle moves the top up as well). A shorter tile (438–615) clips the card on phones because the
     iframe keeps its aspect ratio — that is exactly what the client rejected. Check the phone frames with a local preview
     at 352×405 and 288×331 (card `scrollHeight` ≤ frame height) before pushing the code into the embed.

   Per-site: the headline, the question, the one sentence, the CTA label, the palette (every hex from the brief), the
   `href` (full absolute URL of THIS site's home), the background under the card. Nothing else.

   **When the brief asks for a popup with a button and no scrolling («попап с кнопкой без возможности скрола») —
   mandatory additions** (client, 05.10.2026, done by hand on latloto-lv--info; copy exactly, the media queries are
   fixed — never other breakpoints or values):
   - the card's parent — the full-screen `<a>` — gets an id or a class (e.g. `id="qeqe"`; the rules below use
     that id/class as the selector — `#qeqe` is only the example) and
     `align-items: flex-start` (card pinned to the top on EVERY width): delete the template's
     `@media (min-width:421px){ a{align-items:center!important} }` rule;
   - the same parent gets `overflow-y: auto !important; overscroll-behavior: contain;` (inline `overflow:hidden` /
     `overscroll-behavior:none` of the template are overridden by these);
   - in the `<style>` block, for that parent:
     ```css
     #qeqe {
     padding-top: 250px !important;
     }

     @media (max-width: 1440px) {
     #qeqe {
     padding-top: 200px !important;
     }
     }

     @media (max-width: 600px) {
     #qeqe {
     padding-top: 150px !important;
     }
     }
     ```
   Details and the full snippet: `references/embed.md` → "Popup with a button, no scroll".

4. **The modal CTA always points at the site itself.** The `Continuar` / `Continue` button's `href` is
   **the full absolute URL of this very Google Site's home page** (`https://sites.google.com/view/<address>/home`) —
   never a placeholder left in the published page, never an invented external URL, never a relative path,
   never any `target`. This is the client's standing rule for the whole series: build it that way from the
   first publish, and if a real destination URL is supplied later, swap it in by editing that one embed.
5. **Background under the modal:** a genuinely high-quality (HD, sharp, 1920×1080) photo **on the site's own subject matter**
   (for a gaming/casino info site: the subject itself — a casino table with roulette, chips in the brand colours,
   cards, no people; client 01.10.2026 rejected «person with a phone in an evening interior» as off-theme, and
   generic scenery such as a city skyline or a landscape is rejected too), darkened with **black at 0.8 opacity**. Bake the darkening into the uploaded file
   (`out = in × 0.2`, PIL `point()`), because Sites' own readability scrim is far too weak, and a pale or
   hazy source turns to mush under any overlay. Prepare the darkened file **before the first upload** —
   a replacement does work via `hdrimg.js` (header Image → Upload; verified 01.10.2026), but costs a reload check.
   **Animated header background:** Veo video → `scripts/mkgif.py` (defaults: 12 fps, 1024×576, 7 s loop, 48 colours,
   no dithering, ≈8.3 MB; `GK`/`GV` bake darkening + vignette — Sites has no overlay layer) → `hdrimg.js` upload →
   reload → `js/gifchk.js`. Keep the GIF ≤ ~9 MB (15 MB is silently dropped); 6 fps was rejected as jerky.
6. **Brand logo:** when the site is built for a brand, use the **original logo** (find the real raster
   file online, PNG with transparency) and place it **in the site's own visual style** — never a
   home-made SVG stand-in. The logo lives in the site header; there is **no logo inside the modal**.
7a. **Image blocks are laid out individually per site — never the same pattern twice in a row.**
   At prototype time pick the photo+text pattern for THIS site and write it into the plan
   (`random.Random(address).choice(['left','top','alternate'])`, so a rebuild reproduces it):
   - `left`  — photo left, heading + text right (native `Add layout: Image and caption`);
   - `right` — photo right, text left: **not achievable** (tested 08.09.2026: the image tile can be
     dragged into the right column, but it lands *between* the title and the body there, and text tiles
     do not drag at all — the left column ends up empty). Do not offer it; pick `left` / `top` / `alternate`;
   - `top`   — photo above, text below (Insert → Images as its own section + Text box after it,
     photo widened to the column);
   - `alternate` — cycle left / right / top down the page.
   State the chosen pattern in the prototype hand-off so the user approves it with the layout.
   Recipes: `references/interactions.md` → "Layout block".
7. **Content images run the full content width AND stay tall.** A photo band across the column, not a
   thumbnail tucked in a corner: after inserting an image, widen it to the full column (`x + 944` at a
   1440 viewport) and check the rendered width on the live page. **Do not band-crop the source** — a
   letterbox crop (e.g. 1200×620) cuts heads, hands and objects out of the frame and the client rejects
   it. Generate and upload the full-height frame (4:3 / 3:2, e.g. 1200×800) and let the column decide
   the height; taller is the safe direction.

7b′. **Footer mechanics:** the footer tile becomes `contenteditable` only after a real click on it (`js/footer_fill.tpl.js`
   handles that for the one-tile footer). A multi-column layout **cannot be inserted into the footer by script** — the
   layout lands in the content (the insert goes to the focused content section). The approved footer shape is part of the
   prototype. Order of attempts: (1) focus the footer tile with a real click on the tile (then `insertByLabel`), (2) if the
   layout still lands in the content, delete that stray section and ask the user for the one manual gesture (cursor into the
   footer tile), then run the phase scripts; (3) only if both failed, build the one-tile footer (`js/footer_fill.tpl.js`) and
   **say so in the hand-off** — a simplified footer is acceptable, a silent one is not (client, 13.10.2026). Learning the
   layout-in-footer insert properly is an open task for the next build.
7b. **The footer is unique on every site (client, 01.10.2026: «всегда как-то уникалить футер»).** Change its *shape*,
   not just its colours: 1/2/3 columns, motto above or below, links as a row or a column, help lines, separators.
   Never repeat the previous site's footer shape. Columns are native: `Add layout: Two/Three column image and captions`
   inside the footer, then delete the image placeholders. Show the footer in the prototype for sign-off.

7c. **The published site is ALWAYS public (client, 02.10.2026: «сайт всегда должен быть публичный»).**
   After every publish: `Share with others` → General access → **Published site = Public** ("Anyone on the
   internet can find and open"); Draft stays Restricted. A *Make a copy* inherits **Restricted** from the source —
   outsiders then get a Google sign-in page instead of the site. Verify with a cookie-less session:
   `playwright-cli -s=anon open https://sites.google.com/view/<address>/home` → title must be the page, not
   `accounts.google.com`. Script: the share dialog is the `drivesharing/driveshare` frame — click the second
   `Restricted` (Published site) → option `Public` → `Done` (`scripts/js/share_open.js` → `share_public.js` → `share_done.js`, editor URL open).

8. **Favicon is mandatory.** Every build ships a custom favicon (32×32 PNG built from the brand mark),
   uploaded via `Themes → ⋮ → Edit → Images → Favicon` — the theme wizard's own "Add a logo" buttons do
   nothing. Prepare the file with the other images, upload it before the single publish, and confirm on the
   live URL that `link[rel*=icon]` is not the default Sites glyph. See `references/theme.md` → Favicon.
9. **One source of truth for texts:** the approved HTML prototype. If a Markdown copy exists for the
   editor, generate it from the prototype with a script instead of maintaining two files that drift.
10. **No page header on the inner pages.** The Cover header (photo + modal) belongs to the HOME page
   only. Every other page — policies, terms, responsible gaming, about — opens with **no banner at all**:
   delete its page header, then start the content with the page title (`Ctrl+Alt+1`) followed straight by
   the body text. No hero photo, no coloured title band above the text.

11. **Word-count targets from the brief are numbers, not vibes** — measure the finished page
   (`re.sub('<[^>]+>',' ', main).split()`) and trim to the range before building.

12. **Section mode is decided up front and applies to ALL pages alike (client, 13.10.2026).** Read it off the reference first:
   **if the reference page is ONE section (all content on one background), build ONE section — mandatory.** Otherwise the
   default is separate sections (Style 1 / Style 2 / image bands alternating as the reference does). The user's explicit
   wording («все секции одной», «контент в одной секции с фоном») overrides either way. Put the choice into `site.json` → `"sections": "separate" | "one"` and build
   straight in that mode (`buildpage.sh` joins tiles into the first section automatically in mode `one`) — never build
   separately and merge afterwards (that cost 20 min on betfans). Mode `one` details for the home page:
   **Home page body = ONE visual band from the modal down to the 18+ plaque, plus the disclaimer on the same background.**
   Client rule (comeon-pl-pl, 15.09.2026, confirmed on veikkaus-tietoa before it): everything that follows the Cover header
   (H1 + byline, every H2 section, every photo block) reads as a *single* section with one shared background image; then
   the 18+ plaque (Style 3) breaks it; then the disclaimer («Zastrzeżenie / Disclaimer») sits on the **same background image
   again**; then the footer. No Style 1/Style 2 alternation on the home page.
   **Literally one section** (client, 12.10.2026 — «все секции одной» means ONE section): insert each tile normally (it lands as
   its own section) and drag it into the first content section with `drag_tile.tpl.js DST=<idx>` (`buildpage.sh … JOIN=<idx>` in
   star-casino-cz-information-gsites), images then `imgfix.tpl.js`. The older fallback — N consecutive sections that all
   carry the **same** background file — `("sec","img")` in `content.py` for every home block above the plaque and for the
   disclaimer, `plan.py` keeps `"style":"img"` (base Style 1), and after the texts run `scripts/bgpage.sh home 1`
   (`PLAN=… BG=… SESSION=…`; offset 1 = the Cover header; inner pages: `bgpage.sh <page> 0` for their disclaimer).
   **The background image must be on-brand and on-theme**, not generic: brand colours as the base gradient, the brand's
   own motif as faint geometry (ComeOn: rounded tiles + green glows; Veikkaus: V-triangles + mint/blue glows), fine texture,
   1920×2800 so one file covers the whole band, **evenly distributed — no large bright blobs**, or the seams between the N
   sections become visible. Generate it with PIL (`scripts/bg_tall_example.py`) or Gemini; show it in the prototype as one
   tall `<section class="s-img">` (`proto.py` must not split consecutive sections of the same style). The section image
   turns all text white on the live page — plan heading colours accordingly.

13. **The 18+ plaque's accent line («18+ · Play responsibly · …») is RED, like the reference** (client, 12.10.2026, star-casino-cz-information).
   The toolbar text colour cannot be automated, so: the line is pasted as Subheading (`accent` block → `Ctrl+Alt+3`) and the
   theme sets **Colors → Style N → More options → Subheading = red** (brand red or the reference's) while the theme is built —
   same step as Style 1/2/3. Use Subheading for nothing else. Before publishing, read `getComputedStyle` of that line on the
   live home page: it must be red; a white line = the theme step was skipped.

14. **Contact form = mirror the reference, scripted in one pass (client, 13.10.2026).** If the reference's contact page has a
   form (or the user asks), build a Google Form in the same account with the ready scripts — `forms/u/0/create` →
   `js/form_create.tpl.js` (TITLE, DESC, FIRST_Q, QUESTIONS) → `js/form_publish.js` (new Forms accept no answers until
   Publish) → `js/form_link.js` (viewform URL) → on the Contact page `js/button_insert.tpl.js` (LABEL, FORM_URL) → the
   button lands as a new top section → `js/drag_src.tpl.js SRC=0 DST=1 POS="beforeLast"`. Budget: ≤10 min, no probing.
   No form in the reference and no request → text-only Contact page.

15. **Texts in `content.py` are in the SAME order as the approved prototype, and `proto.py` never reorders blocks with CSS**
   (client, 13.10.2026: byline sat above the H1 on the live page while the prototype showed it below, centred, accent-coloured).
   The title section of the home page is: H1 → byline, both centred, byline in the accent colour (`textcolor.tpl.js`).

### What Sites cannot do (not a rule violation)

Global project rules that are unreachable here, so don't fight them: self-hosted `woff2` fonts (theme
fonts only, from Sites' fixed list), clean URLs (Sites owns the slugs), asset versioning (`?v1.2`),
a support chat widget, and full control of the DOM/heading semantics.

## Workflow

Work top-to-bottom, but skip whatever the task doesn't need (theme, popup, extra pages).

0. **Pre-flight — check the profile yourself, don't ask (client, 13.10.2026).** `source scripts/gs.sh && gs_preflight`
   prints `FREE` or `BUSY: …` — it looks for a `chrome.exe` running on this user-data-dir and for a playwright session that is
   editing another site. `FREE` → go. `BUSY` → report what holds the profile (manual Chrome / another build) and ask only then.
   Lock the decisions that cause rework later (one `AskUserQuestion` batch only when something is genuinely undecided): web address (+2 fallback variants — good names are usually taken), page list, popup yes/no, footer content and link separator, background treatment, what stays in the nav vs footer-only.

0b. **Claim the web address before anything else — silently.** Two cases:
   - **The user wrote an address in the request** → use exactly that one; if Sites rejects it as taken,
     say so and stop — that is the one address question worth asking.
   - **No address given** → derive `<brand>-info`, check it right after the site is created (Publish →
     type → read the dialog); if taken, pick the closest variant yourself (`-informazioni` /
     `-information` / `-guida` / `-portal`…) and go on — **do not ask**, just report the final address at
     the end. The modal CTA, all verification
   URLs and the memory note depend on it, so it must be known before the first tile is filled.

1. **Understand the target.** If there's a reference site, open it and record its section order, headings, footer, background treatment and any embed (measure iframe sizes). If it's unique, sketch the page/section list from the brief. Also gather brand colours if a themed look is wanted (sample the logo/favicon with PIL if the brand site is geo-blocked). → `references/setup-and-golden-rules.md` (reference-capture + colour-sampling)

2. **HTML prototype of the HOME page → user sign-off (mandatory before any editor work).**
   **The prototype may only use constructs that exist as native Sites blocks** — it is a preview of what
   the editor can build, not a design exercise. Allowed vocabulary, nothing else: full-width text
   sections on Style 1/2/3 backgrounds (heading + paragraphs + "— " lists); the layout block
   photo + heading + text (left / right / top, see requirement 7a); a divider; a native button; the
   Cover header with the one embed modal; the footer (text line + links) — it takes a Style from the colour scheme or an image background like
   any section (the palette icon sits on its left edge on hover; one probe missed it), and otherwise inherits
   the theme's Default Background. **Forbidden in the prototype:** cards, grids of tiles, badges/pills,
   icon rows, multi-column text, overlays on photos, anything that would need an embed
   to reproduce. If a section idea needs custom HTML, drop the idea, not the rule. Build a fast local static mockup of the home page only, approximating how the finished Google Site will look: a single ~944px column, the real home texts, the actual generated background image (simulate Sites' darkening: `out = in*0.298 + 23`), the footer line, and — when there is one — the full-screen first screen: the Cover-header photo with the modal card on top. **Hand the prototype over by opening it in the user's own browser** — and open it **explicitly in Chrome**, because on this machine the `.html` file association points at VS Code, so `start file.html` / `Start-Process file.html` silently opens the editor instead of a browser:
`Start-Process "chrome.exe" -ArgumentList "file:///C:/OSPanel/domains/<site>/index.html"` — **a new TAB in the browser window the user already has open**, never `--new-window` (the client asked for a tab, not another window).
Then confirm it really landed (`Get-Process | ? MainWindowTitle -match '<page title>'`) and say what to look at. This is the client's standing preference: never make them read a screenshot instead, and never spend Playwright time on prototype screenshots (a second Chrome/Playwright instance also risks killing a concurrent build's browser). Iterate **here** — a prototype edit costs seconds, editor rework costs tens of minutes. Only after explicit approval, open the editor. The other pages are then built in the approved style without their own prototypes; keep all page texts as the JSON content source for step 6.

3. **Set up the session.** Ensure a logged-in profile exists, launch `playwright-cli` against it, open Google Sites. → `references/setup-and-golden-rules.md`

4. **Create the site + (optional) theme.** Theme wizard notes (13.10.2026): the colours tab may be called **Custom colors**
   (en-US) or Customised colours; the font list may lack Inter/Poppins/Lato → `js/theme_font_more.tpl.js FONT=… ROWS=[…]`
   (More fonts → search → pick → Done, then keyboard selection in the dropdown); **seed colours in the wizard are set, not
   skipped**: `tcol.js` (tab matches both «Custom colors» and «Customised colours») → `tcol2.tpl.js C1=<brand dark bg> C2=<accent>
   C3=<accent>` — Color 3 drives buttons / links / Active dot, so a wrong C3 leaks the preset's brown into every link; the
   script re-reads the three inputs and reports `seed colors ok`. After creating the theme run
   `js/theme_styles_dump.js` + `js/theme_swatches_dump.js` and recolour every seed-colour swatch (buttons, Active dot, «Color»
   rows) with `js/theme_recolor.tpl.js FROM=… TO=…` — otherwise links/buttons come out in the preset's colour. Sidebar
   panels need a viewport ≥1300px tall or their swatches have zero width. Start a **new blank site** (golden rule 6: copying an existing site is forbidden unless the user explicitly named one as an example from the same reference — only then topbar ⋮ → *Make a copy*; the dashboard card menu has no duplicate item). Set the site name, delete the default page header. If a branded look is requested, build a custom theme (background, accent, headings, fonts). → `references/theme.md`

5. **Create the pages.** Add each subpage via the "New page" FAB (real click). → `references/interactions.md`

6. **Fill each page with native blocks.** Grow sections by duplicating, fill text via plain-paste + heading shortcuts, set per-section styles, add internal links, add the site-wide footer. Prepare content as data (from the approved prototype) and drive it with a small builder script rather than hand-clicking every block. → `references/content.md`

   **Images — the rule depends on the build mode:**
   - **Unique / from-scratch build:** image placement is the user's design decision — *ask, don't guess.* Ask which sections get content images and which (if any) get an image background vs a plain colour; add images only where they name; if they gave/asked for none, add none.
   - **Close-copy / replica of a reference page:** *don't ask — mirror the original.* The reference already answers "where do images go". Put a content image wherever the original section has one, use an image background wherever the original section has one, and reproduce them as closely as native blocks allow. Match layout, section order, colours, fonts and imagery to the source; only ask if something in the original genuinely can't be reproduced natively and you need a fallback decision.
   → `references/interactions.md` (content images, section background images), `references/copy-mode.md` (replica workflow)

7. **(Optional) Build the first screen: a Cover header + the age-gate/CTA modal — one command: `scripts/cover.sh`**
   (reads `site.json → cover {image, popup, w, h}`; runs Header type → Cover, clears and removes the Title tile, clears the
   Site name, uploads the header image and waits for the data-URI, inserts the embed, drags it into the header, resizes W×H
   symmetrically and prints `hdrTiles / ifr / dx`). Details of each step: Only if asked for a popup or a full-screen opener. The approved shape is a **Page header of type `Cover`** (viewport-tall, native scroll-down arrow, parallax background) with the modal **Embed inside it** — not a tall section, which has neither arrow nor parallax. The modal itself is the fixed series template from hard requirement 3 (row `18+ | headline` → accent divider → two short lines → wide CTA, no logo, no icon, fade-in), with no `target` on the button and its `href` always the published root URL of this same site. **Both former hand-off gestures are now scripted (12.10.2026):** never delete the home header (then **Add header** is not needed — `cover2.js`/`_cover4.js` turns the existing one into Cover), **the empty Title tile of the Cover header is REMOVED, not just cleared** (`scripts/js/rmhdrtitle.js`: select the text tile → toolbar `Remove`; `clrhdr.js` alone leaves an empty 91px tile above the modal — client 13.10.2026), and the modal is dragged into the header by `scripts/js/drag_embed_hdr.js` (insert embed → drag by the tile's top strip at viewport 1440×1400 → `resize.js` W=782,H=620 → dx=0). Only if the drag script reports `NO MOVE CURSOR` twice, hand the drag to the user. → `references/embed.md`

8. **Publish ONCE, then the 30-second live audit — `scripts/publish.sh`.** It publishes (or `publish.sh re` republishes),
   sets Public, opens the site in the cookie-less `anon` session and runs `js/audit_live.tpl.js`: every page 200 + h1, no
   horizontal scroll, custom favicon, images ≥900px, no seed-colour leftovers, section count per mode, on the home page the
   header holds only the modal iframe (no leftover Title tile), the 18+ line is the required red, the byline sits under the H1,
   centred, in the accent colour. **The build is not finished while `AUDIT FAILS` is non-empty** — fix in the editor,
   `publish.sh re`, repeat. The audit replaces hand-checking; it is not an extra stage.
   **Publish ONCE, verify ONCE — at the very end, 15-minute budget.** Pick a unique web address (lowercase/digits/dashes, **no dots**), publish, **set Published site = Public (requirement 7c) and open it in a cookie-less `-s=anon` session**, then do a single verification pass (each page loads, footer links resolve, one mobile screenshot). **Hard cap: 15 minutes** — if verification (or fixing what it found) would run longer, stop, hand the URL and the list of findings to the user and let them check/decide manually. **No publish→check→republish loops during the build**: verify intermediate state via DOM `eval` in the editor instead; every extra publish-and-browse cycle costs 2–4 minutes. → `references/publish.md`

## Waiting policy (13.10.2026 — fixed pauses were half of the editor time)

`_common.js` has `until(fn, capMs)` — poll a condition every 100 ms instead of sleeping. Rules for every step script:
- after a click that opens something, wait for the thing (panel item visible, palette rows present, new `section`/`tile`
  count, `activeElement` contenteditable), capped at 2–3.5 s — never a bare 1.2–3.5 s sleep;
- real-click pauses are 120/90 ms, paste 60/120 ms, per-block style 80 ms; drags keep their timing (the editor needs it);
- after `playwright-cli upload` use `gs_upload <file> <settle> "<js condition>"` (polls for the data-URI / tile background)
  instead of `sleep 8`;
- measured budget per text tile ≈ 25–35 s, per image tile ≈ 40 s. If a step starts failing after a cut, raise that one cap,
  not all of them.

## Working fast (this is where builds bleed time — read it)

Google Sites builds are slow when you fight the editor click-by-click and re-discover its quirks live. Structure the work to avoid that:

1. **Kill the two biggest time sinks first** (they cost the most in practice): edit-on-live (always confirm `/edit`) and the stuck editor (restart at the *first* dead handle — don't retry drag variations). Golden rules 1 and 3 exist because ignoring them ate hours.
2. **Batch, don't click.** Author all content as JSON up front, then run **one builder script per page** (grow sections → fill text+styles → links) instead of dozens of individual tool calls. Create *all* pages in one script; do *all* internal links in one pass. One `run-code` that builds a whole page beats fifty small actions. → `references/content.md`
3. **Build from a blank site — do NOT copy old sites for speed.** Reskinning a copy looks faster but leaks the old site's design and text into the new one (see golden rule 6); cleanup costs more than a clean build from prepared JSON. Copy only when the user explicitly names an example site made from the same reference.
4. **Decide the design before building, to avoid rework.** Lock the plan (section list, colours, fonts, which sections get images, popup or not) once. In copy mode, capture the whole reference first (`references/copy-mode.md`) — then build straight through. Get the popup spec right the first time (`min-height` centering, height ≈ one viewport) instead of iterating on it.
5. **Verify with DOM eval, screenshot only at milestones.** Checking counts/heights/text/`href`s via `eval` is much faster than screenshot→read loops. Screenshot at section-complete / page-complete / pre-publish, not after every micro-step. Publish exactly once, at the end (workflow step 8).
6. **Avoid the flaky, slow operations.** Build sections in their final order (section reorder is flaky). Set the embed height correctly on the first try. Reuse uploaded images across sections (Select, don't re-upload). Keep the theme and popup HTML as reusable templates.
7. **Parallelize independent calls** — batch independent shell/eval commands in one message rather than serially.
8. **Time-box editor fights: 2 failed attempts → ask for the 5-second manual click.** Some controls (theme hex field, footer edit mode, a dead handle) can eat 30+ minutes of workarounds when the user could click them manually in seconds. After two failed approaches on the same control, stop and ask the user to do that one gesture, then continue automated.
9. **Hand-off protocol for manual edits.** If the user edits the site by hand mid-build, pause all scripts until they say they're done — manual changes shift section indexes and invalidate the build plan. One editor, one moment: either the automation drives or the user does, never both.
10. **Prepare everything offline first.** All texts (JSON), the background image (with the darkening simulation), the popup HTML — ready before the browser opens. Browser time should be pure mechanical transfer; with the prototype approved this is ~45–60 min for an 8-page site.

## Project config instead of sed (`site.json` + `gs.sh`)

Every project has ONE `site.json` in its folder; the step scripts in the skill read it and are **never copied or edited per
project** (copying 60 scripts and sed-ing session/siteId/paths cost 15 min and silent misses on betfans). Keys:
`name, address, url, session, profile, siteId, sections ("separate"|"one"), pages {slug: id}, colors {name: hex},
strings {name: text}, markers [regexps of the 18+/© tiles], audit {notice, notice_rgb, byline, byline_rgb, forbidden_rgb, modal}`.
- `render.py` auto-fills `__SESSION__ __SITEID__ __ADDRESS__ __URL__ __PAGE_<slug>__ __C_<color>__ __S_<string>__` from it
  (explicit `K=V` args still win) and prints `UNFILLED:` for anything left.
- `source scripts/gs.sh` exports `SESSION PROFILE SITEID ADDRESS SECTIONS V SKILL` and gives `gs_open`, `gs_goto <slug>`,
  `gs_run`, `gs_title`, `gs_eval`, `gs_upload`, `gs_render`.
- `scripts/buildpage.sh <slug> [keephdr]`, `scripts/bgpage.sh <slug> [offset]`, `scripts/mktile.py`, `scripts/publish.sh`
  all run from the project folder with no edits. Project-specific things live only in `_src/` (content.py, plan.json,
  images, popup HTML) and `site.json`.

## Ready-made step scripts (run them yourself, one visible step at a time)

There is **no orchestrator** — the client wants to see the build happen and the step-by-step flow is faster
in practice. What exists is a set of proven `playwright-cli run-code` scripts in `scripts/js/`, one per
editor operation, plus `scripts/plan.py` (content.py → plan.json) and `scripts/render.py` to fill a
template's `__PLACEHOLDERS__`:

```
python <skill>/scripts/render.py js/t_text.tpl.js _t.js BLOCKS='[["h2","…"],["p","…"]]' STYLE=2
playwright-cli -s=gs run-code --filename _t.js && playwright-cli -s=gs --raw eval "() => document.title"
```

Scripts report through `document.title` (read it with `--raw eval` after each run). Per page: `delhdr.js`
(inner pages) → `t_text.tpl.js` per text tile → `t_lay_a.tpl.js` + `playwright-cli upload <jpg>` +
`t_lay_b.tpl.js` per layout tile. Site-wide: `footer.tpl.js`, `hidenav.tpl.js`, `cover2.js` + `clrhdr.js`,
`embed.tpl.js` + `resize.js` + `popup_fit.py` (fit-check before the embed goes in), `publish1.tpl.js` / `republish.js`, `verify.tpl.js`. Theme: `themetab.js`,
`crtheme.js`, `tname.tpl.js`, `tcol.js`, `tcol2.tpl.js`, `tnext.js`, `tcreate.js`, `theme_reenter.js`,
`setswatch.js` (Style tabs only — never the `Default` swatch), `openup.tpl.js` (theme Header/Logo upload),
`brand_open.js` + `brand_upload_favicon.js`. Run one, read the result, run the next — every step is a visible
tool call and a failure is caught where it happens, not three stages later.

**Nothing unproven on a client site.** A new pattern or mechanic gets tried on a scratch site first, then
either becomes a script here or is written off in the references.

## Reference files

- `references/setup-and-golden-rules.md` — login/profile flow, launching Playwright, editor-vs-live, the `rc()` real-click helper, the stuck-editor restart, capturing a reference site, sampling brand colours from a logo.
- `references/theme.md` — custom theme creation, brand colours (Style 1/2/3, background, headings, body, nav), fonts, deleting the page header. **Optional** — skip if no branded look is requested.
- `references/interactions.md` — creating pages, section duplicate/delete, section styles, section background images (upload), the low-level click/paste helpers reused everywhere.
- `references/content.md` — text blocks (plain-paste + `Ctrl+Alt+N` styles, centering), internal links (Insert-link → filter → Apply, and why `Ctrl+K` and the current page don't work), footer, and the recommended JSON-content + builder-script pattern.
- `references/embed.md` — the trickiest part: inserting an HTML embed, resizing it (incl. beyond the viewport via iterative scroll), making a section full-screen with a tall embed, **centering the card with `min-height:100%` not `position:fixed`**, and full-bleed patterns via transparent embed + section background image.
- `references/copy-mode.md` — the "make a maximally similar copy of this page" workflow: capture the source section-by-section, fetch its images, rebuild with the closest native blocks, compare side-by-side. In this mode don't ask about images — mirror the original.
- `references/publish.md` — publishing, choosing a valid address, re-publishing, and verifying.

## A note on honesty about limits

Some things genuinely can't be forced through this editor reliably: true responsive `100vh` sections (embeds are fixed-px and scale by aspect ratio on mobile), and section reordering is flaky. **Add header** cannot be clicked from Playwright — so never delete the home header (convert it to Cover instead). Moving a block (text, image, embed) into another section or into the header IS automatable since 12.10.2026: `drag_tile.tpl.js` / `drag_embed_hdr.js` (grab the tile's top strip where the cursor reads `move`, keep source and target inside one tall viewport). If a resize/reorder won't take after a fresh-session retry, say so plainly and offer the user the 5-second manual gesture rather than burning dozens of attempts.

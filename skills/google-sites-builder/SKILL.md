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

**HTML embeds are reserved for the popup by default.** The default use of an "Embed code" block is the optional full-screen popup/age-gate/CTA card, because native blocks can't produce that one interactive full-viewport element. **Build everything else with native Google Sites blocks** — text boxes, headings, images, buttons, dividers, image carousels, section background colours/images, the footer. Do not *silently* reach for an embed to make a hero, a feature grid, cards, columns, or a background; those are all native, so use the native equivalent.

The one exception: **if the user explicitly asks for a specific thing to be done via embed** (e.g. "add this widget as an embed", "do the pricing table as custom HTML"), then honour that — embeds are fine wherever the user asks for them. The rule is only "don't default to embeds on your own"; an explicit user request always overrides it.

## The golden rules (internalize these — they cost the most time when ignored)

1. **Edit on the `/edit` URL, never the published `/view/` URL.** The editor lives at
   `https://sites.google.com/d/<siteId>/p/<pageId>/edit`. The published site is `https://sites.google.com/view/<address>/...` and is **read-only** — clicking/dragging there does nothing but looks like the editor. Before any edit action, confirm:
   `playwright-cli --raw eval "location.href.includes('/edit') ? 'EDITOR' : 'LIVE'"`.
   If you ever see an "Edit this page" pencil FAB while trying to edit, you're on the live site — go back to `/edit`.

2. **Use real mouse clicks, not `.click()`.** Most Sites controls — the "New page" FAB, dialog buttons, resize handles, section toolbar icons — ignore Playwright's `.click()`. Drive them with `mouse.move → mouse.down → (pause ~120ms) → mouse.up`. Keep this `rc()` helper handy (see `references/interactions.md`).

3. **When resize/reorder/handles stop responding, close and reopen the browser.** After many operations the editor gets into a state where drag-resizing an embed or dragging a section produces the correct `ns-resize` cursor but has **no effect**. This is not a coordinate problem — it's a stuck editor. `playwright-cli close`, reopen the `/edit` URL fresh, and it works again. This single trick unblocked the full-screen embed after ~40 failed attempts.

4. **Reuse the already-logged-in profile — verify, don't re-login.** The user normally already has a logged-in Google session in the saved Chrome profile. Your job is just to **confirm** the session is live (open `sites.google.com` and check the account/dashboard loaded), and only fall back to the one-time manual login if it isn't. Never re-run the login flow "just in case", never type the Google password via Playwright (Google rejects automated logins), and never copy Chrome profile folders (blocked as credential theft). See `references/setup-and-golden-rules.md`.

5. **Paste content as plain text and style with keyboard shortcuts.** Pasting HTML into a text box drags in black text and Arial that clash with the theme. Instead paste plain text (`Ctrl+Shift+V`) and apply block styles with `Ctrl+Alt+1/2/3` (Title/Heading/Subheading), `Ctrl+Alt+0` (Normal). See `references/content.md`.

6. **A given reference outranks everything — including sites built before.** When the user provides a reference URL, that reference IS the spec: its structure, background treatment (e.g. one seamless tone-on-tone pattern vs per-section colours), footer shape and overall feel. Never substitute "how the previous site in this account did it" for what the reference shows — that mistake forced a triple rebuild once. **Copying an existing site is FORBIDDEN by default** — always start from a blank site. The single exception: the user explicitly designates an existing site as an example built from the same reference (wording like «вот пример такого сайта»); only then Make-a-copy it, and still treat every inherited text as placeholder.

7. **Only ONE build may drive a Chrome profile dir at a time.** The Chrome profile (`.gsites-profile`) and the playwright daemon are shared across sessions: a second concurrent build hijacks navigation and closes the browser mid-write (this destroyed hours once). One profile dir = one Chrome instance — two sessions on it **cannot** run in parallel; sequential use is fine. **Parallel builds on the same Google account ARE possible:** a Google account and a Chrome profile dir are different things — create a second user-data-dir (e.g. `.gsites-profile-2`), log the SAME Google account into it once manually (~2 min), and two builds can run side by side on one Sites account. Hence the mandatory pre-flight question below.

## Workflow

Work top-to-bottom, but skip whatever the task doesn't need (theme, popup, extra pages).

0. **Pre-flight — ask BEFORE touching the browser.** One `AskUserQuestion` batch, mandatory:
   - **"Идёт ли сейчас другая сборка Google Sites (в любой сессии)?"** — yes/no. If yes: stop and wait for it to finish, or agree on a second Chrome profile (one-time manual login) before proceeding. Never start against a busy profile.
   - Lock the decisions that cause rework later: web address (+2 fallback variants — good names are usually taken), page list, popup yes/no, footer content and link separator, background treatment, what stays in the nav vs footer-only.

1. **Understand the target.** If there's a reference site, open it and record its section order, headings, footer, background treatment and any embed (measure iframe sizes). If it's unique, sketch the page/section list from the brief. Also gather brand colours if a themed look is wanted (sample the logo/favicon with PIL if the brand site is geo-blocked). → `references/setup-and-golden-rules.md` (reference-capture + colour-sampling)

2. **HTML prototype of the HOME page → user sign-off (mandatory before any editor work).** Build a fast local static mockup of the home page only, approximating how the finished Google Site will look: a single ~944px column, the real home texts, the actual generated background image (simulate Sites' darkening: `out = in*0.298 + 23`), the footer line, the popup card. Show it to the user (screenshot or served page) and iterate **here** — a prototype edit costs seconds, editor rework costs tens of minutes. Only after explicit approval, open the editor. The other pages are then built in the approved style without their own prototypes; keep all page texts as the JSON content source for step 6.

3. **Set up the session.** Ensure a logged-in profile exists, launch `playwright-cli` against it, open Google Sites. → `references/setup-and-golden-rules.md`

4. **Create the site + (optional) theme.** Start a **new blank site** (golden rule 6: copying an existing site is forbidden unless the user explicitly named one as an example from the same reference — only then topbar ⋮ → *Make a copy*; the dashboard card menu has no duplicate item). Set the site name, delete the default page header. If a branded look is requested, build a custom theme (background, accent, headings, fonts). → `references/theme.md`

5. **Create the pages.** Add each subpage via the "New page" FAB (real click). → `references/interactions.md`

6. **Fill each page with native blocks.** Grow sections by duplicating, fill text via plain-paste + heading shortcuts, set per-section styles, add internal links, add the site-wide footer. Prepare content as data (from the approved prototype) and drive it with a small builder script rather than hand-clicking every block. → `references/content.md`

   **Images — the rule depends on the build mode:**
   - **Unique / from-scratch build:** image placement is the user's design decision — *ask, don't guess.* Ask which sections get content images and which (if any) get an image background vs a plain colour; add images only where they name; if they gave/asked for none, add none.
   - **Close-copy / replica of a reference page:** *don't ask — mirror the original.* The reference already answers "where do images go". Put a content image wherever the original section has one, use an image background wherever the original section has one, and reproduce them as closely as native blocks allow. Match layout, section order, colours, fonts and imagery to the source; only ask if something in the original genuinely can't be reproduced natively and you need a fallback decision.
   → `references/interactions.md` (content images, section background images), `references/copy-mode.md` (replica workflow)

7. **(Optional) Add a popup / full-screen section as an HTML embed.** Only if asked. Insert an "Embed code" block, resize it (fresh session!), make it full-screen if wanted, and center its card robustly. → `references/embed.md`

8. **Publish ONCE, verify ONCE — at the very end, 15-minute budget.** Pick a unique web address (lowercase/digits/dashes, **no dots**), publish, then do a single verification pass (each page loads, footer links resolve, one mobile screenshot). **Hard cap: 15 minutes** — if verification (or fixing what it found) would run longer, stop, hand the URL and the list of findings to the user and let them check/decide manually. **No publish→check→republish loops during the build**: verify intermediate state via DOM `eval` in the editor instead; every extra publish-and-browse cycle costs 2–4 minutes. → `references/publish.md`

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

## Reference files

- `references/setup-and-golden-rules.md` — login/profile flow, launching Playwright, editor-vs-live, the `rc()` real-click helper, the stuck-editor restart, capturing a reference site, sampling brand colours from a logo.
- `references/theme.md` — custom theme creation, brand colours (Style 1/2/3, background, headings, body, nav), fonts, deleting the page header. **Optional** — skip if no branded look is requested.
- `references/interactions.md` — creating pages, section duplicate/delete, section styles, section background images (upload), the low-level click/paste helpers reused everywhere.
- `references/content.md` — text blocks (plain-paste + `Ctrl+Alt+N` styles, centering), internal links (Insert-link → filter → Apply, and why `Ctrl+K` and the current page don't work), footer, and the recommended JSON-content + builder-script pattern.
- `references/embed.md` — the trickiest part: inserting an HTML embed, resizing it (incl. beyond the viewport via iterative scroll), making a section full-screen with a tall embed, **centering the card with `min-height:100%` not `position:fixed`**, and full-bleed patterns via transparent embed + section background image.
- `references/copy-mode.md` — the "make a maximally similar copy of this page" workflow: capture the source section-by-section, fetch its images, rebuild with the closest native blocks, compare side-by-side. In this mode don't ask about images — mirror the original.
- `references/publish.md` — publishing, choosing a valid address, re-publishing, and verifying.

## A note on honesty about limits

Some things genuinely can't be forced through this editor reliably: true responsive `100vh` sections (embeds are fixed-px and scale by aspect ratio on mobile), and section reordering is flaky. If a resize/reorder won't take after a fresh-session retry, say so plainly and offer the user the 5-second manual gesture rather than burning dozens of attempts.

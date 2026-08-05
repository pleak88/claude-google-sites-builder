# Copy mode — replicating a page as closely as native Sites allows

Use this when the task is "make a maximally similar copy of this page" (usually a home page). The goal is the closest possible reproduction using **native Google Sites blocks only** (an embed is still allowed only for a popup, or if the user explicitly asks). In this mode you do **not** ask the user about image placement — the original already answers every layout/image question. Mirror it.

Fidelity, not invention: match section order, layout, spacing rhythm, colours, fonts, headings/body copy, buttons, and imagery to the source. Don't add sections the original doesn't have, and don't drop ones it does.

## 1. Capture the reference thoroughly

Open the source page and record it section by section so you can reproduce each one:

- **Full-page screenshots** while scrolling (top → bottom) — your visual ground truth.
- **Section inventory**: for each section note its role (hero / features / text / gallery / CTA / footer), whether it has a **background image** or a solid colour, and whether it contains **content images**, and the text.
- **Colours & fonts**: sample the real values, don't eyeball.

```bash
# section boxes, backgrounds, and every image/background-image URL on the page
playwright-cli -s=gsites --raw run-code "async page => {
  const secs=[...document.querySelectorAll('section, header, footer')].map((s,i)=>{
    const cs=getComputedStyle(s);
    return {i, tag:s.tagName, h:Math.round(s.getBoundingClientRect().height),
            bg:cs.backgroundColor, bgImg:cs.backgroundImage.slice(0,80),
            text:(s.innerText||'').replace(/\s+/g,' ').slice(0,80)};
  });
  const imgs=[...document.querySelectorAll('img')].map(im=>({src:im.currentSrc||im.src, w:im.naturalWidth, h:im.naturalHeight, alt:im.alt}));
  const bgUrls=[...document.querySelectorAll('*')].map(e=>getComputedStyle(e).backgroundImage).filter(v=>v&&v!=='none'&&/url\(/.test(v));
  return JSON.stringify({secs, imgs:imgs.slice(0,40), bgUrls:[...new Set(bgUrls)].slice(0,40)}, null, 1);
}"
```

- **Fonts**: `getComputedStyle(h1).fontFamily` on a heading and on body text.
- **Accent/background colours**: read `color` of headings, `backgroundColor` of sections, or sample the logo (setup reference, colour-sampling).

## 2. Get the images

Native Sites needs the actual image files (it can't reference the source's URLs cleanly). For each content image and each background image the source uses, obtain a file:

- Download the source asset directly if the URL is public (`curl -sL "<src>" -o img.jpg`).
- If a source URL is unstable/parametrised (some CDNs return different crops per size param), download at the size you need and verify it visually before using.
- If an asset can't be fetched, regenerate a close visual match with the project's image-generation skill.

Keep them in your scratchpad, named per section (`hero.jpg`, `about-bg.jpg`, …).

## 3. Rebuild with native blocks

Reproduce each section with the closest native equivalent (all covered in the other references):

- **Hero with a background photo + heading** → a section with an **image background** (`interactions.md`) + native Title/Heading text on top.
- **Text sections** → native text blocks with `Ctrl+Alt+1/2/3` styles (`content.md`).
- **Image + text / columns / galleries** → the native layout blocks under Insert → Images (image+caption, two/three column, image carousel).
- **Section background colours** → the theme's Style 1/2/3, or a custom colour close to the source.
- **Buttons / CTAs** → native **Button** blocks (Insert → Button), linked appropriately.
- **Fonts** → set the theme title/body fonts to match the source (`theme.md`).
- **Footer** → native footer with the same links/text.

Set section styles/backgrounds and match spacing as you go. Alternate/echo the source's section colours rather than inventing a new rhythm.

## 4. Compare side by side and close the gaps

Screenshot your live copy at the same widths as the source (desktop 1440, mobile 390) and compare against your reference screenshots section by section. Fix the largest visual deltas first: wrong colour, wrong font, missing/extra section, image in the wrong place, background solid where it should be an image. Iterate until it reads as the same page.

## What native Sites can't perfectly reproduce

Be honest about the ceiling and get close rather than forcing an embed:
- Exact custom fonts not in the Sites font list → pick the nearest available.
- Pixel-exact spacing, overlapping/absolutely-positioned elements, animations → approximate with the closest native layout.
- Complex interactive widgets → only these justify an embed, and only if the user is OK with it (default is native).

If a specific element truly can't be matched natively and matters, flag it to the user and offer the closest native approximation (or an embed, if they approve) rather than silently drifting from the source.

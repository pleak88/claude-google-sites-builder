async (page) => {
  const rc = async (loc) => { const b=await loc.boundingBox({timeout:6000}).catch(()=>null); if(!b) return false;
    await page.mouse.move(b.x+b.width/2,b.y+b.height/2); await page.waitForTimeout(180);
    await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); return true; };

  const STYLE = '__STYLE__';                 // 'Style 1' | 'Style 2' | 'Style 3'
  const JOBS  = __JOBS__;                    // [["Background","#F4F7FB"], ...]

  // 1. выбрать таб стиля
  const tab = page.locator(`[aria-label="${STYLE}"]`).first();
  if (await tab.count()) { await tab.click({force:true}); await page.waitForTimeout(1400); }

  for (const [role, hex] of JOBS) {
    // 2. открыть свотч роли (только locator.click, real-click не работает)
    const sw = page.locator(`[aria-label^="${role}, selected color"]`).first();
    if (!(await sw.count())) { console.log('no swatch ' + role); continue; }
    await sw.click({force:true});
    await page.waitForTimeout(1500);

    // 3. Add custom color (второй раз это уже иконка "+")
    const addCands = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('[aria-label],[role=button],[role=menuitem]').forEach(e => {
        const al = (e.getAttribute('aria-label') || '') + ' ' + (e.innerText || '');
        const r = e.getBoundingClientRect();
        if (/add custom color|custom color/i.test(al) && r.width > 8 && r.height > 8)
          out.push({ x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) });
      });
      return out;
    });
    if (addCands.length) {
      const c = addCands[0];
      await page.mouse.move(c.x, c.y); await page.waitForTimeout(180);
      await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up();
      await page.waitForTimeout(1600);
    }

    // 4. Hex → fill (никогда type) → Tab → Save
    const hexIn = page.locator('input[aria-label="Hex"]').last();
    if (!(await hexIn.count())) { console.log('no hex field for ' + role); await page.keyboard.press('Escape'); continue; }
    await hexIn.click(); await page.waitForTimeout(200);
    await hexIn.fill(''); await page.waitForTimeout(150);
    await hexIn.fill(hex); await page.waitForTimeout(300);
    await page.keyboard.press('Tab'); await page.waitForTimeout(900);

    const save = page.locator('[role=button],button').filter({ hasText: /^Save$/ }).last();
    if (await save.count()) { await rc(save); } else { await page.keyboard.press('Enter'); }
    await page.waitForTimeout(2000);
  }
}

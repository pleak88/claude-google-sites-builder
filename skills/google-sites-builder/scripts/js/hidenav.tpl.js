async (page) => {
  const rc = async (loc) => { const b=await loc.boundingBox({timeout:6000}).catch(()=>null); if(!b) return false;
    await page.mouse.move(b.x+b.width/2,b.y+b.height/2); await page.waitForTimeout(180);
    await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); return true; };
  const log = [];
  await rc(page.locator('[role=tab]').filter({ hasText: /^Pages$/ }).first());
  await page.waitForTimeout(2200);

  for (const nm of __HIDE_PAGES__) {
    const row = await page.evaluate(n => {
      const i=[...document.querySelectorAll('input[aria-label="Page title"]')].find(x=>x.value===n);
      if (!i) return null; const r=i.getBoundingClientRect();
      return {y: Math.round(r.y + r.height/2)};
    }, nm);
    if (!row) { log.push('no row '+nm); continue; }

    // кнопка Page actions на той же строке
    const act = await page.evaluate(y => {
      const c=[...document.querySelectorAll('[aria-label]')].filter(e=>/page actions|more options/i.test(e.getAttribute('aria-label')||''))
        .map(e=>{const r=e.getBoundingClientRect(); return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2), w:Math.round(r.width)}})
        .filter(o=>o.w>8 && Math.abs(o.y-y)<20);
      return c[0]||null;
    }, row.y);
    if (!act) {
      // кнопка появляется по ховеру строки
      await page.mouse.move(1300, row.y); await page.waitForTimeout(900);
    }
    const act2 = act || await page.evaluate(y => {
      const c=[...document.querySelectorAll('[aria-label]')].filter(e=>/page actions|more options/i.test(e.getAttribute('aria-label')||''))
        .map(e=>{const r=e.getBoundingClientRect(); return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2), w:Math.round(r.width)}})
        .filter(o=>o.w>8 && Math.abs(o.y-y)<20);
      return c[0]||null;
    }, row.y);
    if (!act2) { log.push('no actions btn '+nm); continue; }

    await page.mouse.move(act2.x, act2.y); await page.waitForTimeout(220);
    await page.mouse.down(); await page.waitForTimeout(140); await page.mouse.up();
    await page.waitForTimeout(1800);

    const mi = await page.evaluate(() => {
      const c=[...document.querySelectorAll('[role=menuitem]')].filter(e=>/Hide from navigation/i.test(e.innerText||''))
        .map(e=>{const r=e.getBoundingClientRect(); return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2), w:Math.round(r.width)}})
        .filter(o=>o.w>8);
      return c[0]||null;
    });
    if (!mi) { log.push('no menuitem for '+nm); await page.keyboard.press('Escape'); continue; }
    await page.mouse.move(mi.x, mi.y); await page.waitForTimeout(220);
    await page.mouse.down(); await page.waitForTimeout(140); await page.mouse.up();
    await page.waitForTimeout(2500);
    log.push('hidden '+nm);
  }
  await page.evaluate(t=>document.title=t.slice(0,600), JSON.stringify(log));
}

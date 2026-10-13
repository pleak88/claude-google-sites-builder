async (page) => {
__COMMON__
  const ITEMS = __ITEMS__;
  const ST = __STYLE__;
  const log = [];
  const clickXY = async (x,y) => { await page.mouse.move(x,y); await page.waitForTimeout(180); await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); };
  const lastGroupTiles = () => page.evaluate(()=>{
    const s=[...document.querySelectorAll('section')].filter(x=>!/footer/i.test(x.getAttribute('aria-label')||'') && x.querySelector('[aria-label^="Group starting"]')).pop();
    if(!s) return null;
    const g=[...s.querySelectorAll('[aria-label^="Group starting"]')].pop();
    return [...g.querySelectorAll('[aria-label="Text"]')].filter(t=>!t.parentElement.closest('[aria-label="Text"]')).map(t=>{const r=t.getBoundingClientRect(); return {x:Math.round(r.x+40), y:Math.round(r.y+r.height/2)}});
  });
  const inTile = (j) => page.evaluate(j=>{
    const s=[...document.querySelectorAll('section')].filter(x=>!/footer/i.test(x.getAttribute('aria-label')||'') && x.querySelector('[aria-label^="Group starting"]')).pop();
    const g=[...s.querySelectorAll('[aria-label^="Group starting"]')].pop();
    const el=[...g.querySelectorAll('[aria-label="Text"]')].filter(t=>!t.parentElement.closest('[aria-label="Text"]'))[j];
    return !!el && el.contains(document.activeElement);
  }, j);
  for (let k=0;k<ITEMS.length;k++){
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    await toBottom();
    const before = await page.evaluate(()=>document.querySelectorAll('section').length);
    if (!(await insertByLabel('Collapsible group'))) { log.push('no CG control'); break; }
    const after = await page.evaluate(()=>document.querySelectorAll('section').length);
    log.push('k'+k+' secs '+before+'→'+after);
    for (const j of [0,1]) {
      await page.keyboard.press('Escape'); await page.waitForTimeout(400);
      let ok=false;
      for (let a=0;a<3 && !ok;a++){
        let t=(await lastGroupTiles())[j];
        if (t.y<150 || t.y>780){ await page.mouse.move(600,500); await page.mouse.wheel(0,t.y-450); await page.waitForTimeout(600); t=(await lastGroupTiles())[j]; }
        await clickXY(t.x,t.y); await page.waitForTimeout(800); ok = await inTile(j);
      }
      if (!ok) { log.push('k'+k+'j'+j+' NO FOCUS'); continue; }
      await page.keyboard.press('Control+A'); await page.keyboard.press('Delete'); await page.waitForTimeout(300);
      await paste(ITEMS[k][j]); await page.waitForTimeout(400);
    }
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);
    log.push('style:'+await setStyleLast(ST));
  }
  await page.evaluate(t=>document.title=t.slice(0,1500), JSON.stringify(log));
}

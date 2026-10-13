async (page) => {
__COMMON__
  // Текстовый блок В ТУ ЖЕ секцию: фокус в последний тайл секции SEC → Insert → Text box → заполнить
  const BLOCKS = __BLOCKS__;
  const SEC = __SEC__;
  const log = [];
  await page.setViewportSize({width:1440,height:900}); await page.waitForTimeout(200);
  await page.keyboard.press('Escape');
  // прокрутить к низу секции SEC
  await page.mouse.move(600,500);
  let box=null;
  for (let i=0;i<60;i++){
    box = await page.evaluate(k=>{const s=document.querySelectorAll('section')[k]; if(!s) return null; const r=s.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height,b:r.y+r.height}}, SEC);
    if (!box) { log.push('no section '+SEC); await report(log); return; }
    if (box.b>200 && box.b<780) break;
    await page.mouse.wheel(0, box.b>780 ? 600 : -600); await page.waitForTimeout(120);
  }
  // клик в конец последнего текстового тайла секции (или в низ секции)
  const last = await page.evaluate(k=>{const s=document.querySelectorAll('section')[k]; const t=[...s.querySelectorAll('[aria-label="Text"][contenteditable="true"]')].pop(); if(!t) return null; const r=t.getBoundingClientRect(); return {x:r.x+r.width/2, y:r.y+r.height-12};}, SEC);
  if (last) { await rcXY(last.x, Math.min(860, Math.max(120, last.y))); } else { await rcXY(box.x+box.w/2, box.b-25); }
  await page.waitForTimeout(400);
  const before = await page.evaluate(()=>document.querySelectorAll('section').length);
  const tb = await page.evaluate(k=>document.querySelectorAll('section')[k].querySelectorAll('[aria-label="Text"]').length, SEC);
  if (!(await insertByLabel('Text box'))) { log.push('no Text box control'); }
  const after = await page.evaluate(()=>document.querySelectorAll('section').length);
  const ta = await page.evaluate(k=>document.querySelectorAll('section')[k].querySelectorAll('[aria-label="Text"]').length, SEC);
  log.push('secs '+before+'→'+after+' tilesInSec '+tb+'→'+ta);
  // новый тайл: последний пустой тайл в секции SEC, иначе последний на странице
  const tiles = page.locator('section').nth(SEC).locator('[aria-label="Text"][contenteditable="true"]');
  const n = await tiles.count();
  const target = (after===before && n>tb) ? tiles.nth(n-1) : page.locator('[aria-label="Text"][contenteditable="true"]').last();
  await fillTile(target, BLOCKS); log.push('filled '+(after===before?'JOINED':'NEW SECTION'));
  await report(log);
}

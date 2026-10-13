async (page) => {
__COMMON__
  // Картинка В ТУ ЖЕ секцию SEC: фокус в последний тайл секции → Insert → Images → Upload (нативный чузер → playwright-cli upload)
  const SEC = __SEC__;
  const log = [];
  await page.setViewportSize({width:1440,height:900}); await page.waitForTimeout(200);
  await page.keyboard.press('Escape');
  await page.mouse.move(600,500);
  let box=null;
  for (let i=0;i<60;i++){
    box = await page.evaluate(k=>{const s=document.querySelectorAll('section')[k]; if(!s) return null; const r=s.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height,b:r.y+r.height}}, SEC);
    if (!box) { log.push('no section '+SEC); await report(log); return; }
    if (box.b>200 && box.b<780) break;
    await page.mouse.wheel(0, box.b>780 ? 600 : -600); await page.waitForTimeout(120);
  }
  const last = await page.evaluate(k=>{const s=document.querySelectorAll('section')[k]; const t=[...s.querySelectorAll('[aria-label="Text"][contenteditable="true"]')].pop(); if(!t) return null; const r=t.getBoundingClientRect(); return {x:r.x+r.width/2, y:r.y+r.height-12};}, SEC);
  if (last) { await rcXY(last.x, Math.min(860, Math.max(120, last.y))); } else { await rcXY(box.x+box.w/2, box.b-25); }
  await page.waitForTimeout(400);
  const before = await page.evaluate(()=>document.querySelectorAll('section').length);
  await openInsert();
  const im = page.locator('[aria-label="Images"]').first();
  if (!(await im.count())) { log.push('no Images control'); await report(log); return; }
  await rc(im);
  const findUp = () => page.evaluate(() => !![...document.querySelectorAll('*')].find(e=>e.children.length===0 && (e.innerText||'').trim()==='Upload' && e.getBoundingClientRect().width>0));
  await until(findUp, 2500);   // подменю Images появилось
  const up = await page.evaluate(() => {
    const el=[...document.querySelectorAll('*')].find(e=>e.children.length===0 && (e.innerText||'').trim()==='Upload' && e.getBoundingClientRect().width>0);
    if(!el) return null; const r=el.getBoundingClientRect(); return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2)};
  });
  if (!up) { log.push('NO Upload item'); await report(log); return; }
  await rcXY(up.x, up.y); await page.waitForTimeout(900);   // нативный чузер открывается ~0,5 с
  log.push('secs '+before+' → chooser opened');
  await report(log);
}

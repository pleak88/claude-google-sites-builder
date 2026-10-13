async (page) => {
__COMMON__
  // Паттерн «фото сверху»: шаг A — Insert → Images → Upload (открывает нативный чузер; дальше playwright-cli upload)
  const log = [];
  await page.setViewportSize({width:1440,height:900}); await page.waitForTimeout(600);
  await toBottom();
  // фокус: клик в низ последней контентной секции (низ должен быть во вьюпорте 200–780)
  const idx = await lastContentIdx();
  await page.mouse.move(600,500);
  let box = null;
  for (let i=0;i<30;i++){
    box = await page.evaluate(k=>{const r=document.querySelectorAll('section')[k].getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height,b:r.y+r.height}}, idx);
    if (box.b>200 && box.b<780) break;
    await page.mouse.wheel(0, box.b>780 ? 400 : -400); await page.waitForTimeout(350);
  }
  await rcXY(box.x+box.w/2, box.b-25); await page.waitForTimeout(800);
  const before = await page.evaluate(()=>document.querySelectorAll('section').length);
  await openInsert();
  const im = page.locator('[aria-label="Images"]').first();
  if (!(await im.count())) { log.push('no Images control'); await report(log); return; }
  await rc(im); await page.waitForTimeout(2000);
  const up = await page.evaluate(() => {
    const el=[...document.querySelectorAll('*')].find(e=>e.children.length===0 && (e.innerText||'').trim()==='Upload' && e.getBoundingClientRect().width>0);
    if(!el) return null; const r=el.getBoundingClientRect(); return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2)};
  });
  if (!up) { log.push('NO Upload item'); await report(log); return; }
  await rcXY(up.x, up.y); await page.waitForTimeout(2000);
  log.push('secs '+before+' → chooser opened');
  await report(log);
}

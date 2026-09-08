async (page) => {
__COMMON__
  const log = [];
  await toBottom();
  const before = await page.evaluate(()=>document.querySelectorAll('section').length);
  if (!(await insertByLabel('Add layout: Image and caption'))) log.push('no layout control');
  const after = await page.evaluate(()=>document.querySelectorAll('section').length);
  log.push('secs '+before+'→'+after);
  // кнопка Insert content внутри плейсхолдера последней секции
  const ic = await page.evaluate(() => {
    const s=[...document.querySelectorAll('section')];
    const last=s[s.length-1];
    const e=last.querySelector('[aria-label="Insert content"]');
    if(!e) return null; const r=e.getBoundingClientRect();
    return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2)};
  });
  if (!ic) { log.push('NO Insert content'); await page.evaluate(t=>document.title=t, JSON.stringify(log)); return; }
  await rcXY(ic.x, ic.y);
  await page.waitForTimeout(2200);
  const up = await page.evaluate(() => {
    const el=[...document.querySelectorAll('*')].find(e=>e.children.length===0 && (e.innerText||'').trim()==='Upload' && e.getBoundingClientRect().width>0);
    if(!el) return null; const r=el.getBoundingClientRect();
    return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2)};
  });
  if (!up) { log.push('NO Upload item'); await page.evaluate(t=>document.title=t, JSON.stringify(log)); return; }
  await rcXY(up.x, up.y);
  await page.waitForTimeout(2200);
  log.push('chooser opened');
  await page.evaluate(t=>document.title=t.slice(0,400), JSON.stringify(log));
}

async (page) => {
  const TILE = __TILE__; const log=[];
  const rcXY = async (x,y) => { await page.mouse.move(x,y); await page.waitForTimeout(200); await page.mouse.down(); await page.waitForTimeout(130); await page.mouse.up(); };
  await page.setViewportSize({width:1440,height:1100}); await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  const r = await page.evaluate(i=>{const t=document.querySelectorAll('section')[2].querySelectorAll('tile')[i]; t.scrollIntoView({block:'center'}); const b=t.getBoundingClientRect(); return {x:b.x+b.width/2, y:b.y+b.height/2}}, TILE);
  await page.waitForTimeout(700);
  let more=null;
  for (let k=0;k<3 && !more;k++) { await rcXY(r.x, r.y); await page.waitForTimeout(1300);
    more = await page.evaluate(()=>{const e=[...document.querySelectorAll('[aria-label="More editing options"]')].find(x=>x.getBoundingClientRect().width>8); if(!e) return null; const b=e.getBoundingClientRect(); return {x:b.x+b.width/2,y:b.y+b.height/2};}); }
  log.push('more='+JSON.stringify(more)); if (!more) { await page.evaluate(t=>document.title=t, JSON.stringify(log)); return; }
  await rcXY(more.x, more.y); await page.waitForTimeout(1200);
  const items = await page.evaluate(()=>[...document.querySelectorAll('[role=menuitem]')].filter(e=>e.getBoundingClientRect().width>8).map(e=>{const b=e.getBoundingClientRect(); return {t:(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,25), x:Math.round(b.x+b.width/2), y:Math.round(b.y+b.height/2)}}));
  log.push('menu='+items.map(i=>i.t).join('/'));
  const rep = items.find(i=>/replace/i.test(i.t));
  if (!rep) { await page.keyboard.press('Escape'); await page.evaluate(t=>document.title=t.slice(0,600), JSON.stringify(log)); return; }
  await rcXY(rep.x, rep.y); await page.waitForTimeout(1200);
  const sub = await page.evaluate(()=>[...document.querySelectorAll('[role=menuitem]')].filter(e=>e.getBoundingClientRect().width>8).map(e=>{const b=e.getBoundingClientRect(); return {t:(e.innerText||'').trim().slice(0,20), x:Math.round(b.x+b.width/2), y:Math.round(b.y+b.height/2)}}));
  log.push('sub='+sub.map(i=>i.t).join('/'));
  const up = sub.find(i=>/^upload$/i.test(i.t));
  if (up) { await rcXY(up.x, up.y); await page.waitForTimeout(2000); log.push('upload clicked'); }
  await page.evaluate(t=>document.title=t.slice(0,600), JSON.stringify(log));
}

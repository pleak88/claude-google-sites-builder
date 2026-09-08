async (page) => {
  const log = [];
  const rcXY = async (x,y) => { await page.mouse.move(x,y); await page.waitForTimeout(200);
    await page.mouse.down(); await page.waitForTimeout(140); await page.mouse.up(); };
  await page.mouse.move(400,120); await page.waitForTimeout(1800);
  const bt = await page.evaluate(() => {
    const c=[...document.querySelectorAll('*')].filter(e=>(e.innerText||'').trim()==='Header type')
      .map(e=>{const r=e.getBoundingClientRect(); return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2), w:r.width, h:r.height}})
      .filter(o=>o.w>60 && o.h>25);
    return c[0]||null;
  });
  if (!bt) { log.push('NO Header type'); await page.evaluate(t=>document.title=t, JSON.stringify(log)); return; }
  await rcXY(bt.x, bt.y);
  await page.waitForTimeout(2200);
  const items = await page.evaluate(() => [...document.querySelectorAll('*')]
    .filter(e=>e.children.length===0 && /^(Cover|Large banner|Banner|Title only)$/.test((e.innerText||'').trim()) && e.getBoundingClientRect().width>8)
    .map(e=>{const r=e.getBoundingClientRect(); return {t:(e.innerText||'').trim(), x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2)}}));
  log.push('items='+JSON.stringify(items.map(i=>i.t)));
  const cov = items.find(i=>i.t==='Cover');
  if (!cov) { log.push('no Cover item'); await page.evaluate(t=>document.title=t.slice(0,400), JSON.stringify(log)); return; }
  await rcXY(cov.x, cov.y);
  await page.waitForTimeout(3500);
  const g = await page.evaluate(() => {
    const s=document.querySelector('section');
    return {h:Math.round(s.getBoundingClientRect().height), vp:window.innerHeight, arrow:!!document.querySelector('[aria-label="Scroll down"]')};
  });
  log.push('hdr='+g.h+' vp='+g.vp+' arrow='+g.arrow);
  await page.evaluate(t=>document.title=t.slice(0,400), JSON.stringify(log));
}

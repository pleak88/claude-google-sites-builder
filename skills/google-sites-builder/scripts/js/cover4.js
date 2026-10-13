async (page) => {
  const log = [];
  const rcXY = async (x,y) => { await page.mouse.move(x,y); await page.waitForTimeout(200); await page.mouse.down(); await page.waitForTimeout(140); await page.mouse.up(); };
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  await page.mouse.move(600,400); for (let i=0;i<8;i++){ await page.mouse.wheel(0,-900); await page.waitForTimeout(80); }
  await page.mouse.move(400,200); await page.waitForTimeout(1800);
  const find = () => page.evaluate(() => { const c=[...document.querySelectorAll('*')].filter(e=>e.children.length<=1 && (e.innerText||'').trim()==='Header type').map(e=>{const r=e.getBoundingClientRect(); return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2), w:r.width, h:r.height}}).filter(o=>o.w>40 && o.h>15); return c[0]||null; });
  let bt = await find(); if (!bt) { await rcXY(400,200); await page.waitForTimeout(1500); bt = await find(); }
  if (!bt) { await page.evaluate(()=>document.title='no Header type'); return; }
  const before = await page.evaluate(()=>new Set([...document.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().width>8).map(e=>(e.innerText||'').trim())).size);
  await rcXY(bt.x, bt.y); await page.waitForTimeout(2500);
  const items = await page.evaluate(() => [...document.querySelectorAll('*')].filter(e=>{const t=(e.innerText||'').trim(); const r=e.getBoundingClientRect(); return r.width>8 && r.height>8 && r.x<1180 && /^(Cover|Large banner|Banner|Title only)$/.test(t);}).map(e=>{const r=e.getBoundingClientRect(); return {t:(e.innerText||'').trim(), x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2), w:Math.round(r.width), h:Math.round(r.height), tag:e.tagName, role:e.getAttribute('role')}}));
  log.push('items='+JSON.stringify(items.slice(0,12)));
  if (!items.length) { await page.screenshot({path:'_hdrmenu.png'}); log.push('shot'); await page.evaluate(t=>document.title=t.slice(0,700), JSON.stringify(log)); return; }
  const cov = items.filter(i=>i.t==='Cover').sort((a,b)=>a.w-b.w)[0];
  await rcXY(cov.x, cov.y); await page.waitForTimeout(3500);
  const g = await page.evaluate(() => { const s=document.querySelector('section'); return {h:Math.round(s.getBoundingClientRect().height), vp:window.innerHeight, arrow:!!document.querySelector('[aria-label="Scroll down"]')}; });
  log.push('hdr='+g.h+' vp='+g.vp+' arrow='+g.arrow);
  await page.evaluate(t=>document.title=t.slice(0,700), JSON.stringify(log));
}

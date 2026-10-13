async (page) => {
  // заменить HTML существующего embed в хедере: выделить iframe → Edit → Embed code → вставить → Next → Insert/Save
  const log=[];
  await page.context().grantPermissions(['clipboard-read','clipboard-write'], { origin: 'https://sites.google.com' });
  const rcXY = async (x,y) => { await page.mouse.move(x,y); await page.waitForTimeout(200); await page.mouse.down(); await page.waitForTimeout(140); await page.mouse.up(); };
  await page.mouse.move(600,400); for (let i=0;i<8;i++){ await page.mouse.wheel(0,-900); await page.waitForTimeout(80); }
  const f = await page.evaluate(()=>{const el=[...document.querySelectorAll('iframe')].find(x=>(x.src||'').includes('atari')||x.title==='Custom embed'); if(!el) return null; const r=el.getBoundingClientRect(); return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)};});
  log.push('iframe='+JSON.stringify(f)); if(!f){ await page.evaluate(t=>document.title=t, JSON.stringify(log)); return; }
  await rcXY(f.x+f.w/2, f.y+40); await page.waitForTimeout(1200);
  const ed = await page.evaluate(()=>{const e=[...document.querySelectorAll('[aria-label="Edit"]')].find(x=>x.getBoundingClientRect().width>0); if(!e) return null; const r=e.getBoundingClientRect(); return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};});
  log.push('edit='+JSON.stringify(ed)); if(!ed){ await page.evaluate(t=>document.title=t, JSON.stringify(log)); return; }
  await rcXY(ed.x, ed.y); await page.waitForTimeout(2500);
  const tab = page.locator('[role=dialog] *').filter({ hasText: /^Embed code$/ }).last();
  if (await tab.count()) { const b=await tab.boundingBox(); if(b){ await rcXY(b.x+b.width/2,b.y+b.height/2); await page.waitForTimeout(1500); log.push('tab'); } }
  const ta = page.locator('[role=dialog] textarea, [role=dialog] [contenteditable="true"]').first();
  if (!(await ta.count())) { log.push('NO textarea'); await page.evaluate(t=>document.title=t, JSON.stringify(log)); return; }
  await ta.click(); await page.waitForTimeout(300); await page.keyboard.press('Control+A'); await page.keyboard.press('Delete'); await page.waitForTimeout(300);
  await page.evaluate(b64 => { const html = new TextDecoder().decode(Uint8Array.from(atob(b64), c => c.charCodeAt(0))); return navigator.clipboard.writeText(html); }, '__B64__');
  await page.waitForTimeout(300); await page.keyboard.press('Control+V'); await page.waitForTimeout(1500);
  for (const label of ['Next','Insert','Save']) {
    const c = await page.evaluate(l => { const d=[...document.querySelectorAll('[role=dialog]')].pop(); if(!d) return null;
      const o=[...d.querySelectorAll('*')].filter(e=>(e.innerText||'').trim()===l).map(e=>{const r=e.getBoundingClientRect(); return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2), w:r.width, h:r.height}}).filter(x=>x.w>10 && x.h>10);
      return o[o.length-1]||null; }, label);
    if (c) { await rcXY(c.x,c.y); await page.waitForTimeout(3200); log.push(label+' clicked'); }
  }
  const res = await page.evaluate(() => { const s=[...document.querySelectorAll('section')]; const i=s.findIndex(x=>x.querySelector('iframe')); const f=s[i]&&s[i].querySelector('iframe'); const r=f?f.getBoundingClientRect():null; const q=s[i]?s[i].getBoundingClientRect():null; return {sec:i, size:r?Math.round(r.width)+'x'+Math.round(r.height):null, dx:r?Math.round((r.x+r.width/2)-(q.x+q.width/2)):null, dlgs:document.querySelectorAll('[role=dialog]').length}; });
  log.push(JSON.stringify(res));
  await page.evaluate(t=>document.title=t.slice(0,700), JSON.stringify(log));
}

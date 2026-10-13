async (page) => {
  // раскрыть все секции сайдбара темы и собрать свотчи с ближайшей подписью
  const rcXY = async (x,y) => { await page.mouse.move(x,y); await page.waitForTimeout(200); await page.mouse.down(); await page.waitForTimeout(130); await page.mouse.up(); };
  for (const row of ['Components','Navigation','Text']) {
    const r = await page.evaluate(lbl=>{const sb=document.querySelector('[aria-label=Sidebar]'); const e=[...sb.querySelectorAll('*')].find(x=>x.children.length===0 && (x.innerText||'').trim()===lbl && x.getBoundingClientRect().width>0); if(!e) return null; const b=e.getBoundingClientRect(); return {x:b.x+b.width/2,y:b.y+b.height/2}});
    if (r) { await rcXY(r.x,r.y); await page.waitForTimeout(1200); }
  }
  const out = await page.evaluate(()=>{const sb=document.querySelector('[aria-label=Sidebar]'); return [...sb.querySelectorAll('[aria-label*="selected color"]')].map(e=>{const b=e.getBoundingClientRect(); let lab=''; let p=e; for(let k=0;k<4&&!lab;k++){ p=p.parentElement; if(!p) break; const t=(p.innerText||'').replace(/\s+/g,' ').trim(); if(t) lab=t.slice(0,40);} return Math.round(b.y)+' '+lab+' => '+e.getAttribute('aria-label').replace(/, selected color /,'=').replace(/,.*$/,'');}).join(' | ');});
  await page.evaluate(t=>document.title=t.slice(0,1800), out);
}

async (page) => {
  await page.setViewportSize({width:1440,height:1400}); await page.waitForTimeout(600);
  const rcXY = async (x,y) => { await page.mouse.move(x,y); await page.waitForTimeout(200); await page.mouse.down(); await page.waitForTimeout(130); await page.mouse.up(); };
  const r = await page.evaluate(()=>{const sb=document.querySelector('[aria-label=Sidebar]'); const e=[...sb.querySelectorAll('*')].find(x=>x.children.length===0 && (x.innerText||'').trim()==='Components' && x.getBoundingClientRect().width>0); if(!e) return null; const b=e.getBoundingClientRect(); return {x:b.x+b.width/2,y:b.y+b.height/2}});
  if (r) { await rcXY(r.x,r.y); await page.waitForTimeout(1500); }
  const out = await page.evaluate(()=>{const sb=document.querySelector('[aria-label=Sidebar]'); return [...sb.querySelectorAll('[aria-label*="selected color"]')].filter(e=>e.getBoundingClientRect().width>0).map(e=>Math.round(e.getBoundingClientRect().y)+':'+e.getAttribute('aria-label').replace(/, selected color /,'=').replace(/,.*$/,'')).join(' | ');});
  await page.evaluate(t=>document.title=t.slice(0,900), out);
}

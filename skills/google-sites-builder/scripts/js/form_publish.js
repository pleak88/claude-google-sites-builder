async (page) => {
  const log=[];
  const rcXY = async (x,y) => { await page.mouse.move(x,y); await page.waitForTimeout(200); await page.mouse.down(); await page.waitForTimeout(130); await page.mouse.up(); };
  const find = (re, root) => page.evaluate(([src,root])=>{const re=new RegExp(src); const base = root ? ([...document.querySelectorAll('[role=dialog]')].pop()||document) : document; const e=[...base.querySelectorAll('[role=button],button')].filter(x=>re.test((x.innerText||'').trim()) && x.getBoundingClientRect().width>0).pop(); if(!e) return null; const b=e.getBoundingClientRect(); return {x:Math.round(b.x+b.width/2), y:Math.round(b.y+b.height/2)};}, [re.source, root?1:0]);
  const p1 = await find(/^Publish$/); log.push('pub1='+JSON.stringify(p1));
  if (p1) { await rcXY(p1.x,p1.y); await page.waitForTimeout(2500); }
  const d = await page.evaluate(()=>{const x=[...document.querySelectorAll('[role=dialog]')].pop(); return x? x.innerText.replace(/\s+/g,' ').slice(0,200):'none'}); log.push('dlg='+d);
  const p2 = await find(/^Publish$/, true); log.push('pub2='+JSON.stringify(p2));
  if (p2) { await rcXY(p2.x,p2.y); await page.waitForTimeout(3500); }
  const d2 = await page.evaluate(()=>{const x=[...document.querySelectorAll('[role=dialog]')].pop(); return x? x.innerText.replace(/\s+/g,' ').slice(0,200):'none'}); log.push('after='+d2);
  await page.keyboard.press('Escape');
  await page.evaluate(t=>document.title=t.slice(0,700), JSON.stringify(log));
}

async (page) => {
  // удалить пустой текстовый тайл (Title) из Cover-хедера: выделить тайл → тулбар Remove
  const log=[];
  const rcXY = async (x,y) => { await page.mouse.move(x,y); await page.waitForTimeout(200); await page.mouse.down(); await page.waitForTimeout(130); await page.mouse.up(); };
  await page.setViewportSize({width:1440,height:1100}); await page.keyboard.press('Escape');
  await page.mouse.move(600,400); for (let i=0;i<8;i++){ await page.mouse.wheel(0,-900); await page.waitForTimeout(80); }
  const tiles = () => page.evaluate(()=>[...document.querySelector('section').querySelectorAll('tile')].map(t=>{const r=t.getBoundingClientRect(); return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2), w:Math.round(r.width), h:Math.round(r.height), ifr:!!t.querySelector('iframe'), txt:(t.innerText||'').trim().slice(0,20)}}));
  let t = await tiles(); log.push('before='+JSON.stringify(t));
  const txt = t.find(o=>!o.ifr);
  if (!txt) { log.push('no text tile'); await page.evaluate(x=>document.title=x, JSON.stringify(log)); return; }
  let btn=null;
  for (let a=0;a<3 && !btn;a++) {
    await rcXY(txt.x, txt.y); await page.waitForTimeout(900);
    btn = await page.evaluate(()=>{const e=[...document.querySelectorAll('[aria-label="Remove"],[aria-label="Delete"]')].find(x=>x.getBoundingClientRect().width>8); if(!e) return null; const r=e.getBoundingClientRect(); return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2)};});
  }
  log.push('remove btn='+JSON.stringify(btn));
  if (btn) { await rcXY(btn.x, btn.y); await page.waitForTimeout(1500); }
  await page.keyboard.press('Escape');
  t = await tiles(); log.push('after='+JSON.stringify(t));
  await page.evaluate(x=>document.title=x.slice(0,600), JSON.stringify(log));
}

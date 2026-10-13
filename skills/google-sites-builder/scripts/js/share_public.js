async page => {
  const f = page.frames().find(x=>x.url().includes('drivesharing/driveshare'));
  if (!f) return 'no share frame';
  const els = await f.evaluate(()=>[...document.querySelectorAll('*')].filter(e=>e.children.length===0 && (e.innerText||'').trim()==='Restricted' && e.getBoundingClientRect().width>0).map(e=>{const r=e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}}));
  if (els.length<2) return 'restricted els '+els.length;
  const fe = await (await f.frameElement()).boundingBox();
  const p = {x: fe.x+els[1].x, y: fe.y+els[1].y};
  await page.mouse.click(p.x, p.y); await page.waitForTimeout(1500);
  const opts = await f.evaluate(()=>[...document.querySelectorAll('[role=option],[role=menuitem],[role=menuitemradio]')].filter(e=>e.getBoundingClientRect().width>0).map(e=>{const r=e.getBoundingClientRect(); return {t:(e.innerText||'').trim().split('\n')[0], x:r.x+r.width/2, y:r.y+r.height/2}}));
  const pub = opts.find(o=>/^Public$/.test(o.t));
  if (!pub) return 'opts: '+opts.map(o=>o.t).join('|');
  await page.mouse.click(fe.x+pub.x, fe.y+pub.y); await page.waitForTimeout(2500);
  const t = await f.evaluate(()=>document.body.innerText.replace(/\s+/g,' ').slice(0,500));
  return t;
}

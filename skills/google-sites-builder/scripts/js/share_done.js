async page => {
  const f = page.frames().find(x=>x.url().includes('drivesharing/driveshare'));
  if (f) { const fe = await (await f.frameElement()).boundingBox(); const d = await f.evaluate(()=>{const e=[...document.querySelectorAll('*')].find(x=>x.children.length===0 && (x.innerText||'').trim()==='Done' && x.getBoundingClientRect().width>0); const r=e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}}); await page.mouse.click(fe.x+d.x, fe.y+d.y); await page.waitForTimeout(2000); }
  return 'done';
}

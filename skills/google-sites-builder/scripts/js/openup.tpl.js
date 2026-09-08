async (page) => {
  const rc = async (loc) => { const b=await loc.boundingBox({timeout:6000}).catch(()=>null); if(!b) return false;
    await page.mouse.move(b.x+b.width/2,b.y+b.height/2); await page.waitForTimeout(180);
    await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); return true; };
  await rc(page.locator('[aria-label="__ROW__"]').first());
  await page.waitForTimeout(1800);
  // подменю: Upload / Select
  const up = await page.evaluate(() => {
    const el=[...document.querySelectorAll('*')].find(e=>(e.innerText||'').trim()==='Upload' && e.children.length===0 && e.getBoundingClientRect().width>0);
    if(!el) return null; const r=el.getBoundingClientRect();
    return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2)};
  });
  if (!up) { console.log('NO UPLOAD ITEM'); return; }
  await page.mouse.move(up.x,up.y); await page.waitForTimeout(180);
  await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up();
  await page.waitForTimeout(2200);
}

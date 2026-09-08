async (page) => {
  const rc = async (loc) => { const b=await loc.boundingBox({timeout:8000}).catch(()=>null); if(!b) return false;
    await page.mouse.move(b.x+b.width/2,b.y+b.height/2); await page.waitForTimeout(180);
    await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); return true; };
  const dlg = page.locator('[role=dialog]').last();
  const cands = await page.evaluate(() => {
    const d=[...document.querySelectorAll('[role=dialog]')].pop();
    return [...d.querySelectorAll('*')].filter(e=>(e.innerText||'').trim()==='Create theme')
      .map(e=>{const r=e.getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:r.width,h:r.height}})
      .filter(c=>c.w>10&&c.h>10);
  });
  const c = cands[cands.length-1];
  await page.mouse.move(c.x,c.y); await page.waitForTimeout(180);
  await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up();
  await page.waitForTimeout(6000);
}

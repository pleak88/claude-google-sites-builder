async (page) => {
  const rc = async (loc) => { const b=await loc.boundingBox({timeout:6000}).catch(()=>null); if(!b) return false;
    await page.mouse.move(b.x+b.width/2,b.y+b.height/2); await page.waitForTimeout(180);
    await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); return true; };
  await rc(page.locator('[role=tab]').filter({ hasText: /^Pages$/ }).first());
  await page.waitForTimeout(2200);
  const names = __NAMES__;
  const map = {};
  for (const n of names) {
    const rows = await page.evaluate(nm => {
      const out=[];
      document.querySelectorAll('input[aria-label="Page title"]').forEach(i=>{
        if (i.value === nm) { const r=i.getBoundingClientRect(); out.push({x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2)}); }
      });
      return out;
    }, n);
    if (!rows.length) { map[n]='NOT FOUND'; continue; }
    await page.mouse.move(rows[0].x, rows[0].y); await page.waitForTimeout(200);
    await page.mouse.down(); await page.waitForTimeout(130); await page.mouse.up();
    await page.waitForTimeout(3000);
    map[n] = (page.url().match(/\/p\/([^/]+)\//)||[])[1] || 'no-id';
  }
  await page.evaluate(t=>document.title=t, JSON.stringify(map));
}

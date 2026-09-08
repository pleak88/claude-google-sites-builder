async (page) => {
  const rc = async (loc) => { const b=await loc.boundingBox({timeout:6000}).catch(()=>null); if(!b) return false;
    await page.mouse.move(b.x+b.width/2,b.y+b.height/2); await page.waitForTimeout(180);
    await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); return true; };
  await rc(page.locator('[aria-label="Settings"]').first());
  await page.waitForTimeout(2500);
  const bi = page.locator('[role=dialog] *').filter({ hasText: /^Brand images$/ }).last();
  if (await bi.count()) { await rc(bi); await page.waitForTimeout(2000); }
  const d = await page.evaluate(()=>{const x=[...document.querySelectorAll('[role=dialog]')].pop(); return x?x.innerText:'none'});
  await page.evaluate(t=>document.title=t.slice(0,800), d);
}

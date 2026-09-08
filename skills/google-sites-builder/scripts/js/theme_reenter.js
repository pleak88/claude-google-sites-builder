async (page) => {
  const rc = async (loc) => { const b=await loc.boundingBox({timeout:6000}).catch(()=>null); if(!b) return false;
    await page.mouse.move(b.x+b.width/2,b.y+b.height/2); await page.waitForTimeout(180);
    await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); return true; };
  // сначала вкладка Themes (идемпотентно), иначе kebab не найти
  const tabT = page.locator('[role=tab]').filter({ hasText: /^Themes$/ }).first();
  if (await tabT.count()) { await rc(tabT); await page.waitForTimeout(1800); }
  const already = await page.evaluate(()=>/Colors[\s\S]*Spacing/.test((document.querySelector('[aria-label=Sidebar]')||{innerText:''}).innerText));
  if (already) { const col = page.locator('[aria-label="Colors"]').first(); if (await col.count()) { await rc(col); await page.waitForTimeout(1600); } return; }
  await page.mouse.move(1290,200); await page.waitForTimeout(900);
  await page.mouse.move(1400,181); await page.waitForTimeout(200);
  await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up();
  await page.waitForTimeout(1800);
  const ed = page.locator('[role=menuitem]').filter({ hasText: /^Edit$/ }).first();
  if (await ed.count()) { await rc(ed); await page.waitForTimeout(3000); }
  const col = page.locator('[aria-label="Colors"]').first();
  if (await col.count()) { await rc(col); await page.waitForTimeout(1800); }
}

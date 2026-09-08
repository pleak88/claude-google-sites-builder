async (page) => {
  const rc = async (loc) => { const b=await loc.boundingBox({timeout:8000}).catch(()=>null); if(!b) return false;
    await page.mouse.move(b.x+b.width/2,b.y+b.height/2); await page.waitForTimeout(180);
    await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); return true; };
  const NAME = '__NAME__';
  let dlg = page.locator('[role="dialog"]').filter({ hasText: 'New page' }).first();
  if (!(await dlg.count())) {
    await rc(page.locator('[aria-label="New page"]').first());
    await page.waitForTimeout(2500);
    dlg = page.locator('[role="dialog"]').filter({ hasText: 'New page' }).first();
  }
  const inp = dlg.locator('input:visible, textarea:visible').first();
  await inp.click({timeout:8000}); await page.waitForTimeout(300);
  await inp.fill(NAME); await page.waitForTimeout(700);
  const done = dlg.locator('[role="button"], button').filter({ hasText: /^Done$/ }).first();
  if (await done.count()) await rc(done); else await page.keyboard.press('Enter');
  await page.waitForTimeout(4500);
}

async (page) => {
  const rc = async (loc) => { const b=await loc.boundingBox({timeout:8000}).catch(()=>null); if(!b) return false;
    await page.mouse.move(b.x+b.width/2,b.y+b.height/2); await page.waitForTimeout(180);
    await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); return true; };
  const dlg = page.locator('[role=dialog]').last();
  await rc(dlg.locator('*').filter({ hasText: /^Custom colors$/ }).last());
  await page.waitForTimeout(2000);
}

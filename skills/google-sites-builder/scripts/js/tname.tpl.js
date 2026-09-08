async (page) => {
  const rc = async (loc) => { const b=await loc.boundingBox({timeout:8000}).catch(()=>null); if(!b) return false;
    await page.mouse.move(b.x+b.width/2,b.y+b.height/2); await page.waitForTimeout(180);
    await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); return true; };
  const dlg = page.locator('[role=dialog]').last();
  const inp = dlg.locator('input:visible, textarea:visible').first();
  await inp.click(); await page.keyboard.press('Control+A'); await page.keyboard.press('Delete');
  await page.keyboard.type(__THEME_NAME__, {delay:30}); await page.waitForTimeout(600);
  const nxt = dlg.locator('[role=button],button').filter({ hasText: /^Next$/ }).first();
  await rc(nxt); await page.waitForTimeout(2600);
}

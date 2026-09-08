async (page) => {
  const log=[];
  const rc = async (loc) => { const b=await loc.boundingBox({timeout:6000}).catch(()=>null); if(!b) return false;
    await page.mouse.move(b.x+b.width/2,b.y+b.height/2); await page.waitForTimeout(180);
    await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); return true; };
  await rc(page.locator('[role=button],button').filter({ hasText: /^Publish$/ }).first());
  await page.waitForTimeout(4500);
  // на диалоге "Review changes and publish" кнопка Publish в правом верхнем углу
  await page.mouse.move(1384,32); await page.waitForTimeout(220);
  await page.mouse.down(); await page.waitForTimeout(140); await page.mouse.up();
  await page.waitForTimeout(9000);
  const left = await page.evaluate(()=>document.querySelectorAll('[role=dialog]').length);
  log.push('dialogs_left='+left);
  await page.evaluate(t=>document.title=t.slice(0,300), JSON.stringify(log));
}

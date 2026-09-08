async (page) => {
  const log=[];
  const tiles = page.locator('section').first().locator('[aria-label="Text"]');
  const n = await tiles.count();
  log.push('tiles='+n);
  if (n) {
    await tiles.nth(0).click(); await page.waitForTimeout(900);
    await page.keyboard.press('Control+A'); await page.keyboard.press('Delete');
    await page.waitForTimeout(1500);
    log.push('cleared');
  }
  const g = await page.evaluate(()=>{const s=document.querySelector('section'); return {h:Math.round(s.getBoundingClientRect().height), txt:(s.innerText||'').replace(/\s+/g,' ').slice(0,80)}});
  log.push(JSON.stringify(g));
  await page.evaluate(t=>document.title=t.slice(0,400), JSON.stringify(log));
}

async (page) => {
  const out={};
  for (const st of ['Style 1','Style 2','Style 3']) {
    const tab = page.locator(`[aria-label="${st}"]`).first(); if (!(await tab.count())) { out[st]='no tab'; continue; }
    await tab.click({force:true}); await page.waitForTimeout(1200);
    if (!(await page.locator('[aria-label^="Heading, selected color"]').first().isVisible().catch(()=>false))) {
      const mo = page.locator('[role=button],button,a,span').filter({ hasText: /^More options$/ }).first(); if (await mo.count()) { await mo.click({force:true}); await page.waitForTimeout(1000); } }
    out[st] = await page.evaluate(()=>[...document.querySelectorAll('[aria-label*="selected color"]')].filter(e=>e.getBoundingClientRect().width>0).map(e=>e.getAttribute('aria-label').replace(/, selected color /,'=').replace(/,.*$/,'')).join(' '));
  }
  await page.evaluate(t=>document.title=t.slice(0,900), JSON.stringify(out));
}

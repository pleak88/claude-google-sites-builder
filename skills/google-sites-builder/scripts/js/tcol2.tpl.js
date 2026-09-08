async (page) => {
  const dlg = page.locator('[role=dialog]').last();
  const set = async (label, hex) => {
    const i = dlg.locator(`input[aria-label="${label}"]`).first();
    await i.click(); await page.waitForTimeout(200);
    await i.fill(''); await page.waitForTimeout(150);
    await i.fill(hex); await page.waitForTimeout(300);
    await page.keyboard.press('Tab'); await page.waitForTimeout(900);
  };
  await set('Color 1', __C1__);
  await set('Color 2', __C2__);
  await set('Color 3', __C3__);
  await page.waitForTimeout(800);
}

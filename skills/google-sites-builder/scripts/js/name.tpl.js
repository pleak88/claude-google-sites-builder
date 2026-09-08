async (page) => {
  const inp = page.locator('input[aria-label="Site name"]').first();
  await inp.click(); await page.waitForTimeout(300);
  await page.keyboard.press('Control+A'); await page.keyboard.press('Delete');
  await page.keyboard.type(__SITE_NAME__, {delay:35});
  await page.waitForTimeout(1200);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(2500);
}

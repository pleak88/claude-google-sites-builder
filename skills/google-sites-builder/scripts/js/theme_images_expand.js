async (page) => {
  await page.mouse.move(1408, 428); await page.waitForTimeout(200);
  await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up();
  await page.waitForTimeout(2200);
}

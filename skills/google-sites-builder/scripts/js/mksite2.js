async (page) => {
  // плитка Blank site: карточка ~172px высотой над подписью
  await page.mouse.move(235, 200); await page.waitForTimeout(200);
  await page.mouse.down(); await page.waitForTimeout(130); await page.mouse.up();
  await page.waitForTimeout(11000);
}

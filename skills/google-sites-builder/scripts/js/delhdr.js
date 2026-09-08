async (page) => {
__COMMON__
  // удалить хедер внутренней страницы (главная хедер сохраняет — там Cover с модалкой)
  await page.mouse.move(500,140); await page.waitForTimeout(1000);
  const del = page.locator('[aria-label="Delete header"]').first();
  if (await del.count()) { await rc(del); await page.waitForTimeout(2500); await report(['header deleted']); }
  else await report(['no delete-header btn (already deleted?)']);
}

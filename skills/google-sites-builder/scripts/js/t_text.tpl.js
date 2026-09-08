async (page) => {
__COMMON__
  const BLOCKS = __BLOCKS__;
  const ST = __STYLE__;
  const log = [];
  await toBottom();
  const before = await page.evaluate(()=>document.querySelectorAll('section').length);
  if (!(await insertByLabel('Text box'))) { log.push('no Text box control'); }
  const after = await page.evaluate(()=>document.querySelectorAll('section').length);
  log.push('secs '+before+'→'+after);
  const tiles = page.locator('[aria-label="Text"][contenteditable="true"]');
  const n = await tiles.count();
  if (!n) log.push('NO TILE');
  else { await fillTile(tiles.nth(n-1), BLOCKS); log.push('filled'); }
  log.push('style:'+await setStyleLast(ST));
  await page.evaluate(t=>document.title=t.slice(0,400), JSON.stringify(log));
}

async (page) => {
  const dlg = page.locator('[role=dialog]').last();
  const set = async (label, hex) => {
    const i = dlg.locator(`input[aria-label="${label}"]`).first();
    await i.click(); await page.waitForTimeout(200);
    await i.fill(''); await page.waitForTimeout(150);
    await i.fill(hex); await page.waitForTimeout(300);
    await page.keyboard.press('Tab'); await page.waitForTimeout(900);
  };
  // Seed-цвета мастера (проверено 13.10.2026): Color 3 → кнопки (Filled/Outlined/Text button), Active dot, «Color» компонентов = акцент/ссылки;
  // Color 1/2 → базовые фон/заголовки пресета. Задавать: C1 = тёмный фон бренда, C2 = акцент, C3 = акцент. После создания темы всё равно
  // theme_styles_dump.js + theme_swatches_dump.js; theme_recolor.tpl.js — только если что-то осталось чужим.
  const want = {'Color 1': __C1__, 'Color 2': __C2__, 'Color 3': __C3__};
  for (let attempt=0; attempt<2; attempt++) {
    for (const [k,v] of Object.entries(want)) { const cur = await dlg.locator(`input[aria-label="${k}"]`).first().inputValue().catch(()=>''); if (cur.toLowerCase() !== v.toLowerCase()) await set(k, v); }
    const got = {}; for (const k of Object.keys(want)) got[k] = await dlg.locator(`input[aria-label="${k}"]`).first().inputValue().catch(()=>'');
    if (Object.entries(want).every(([k,v]) => (got[k]||'').toLowerCase() === v.toLowerCase())) { await page.evaluate(t=>document.title=t, 'seed colors ok '+JSON.stringify(got)); break; }
    await page.evaluate(t=>document.title=t, 'seed colors MISMATCH '+JSON.stringify(got));
  }
  await page.waitForTimeout(400);
}

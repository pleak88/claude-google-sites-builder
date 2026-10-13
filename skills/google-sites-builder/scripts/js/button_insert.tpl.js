// button_insert.tpl.js — нативная кнопка (LABEL, FORM_URL). ⚠️ встаёт НОВОЙ секцией над контентом (13.10.2026) → затем drag_src.tpl.js
// SRC=0 DST=1 POS="beforeLast" (кнопка перед дисклеймером) или POS="end". Sites сам ставит target=_blank кнопке — это не embed-ссылка, допустимо.
async (page) => {
  const log=[]; const rcB = async (b) => { await page.mouse.move(b.x+b.width/2,b.y+b.height/2); await page.waitForTimeout(180); await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); };
  const before = await page.evaluate(()=>document.querySelectorAll('section').length);
  const tile = page.locator('section').first().locator('[aria-label="Text"]').first();
  const tb = await tile.boundingBox(); await rcB({x:tb.x+tb.width-20,y:tb.y+tb.height-20,width:2,height:2}); await page.waitForTimeout(800);
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  await rcB(await page.locator('[role=tab]').filter({hasText:/^Insert$/}).first().boundingBox()); await page.waitForTimeout(1200);
  const b = page.locator('[aria-label="Button"]').first(); await b.scrollIntoViewIfNeeded(); await rcB(await b.boundingBox()); await page.waitForTimeout(2500);
  const dlg = page.locator('[role=dialog]:visible').last();
  const ins = dlg.locator('input:visible'); log.push('inputs='+await ins.count());
  await ins.nth(0).fill('__LABEL__'); await page.waitForTimeout(400);
  await ins.nth(1).fill('__FORM_URL__'); await page.waitForTimeout(800);
  const ok = dlg.locator('[role=button],button').filter({hasText:/^Insert$/}).last(); await rcB(await ok.boundingBox()); await page.waitForTimeout(3000);
  log.push(await page.evaluate(()=>[...document.querySelectorAll('section')].map((s,i)=>i+':'+(s.innerText||'').includes('__LABEL__')+':h'+Math.round(s.getBoundingClientRect().height)).join(' ')));
  log.push('before='+before);
  await page.evaluate(t=>document.title=t.slice(0,500), JSON.stringify(log));
}

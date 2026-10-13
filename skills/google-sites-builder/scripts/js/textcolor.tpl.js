async (page) => {
  // Покрасить строку текста цветом из палитры тулбара (Text color): SEC — индекс секции, TEXT — регэксп строки,
  // HEX — hex из ряда THEME/стандартных (lowercase, напр. "#ff4d6a"). Цвет Subheading из темы на image-фоне НЕ держится —
  // этот путь единственный надёжный (betfans 13.10.2026). Проверять по внутреннему span, не по H3.
  const SEC = __SEC__, TEXT = new RegExp('__TEXT__'), HEX = '__HEX__'.toLowerCase(); const log=[];
  await page.setViewportSize({width:1440,height:1100}); await page.keyboard.press('Escape');
  const find = () => page.evaluate(([sec,src])=>{const re=new RegExp(src); const s=document.querySelectorAll('section')[sec]; const e=[...s.querySelectorAll('h1,h2,h3,p,div,span')].find(x=>x.children.length<=1 && re.test((x.innerText||'')) && x.getBoundingClientRect().width>0 && (x.innerText||'').length<400); if(!e) return null; e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); const sp=e.querySelector('span')||e; return {x:r.x+40, y:r.y+r.height/2, color:getComputedStyle(sp).color};}, [SEC, TEXT.source]);
  let p = await find(); if (!p) { log.push('text not found'); await page.evaluate(t=>document.title=t, JSON.stringify(log)); return; }
  await page.waitForTimeout(600); p = await find(); log.push('before '+p.color);
  await page.mouse.click(p.x, p.y, {clickCount:3}); await page.waitForTimeout(700);
  let sel = await page.evaluate(()=>String(window.getSelection()).slice(0,60));
  if (!TEXT.test(sel)) { await page.mouse.click(p.x, p.y); await page.waitForTimeout(400); await page.keyboard.press('Home'); await page.keyboard.down('Shift'); await page.keyboard.press('End'); await page.keyboard.up('Shift'); sel = await page.evaluate(()=>String(window.getSelection()).slice(0,60)); }
  log.push('sel='+sel);
  const tc = page.locator('[aria-label="Text color"], [aria-label="Text colour"]').first();
  if (!(await tc.count())) { log.push('no Text color button'); await page.evaluate(t=>document.title=t, JSON.stringify(log)); return; }
  await tc.click({force:true}); await page.waitForTimeout(1200);
  const sw = page.locator(`[aria-label="${HEX}"]`).first(); log.push('swatch='+await sw.count());
  if (await sw.count()) { await sw.click({force:true}); await page.waitForTimeout(1000); }
  else {
    // нет в палитре → Add custom color → Hex
    const add = page.locator('[aria-label="Add custom color"]').first();
    if (await add.count()) { await add.click({force:true}); await page.waitForTimeout(1000); const hx = page.locator('input[aria-label="Hex"]').last();
      if (await hx.count()) { await hx.fill(''); await hx.fill(HEX.toUpperCase()); await page.keyboard.press('Tab'); await page.waitForTimeout(500); const ok = page.locator('[role=button],button').filter({hasText:/^(OK|Save)$/}).last(); if (await ok.count()) await ok.click({force:true}); await page.waitForTimeout(1000); log.push('custom hex'); } }
    else { log.push('no swatch, no custom'); await page.keyboard.press('Escape'); }
  }
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  p = await find(); log.push('after '+(p&&p.color));
  await page.evaluate(t=>document.title=t.slice(0,600), JSON.stringify(log));
}

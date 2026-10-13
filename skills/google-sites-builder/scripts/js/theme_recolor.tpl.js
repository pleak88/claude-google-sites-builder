async (page) => {
  // Перекрасить ВСЕ свотчи темы цвета FROM в TO (кнопки, Active dot, «Color» компонентов наследуют seed-цвет мастера —
  // без этого шага на тёмном бренде вылезают чужие цвета ссылок/кнопок; betfans 13.10.2026). Запускать после theme_reenter.js.
  const FROM = '__FROM__'.toLowerCase(), TO = '__TO__';
  const rc = async (loc) => { const b=await loc.boundingBox({timeout:6000}).catch(()=>null); if(!b) return false; await page.mouse.move(b.x+b.width/2,b.y+b.height/2); await page.waitForTimeout(180); await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); return true; };
  const rcXY = async (x,y) => { await page.mouse.move(x,y); await page.waitForTimeout(200); await page.mouse.down(); await page.waitForTimeout(130); await page.mouse.up(); };
  const log=[];
  await page.setViewportSize({width:1440,height:1400}); await page.waitForTimeout(600);   // панели сайдбара при 720px имеют ширину 0
  for (const row of ['Navigation','Components']) {
    const r = await page.evaluate(lbl=>{const sb=document.querySelector('[aria-label=Sidebar]'); const e=[...sb.querySelectorAll('*')].find(x=>x.children.length===0 && (x.innerText||'').trim()===lbl && x.getBoundingClientRect().width>0); if(!e) return null; const b=e.getBoundingClientRect(); return {x:b.x+b.width/2,y:b.y+b.height/2}}, row);
    if (r) { await rcXY(r.x,r.y); await page.waitForTimeout(1200); }
  }
  for (let k=0;k<10;k++) {
    const sw = page.locator(`[aria-label*="selected color ${FROM}"]:visible`).first();
    if (!(await sw.count())) break;
    const lab = await sw.getAttribute('aria-label');
    await sw.click({force:true}); await page.waitForTimeout(1500);
    const add = await page.evaluate(()=>{const o=[]; document.querySelectorAll('[aria-label],[role=button],[role=menuitem]').forEach(e=>{const al=(e.getAttribute('aria-label')||'')+' '+(e.innerText||''); const r=e.getBoundingClientRect(); if(/custom color/i.test(al)&&r.width>8&&r.height>8) o.push({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});}); return o[0]||null});
    if (add) { await rcXY(add.x, add.y); await page.waitForTimeout(1600); }
    const hx = page.locator('input[aria-label="Hex"]').last();
    if (!(await hx.count())) { log.push('no hex: '+lab.slice(0,20)); await page.keyboard.press('Escape'); break; }
    await hx.click(); await hx.fill(''); await hx.fill(TO); await page.waitForTimeout(300); await page.keyboard.press('Tab'); await page.waitForTimeout(800);
    const save = page.locator('[role=button],button').filter({ hasText: /^Save$/ }).last(); if (await save.count()) await rc(save); else await page.keyboard.press('Enter'); await page.waitForTimeout(2000);
    log.push('set: '+lab.replace(/, selected color.*/,''));
  }
  log.push('left='+await page.locator(`[aria-label*="selected color ${FROM}"]:visible`).count());
  await page.evaluate(t=>document.title=t.slice(0,700), JSON.stringify(log));
}

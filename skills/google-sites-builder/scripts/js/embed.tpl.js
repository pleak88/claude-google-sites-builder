async (page) => {
  const B64 = '__B64__';
  const rc = async (loc) => { const b=await loc.boundingBox({timeout:6000}).catch(()=>null); if(!b) return false;
    await page.mouse.move(b.x+b.width/2,b.y+b.height/2); await page.waitForTimeout(180);
    await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); return true; };
  const log = [];
  await page.context().grantPermissions(['clipboard-read','clipboard-write'], { origin: 'https://sites.google.com' });

  // фокус на первой контентной секции, чтобы embed встал сразу под хедером
  const box = await page.evaluate(() => {
    const s=[...document.querySelectorAll('section')];
    if (s.length < 2) return null;
    const r=s[1].getBoundingClientRect();
    return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height-30), bottom:Math.round(r.y+r.height)};
  });
  if (box) {
    await page.mouse.move(600,500);
    for (let i=0;i<25;i++){
      const b = await page.evaluate(()=>{const s=[...document.querySelectorAll('section')]; const r=s[1].getBoundingClientRect(); return Math.round(r.y+r.height)});
      if (b>200 && b<760) break;
      await page.mouse.wheel(0, b>760 ? 450 : -450); await page.waitForTimeout(350);
    }
    const b2 = await page.evaluate(()=>{const s=[...document.querySelectorAll('section')]; const r=s[1].getBoundingClientRect(); return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height-30)}});
    await page.mouse.move(b2.x, b2.y); await page.waitForTimeout(200);
    await page.mouse.down(); await page.waitForTimeout(130); await page.mouse.up();
    await page.waitForTimeout(900);
  }

  // Insert → Embed
  await rc(page.locator('[role=tab]').filter({ hasText: /^Insert$/ }).first());
  await page.waitForTimeout(1400);
  await page.mouse.move(1300,400); await page.waitForTimeout(150);
  for (let i=0;i<8;i++){ await page.mouse.wheel(0,-400); await page.waitForTimeout(110); }
  await rc(page.locator('[aria-label="Embed"]').first());
  await page.waitForTimeout(3000);

  // вкладка Embed code
  const tab = page.locator('[role=dialog] *').filter({ hasText: /^Embed code$/ }).last();
  if (await tab.count()) { await rc(tab); await page.waitForTimeout(1500); log.push('embed-code tab'); }
  else log.push('no embed-code tab');

  // вставить HTML из буфера
  const ta = page.locator('[role=dialog] textarea, [role=dialog] [contenteditable="true"]').first();
  if (!(await ta.count())) { log.push('NO textarea'); await page.evaluate(t=>document.title=t, JSON.stringify(log)); return; }
  await ta.click(); await page.waitForTimeout(400);
  await page.evaluate(b64 => {
    const html = new TextDecoder().decode(Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
    return navigator.clipboard.writeText(html);
  }, B64);
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+V');
  await page.waitForTimeout(1500);

  // Next → Insert
  for (const label of ['Next','Insert']) {
    const c = await page.evaluate(l => {
      const d=[...document.querySelectorAll('[role=dialog]')].pop(); if(!d) return null;
      const o=[...d.querySelectorAll('*')].filter(e=>(e.innerText||'').trim()===l)
        .map(e=>{const r=e.getBoundingClientRect(); return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2), w:r.width, h:r.height}})
        .filter(x=>x.w>10 && x.h>10);
      return o[o.length-1]||null;
    }, label);
    if (c) {
      await page.mouse.move(c.x,c.y); await page.waitForTimeout(200);
      await page.mouse.down(); await page.waitForTimeout(140); await page.mouse.up();
      await page.waitForTimeout(3200);
      log.push(label+' clicked');
    } else log.push('no '+label);
  }

  const res = await page.evaluate(() => ({
    secs: document.querySelectorAll('section').length,
    ifr: [...document.querySelectorAll('iframe')].map(f=>{const r=f.getBoundingClientRect(); return Math.round(r.width)+'x'+Math.round(r.height)}),
  }));
  log.push(JSON.stringify(res));
  await page.evaluate(t=>document.title=t.slice(0,700), JSON.stringify(log));
}

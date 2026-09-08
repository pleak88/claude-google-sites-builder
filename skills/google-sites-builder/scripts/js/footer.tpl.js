async (page) => {
  const rc = async (loc) => { const b=await loc.boundingBox({timeout:6000}).catch(()=>null); if(!b) return false;
    await page.mouse.move(b.x+b.width/2,b.y+b.height/2); await page.waitForTimeout(180);
    await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); return true; };
  const log = [];
  await page.context().grantPermissions(['clipboard-read','clipboard-write'], { origin: 'https://sites.google.com' });
  const paste = async (text) => {
    await page.evaluate(t => navigator.clipboard.writeText(t), text);
    await page.waitForTimeout(140);
    await page.keyboard.press('Control+Shift+V');
    await page.waitForTimeout(280);
  };

  await page.setViewportSize({width:1440, height:1200});
  await page.waitForTimeout(1200);
  await page.mouse.move(600,600);
  for (let i=0;i<16;i++){ await page.mouse.wheel(0,900); await page.waitForTimeout(120); }
  await page.waitForTimeout(700);

  // ── Add Footer: только по самой пилюле (w≈124,h≈40)
  const pill = await page.evaluate(() => {
    const c=[...document.querySelectorAll('*')].filter(e=>(e.innerText||'').trim()==='Add Footer')
      .map(e=>{const r=e.getBoundingClientRect(); return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2), w:Math.round(r.width), h:Math.round(r.height)}})
      .filter(o=>o.w>60 && o.w<200 && o.h>20 && o.h<60);
    return c[0]||null;
  });
  if (pill) {
    await page.mouse.move(pill.x, pill.y); await page.waitForTimeout(220);
    await page.mouse.down(); await page.waitForTimeout(140); await page.mouse.up();
    await page.waitForTimeout(3500);
    log.push('footer added @'+pill.x+','+pill.y);
  } else log.push('NO Add Footer pill');

  // ── найти текстовый тайл футера (последняя секция)
  const fill = async () => {
    const tiles = page.locator('[aria-label="Text"][contenteditable="true"]');
    const n = await tiles.count();
    if (!n) { log.push('no footer text tile'); return false; }
    const tile = tiles.nth(n-1);
    await tile.click({timeout:8000}); await page.waitForTimeout(800);
    await page.keyboard.press('Control+A'); await page.keyboard.press('Delete'); await page.waitForTimeout(400);
    await paste(__FOOTER_TEXT__);
    await page.keyboard.press('Control+Alt+0');
    await page.waitForTimeout(500);
    return true;
  };
  if (!(await fill())) { await page.evaluate(t=>document.title=t, JSON.stringify(log)); return; }

  // ── ссылки: каждая на новой строке, вставка БЕЗ выделения
  const PAGES = __FOOTER_PAGES__;
  let first = true;
  for (const nm of PAGES) {
    // каретка: в конец последней ссылки (Control+End в футере не работает — двойной real-click по её правому краю)
    const last = await page.evaluate(() => {
      const s=[...document.querySelectorAll('section')]; const f=s[s.length-1];
      const links=[...f.querySelectorAll('a,[role=link]')]; const l=links[links.length-1];
      if (!l) return null; const r=l.getBoundingClientRect(); return {x:Math.round(r.x+r.width-3), y:Math.round(r.y+r.height/2)};
    });
    if (first || !last) {
      const tiles = page.locator('[aria-label="Text"][contenteditable="true"]');
      const tile = tiles.nth((await tiles.count())-1);
      await tile.click(); await page.waitForTimeout(600);
      await page.keyboard.press('Control+End'); await page.waitForTimeout(250);
      await page.keyboard.press('Enter'); await page.waitForTimeout(350);
    } else {
      await page.mouse.move(last.x, last.y); await page.waitForTimeout(150);
      await page.mouse.dblclick(last.x, last.y); await page.waitForTimeout(400);
      await page.keyboard.press('End'); await page.waitForTimeout(200);
      await page.keyboard.type(' · ', {delay:40}); await page.waitForTimeout(300);
    }
    first = false;

    const ins = page.locator('[aria-label="Insert link"]').first();
    if (!(await ins.count())) { log.push('no insert-link btn for '+nm); continue; }
    await rc(ins); await page.waitForTimeout(1900);
    const lf = page.locator('input[aria-label="Link"]').first();
    if (!(await lf.count())) { log.push('no link field for '+nm); await page.keyboard.press('Escape'); continue; }
    await lf.click(); await page.keyboard.type(nm.slice(0,7), {delay:70}); await page.waitForTimeout(1800);
    const opt = page.locator('[role="option"]').filter({ hasText: nm }).first();
    if (await opt.count()) {
      await rc(opt); await page.waitForTimeout(900);
      const apply = page.locator('[role=button],button').filter({ hasText: /^Apply$/ }).first();
      if (await apply.count()) await rc(apply);
      await page.waitForTimeout(1800);
      log.push('link '+nm+' ok');
    } else { log.push('no option '+nm); await page.keyboard.press('Escape'); }
  }

  // строка ссылок чуть крупнее копирайта: стиль Subheading на этой строке
  const lastL = await page.evaluate(() => {
    const s=[...document.querySelectorAll('section')]; const f=s[s.length-1];
    const links=[...f.querySelectorAll('a,[role=link]')]; const l=links[links.length-1];
    if (!l) return null; const r=l.getBoundingClientRect(); return {x:Math.round(r.x+r.width-3), y:Math.round(r.y+r.height/2)};
  });
  if (lastL) { await page.mouse.dblclick(lastL.x, lastL.y); await page.waitForTimeout(400);
    await page.keyboard.press('End'); await page.keyboard.press('Control+Alt+3'); await page.waitForTimeout(600); log.push('links line = Subheading'); }

  const res = await page.evaluate(() => {
    const s=[...document.querySelectorAll('section')]; const f=s[s.length-1];
    return {txt:(f.innerText||'').replace(/\s+/g,' ').slice(0,220), links:[...f.querySelectorAll('a,[role=link]')].map(a=>(a.innerText||'').trim())};
  });
  log.push(JSON.stringify(res));
  await page.evaluate(t=>document.title=t.slice(0,900), JSON.stringify(log));
}

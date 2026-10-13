async (page) => {
  // Мастер темы, шаг «Select fonts»: выставить FONT в строках Titles and headings / Body text.
  // В списке аккаунта может не быть Inter/Poppins/Lato → More fonts → поиск → выбрать → Done (шрифт появляется в дропдауне).
  // Выбор в дропдауне ТОЛЬКО клавиатурой: ArrowDown×(index+1) → Enter; клики по пунктам при прокрутке попадают мимо (13.10.2026).
  const FONT = '__FONT__'; const ROWS = __ROWS__; // напр. ["Titles and headings","Body text"]
  const log=[];
  const rcXY = async (x,y) => { await page.mouse.move(x,y); await page.waitForTimeout(200); await page.mouse.down(); await page.waitForTimeout(130); await page.mouse.up(); };
  const rowVal = (lbl) => page.evaluate(lbl => {
    const d=[...document.querySelectorAll('[role=dialog]')].pop(); if(!d) return null;
    const lab=[...d.querySelectorAll('*')].find(x=>x.children.length===0 && (x.innerText||'').trim()===lbl && x.getBoundingClientRect().width>0);
    if(!lab) return null; const lb=lab.getBoundingClientRect();
    const cand=[...d.querySelectorAll('*')].filter(x=>x.children.length===0 && x!==lab && x.getBoundingClientRect().width>0 && /^[A-Z][A-Za-z ]{2,30}$/.test((x.innerText||'').trim()) && !/^(Cancel|Create theme|Select fonts|Titles and headings|Body text|Create a theme|More fonts)$/.test((x.innerText||'').trim()))
      .map(x=>({x, b:x.getBoundingClientRect()})).filter(o=>o.b.y>lb.y+8 && o.b.y<lb.y+90 && Math.abs(o.b.x-lb.x)<200).sort((a,b)=>a.b.y-b.b.y);
    const c=cand[0]; if(!c) return null; return {x:Math.round(c.b.x+c.b.width/2), y:Math.round(c.b.y+c.b.height/2), cur:c.x.innerText.trim()};
  }, lbl);
  const menuItems = () => page.evaluate(()=>{const m=[...document.querySelectorAll('[role=menu]')].find(e=>e.getBoundingClientRect().width>0 && e.querySelectorAll('[role=menuitem]').length>15); return m? [...m.querySelectorAll('[role=menuitem]')].map(e=>(e.textContent||'').trim()) : null;});
  for (const row of ROWS) {
    let r = await rowVal(row); if (!r) { log.push('no row '+row); continue; }
    if (r.cur === FONT) { log.push(row+' already'); continue; }
    await rcXY(r.x, r.y); await page.waitForTimeout(1800);
    let items = await menuItems(); if (!items) { log.push('no menu '+row); await page.keyboard.press('Escape'); continue; }
    if (!items.includes(FONT)) {
      // More fonts → диалог Google Fonts
      const mf = await page.evaluate(()=>{const m=[...document.querySelectorAll('[role=menu]')].find(e=>e.getBoundingClientRect().width>0 && e.querySelectorAll('[role=menuitem]').length>15); const e=[...m.querySelectorAll('[role=menuitem]')].find(e=>/More fonts/.test(e.textContent)); const b=e.getBoundingClientRect(); return {x:Math.round(b.x+b.width/2), y:Math.round(b.y+b.height/2)};});
      await rcXY(mf.x, mf.y); await page.waitForTimeout(3000);
      const s = page.locator('[role=dialog] input[aria-label="Search"]').last(); await s.click(); await s.fill(FONT); await page.waitForTimeout(2500);
      const it = await page.evaluate(f=>{const d=[...document.querySelectorAll('[role=dialog]')].pop(); const e=[...d.querySelectorAll('*')].find(x=>x.children.length===0 && (x.textContent||'').trim()===f && x.getBoundingClientRect().width>0 && x.getBoundingClientRect().y>0 && x.getBoundingClientRect().y<innerHeight); if(!e) return null; const b=e.getBoundingClientRect(); return {x:Math.round(b.x+b.width/2), y:Math.round(b.y+b.height/2)};}, FONT);
      log.push('fonts dialog item='+JSON.stringify(it));
      if (it) { await rcXY(it.x, it.y); await page.waitForTimeout(1200); }
      const done = await page.evaluate(()=>{const d=[...document.querySelectorAll('[role=dialog]')].pop(); const e=[...d.querySelectorAll('[role=button],button')].find(e=>(e.innerText||'').trim()==='Done' && e.getBoundingClientRect().width>0); if(!e) return null; const b=e.getBoundingClientRect(); return {x:Math.round(b.x+b.width/2), y:Math.round(b.y+b.height/2)};});
      if (done) { await rcXY(done.x, done.y); await page.waitForTimeout(2500); }
      r = await rowVal(row); if (r && r.cur === FONT) { log.push(row+' set via More fonts'); continue; }
      await rcXY(r.x, r.y); await page.waitForTimeout(1800); items = await menuItems() || [];
    }
    const idx = items.indexOf(FONT);
    if (idx < 0) { log.push(row+': '+FONT+' not in list'); await page.keyboard.press('Escape'); continue; }
    for (let i=0;i<=idx;i++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(110); }
    await page.keyboard.press('Enter'); await page.waitForTimeout(1500);
    r = await rowVal(row); log.push(row+' → '+(r&&r.cur));
  }
  await page.evaluate(t=>document.title=t.slice(0,700), JSON.stringify(log));
}

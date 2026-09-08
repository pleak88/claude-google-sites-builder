  // ── общие хелперы; подставляются в шаблоны вместо __COMMON__ (внутри async (page) => { ... })
  const rc = async (loc) => { const b=await loc.boundingBox({timeout:6000}).catch(()=>null); if(!b) return false;
    await page.mouse.move(b.x+b.width/2,b.y+b.height/2); await page.waitForTimeout(180);
    await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); return true; };
  const rcXY = async (x,y) => { await page.mouse.move(x,y); await page.waitForTimeout(180);
    await page.mouse.down(); await page.waitForTimeout(130); await page.mouse.up(); };
  await page.context().grantPermissions(['clipboard-read','clipboard-write'], { origin: 'https://sites.google.com' });
  const paste = async (text) => {
    await page.evaluate(t => navigator.clipboard.writeText(t), text);
    await page.waitForTimeout(140);
    await page.keyboard.press('Control+Shift+V');
    await page.waitForTimeout(260);
  };
  const STYLE_KEY = { h1:'Control+Alt+1', h2:'Control+Alt+2', h3:'Control+Alt+3',
                      p:'Control+Alt+0', byline:'Control+Alt+0', accent:'Control+Alt+3', list:'Control+Alt+0' };
  const toBottom = async () => {
    await page.mouse.move(600,500); await page.waitForTimeout(120);
    for (let i=0;i<16;i++){ await page.mouse.wheel(0,900); await page.waitForTimeout(130); }
    await page.waitForTimeout(500);
  };
  const openInsert = async () => {
    await rc(page.locator('[role=tab]').filter({ hasText: /^Insert$/ }).first());
    await page.waitForTimeout(1400);
    await page.mouse.move(1300,400); await page.waitForTimeout(150);
    for (let i=0;i<8;i++){ await page.mouse.wheel(0,-400); await page.waitForTimeout(110); }
  };
  const insertByLabel = async (label) => {
    await openInsert();
    const el = page.locator(`[aria-label="${label}"]`).first();
    if (!(await el.count())) return false;
    await rc(el); await page.waitForTimeout(3200); return true;
  };
  const typeBlocks = async (blocks) => {
    for (let j=0;j<blocks.length;j++){
      const [tag, text] = blocks[j];
      await paste(tag === 'list' ? '— ' + text : text);
      await page.keyboard.press(STYLE_KEY[tag] || STYLE_KEY.p);
      await page.waitForTimeout(160);
      if (j < blocks.length-1){ await page.keyboard.press('End'); await page.keyboard.press('Enter'); await page.waitForTimeout(160); }
    }
    await page.waitForTimeout(500);
  };
  const fillTile = async (tile, blocks) => {
    await tile.click({timeout:8000}); await page.waitForTimeout(700);
    await page.keyboard.press('Control+A'); await page.keyboard.press('Delete'); await page.waitForTimeout(400);
    await typeBlocks(blocks);
  };
  const fillAt = async (x, y, blocks) => {
    await rcXY(x, y); await page.waitForTimeout(800);
    await page.keyboard.press('Control+A'); await page.keyboard.press('Delete'); await page.waitForTimeout(400);
    await typeBlocks(blocks);
  };
  // последняя НЕ-футерная секция (футер = последняя секция после Add Footer; до него — просто последняя)
  const lastContentIdx = () => page.evaluate(() => {
    const s=[...document.querySelectorAll('section')];
    for (let i=s.length-1;i>=0;i--){ if(!/footer/i.test(s[i].getAttribute('aria-label')||'')) return i; }
    return s.length-1;
  });
  const setStyleLast = async (n) => {
    const idx = await lastContentIdx();
    const sec = page.locator('section').nth(idx);
    await sec.hover({force:true}); await page.waitForTimeout(500);
    const pal = sec.locator('[aria-label="Section colors"]').first();
    if (!(await pal.count())) return 'no palette';
    await pal.click({force:true}); await page.waitForTimeout(1300);
    const li = page.locator('li').filter({ hasText: new RegExp('^A\\s*Style ' + n + '$') }).first();
    if (await li.count()) { await li.click({force:true}); await page.waitForTimeout(1200); }
    else {
      const rows = await page.evaluate(nn => { const o=[];
        document.querySelectorAll('li').forEach(e=>{const t=(e.innerText||'').trim(); const r=e.getBoundingClientRect();
          if (r.width>0 && new RegExp('Style '+nn).test(t)) o.push({x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2)});});
        return o; }, n);
      if (rows.length) { await rcXY(rows[0].x, rows[0].y); await page.waitForTimeout(1200); }
      else return 'no Style row';
    }
    await page.mouse.move(600,300); await page.waitForTimeout(400);
    return 'ok';
  };
  const report = async (obj) => { await page.evaluate(t=>document.title=t.slice(0,1500), JSON.stringify(obj)); };

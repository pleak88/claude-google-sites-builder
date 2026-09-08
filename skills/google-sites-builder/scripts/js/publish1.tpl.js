async (page) => {
  const log=[];
  const rc = async (loc) => { const b=await loc.boundingBox({timeout:6000}).catch(()=>null); if(!b) return false;
    await page.mouse.move(b.x+b.width/2,b.y+b.height/2); await page.waitForTimeout(180);
    await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); return true; };
  await rc(page.locator('[role=button],button').filter({ hasText: /^Publish$/ }).first());
  await page.waitForTimeout(4000);
  const dlg = page.locator('[role=dialog]').last();
  const inp = dlg.locator('input:visible').first();
  if (!(await inp.count())) { log.push('no input: '+(await dlg.innerText()).slice(0,120)); await page.evaluate(t=>document.title=t.slice(0,400), JSON.stringify(log)); return; }
  let chosen=null;
  for (const c of __CANDS__) {
    await inp.click(); await page.keyboard.press('Control+A'); await page.keyboard.press('Delete');
    await page.keyboard.type(c, {delay:45});
    await page.waitForTimeout(3800);
    const t = await dlg.innerText();
    const bad = /already taken|Use only lowercase|not available/i.test(t);
    log.push(c+(bad?' TAKEN':' FREE'));
    if (!bad) { chosen=c; break; }
  }
  log.push('chosen='+chosen);
  if (chosen) {
    const btn = await page.evaluate(() => {
      const d=[...document.querySelectorAll('[role=dialog]')].pop();
      const o=[...d.querySelectorAll('*')].filter(e=>(e.innerText||'').trim()==='Publish')
        .map(e=>{const r=e.getBoundingClientRect(); return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2), w:r.width, h:r.height}})
        .filter(x=>x.w>10&&x.h>10);
      return o[o.length-1]||null;
    });
    if (btn) { await page.mouse.move(btn.x,btn.y); await page.waitForTimeout(200);
      await page.mouse.down(); await page.waitForTimeout(140); await page.mouse.up();
      await page.waitForTimeout(8000); log.push('published'); }
    else log.push('no publish btn');
  }
  const left = await page.evaluate(()=>document.querySelectorAll('[role=dialog]').length);
  log.push('dlgs_left='+left);
  await page.evaluate(t=>document.title=t.slice(0,500), JSON.stringify(log));
}

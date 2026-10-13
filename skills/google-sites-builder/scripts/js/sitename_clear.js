async (page) => {
  const log=[];
  await page.mouse.move(600,400); for (let i=0;i<8;i++){ await page.mouse.wheel(0,-900); await page.waitForTimeout(80); }
  const inp = await page.evaluate(()=>[...document.querySelectorAll('input[aria-label="Site name"]')].map(i=>{const r=i.getBoundingClientRect(); return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2), w:Math.round(r.width), v:i.value}}).filter(o=>o.w>0));
  log.push('inputs='+JSON.stringify(inp));
  const hdr = inp.find(o=>o.y>70);   // поле Site name внутри шапки страницы (не имя документа вверху)
  if (hdr) { await page.mouse.move(hdr.x,hdr.y); await page.waitForTimeout(200); await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); await page.waitForTimeout(600);
    await page.keyboard.press('Control+A'); await page.keyboard.press('Delete'); await page.waitForTimeout(500); await page.keyboard.press('Tab'); await page.waitForTimeout(1500);
    log.push('after='+JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('input[aria-label="Site name"]')].map(i=>i.value)))); }
  await page.evaluate(t=>document.title=t.slice(0,600), JSON.stringify(log));
}
